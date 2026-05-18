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
  if (!template) throw new RenderValidationError("Template is required.");
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
  for (const [key, value] of Object.entries(replacements)) {
    configYaml = configYaml.replaceAll(`{{${key}}}`, String(value));
  }

  const unresolved = [...configYaml.matchAll(/{{\s*([A-Z0-9_]+)\s*}}/g)].map((match) => match[1]);
  if (unresolved.length) {
    throw new RenderValidationError("Template contains unresolved variables.", unresolved);
  }

  if (!configYaml.includes("proxies:") || !configYaml.includes("proxy-groups:")) {
    throw new RenderValidationError("Rendered config must include proxies and proxy-groups.");
  }

  const size = byteLength(configYaml);
  if (size > maxRenderedBytes) {
    throw new RenderValidationError(`Rendered config is too large. Maximum is ${maxRenderedBytes} bytes.`);
  }

  return {
    configYaml,
    proxies,
    byteLength: size,
  };
}

function buildVariableValues(template, inputValues) {
  const values = {};
  for (const variable of template.variables || []) {
    const value = inputValues[variable.name] ?? variable.defaultValue ?? "";
    if (variable.required && !String(value).trim()) {
      throw new RenderValidationError(`Missing required variable ${variable.name}.`);
    }
    values[variable.name] = value;
  }
  for (const [key, value] of Object.entries(inputValues || {})) {
    const normalized = key.trim().replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
    values[normalized] = value;
  }
  return values;
}

