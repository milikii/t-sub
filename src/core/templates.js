import { ANDROID_TEMPLATE_BODY, NAS_TEMPLATE_BODY, WINDOWS_TEMPLATE_BODY } from "./default-template-bodies.js";
import { extractTemplateVariableNames, hasTemplatePlaceholder, normalizeVariableName } from "./template-vars.js";

export const DEFAULT_TEMPLATES = [
  {
    id: "android",
    name: "Android",
    platform: "android",
    description: "Android mihomo alpha 完整模板，包含 TUN、DNS、FCM、US/JP 分组和 Tailscale 回家（首次启动需要在日志里完成 Tailscale 登录）。",
    body: ANDROID_TEMPLATE_BODY,
    variables: [],
    revision: 7,
  },
  {
    id: "nas",
    name: "NAS",
    platform: "nas",
    description: "适合 Debian NAS 或网关设备使用，仅允许私网/Tailscale 网段访问本机代理，不包含 Tailscale 出站。",
    body: NAS_TEMPLATE_BODY,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "NAS" },
    ],
    revision: 2,
  },
  {
    id: "windows",
    name: "Windows",
    platform: "windows",
    description: "适合桌面客户端使用，仅在本机开启控制接口，不包含 Tailscale 出站。",
    body: WINDOWS_TEMPLATE_BODY,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "Windows" },
    ],
    revision: 2,
  },
];

export function builtInTemplateById(id) {
  return DEFAULT_TEMPLATES.find((template) => template.id === id) || null;
}

export function normalizeTemplate(input, existing = null) {
  const now = new Date().toISOString();
  const id = String(input.id || existing?.id || crypto.randomUUID()).trim();
  const name = String(input.name || "").trim();
  const body = String(input.body || "");
  const platform = ["android", "nas", "windows", "custom"].includes(input.platform)
    ? input.platform
    : "custom";

  if (!id) throw new Error("模板 ID 不能为空。");
  if (!name) throw new Error("模板名称不能为空。");
  if (!hasProxyInjectionPoint(body)) {
    throw new Error("模板内容必须包含 {{PROXIES_YAML}}，或者包含顶层 proxies: 段。");
  }

  return {
    id,
    name,
    platform,
    description: String(input.description || ""),
    body,
    variables: normalizeVariables(input.variables, body),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    revision: Number(existing?.revision || input.revision || 0) + 1,
  };
}

function hasProxyInjectionPoint(body) {
  return hasTemplatePlaceholder(body, "PROXIES_YAML") || /^proxies\s*:/m.test(body);
}

function normalizeVariables(value, body = "") {
  const bodyVariableNames = extractVariableNames(body);
  const bodyVariableNameSet = new Set(bodyVariableNames);
  const variables = new Map();
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = normalizeVariableName(item.name);
      if (!name) continue;
      if (!bodyVariableNameSet.has(name)) continue;
      variables.set(name, variableRecord(name, item.required, item.defaultValue));
    }
  }

  for (const name of bodyVariableNames) {
    if (!variables.has(name)) {
      variables.set(name, variableRecord(name, false, undefined));
    }
  }

  return [...variables.values()];
}

const requiredVariableNames = new Set(["PROFILE_NAME", "TAILSCALE_AUTH_KEY"]);
function variableRecord(name, required, defaultValue) {
  return {
    name,
    required: Boolean(required) || requiredVariableNames.has(name),
    defaultValue: defaultValue == null ? defaultVariableValue(name) : String(defaultValue),
  };
}

function defaultVariableValue(name) {
  return name === "PROFILE_NAME" ? "mihomo" : "";
}

function extractVariableNames(body) {
  return extractTemplateVariableNames(body);
}

export function withTemplateTimestamps(template) {
  const now = new Date().toISOString();
  return {
    ...template,
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || now,
  };
}
