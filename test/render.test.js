import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_TEMPLATES, builtInTemplateById, normalizeTemplate } from "../src/core/templates.js";
import { renderConfig } from "../src/core/render.js";

let yaml;
try {
  yaml = await import("js-yaml");
} catch {
  // js-yaml not available, skip YAML parsing tests
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN_STRINGS = [
  "GEOSITE,",
  "GEOIP,",
  "geosite:",
  "geoip:",
  "geodata-mode",
  "geo-auto-update",
  "geox-url",
  "country.mmdb",
  "geoip.dat",
  "geosite.dat",
  "Loyalsoldier",
  "v2ray-rules-dat",
];

function renderWithDefaults(templateId, extraVars = {}) {
  const nodesText = [
    "ss://YWVzLTEyOC1nY206cGFzc0B1cy5leGFtcGxlLmNvbTo4Mzg4#us-test",
    "ss://YWVzLTEyOC1nY206cGFzc0BqcC5leGFtcGxlLmNvbTo4Mzg4#jp-test",
    "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#剩余流量 100GB",
  ].join("\n");

  const variables = {
    PROFILE_NAME: templateId === "android" ? undefined : templateId.toUpperCase(),
    HOME_DOMAIN: "19970626.xyz",
    TS_DOMAIN: "tailc1b432.ts.net",
    RULE_BASE_URL: "http://local.test/rules",
    ...extraVars,
  };

  return renderConfig({
    template: builtInTemplateById(templateId),
    nodesText,
    variables,
  });
}

function parseYaml(yamlText) {
  if (!yaml) {
    return { skipped: true };
  }
  return yaml.load(yamlText);
}

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

test("renders mihomo yaml from template and node lines", () => {
  const result = renderWithDefaults("nas", { PROFILE_NAME: "NAS" });
  assert.match(result.configYaml, /NAS 生成于/);
  assert.match(result.configYaml, /type: "ss"|type: ss/);
  assert.match(result.configYaml, /us-test/);
  assert.match(result.configYaml, /jp-test/);
  assert.equal(result.proxies.length, 3);
});

test("all templates render without errors", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.ok(result.configYaml.length > 0);
    assert.ok(result.proxies.length > 0);
  }
});

test("info nodes with exclude-filter keywords are still in proxies but not in urltest groups", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  // Info nodes still appear in proxies list
  const proxyNames = (doc.proxies || []).map((p) => p.name);
  assert.ok(proxyNames.includes("剩余流量 100GB"));
  // exclude-filter should have 流量 keyword
  for (const group of doc["proxy-groups"] || []) {
    if (group["exclude-filter"]) {
      assert.match(group["exclude-filter"], /流量/);
    }
  }
});

// ======================== Forbidden strings check ========================
test("ALL templates contain NO forbidden strings (GEOSITE/GEOIP/GeoX/DAT/MMDB)", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    for (const forbidden of FORBIDDEN_STRINGS) {
      assert.ok(
        !result.configYaml.includes(forbidden),
        `${template.id} must not contain "${forbidden}"`,
      );
    }
  }
});

// ======================== New provider names ========================
test("ALL templates use new provider names (not old names)", () => {
  const oldNames = ["RULE-SET,private,", "RULE-SET,cn,", "RULE-SET,geoip-cn,", "RULE-SET,openai,", "RULE-SET,github,"];
  const newNames = [
    "RULE-SET,private_domain,",
    "RULE-SET,private_ip,",
    "RULE-SET,cn_domain,",
    "RULE-SET,cn_ip,",
    "RULE-SET,openai_domain,",
    "RULE-SET,github_domain,",
    "RULE-SET,tracker_domain,",
    "RULE-SET,jp_ip,",
  ];

  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    // No old names
    for (const old of oldNames) {
      assert.ok(
        !result.configYaml.includes(old),
        `${template.id} must not use old name "${old}"`,
      );
    }
    // New names present
    for (const name of newNames) {
      assert.ok(
        result.configYaml.includes(name),
        `${template.id} must include new provider "${name}"`,
      );
    }
  }
});

test("ALL templates have common providers (private_domain, cn_domain, etc.)", () => {
  const commonProviders = [
    "private_domain:",
    "private_ip:",
    "cn_domain:",
    "cn_ip:",
    "openai_domain:",
    "github_domain:",
    "tracker_domain:",
    "jp_ip:",
    "custom-direct-domain:",
    "custom-proxy-domain:",
    "pt-direct-domain:",
    "misc-direct-domain:",
    "japan-services-domain:",
  ];

  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    for (const provider of commonProviders) {
      assert.ok(
        result.configYaml.includes(provider),
        `${template.id} must have provider ${provider}`,
      );
    }
  }
});

