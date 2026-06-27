import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let yaml;
try {
  yaml = await import("js-yaml");
} catch {
  console.error("js-yaml is required. Run: npm install --save-dev js-yaml");
  process.exit(1);
}

const templatesPath = resolve(rootDir, "src/core/templates.js");
const renderPath = resolve(rootDir, "src/core/render.js");
const defaultRuleBodiesPath = resolve(rootDir, "src/core/default-rule-bodies.js");

import(`file://${templatesPath}`)
  .then(({ builtInTemplateById, DEFAULT_TEMPLATES }) => {
    import(`file://${renderPath}`)
      .then(({ renderConfig }) => {
        import(`file://${defaultRuleBodiesPath}`)
          .then(({ listRuleFiles }) => {
            runValidation(builtInTemplateById, DEFAULT_TEMPLATES, renderConfig, listRuleFiles);
          });
      });
  });

// ================ Forbidden strings ================
const FORBIDDEN = [
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

// ================ Required providers (all templates) ================
const COMMON_PROVIDERS = [
  "private_domain",
  "private_ip",
  "cn_domain",
  "cn_ip",
  "openai_domain",
  "github_domain",
  "tracker_domain",
  "jp_ip",
  "custom-direct-domain",
  "custom-proxy-domain",
  "pt-direct-domain",
  "misc-direct-domain",
  "japan-services-domain",
];

// ================ Android-only providers ================
const ANDROID_PROVIDERS = [
  "googlefcm_domain",
  "googleplay_domain",
  "android-fcm-domain",
  "android-google-play-domain",
];

// ================ Required proxy groups ================
const COMMON_GROUPS = ["🚀 默认代理", "⚡ 全部自动", "🇯🇵 日本节点", "♻️ 日本自动", "🇺🇸 美国节点", "♻️ 美国自动"];

// ================ Provider format checks ================
const MRS_DOMAIN = new Set([
  "private_domain",
  "cn_domain",
  "openai_domain",
  "github_domain",
  "tracker_domain",
  "googlefcm_domain",
  "googleplay_domain",
]);

const MRS_IPCidr = new Set(["private_ip", "cn_ip", "jp_ip"]);

const TEXT_DOMAIN = new Set([
  "custom-direct-domain",
  "custom-proxy-domain",
  "pt-direct-domain",
  "misc-direct-domain",
  "japan-services-domain",
  "android-fcm-domain",
  "android-google-play-domain",
]);

// ================ Old names that must NOT appear ================
const OLD_NAMES = ["private", "cn", "geoip-cn", "openai", "github"];

function runValidation(builtInTemplateById, DEFAULT_TEMPLATES, renderConfig, listRuleFiles) {
  const testNodes = [
    "ss://YWVzLTEyOC1nY206cGFzc0B1cy5leGFtcGxlLmNvbTo4Mzg4#us-test",
    "ss://YWVzLTEyOC1nY206cGFzc0BqcC5leGFtcGxlLmNvbTo4Mzg4#jp-test",
    "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#剩余流量 100GB",
  ].join("\n");

  let failures = 0;

  for (const template of DEFAULT_TEMPLATES) {
    const id = template.id;
    console.log(`\n=== Validating ${id} template ===`);

    try {
      const variables = {
        PROFILE_NAME: id === "android" ? undefined : id.toUpperCase(),
        HOME_DOMAIN: "19970626.xyz",
        TS_DOMAIN: "tailc1b432.ts.net",
        RULE_BASE_URL: "http://local.test/rules",
      };

      const result = renderConfig({
        template: builtInTemplateById(id),
        nodesText: testNodes,
        variables,
      });

      const rawYaml = result.configYaml;
      const doc = yaml.load(rawYaml);

      // ======================== A. Forbidden strings ========================
      console.log("  A. Checking forbidden strings...");
      for (const forbidden of FORBIDDEN) {
        if (rawYaml.includes(forbidden)) {
          console.error(`  FAIL: ${id} contains forbidden string "${forbidden}"`);
          failures++;
        }
      }

      // ======================== B. Common provider check ========================
      console.log("  B. Checking common providers...");
      const providers = Object.keys(doc["rule-providers"] || {});
      for (const name of COMMON_PROVIDERS) {
        if (!providers.includes(name)) {
          console.error(`  FAIL: ${id} missing provider: ${name}`);
          failures++;
        }
      }

      // ======================== C. Android-specific providers ========================
      console.log("  C. Checking platform-specific providers...");
      if (id === "android") {
        for (const name of ANDROID_PROVIDERS) {
          if (!providers.includes(name)) {
            console.error(`  FAIL: ${id} missing android provider: ${name}`);
            failures++;
          }
        }
      } else {
        for (const name of ANDROID_PROVIDERS) {
          if (providers.includes(name)) {
            console.error(`  FAIL: ${id} should NOT have android provider: ${name}`);
            failures++;
          }
        }
      }

      // ======================== D. Provider format checks ========================
      console.log("  D. Checking provider formats...");
      for (const name of MRS_DOMAIN) {
        const p = doc["rule-providers"]?.[name];
        if (p) {
          if (p.behavior !== "domain") {
            console.error(`  FAIL: ${id} ${name} should have behavior=domain, got ${p.behavior}`);
            failures++;
          }
          if (p.format !== "mrs") {
            console.error(`  FAIL: ${id} ${name} should have format=mrs, got ${p.format}`);
            failures++;
          }
        }
      }
      for (const name of MRS_IPCidr) {
        const p = doc["rule-providers"]?.[name];
        if (p) {
          if (p.behavior !== "ipcidr") {
            console.error(`  FAIL: ${id} ${name} should have behavior=ipcidr, got ${p.behavior}`);
            failures++;
          }
          if (p.format !== "mrs") {
            console.error(`  FAIL: ${id} ${name} should have format=mrs, got ${p.format}`);
            failures++;
          }
        }
      }
      for (const name of TEXT_DOMAIN) {
        const p = doc["rule-providers"]?.[name];
        if (p) {
          if (p.behavior !== "domain") {
            console.error(`  FAIL: ${id} ${name} should have behavior=domain, got ${p.behavior}`);
            failures++;
          }
          if (p.format !== "text") {
            console.error(`  FAIL: ${id} ${name} should have format=text, got ${p.format}`);
            failures++;
          }
        }
      }

      // ======================== E. RULE-SET vs providers ========================
      console.log("  E. Checking RULE-SET references vs providers...");
      const rules = doc.rules || [];
      for (const rule of rules) {
        if (typeof rule === "string" && rule.startsWith("RULE-SET,")) {
          const providerName = rule.split(",")[1];
          if (!providers.includes(providerName)) {
            console.error(`  FAIL: ${id} RULE-SET references unknown provider: ${providerName}`);
            failures++;
          }
        }
      }

      // Check no old names
      for (const rule of rules) {
        if (typeof rule === "string") {
          for (const old of OLD_NAMES) {
            if (rule.includes(`RULE-SET,${old},`)) {
              console.error(`  FAIL: ${id} uses old provider name in rule: ${rule}`);
              failures++;
            }
          }
        }
      }

      // ======================== F. Strategy group existence ========================
      console.log("  F. Checking proxy-group targets...");
      const groupNames = new Set((doc["proxy-groups"] || []).map((g) => g.name));
      for (const name of COMMON_GROUPS) {
        if (!groupNames.has(name)) {
          console.error(`  FAIL: ${id} missing proxy-group: ${name}`);
          failures++;
        }
      }

      if (id === "android") {
        if (!groupNames.has("🏠 回家")) {
          console.error(`  FAIL: ${id} missing 🏠 回家 group`);
          failures++;
        }
        if (!groupNames.has("📲 谷歌推送")) {
          console.error(`  FAIL: ${id} missing 📲 谷歌推送 group`);
          failures++;
        }
      } else {
        if (groupNames.has("🏠 回家")) {
          console.error(`  FAIL: ${id} should NOT have 🏠 回家 group`);
          failures++;
        }
        if (groupNames.has("📲 谷歌推送")) {
          console.error(`  FAIL: ${id} should NOT have 📲 谷歌推送 group`);
          failures++;
        }
      }

      // ======================== G. Rule order & targeting ========================
      console.log("  G. Checking rule order and targeting...");
      const ruleLines = rules.filter((r) => typeof r === "string");
      const findRuleIndex = (target) => ruleLines.findIndex((r) => r.includes(target));

      // custom-direct-domain before japan-services-domain
      const cddIdx = findRuleIndex("custom-direct-domain");
      const jsdIdx = findRuleIndex("japan-services-domain");
      if (cddIdx >= 0 && jsdIdx >= 0 && cddIdx > jsdIdx) {
        console.error(`  FAIL: ${id} custom-direct-domain should be before japan-services-domain`);
        failures++;
      }

      // japan-services-domain before custom-proxy-domain
      const cpdIdx = findRuleIndex("custom-proxy-domain");
      if (jsdIdx >= 0 && cpdIdx >= 0 && jsdIdx > cpdIdx) {
        console.error(`  FAIL: ${id} japan-services-domain should be before custom-proxy-domain`);
        failures++;
      }

      // jp_ip before custom-proxy-domain
      const jpIpIdx = findRuleIndex("jp_ip");
      if (jpIpIdx >= 0 && cpdIdx >= 0 && jpIpIdx > cpdIdx) {
        console.error(`  FAIL: ${id} jp_ip should be before custom-proxy-domain`);
        failures++;
      }

      // custom-proxy-domain before cn_domain
      const cnDomIdx = findRuleIndex("cn_domain");
      if (cpdIdx >= 0 && cnDomIdx >= 0 && cpdIdx > cnDomIdx) {
        console.error(`  FAIL: ${id} custom-proxy-domain should be before cn_domain`);
        failures++;
      }

      // openai_domain -> 🇺🇸 美国节点
      const openaiRule = ruleLines.find((r) => r.includes("openai_domain,"));
      if (openaiRule && !openaiRule.includes("🇺🇸 美国节点")) {
        console.error(`  FAIL: ${id} openai_domain should target 🇺🇸 美国节点`);
        failures++;
      }

      // github_domain -> 🇺🇸 美国节点
      const githubRule = ruleLines.find((r) => r.includes("github_domain,"));
      if (githubRule && !githubRule.includes("🇺🇸 美国节点")) {
        console.error(`  FAIL: ${id} github_domain should target 🇺🇸 美国节点`);
        failures++;
      }

      // japan-services-domain -> 🇯🇵 日本节点
      const japanRule = ruleLines.find((r) => r.includes("japan-services-domain,"));
      if (japanRule && !japanRule.includes("🇯🇵 日本节点")) {
        console.error(`  FAIL: ${id} japan-services-domain should target 🇯🇵 日本节点`);
        failures++;
      }

      // jp_ip -> 🇯🇵 日本节点
      const jpIpRule = ruleLines.find((r) => r.startsWith("RULE-SET,jp_ip,"));
      if (jpIpRule && !jpIpRule.includes("🇯🇵 日本节点")) {
        console.error(`  FAIL: ${id} jp_ip should target 🇯🇵 日本节点`);
        failures++;
      }

      // cn_domain -> DIRECT
      const cnDomRule = ruleLines.find((r) => r.startsWith("RULE-SET,cn_domain,"));
      if (cnDomRule && !cnDomRule.endsWith(",DIRECT")) {
        console.error(`  FAIL: ${id} cn_domain should target DIRECT, got: ${cnDomRule}`);
        failures++;
      }

      // cn_ip -> DIRECT,no-resolve
      const cnIpRule = ruleLines.find((r) => r.startsWith("RULE-SET,cn_ip,"));
      if (cnIpRule && !cnIpRule.endsWith(",no-resolve")) {
        console.error(`  FAIL: ${id} cn_ip should target DIRECT,no-resolve, got: ${cnIpRule}`);
        failures++;
      }

      // MATCH is last
      const lastRule = ruleLines[ruleLines.length - 1];
      if (lastRule && !lastRule.startsWith("MATCH,")) {
        console.error(`  FAIL: ${id} last rule should be MATCH, got: ${lastRule}`);
        failures++;
      }

      // ======================== H. Android-specific ========================
      console.log("  H. Checking Android-specific rules...");
      if (id === "android") {
        const tsProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
        if (tsProxies.length !== 1) {
          console.error(`  FAIL: ${id} should have exactly 1 tailscale proxy, got ${tsProxies.length}`);
          failures++;
        }
        if (tsProxies.length === 1 && tsProxies[0]["exit-node-allow-lan-access"] !== undefined) {
          console.error(`  FAIL: ${id} tailscale should not have exit-node-allow-lan-access`);
          failures++;
        }

        // HOME_DOMAIN/TS_DOMAIN rules target 🏠 回家
        for (const rule of rules) {
          if (typeof rule === "string") {
            if ((rule.includes("19970626.xyz") || rule.includes("tailc1b432.ts.net")) &&
                !rule.includes("🏠 回家")) {
              console.error(`  FAIL: ${id} HOME_DOMAIN or TS_DOMAIN rule should target 🏠 回家: ${rule}`);
              failures++;
            }
            if ((rule.includes("100.64.0.0/10") || rule.includes("fd7a:115c:a1e0::/48") ||
                 rule.includes("192.168.1.0/24") || rule.includes("192.168.2.0/24")) &&
                !rule.includes("🏠 回家")) {
              console.error(`  FAIL: ${id} home CIDR rule should target 🏠 回家: ${rule}`);
              failures++;
            }
          }
        }

        // .lan/.local should target DIRECT
        for (const rule of rules) {
          if (typeof rule === "string") {
            if ((rule.includes("DOMAIN-SUFFIX,lan,") || rule.includes("DOMAIN-SUFFIX,local,")) &&
                !rule.endsWith(",DIRECT")) {
              console.error(`  FAIL: ${id} .lan/.local should target DIRECT: ${rule}`);
              failures++;
            }
          }
        }

        if (doc["allow-lan"] !== false) {
          console.error(`  FAIL: ${id} allow-lan should be false`);
          failures++;
        }
        if (!doc.tun || doc.tun.enable !== true) {
          console.error(`  FAIL: ${id} tun.enable should be true`);
          failures++;
        }

        // Check no external-ui-url
        if (rawYaml.includes("external-ui-url")) {
          console.error(`  FAIL: ${id} should not have external-ui-url`);
          failures++;
        }
      }

      // ======================== I. Windows-specific ========================
      console.log("  I. Checking Windows-specific rules...");
      if (id === "windows") {
        if (doc["allow-lan"] !== false) {
          console.error(`  FAIL: ${id} allow-lan should be false`);
          failures++;
        }
        if (doc["find-process-mode"] !== "off") {
          console.error(`  FAIL: ${id} find-process-mode should be off`);
          failures++;
        }
        // No tailscale
        const tsCount = (doc.proxies || []).filter((p) => p.type === "tailscale").length;
        if (tsCount > 0) {
          console.error(`  FAIL: ${id} should not have tailscale proxy`);
          failures++;
        }
        // No tun required
      }

      // ======================== J. NAS-specific ========================
      console.log("  J. Checking NAS-specific rules...");
      if (id === "nas") {
        if (doc["allow-lan"] !== true) {
          console.error(`  FAIL: ${id} allow-lan should be true`);
          failures++;
        }
        if (doc["mixed-port"] !== 7890) {
          console.error(`  FAIL: ${id} mixed-port should be 7890`);
          failures++;
        }
        if (!doc.tun || doc.tun.enable !== true) {
          console.error(`  FAIL: ${id} tun.enable should be true`);
          failures++;
        }
        if (!doc.tun || doc.tun["auto-route"] !== true) {
          console.error(`  FAIL: ${id} tun.auto-route should be true`);
          failures++;
        }
        if (!doc.tun || doc.tun["auto-redirect"] !== true) {
          console.error(`  FAIL: ${id} tun.auto-redirect should be true`);
          failures++;
        }
        if (!doc.tun || doc.tun["strict-route"] !== true) {
          console.error(`  FAIL: ${id} tun.strict-route should be true`);
          failures++;
        }
        const dh = doc.tun?.["dns-hijack"] || [];
        if (!dh.includes("any:53") || !dh.includes("tcp://any:53")) {
          console.error(`  FAIL: ${id} dns-hijack should include any:53 and tcp://any:53`);
          failures++;
        }
        // No tailscale
        const tsCount = (doc.proxies || []).filter((p) => p.type === "tailscale").length;
        if (tsCount > 0) {
          console.error(`  FAIL: ${id} should not have tailscale proxy`);
          failures++;
        }
      }

      console.log(`  OK - ${result.byteLength} bytes, ${result.proxies.length} proxies`);

    } catch (error) {
      console.error(`FAIL: ${error.message}`);
      failures++;
    }
  }

  // ======================== K. Rule file validation ========================
  console.log("\n=== Validating rule files ===");

  const ruleFiles = listRuleFiles();
  for (const filename of ruleFiles) {
    const filePath = resolve(rootDir, "rules", filename);
    if (!existsSync(filePath)) {
      console.error(`FAIL: Rule file not found: ${filename}`);
      failures++;
      continue;
    }
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));

    // Check for duplicate lines
    const seen = new Set();
    for (const line of lines) {
      if (seen.has(line)) {
        console.error(`FAIL: Duplicate line in ${filename}: ${line}`);
        failures++;
      }
      seen.add(line);
    }

    // Check for illegal whitespace
    for (const line of lines) {
      const trimmed = line.replace(/^\+\./, "").trim();
      if (/\s/.test(trimmed)) {
        console.error(`FAIL: Illegal whitespace in ${filename}: ${line}`);
        failures++;
      }
    }
  }

  // japan-services-domain.list required entries
  const jsdContent = readFileSync(resolve(rootDir, "rules/japan-services-domain.list"), "utf8");
  const requiredJapan = ["+.jp", "+.dmm.co.jp", "+.pixiv.net", "+.amazon.co.jp", "+.rakuten.co.jp", "+.yahoo.co.jp"];
  for (const entry of requiredJapan) {
    if (!jsdContent.includes(entry)) {
      console.error(`FAIL: japan-services-domain.list missing: ${entry}`);
      failures++;
    }
  }

  // pt-direct-domain.list should not contain smzdm/pcbeta/personal home domain
  const ptContent = readFileSync(resolve(rootDir, "rules/pt-direct-domain.list"), "utf8");
  if (ptContent.includes("smzdm") || ptContent.includes("pcbeta") || ptContent.includes("19970626")) {
    console.error(`FAIL: pt-direct-domain.list contains non-PT domains`);
    failures++;
  }

  // ======================== L. Default variable rendering ========================
  console.log("\n=== Validating default variable rendering ===");

  for (const template of DEFAULT_TEMPLATES) {
    const id = template.id;
    // Build variables from template defaults only
    const variables = {};
    for (const v of template.variables) {
      variables[v.name] = v.defaultValue;
    }
    // Add RULE_BASE_URL which is always injected
    variables.RULE_BASE_URL = "http://local.test/rules";
    // GENERATED_AT is auto-set, PROXIES_YAML is auto-set
    // Do NOT add HOME_DOMAIN or TS_DOMAIN unless the template declares them

    try {
      const result = renderConfig({
        template: builtInTemplateById(id),
        nodesText: [
          "ss://YWVzLTEyOC1nY206cGFzc0B1cy5leGFtcGxlLmNvbTo4Mzg4#us-test",
          "ss://YWVzLTEyOC1nY206cGFzc0BqcC5leGFtcGxlLmNvbTo4Mzg4#jp-test",
        ].join("\n"),
        variables,
      });

      const rawYaml = result.configYaml;

      // No unresolved {{...}} placeholders
      if (/\{\{\s*[A-Z0-9_]+\s*\}\}/i.test(rawYaml)) {
        console.error(`FAIL: ${id} default render has unresolved placeholders`);
        failures++;
      }

      // Windows-specific checks
      if (id === "windows") {
        if (rawYaml.includes("HOME_DOMAIN}") || rawYaml.includes("TS_DOMAIN}")) {
          console.error(`FAIL: ${id} default render must not have HOME_DOMAIN or TS_DOMAIN placeholders`);
          failures++;
        }
        if (rawYaml.includes("tailscale") || rawYaml.includes("🏠 回家") || rawYaml.includes("📲 谷歌推送")) {
          console.error(`FAIL: ${id} default render must not contain tailscale/回家/谷歌推送`);
          failures++;
        }
      }

      console.log(`  OK - ${id} default render: ${result.byteLength} bytes`);

    } catch (error) {
      console.error(`FAIL: ${id} default render failed: ${error.message}`);
      failures++;
    }
  }

  // ======================== M. Worker /rules whitelist check ========================
  console.log("\n=== Validating Worker /rules whitelist ===");

  const allowed = listRuleFiles();
  const templateIncludePattern = /#\s*t-sub:include\s+rules\/([^\s]+)/g;

  for (const template of DEFAULT_TEMPLATES) {
    const body = template.body;
    let match;
    while ((match = templateIncludePattern.exec(body)) !== null) {
      const filename = match[1];
      if (!allowed.includes(filename)) {
        console.error(`FAIL: ${template.id} references rules/${filename} but it is not in Worker whitelist`);
        failures++;
      }
    }
  }

  console.log(`  OK - all template includes are whitelisted`);

  console.log(`\n=== Results ===`);
  if (failures === 0) {
    console.log("All validations passed.");
  } else {
    console.error(`${failures} failure(s) found.`);
    process.exit(1);
  }
}
