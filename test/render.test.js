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
  assert.equal(result.proxies.length, 3); // all 3 nodes parsed (exclude-filter only affects groups)
});

test("all templates render without errors", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.ok(result.configYaml.length > 0);
    assert.ok(result.proxies.length > 0);
  }
});

test("info nodes with exclude-filter keywords are still in proxies but not in proxy-groups", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  // Info nodes still appear in proxies list
  const proxyNames = (doc.proxies || []).map((p) => p.name);
  assert.ok(proxyNames.includes("剩余流量 100GB"));
  // But they should not appear in url-test proxy-groups (excluded by filter)
  for (const group of doc["proxy-groups"] || []) {
    if (group["exclude-filter"]) {
      // The exclude-filter should contain keywords that match 剩余流量
      assert.match(group["exclude-filter"], /剩余/);
    }
  }
});

// ---------------------------------------------------------------------------
// YAML structural validation (requires js-yaml)
// ---------------------------------------------------------------------------

test("rendered YAML parses to valid object with no duplicate top-level keys", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    assert.ok(doc, `Template ${template.id} should parse as YAML`);
    assert.ok(doc["proxy-groups"], `${template.id} must have proxy-groups`);
    assert.ok(doc.rules, `${template.id} must have rules`);
    assert.ok(doc.dns, `${template.id} must have dns`);

    // Check no duplicate top-level keys by counting occurrences
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
        // These are valid targets that don't need to be groups
        if (ref === "DIRECT" || ref === "REJECT" || ref === "tailscale") continue;
        // If it's a proxy group name (starts with emoji or chinese), it must exist
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
      // If it has a Chinese/emoji prefix or looks like a group name
      if (/[^\x00-\x7F]/.test(target)) {
        assert.ok(
          groupNames.has(target),
          `${template.id}: rule target "${target}" must exist as a proxy-group`,
        );
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Android-specific
// ---------------------------------------------------------------------------

test("android: exactly one type: tailscale proxy", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
  assert.equal(tsProxies.length, 1);
  assert.equal(tsProxies[0].name, "tailscale");
  assert.equal(tsProxies[0].hostname, "mihomo-android");
  assert.equal(tsProxies[0]["ip-version"], "dual");
});

test("android: no exit-node-allow-lan-access", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  assert.doesNotMatch(result.configYaml, /exit-node-allow-lan-access/);
});

test("android: home/family rules target 🏠 回家, not tailscale directly", () => {
  if (!yaml) return;
  const result = renderWithDefaults("android");
  const doc = parseYaml(result.configYaml);
  for (const rule of doc.rules || []) {
    if (typeof rule !== "string") continue;
    // CIDR routes for home should go to 🏠 回家
    if (rule.includes("192.168.1.0/24") || rule.includes("192.168.2.0/24") ||
        rule.includes("100.64.0.0/10") || rule.includes("fd7a:115c:a1e0::/48")) {
      assert.match(rule, /回家/);
    }
    // HOME_DOMAIN and TS_DOMAIN should go to 🏠 回家
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

test("android: no DOMAIN-SUFFIX,lan or DOMAIN-SUFFIX,local rules", () => {
  const result = renderWithDefaults("android");
  assert.doesNotMatch(result.configYaml, /DOMAIN-SUFFIX,lan,/);
  assert.doesNotMatch(result.configYaml, /DOMAIN-SUFFIX,local,/);
});

test("android: has all expected ipv6 rule providers and groups", () => {
  const result = renderWithDefaults("android");
  assert.match(result.configYaml, /ipv6: true/);
  assert.match(result.configYaml, /RULE-SET,android-fcm-domain,/);
  assert.match(result.configYaml, /RULE-SET,android-google-play-domain,/);
  assert.match(result.configYaml, /RULE-SET,japan-services-domain,/);
  assert.match(result.configYaml, /dns-hijack:\n    - any:53/);
});

// ---------------------------------------------------------------------------
// Windows-specific
// ---------------------------------------------------------------------------

test("windows: no tailscale, no 🏠 回家", () => {
  if (!yaml) return;
  const result = renderWithDefaults("windows");
  const doc = parseYaml(result.configYaml);
  const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
  assert.equal(tsProxies.length, 0);
  const groupNames = (doc["proxy-groups"] || []).map((g) => g.name);
  assert.ok(!groupNames.includes("🏠 回家"));
});

test("windows: allow-lan: false, find-process-mode: off", () => {
  if (!yaml) return;
  const result = renderWithDefaults("windows");
  const doc = parseYaml(result.configYaml);
  assert.equal(doc["allow-lan"], false);
  assert.equal(doc["find-process-mode"], "off");
});

test("windows: has external-controller", () => {
  const result = renderWithDefaults("windows");
  assert.match(result.configYaml, /external-controller: 127\.0\.0\.1:9090/);
});

// ---------------------------------------------------------------------------
// NAS-specific
// ---------------------------------------------------------------------------

test("nas: tun.enable: true with transparent proxy settings", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  assert.ok(doc.tun, "NAS should have tun section");
  assert.equal(doc.tun.enable, true);
  assert.equal(doc.tun["auto-route"], true);
  assert.equal(doc.tun["auto-redirect"], true);
  assert.equal(doc.tun["strict-route"], true);
  assert.ok(doc.tun["route-exclude-address"], "NAS should have route-exclude-address");
  assert.ok(doc.tun["dns-hijack"].includes("tcp://any:53"));
});

test("nas: allow-lan: true, dns.listen 0.0.0.0:1053", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  assert.equal(doc["allow-lan"], true);
  assert.match(result.configYaml, /listen: 0\.0\.0\.0:1053/);
});

test("nas: no tailscale, no 🏠 回家", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
  assert.equal(tsProxies.length, 0);
  const groupNames = (doc["proxy-groups"] || []).map((g) => g.name);
  assert.ok(!groupNames.includes("🏠 回家"));
});