test("Android has googlefcm and googleplay providers; Windows/NAS do NOT", () => {
  const androidProviders = ["googlefcm_domain:", "googleplay_domain:", "android-fcm-domain:", "android-google-play-domain:"];

  const androidResult = renderWithDefaults("android");
  for (const p of androidProviders) {
    assert.ok(androidResult.configYaml.includes(p), `Android must have ${p}`);
  }

  for (const tid of ["windows", "nas"]) {
    const result = renderWithDefaults(tid);
    for (const p of androidProviders) {
      assert.ok(!result.configYaml.includes(p), `${tid} must NOT have ${p}`);
    }
  }
});

// ======================== YAML structural validation ========================
test("rendered YAML parses to valid object with no duplicate top-level keys", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    assert.ok(doc, `Template ${template.id} should parse as YAML`);
    assert.ok(doc["proxy-groups"], `${template.id} must have proxy-groups`);
    assert.ok(doc.rules, `${template.id} must have rules`);
    assert.ok(doc.dns, `${template.id} must have dns`);

    const keys = Object.keys(doc);
    const keySet = new Set(keys);
    assert.equal(keys.length, keySet.size, `${template.id} should have no duplicate top-level keys`);
  }
});

test("all RULE-SET references have matching rule-provider", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    const providers = new Set(Object.keys(doc["rule-providers"] || {}));
    for (const rule of doc.rules || []) {
      if (typeof rule === "string" && rule.startsWith("RULE-SET,")) {
        const providerName = rule.split(",")[1];
        assert.ok(providers.has(providerName), `${template.id}: RULE-SET ${providerName} has matching rule-provider`);
      }
    }
  }
});

test("all proxy-group references exist", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    const groupNames = new Set((doc["proxy-groups"] || []).map((g) => g.name));
    for (const group of doc["proxy-groups"] || []) {
      for (const ref of group.proxies || []) {
        if (ref === "DIRECT" || ref === "REJECT" || ref === "tailscale") continue;
        if (/^[^\x00-\x7F]/.test(ref) || /^[A-Z]/.test(ref)) {
          assert.ok(
            groupNames.has(ref) || ref.startsWith("♻️"),
            `${template.id}: proxy reference "${ref}" in group "${group.name}" must exist as a group`,
          );
        }
      }
    }
  }
});

test("all rule targets map to defined proxy-groups or special names", () => {
  if (!yaml) return;
  const specialTargets = new Set(["DIRECT", "REJECT", "tailscale"]);
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    const groupNames = new Set((doc["proxy-groups"] || []).map((g) => g.name));
    for (const rule of doc.rules || []) {
      if (typeof rule !== "string") continue;
      const parts = rule.split(",");
      const target = parts[parts.length - 1].replace(/,no-resolve$/, "").trim();
      if (target === "MATCH" || specialTargets.has(target) || target.startsWith("♻️")) continue;
      if (/[^\x00-\x7F]/.test(target)) {
        assert.ok(
          groupNames.has(target),
          `${template.id}: rule target "${target}" must exist as a proxy-group`,
        );
      }
    }
  }
});

// ======================== Rule order checks ========================
test("ALL templates: custom-direct-domain before japan-services-domain before custom-proxy-domain before cn_domain", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const rules = result.configYaml.split("\n").filter((l) => l.trim().startsWith("- RULE-SET,"));
    const idx = (name) => rules.findIndex((r) => r.includes(name));
    const cdd = idx("custom-direct-domain");
    const jsd = idx("japan-services-domain");
    const cpd = idx("custom-proxy-domain");
    const cn = idx("cn_domain");

    assert.ok(cdd >= 0 && jsd >= 0 && cpd >= 0 && cn >= 0, `${template.id}: all expected rule-sets found`);
    assert.ok(cdd < jsd, `${template.id}: custom-direct-domain before japan-services-domain`);
    assert.ok(jsd < cpd, `${template.id}: japan-services-domain before custom-proxy-domain`);
    assert.ok(cpd < cn, `${template.id}: custom-proxy-domain before cn_domain`);
  }
});

