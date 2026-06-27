export const RESERVED_TEMPLATE_VARIABLES = new Set([
  "PROXIES_YAML",
  "PROXY_NAMES_YAML",
  "GENERATED_AT",
  "NODE_COUNT",
  "RULE_BASE_URL",
]);

const variableNameAliases = new Map([
  ["TAIL_SCALE_AUTH_KEY", "TAILSCALE_AUTH_KEY"],
]);

export function normalizeVariableName(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Z0-9_]/gi, "_")
    .toUpperCase();
  return variableNameAliases.get(normalized) || normalized;
}

export function extractTemplateVariableNames(body, { includeReserved = false } = {}) {
  return [...String(body).matchAll(/{{\s*([A-Z0-9_]+)\s*}}/gi)]
    .map((match) => normalizeVariableName(match[1]))
    .filter((name) => name && (includeReserved || !RESERVED_TEMPLATE_VARIABLES.has(name)));
}

export function hasTemplatePlaceholder(body, name) {
  const normalizedName = normalizeVariableName(name);
  return extractTemplateVariableNames(body, { includeReserved: true }).some((item) => item === normalizedName);
}

export function replaceTemplatePlaceholders(body, replacements) {
  return String(body).replace(/{{\s*([A-Z0-9_]+)\s*}}/gi, (match, key) => {
    const normalized = normalizeVariableName(key);
    return Object.hasOwn(replacements, normalized) ? String(replacements[normalized]) : match;
  });
}