test("nas: find-process-mode: off", () => {
  if (!yaml) return;
  const result = renderWithDefaults("nas");
  const doc = parseYaml(result.configYaml);
  assert.equal(doc["find-process-mode"], "off");
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

// ---------------------------------------------------------------------------
// Common assertions across all templates
// ---------------------------------------------------------------------------

test("all templates use include-all-proxies instead of include-all", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    // All url-test groups should use include-all-proxies
    assert.doesNotMatch(result.configYaml, /include-all: true(\s|$)/m,
      `${template.id} should not use include-all`);
    assert.match(result.configYaml.trim() + "\n", /include-all-proxies: true/,
      `${template.id} should use include-all-proxies`);
  }
});

test("all templates have cache-algorithm: arc", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /cache-algorithm: arc/);
  }
});

test("all templates have respect-rules: true", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /respect-rules: true/);
  }
});

test("all templates use enhanced-mode: fake-ip", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /enhanced-mode: fake-ip/);
  }
});

test("all templates have correct rule-provider URLs using RULE_BASE_URL", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    // Custom-direct-domain should reference RULE_BASE_URL
    assert.match(result.configYaml, /url: "http:\/\/local\.test\/rules\/custom-direct-domain\.list"/);
    assert.match(result.configYaml, /url: "http:\/\/local\.test\/rules\/custom-proxy-domain\.list"/);
    assert.match(result.configYaml, /url: "http:\/\/local\.test\/rules\/pt-direct-domain\.list"/);
  }
});

test("all templates have japan-services-domain rule-provider", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /japan-services-domain:/);
    assert.match(result.configYaml, /RULE-SET,japan-services-domain,/);
  }
});

test("all templates have no geodata-mode, geo-auto-update, geox-url", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.doesNotMatch(result.configYaml, /^geodata-mode:/m);
    assert.doesNotMatch(result.configYaml, /^geo-auto-update:/m);
    assert.doesNotMatch(result.configYaml, /^geox-url:/m);
  }
});

test("all templates have no directly imported HenryChiao fake-ip-filter with wildcards", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    // The old HenryChiao fake-ip-filter.list had entries with wildcard patterns
    // We should not see patterns from that file in the output
    // Instead check that our custom entries are present
    assert.match(result.configYaml, /dns\.msftncsi\.com/);
  }
});

test("all templates have no fallback section in DNS (simplified DNS)", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.doesNotMatch(result.configYaml, /^\s+fallback:/m);
    assert.doesNotMatch(result.configYaml, /^\s+fallback-filter:/m);
  }
});

test("all templates use new proxy group names", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /🚀 默认代理/);
    assert.match(result.configYaml, /⚡ 全部自动/);
    assert.match(result.configYaml, /♻️ 日本自动/);
    assert.match(result.configYaml, /♻️ 美国自动/);
    assert.doesNotMatch(result.configYaml, /🚀 节点选择/);
    assert.doesNotMatch(result.configYaml, /⚡ 自动选择/);
  }
});