test("ALL templates: openai_domain and github_domain target 🇺🇸 美国节点", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const findRule = (name, target) => {
      const lines = result.configYaml.split("\n").filter((l) => l.includes(`RULE-SET,${name},`));
      return lines.some((l) => l.includes(target));
    };
    assert.ok(findRule("openai_domain", "🇺🇸 美国节点"), `${template.id}: openai_domain -> 🇺🇸 美国节点`);
    assert.ok(findRule("github_domain", "🇺🇸 美国节点"), `${template.id}: github_domain -> 🇺🇸 美国节点`);
  }
});

test("ALL templates: japan-services-domain targets 🇯🇵 日本节点", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const lines = result.configYaml.split("\n").filter((l) => l.includes("RULE-SET,japan-services-domain,"));
    assert.ok(lines.some((l) => l.includes("🇯🇵 日本节点")), `${template.id}: japan-services-domain -> 🇯🇵`);
  }
});

test("ALL templates: cn_domain and cn_ip target DIRECT", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const domLine = result.configYaml.split("\n").find((l) => l.includes("RULE-SET,cn_domain,"));
    const ipLine = result.configYaml.split("\n").find((l) => l.includes("RULE-SET,cn_ip,"));
    assert.ok(domLine && domLine.includes(",DIRECT") && !domLine.includes(",no-resolve") || domLine && domLine.trim().endsWith(",DIRECT"),
      `${template.id}: cn_domain -> DIRECT`);
    assert.ok(ipLine && ipLine.includes("DIRECT") && ipLine.includes("no-resolve"),
      `${template.id}: cn_ip -> DIRECT,no-resolve`);
  }
});

test("ALL templates: MATCH is last rule", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const lines = result.configYaml.trim().split("\n");
    // Find rules section
    const rulesStart = lines.findIndex((l) => l.trim().startsWith("rules:"));
    const ruleLines = lines.slice(rulesStart + 1).filter((l) => l.trim().startsWith("- "));
    const lastRule = ruleLines[ruleLines.length - 1];
    assert.ok(lastRule && lastRule.includes("MATCH,"), `${template.id}: last rule should be MATCH`);
  }
});

// ======================== DNS checks ========================
test("ALL templates: DNS nameserver-policy uses rule-set: not geosite:", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.ok(result.configYaml.includes('"rule-set:cn_domain"'), `${template.id}: DNS uses rule-set:cn_domain`);
    assert.ok(result.configYaml.includes('"rule-set:private_domain"'), `${template.id}: DNS uses rule-set:private_domain`);
    assert.ok(result.configYaml.includes('"rule-set:japan-services-domain"'), `${template.id}: DNS uses rule-set:japan-services-domain`);
    // No geosite: in nameserver-policy
    assert.doesNotMatch(result.configYaml, /geosite:cn/, `${template.id}: no geosite:cn in DNS`);
    assert.doesNotMatch(result.configYaml, /geosite:private/, `${template.id}: no geosite:private in DNS`);
  }
});

test("ALL templates have cache-algorithm: arc, respect-rules: true, enhanced-mode: fake-ip", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /cache-algorithm: arc/);
    assert.match(result.configYaml, /respect-rules: true/);
    assert.match(result.configYaml, /enhanced-mode: fake-ip/);
  }
});

// ======================== Provider format checks ========================
test("ALL templates: MRS providers have correct behavior/format", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    const providers = doc["rule-providers"] || {};

    // Domain MRS
    for (const name of ["private_domain", "cn_domain", "openai_domain", "github_domain", "tracker_domain"]) {
      assert.equal(providers[name]?.behavior, "domain", `${template.id}: ${name} behavior=domain`);
      assert.equal(providers[name]?.format, "mrs", `${template.id}: ${name} format=mrs`);
    }

    // IPCidr MRS
    for (const name of ["private_ip", "cn_ip", "jp_ip"]) {
      assert.equal(providers[name]?.behavior, "ipcidr", `${template.id}: ${name} behavior=ipcidr`);
      assert.equal(providers[name]?.format, "mrs", `${template.id}: ${name} format=mrs`);
    }

    // Text domain
    for (const name of ["custom-direct-domain", "custom-proxy-domain", "pt-direct-domain", "misc-direct-domain", "japan-services-domain"]) {
      assert.equal(providers[name]?.behavior, "domain", `${template.id}: ${name} behavior=domain`);
      assert.equal(providers[name]?.format, "text", `${template.id}: ${name} format=text`);
    }
  }
});

