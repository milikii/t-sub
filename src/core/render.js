import { byteLength } from "./encoding.js";
import { parseNodeLines } from "./nodes.js";
import { objectToYaml, yamlScalar } from "./yaml.js";

export class RenderValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "RenderValidationError";
    this.details = details;
  }
}

export function renderConfig({ template, nodesText, variables = {}, limits = {} }) {
  if (!template) throw new RenderValidationError("请选择配置模板。");
  const maxNodesBytes = limits.maxNodesBytes ?? 65536;
  const maxRenderedBytes = limits.maxRenderedBytes ?? 131072;
  const proxies = parseNodeLines(nodesText, { maxBytes: maxNodesBytes });

  const variableValues = buildVariableValues(template, variables);
  const proxiesYaml = objectToYaml(proxies, 2);
  const proxyNamesYaml = proxies.map((proxy) => `      - ${yamlScalar(proxy.name)}`).join("\n");

  const replacements = {
    ...variableValues,
    PROFILE_NAME: variableValues.PROFILE_NAME || template.name,
    GENERATED_AT: new Date().toISOString(),
    NODE_COUNT: String(proxies.length),
    PROXIES_YAML: proxiesYaml,
    PROXY_NAMES_YAML: proxyNamesYaml,
  };

  let configYaml = template.body;
  if (!configYaml.includes("{{PROXIES_YAML}}")) {
    configYaml = insertProxiesIntoTopLevelSection(configYaml, proxiesYaml);
  }
  for (const [key, value] of Object.entries(replacements)) {
    configYaml = configYaml.replaceAll(`{{${key}}}`, String(value));
  }

  const unresolved = [...configYaml.matchAll(/{{\s*([A-Z0-9_]+)\s*}}/g)].map((match) => match[1]);
  if (unresolved.length) {
    throw new RenderValidationError("模板中还有未填写的变量。", unresolved);
  }

  if (!configYaml.includes("proxies:") || !configYaml.includes("proxy-groups:")) {
    throw new RenderValidationError("生成结果必须包含 proxies 和 proxy-groups。");
  }

  const size = byteLength(configYaml);
  if (size > maxRenderedBytes) {
    throw new RenderValidationError(`生成的配置过大，最大 ${maxRenderedBytes} 字节。`);
  }

  return {
    configYaml,
    proxies,
    byteLength: size,
  };
}

function insertProxiesIntoTopLevelSection(body, proxiesYaml) {
  const lines = body.split(/\r?\n/);
  const index = lines.findIndex((line) => /^proxies\s*:/.test(line));
  if (index < 0) {
    throw new RenderValidationError("模板内容必须包含 {{PROXIES_YAML}}，或者包含顶层 proxies: 段。");
  }

  const comment = lines[index].match(/^proxies\s*:\s*(#.*)$/)?.[1];
  const proxiesLine = comment ? `proxies: ${comment}` : "proxies:";
  return [
    ...lines.slice(0, index),
    proxiesLine,
    proxiesYaml,
    ...lines.slice(index + 1),
  ].join("\n");
}

function buildVariableValues(template, inputValues) {
  const values = {};
  for (const variable of template.variables || []) {
    const value = inputValues[variable.name] ?? variable.defaultValue ?? "";
    if (variable.required && !String(value).trim()) {
      throw new RenderValidationError(`缺少必填变量 ${variable.name}。`);
    }
    values[variable.name] = value;
  }
  for (const [key, value] of Object.entries(inputValues || {})) {
    const normalized = key.trim().replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
    values[normalized] = value;
  }
  return values;
}
