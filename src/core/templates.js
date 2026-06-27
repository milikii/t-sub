import { ANDROID_TEMPLATE_BODY, NAS_TEMPLATE_BODY, WINDOWS_TEMPLATE_BODY } from "./default-template-bodies.js";
import { extractTemplateVariableNames, hasTemplatePlaceholder, normalizeVariableName } from "./template-vars.js";

export const DEFAULT_TEMPLATES = [
  {
    id: "android",
    name: "Android",
    platform: "android",
    description: "Android 模板：TUN + Tailscale 回家 + FCM/Google Play 规则。MRS-first，无 GeoX。",
    body: ANDROID_TEMPLATE_BODY,
    variables: [
      { name: "HOME_DOMAIN", required: false, defaultValue: "19970626.xyz" },
      { name: "TS_DOMAIN", required: false, defaultValue: "tailc1b432.ts.net" },
    ],
    revision: 12,
  },
  {
    id: "nas",
    name: "NAS",
    platform: "nas",
    description: "Debian NAS 透明旁路由：TUN 全接管 + MRS-first 规则。LAN 客户端设网关/DNS 为本机即可。",
    body: NAS_TEMPLATE_BODY,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "NAS" },
      { name: "HOME_DOMAIN", required: false, defaultValue: "19970626.xyz" },
    ],
    revision: 9,
  },
  {
    id: "windows",
    name: "Windows",
    platform: "windows",
    description: "Windows 桌面模板：本机代理，MRS-first，无 Tailscale，无 TUN。",
    body: WINDOWS_TEMPLATE_BODY,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "Windows" },
    ],
    revision: 7,
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