test("Android: googlefcm_domain and googleplay_domain have correct format", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  const providers = doc["rule-providers"] || {};
  assert.equal(providers.googlefcm_domain?.behavior, "domain");
  assert.equal(providers.googlefcm_domain?.format, "mrs");
  assert.equal(providers.googleplay_domain?.behavior, "domain");
  assert.equal(providers.googleplay_domain?.format, "mrs");
});

// ======================== url-test group checks ========================
test("ALL url-test groups have lazy: true, expected-status: 204, empty-fallback: REJECT, tolerance: 80", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    for (const group of doc["proxy-groups"] || []) {
      if (group.type === "url-test") {
        assert.equal(group.lazy, true, `${template.id}: ${group.name} lazy: true`);
        assert.equal(group["expected-status"], 204, `${template.id}: ${group.name} expected-status: 204`);
        assert.equal(group["empty-fallback"], "REJECT", `${template.id}: ${group.name} empty-fallback: REJECT`);
        assert.equal(group.tolerance, 80, `${template.id}: ${group.name} tolerance: 80`);
        assert.equal(group.interval, 600, `${template.id}: ${group.name} interval: 600`);
        assert.equal(group.timeout, 3000, `${template.id}: ${group.name} timeout: 3000`);
      }
    }
  }
});

test("Regional groups do not contain DIRECT", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    for (const group of doc["proxy-groups"] || []) {
      if (group.name === "🇯🇵 日本节点" || group.name === "🇺🇸 美国节点") {
        assert.ok(!group.proxies.includes("DIRECT"), `${template.id}: ${group.name} should not contain DIRECT`);
        assert.ok(group.proxies[0].startsWith("♻️"), `${template.id}: ${group.name} first proxy should be auto`);
      }
    }
  }
});

test("🚀 默认代理 includes ♻️ groups", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    const defaultGroup = doc["proxy-groups"]?.find((g) => g.name === "🚀 默认代理");
    assert.ok(defaultGroup, `${template.id}: has 🚀 默认代理`);
    assert.ok(defaultGroup.proxies.includes("♻️ 日本自动"), `${template.id}: 🚀 includes ♻️ 日本自动`);
    assert.ok(defaultGroup.proxies.includes("♻️ 美国自动"), `${template.id}: 🚀 includes ♻️ 美国自动`);
    assert.ok(defaultGroup.proxies.includes("DIRECT"), `${template.id}: 🚀 includes DIRECT`);
  }
});

// ======================== Android-specific ========================
test("android: exactly one type: tailscale proxy, no exit-node-allow-lan-access", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
  assert.equal(tsProxies.length, 1);
  assert.equal(tsProxies[0].name, "tailscale");
  assert.equal(tsProxies[0]["exit-node-allow-lan-access"], undefined);
});

test("android: home/family rules target 🏠 回家, not tailscale directly", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  for (const rule of doc.rules || []) {
    if (typeof rule !== "string") continue;
    if (rule.includes("192.168.1.0/24") || rule.includes("192.168.2.0/24") ||
        rule.includes("100.64.0.0/10") || rule.includes("fd7a:115c:a1e0::/48")) {
      assert.match(rule, /回家/);
    }
    if (rule.includes("19970626.xyz") || rule.includes("tailc1b432.ts.net")) {
      assert.match(rule, /回家/);
    }
  }
});

test("android: has 🏠 回家 and 📲 谷歌推送 groups", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  const groupNames = (doc["proxy-groups"] || []).map((g) => g.name);
  assert.ok(groupNames.includes("🏠 回家"));
  assert.ok(groupNames.includes("📲 谷歌推送"));
});

test("android: .lan and .local target DIRECT, not tailscale", () => {
  const result = renderWithDefaults("android");
  const lines = result.configYaml.split("\n").filter((l) => l.includes("DOMAIN-SUFFIX,lan,") || l.includes("DOMAIN-SUFFIX,local,"));
  for (const line of lines) {
    assert.ok(line.includes("DIRECT"), `Android .lan/.local should target DIRECT: ${line}`);
  }
});

test("android: has all expected features", () => {
  const result = renderWithDefaults("android");
  assert.match(result.configYaml, /ipv6: true/);
  assert.match(result.configYaml, /RULE-SET,android-fcm-domain,/);
  assert.match(result.configYaml, /RULE-SET,android-google-play-domain,/);
  assert.match(result.configYaml, /RULE-SET,googlefcm_domain,/);
  assert.match(result.configYaml, /dns-hijack:\n    - any:53/);
  assert.doesNotMatch(result.configYaml, /external-ui-url/);
});

