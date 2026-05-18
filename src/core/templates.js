export const DEFAULT_TEMPLATES = [
  {
    id: "android",
    name: "Android",
    platform: "android",
    description: "Balanced mobile profile with mixed-port and a single selectable proxy group.",
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
    description: "LAN-friendly profile for a NAS or gateway device.",
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
    description: "Desktop profile with controller enabled on loopback only.",
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
  return `# {{PROFILE_NAME}} generated at {{GENERATED_AT}}
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

  if (!id) throw new Error("Template id is required.");
  if (!name) throw new Error("Template name is required.");
  if (!body.includes("{{PROXIES_YAML}}")) {
    throw new Error("Template body must include {{PROXIES_YAML}}.");
  }
  if (!body.includes("{{PROXY_NAMES_YAML}}")) {
    throw new Error("Template body must include {{PROXY_NAMES_YAML}}.");
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

