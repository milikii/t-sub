import { ANDROID_TEMPLATE_BODY, NAS_TEMPLATE_BODY, WINDOWS_TEMPLATE_BODY } from "./default-template-bodies.js";

export const DEFAULT_TEMPLATES = [
  {
    id: "android",
    name: "Android",
    platform: "android",
    description: "Android mihomo alpha 完整模板，包含 TUN、DNS、规则集和节点分组。",
    body: ANDROID_TEMPLATE_BODY,
    variables: [],
    revision: 2,
  },
  {
    id: "nas",
    name: "NAS",
    platform: "nas",
    description: "适合 NAS 或网关设备使用，允许局域网访问。",
    body: NAS_TEMPLATE_BODY,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "NAS" },
    ],
    revision: 1,
  },
  {
    id: "windows",
    name: "Windows",
    platform: "windows",
    description: "适合桌面客户端使用，仅在本机开启控制接口。",
    body: WINDOWS_TEMPLATE_BODY,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "Windows" },
    ],
    revision: 1,
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
    variables: normalizeVariables(input.variables),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    revision: Number(existing?.revision || input.revision || 0) + 1,
  };
}

function hasProxyInjectionPoint(body) {
  return body.includes("{{PROXIES_YAML}}") || /^proxies\s*:/m.test(body);
}

function normalizeVariables(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      name: String(item.name || "").trim().replace(/[^A-Z0-9_]/gi, "_").toUpperCase(),
      required: Boolean(item.required),
      defaultValue: item.defaultValue == null ? "" : String(item.defaultValue),
    }))
    .filter((item) => item.name);
}

export function withTemplateTimestamps(template) {
  const now = new Date().toISOString();
  return {
    ...template,
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || now,
  };
}