test("android: allow-lan false, tun.enable true", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  assert.equal(doc["allow-lan"], false);
  assert.equal(doc.tun?.enable, true);
});

// ======================== Windows-specific ========================
test("windows: no tailscale, no 🏠 回家, no 📲 谷歌推送", () => {
  if (!yaml) return;
  const result = renderWithDefaults("windows");
  const doc = parseYaml(result.configYaml);
  const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
  assert.equal(tsProxies.length, 0);
  const groupNames = (doc["proxy-groups"] || []).map((g) => g.name);
  assert.ok(!groupNames.includes("🏠 回家"));
  assert.ok(!groupNames.includes("📲 谷歌推送"));
});

test("windows: allow-lan: false, find-process-mode: off", () => {
  if (!yaml) return;
  const result = renderWithDefaults("windows");
  const doc = parseYaml(result.configYaml);
  assert.equal(doc["allow-lan"], false);
  assert.equal(doc["find-process-mode"], "off");
});

// ======================== NAS-specific ========================
test("nas: tun.enable: true with transparent proxy settings", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  assert.ok(doc.tun, "NAS should have tun section");
  assert.equal(doc.tun.enable, true);
  assert.equal(doc.tun["auto-route"], true);
  assert.equal(doc.tun["auto-redirect"], true);
  assert.equal(doc.tun["strict-route"], true);
  assert.ok(doc.tun["dns-hijack"].includes("tcp://any:53"));
});

test("nas: allow-lan: true, mixed-port: 7890, dns.listen 0.0.0.0:1053", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  assert.equal(doc["allow-lan"], true);
  assert.equal(doc["mixed-port"], 7890);
  assert.match(result.configYaml, /listen: 0\.0\.0\.0:1053/);
});

test("nas: no tailscale, no 🏠 回家, no 📲 谷歌推送", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
  assert.equal(tsProxies.length, 0);
  const groupNames = (doc["proxy-groups"] || []).map((g) => g.name);
  assert.ok(!groupNames.includes("🏠 回家"));
  assert.ok(!groupNames.includes("📲 谷歌推送"));
});

test("nas: no fake-ip-filter tailnet entries", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  const filter = doc.dns["fake-ip-filter"] || [];
  for (const entry of filter) {
    assert.ok(!entry.includes("ts.net"), "NAS should not have tailnet fake-ip-filter");
  }
});

// ======================== Custom template tests ========================
test("saved templates always elevate PROFILE_NAME to required", () => {
  const template = normalizeTemplate({
    id: "nas",
    name: "NAS",
    platform: "nas",
    body: DEFAULT_TEMPLATES[1].body,
    variables: [
      { name: "PROFILE_NAME", required: false, defaultValue: "NAS" },
    ],
  });

  // NAS body includes {{HOME_DOMAIN}} from fake-ip-filter include
  assert.ok(template.variables.some((v) => v.name === "PROFILE_NAME" && v.required === true && v.defaultValue === "NAS"));
  assert.ok(template.variables.some((v) => v.name === "HOME_DOMAIN" && v.required === false));
  assert.equal(template.variables.length, 2);
});

test("template normalization discovers variables from yaml body", () => {
  const template = normalizeTemplate({
    id: "android",
    name: "Android",
    platform: "android",
    body: DEFAULT_TEMPLATES[0].body,
  });

  const vars = template.variables;
  const varNames = vars.map((v) => v.name);
  assert.ok(varNames.includes("HOME_DOMAIN"));
  assert.ok(varNames.includes("TS_DOMAIN"));
});

test("render accepts normalized variable names from api callers", () => {
  const result = renderConfig({
    template: builtInTemplateById("nas"),
    nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#NAS%20Sample",
    variables: {
      profileName: "CustomProfile",
      HOME_DOMAIN: "home.example.com",
    },
  });

  assert.match(result.configYaml, /CustomProfile 生成于/);
});

test("template normalization drops variable metadata not present in body", () => {
  const template = normalizeTemplate({
    id: "custom",
    name: "Custom",
    platform: "custom",
    body: [
      "mixed-port: 7890",
      "proxies:",
      "{{PROXIES_YAML}}",
      "proxy-groups:",
      "  - name: Proxy",
      "    type: select",
      "    proxies:",
      "{{PROXY_NAMES_YAML}}",
      "rules:",
      "  - MATCH,Proxy",
      "",
    ].join("\n"),
    variables: [
      { name: "REMOVED_SECRET", required: true },
      { name: "profileName", required: true },
    ],
  });

  assert.deepEqual(template.variables, []);
});

