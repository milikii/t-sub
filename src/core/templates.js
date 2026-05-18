export const DEFAULT_TEMPLATES = [
  {
    id: "android",
    name: "Android",
    platform: "android",
    description: "适合手机使用的均衡配置，包含 mixed-port 和单个可选代理组。",
    body: defaultTemplateBody({ allowLan: false, ipv6: false, logLevel: "warning" }),
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "Android" },
    ],
    revision: 1,
  },
  {
    id: "nas",
    name: "NAS",
    platform: "nas",
    description: "适合 NAS 或网关设备使用，允许局域网访问。",
    body: defaultTemplateBody({ allowLan: true, ipv6: true, logLevel: "info" }),
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
    body: `${defaultTemplateBody({ allowLan: false, ipv6: true, logLevel: "info" })}
external-controller: 127.0.0.1:9090
`,
    variables: [
      { name: "PROFILE_NAME", required: true, defaultValue: "Windows" },
    ],
    revision: 1,
  },
];

function defaultTemplateBody({ allowLan, ipv6, logLevel }) {
  return `# {{PROFILE_NAME}} 生成于 {{GENERATED_AT}}
mixed-port: 7890
allow-lan: ${allowLan}
ipv6: ${ipv6}
mode: rule
log-level: ${logLevel}

proxies:
{{PROXIES_YAML}}

proxy-groups:
  - name: Proxy
    type: select
    proxies:
{{PROXY_NAMES_YAML}}

rules:
  - MATCH,Proxy
`;
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