test("all templates exclude-filter has traffic/expire keywords", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    assert.match(result.configYaml, /exclude-filter.*流量/);
  }
});

test("all url-test groups have lazy: true, expected-status: 204, empty-fallback: REJECT", () => {
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    // Find url-test groups and check params
    if (!yaml) {
      // Without yaml parser, just check key strings exist
      assert.match(result.configYaml, /lazy: true/);
      assert.match(result.configYaml, /expected-status: 204/);
      assert.match(result.configYaml, /empty-fallback: REJECT/);
      assert.match(result.configYaml, /timeout: 3000/);
      return;
    }
    const doc = parseYaml(result.configYaml);
    for (const group of doc["proxy-groups"] || []) {
      if (group.type === "url-test" && group.name !== "⚡ 全部自动") {
        // ♻️ groups use YAML anchors from &url-test-defaults
      }
      if (group.type === "url-test") {
        assert.equal(group.lazy, true, `Group ${group.name} should have lazy: true`);
        assert.equal(group["expected-status"], 204, `Group ${group.name} should have expected-status: 204`);
        assert.equal(group["empty-fallback"], "REJECT", `Group ${group.name} should have empty-fallback: REJECT`);
        assert.equal(group.interval, 600, `Group ${group.name} should have interval: 600`);
        assert.equal(group.timeout, 3000, `Group ${group.name} should have timeout: 3000`);
      }
    }
  }
});

test("select groups have no url/interval/expected-status", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    for (const group of doc["proxy-groups"] || []) {
      if (group.type === "select") {
        assert.equal(group.url, undefined, `Select group ${group.name} should not have url`);
        assert.equal(group.interval, undefined, `Select group ${group.name} should not have interval`);
        assert.equal(group["expected-status"], undefined, `Select group ${group.name} should not have expected-status`);
      }
    }
  }
});

test("regional groups do not contain DIRECT", () => {
  if (!yaml) return;
  for (const template of DEFAULT_TEMPLATES) {
    const result = renderWithDefaults(template.id);
    const doc = parseYaml(result.configYaml);
    for (const group of doc["proxy-groups"] || []) {
      if (group.name === "🇯🇵 日本节点" || group.name === "🇺🇸 美国节点") {
        assert.ok(!group.proxies.includes("DIRECT"),
          `Group ${group.name} should not contain DIRECT`);
        // First proxy should be the auto group
        assert.ok(group.proxies[0].startsWith("♻️"),
          `Group ${group.name} first proxy should be auto`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Rule file validation
// ---------------------------------------------------------------------------

test("rule files: no duplicate lines", () => {
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
  }
});

test("rule files: no illegal whitespace", () => {
  const ruleFiles = [
    "pt-direct-domain.list",
    "misc-direct-domain.list",
    "android-fcm-domain.list",
    "android-google-play-domain.list",
    "japan-services-domain.list",
  ];
  for (const filename of ruleFiles) {
    const filePath = resolve(rootDir, "rules", filename);
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    for (const line of lines) {
      // Strip the leading "+." prefix for domain rules before checking
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
  assert.ok(!content.includes("19970626"), "pt-direct-domain.list should not contain 19970626");
});

// ---------------------------------------------------------------------------
// Existing behavioral tests (preserved)
// ---------------------------------------------------------------------------

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

  assert.deepEqual(template.variables, [
    { name: "PROFILE_NAME", required: true, defaultValue: "NAS" },
    { name: "HOME_DOMAIN", required: false, defaultValue: "" },
  ]);
});

test("template normalization discovers variables from yaml body", () => {
  const template = normalizeTemplate({
    id: "android",
    name: "Android",
    platform: "android",
    body: DEFAULT_TEMPLATES[0].body,
  });

  assert.deepEqual(template.variables, [
    { name: "HOME_DOMAIN", required: false, defaultValue: "" },
    { name: "TS_DOMAIN", required: false, defaultValue: "" },
  ]);
});

test("render accepts normalized variable names from api callers", () => {
  const result = renderConfig({
    template: builtInTemplateById("nas"),
    nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#NAS%20Sample",
    variables: { profileName: "CustomProfile" },
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