test("render replaces normalized placeholders in template body", () => {
  const result = renderConfig({
    template: {
      id: "custom",
      name: "Custom",
      platform: "custom",
      body: [
        "mixed-port: 7890",
        "proxies:",
        "{{proxiesYaml}}",
        "proxy-groups:",
        "  - name: Proxy",
        "    type: select",
        "    proxies:",
        "{{proxyNamesYaml}}",
        "rules:",
        "  - DOMAIN,example.test,{{profileName}}",
        "  - MATCH,Proxy",
        "",
      ].join("\n"),
      variables: [
        { name: "profileName", required: true },
      ],
    },
    nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#Sample",
    variables: { profileName: "Proxy" },
  });

  assert.match(result.configYaml, /proxies:\n  - name: "Sample"/);
  assert.match(result.configYaml, /    proxies:\n      - "Sample"/);
  assert.match(result.configYaml, /DOMAIN,example\.test,Proxy/);
  assert.doesNotMatch(result.configYaml, /{{/);
});

test("rejects unresolved template variables", () => {
  assert.throws(
    () => renderConfig({
      template: {
        ...DEFAULT_TEMPLATES[0],
        body: `${DEFAULT_TEMPLATES[0].body}\nextra: {{MISSING_VALUE}}\n`,
      },
      nodesText: "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#ss",
      variables: {},
    }),
    /未填写的变量/,
  );
});

test("injects generated proxies into a full mihomo template without placeholders", () => {
  const result = renderConfig({
    template: {
      id: "full",
      name: "Full",
      platform: "custom",
      body: [
        "mixed-port: 7890",
        "proxies:",
        "  - name: __HOME_NODE_MISSING__",
        "    type: reject",
        "proxy-groups:",
        "  - name: Proxy",
        "    type: select",
        "    proxies:",
        "      - __HOME_NODE_MISSING__",
        "rules:",
        "  - MATCH,Proxy",
        "",
      ].join("\n"),
      variables: [],
    },
    nodesText: "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#ss%20node",
    variables: {},
  });

  assert.match(result.configYaml, /proxies:\n  - name: "ss node"/);
  assert.match(result.configYaml, /name: __HOME_NODE_MISSING__/);
  assert.match(result.configYaml, /proxy-groups:/);
});

// ======================== Rule file validation ========================
test("rule files: no duplicate lines, no illegal whitespace", () => {
  const ruleFiles = [
    "pt-direct-domain.list",
    "misc-direct-domain.list",
    "android-fcm-domain.list",
    "android-google-play-domain.list",
    "japan-services-domain.list",
    "custom-direct-domain.list",
    "custom-proxy-domain.list",
  ];
  for (const filename of ruleFiles) {
    const filePath = resolve(rootDir, "rules", filename);
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    const seen = new Set();
    for (const line of lines) {
      assert.ok(!seen.has(line), `Duplicate line in ${filename}: ${line}`);
      seen.add(line);
    }
    for (const line of lines) {
      const trimmed = line.replace(/^\+\./, "").trim();
      assert.ok(!/\s/.test(trimmed), `Illegal whitespace in ${filename}: "${line}"`);
    }
  }
});

test("pt-direct-domain.list does not contain non-PT domains", () => {
  const filePath = resolve(rootDir, "rules/pt-direct-domain.list");
  const content = readFileSync(filePath, "utf8");
  assert.ok(!content.includes("smzdm"), "pt-direct-domain.list should not contain smzdm");
  assert.ok(!content.includes("pcbeta"), "pt-direct-domain.list should not contain pcbeta");
  assert.ok(!content.includes("19970626"), "pt-direct-domain.list should not contain personal home domain");
});

test("japan-services-domain.list has required entries", () => {
  const filePath = resolve(rootDir, "rules/japan-services-domain.list");
  const content = readFileSync(filePath, "utf8");
  assert.ok(content.includes("+.jp"));
  assert.ok(content.includes("+.dmm.co.jp"));
  assert.ok(content.includes("+.pixiv.net"));
  assert.ok(content.includes("+.amazon.co.jp"));
  assert.ok(content.includes("+.rakuten.co.jp"));
  assert.ok(content.includes("+.yahoo.co.jp"));
});
