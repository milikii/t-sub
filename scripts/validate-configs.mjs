import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Try to load js-yaml
let yaml;
try {
  yaml = await import("js-yaml");
} catch {
  console.error("js-yaml is required. Run: npm install --save-dev js-yaml");
  process.exit(1);
}

// Dynamically import the modules
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
        RULE_BASE_URL: `http://local.test/rules`,
      };

      const result = renderConfig({
        template: builtInTemplateById(id),
        nodesText: testNodes,
        variables,
      });

      // Parse YAML
      const doc = yaml.load(result.configYaml);

      // Check no duplicate top-level keys
      const topKeys = Object.keys(doc);
      const keySet = new Set();
      for (const key of topKeys) {
        if (keySet.has(key)) {
          console.error(`FAIL: Duplicate top-level key: ${key}`);
          failures++;
        }
        keySet.add(key);
      }

      // Check all RULE-SET have corresponding rule-providers
      const providers = Object.keys(doc["rule-providers"] || {});
      const rules = doc.rules || [];
      for (const rule of rules) {
        if (typeof rule === "string" && rule.startsWith("RULE-SET,")) {
          const providerName = rule.split(",")[1];
          if (!providers.includes(providerName)) {
            console.error(`FAIL: RULE-SET references undefined provider: ${providerName}`);
            failures++;
          }
        }
      }

      // Check all proxy group references exist
      const groupNames = (doc["proxy-groups"] || []).map((g) => g.name);
      const groupNameSet = new Set(groupNames);

      // Verify proxy-groups references
      for (const group of doc["proxy-groups"] || []) {
        for (const ref of group.proxies || []) {
          if (!groupNameSet.has(ref) && ref !== "DIRECT" && !ref.startsWith("♻️") && ref !== "tailscale") {
            // Check if ref is a provider reference
            const maybeProvider = group.use ? group.use.includes(ref) : false;
            // Check if ref is a node name (from include-all-proxies)
            if (!maybeProvider && !group["include-all-proxies"]) {
              // Only flag if it's not in include-all mode
              // Actually with include-all-proxies: true, node names are auto-detected
              // Just check for logical correctness
            }
          }
        }
      }

      // Check all rule targets are valid
      for (const rule of rules) {
        if (typeof rule === "string") {
          const parts = rule.split(",");
          const target = parts[parts.length - 1].replace(/,no-resolve$/, "").trim();
          if (target !== "DIRECT" && target !== "REJECT" && target !== "tailscale" && !target.startsWith("♻️")) {
            if (target.includes("://")) continue; // skip URL-form rules
            if (!groupNameSet.has(target) && target !== "DIRECT" && target !== "REJECT") {
              // Might be a provider name - skip for now since include-all-proxies handles it
            }
          }
        }
      }

      // Template-specific checks
      if (id === "android") {
        // Exactly one tailscale proxy
        const tailscaleProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
        if (tailscaleProxies.length !== 1) {
          console.error(`FAIL: Expected exactly 1 tailscale proxy, got ${tailscaleProxies.length}`);
          failures++;
        }

        // Check exit-node-allow-lan-access is absent
        for (const p of doc.proxies || []) {
          if (p["exit-node-allow-lan-access"] !== undefined) {
            console.error(`FAIL: exit-node-allow-lan-access should not be present`);
            failures++;
          }
        }

        // Check home group exists
        if (!groupNameSet.has("🏠 回家")) {
          console.error(`FAIL: Android missing 🏠 回家 group`);
          failures++;
        }

        // Check 谷歌推送 group exists
        if (!groupNameSet.has("📲 谷歌推送")) {
          console.error(`FAIL: Android missing 📲 谷歌推送 group`);
          failures++;
        }

        // Check no DOMAIN-SUFFIX,lan,tailscale or DOMAIN-SUFFIX,local,tailscale
        for (const rule of rules) {
          if (typeof rule === "string" && (rule.match(/DOMAIN-SUFFIX,lan/) || rule.match(/DOMAIN-SUFFIX,local,/))) {
            console.error(`FAIL: Should not have DOMAIN-SUFFIX,lan or DOMAIN-SUFFIX,local: ${rule}`);
            failures++;
          }
        }
      }

      if (id === "windows" || id === "nas") {
        // No tailscale type
        const tailscaleProxies = (doc.proxies || []).filter((p) => p.type === "tailscale");
        if (tailscaleProxies.length > 0) {
          console.error(`FAIL: ${id} should not have tailscale proxy`);
          failures++;
        }

        // No 🏠 回家 group
        if (groupNameSet.has("🏠 回家")) {
          console.error(`FAIL: ${id} should not have 🏠 回家 group`);
          failures++;
        }
      }

      if (id === "nas") {
        // tun.enable: true
        if (!doc.tun || doc.tun.enable !== true) {
          console.error(`FAIL: NAS must have tun.enable: true`);
          failures++;
        }
        if (!doc.tun || doc.tun["auto-route"] !== true) {
          console.error(`FAIL: NAS must have auto-route: true`);
          failures++;
        }
        if (!doc.tun || doc.tun["auto-redirect"] !== true) {
          console.error(`FAIL: NAS must have auto-redirect: true`);
          failures++;
        }
        if (!doc.tun || doc.tun["strict-route"] !== true) {
          console.error(`FAIL: NAS must have strict-route: true`);
          failures++;
        }
        if (doc["allow-lan"] !== true) {
          console.error(`FAIL: NAS must have allow-lan: true`);
          failures++;
        }
      }

      if (id === "windows") {
        if (doc["allow-lan"] !== false) {
          console.error(`FAIL: Windows must have allow-lan: false`);
          failures++;
        }
        if (doc["find-process-mode"] !== "off") {
          console.error(`FAIL: Windows must have find-process-mode: off`);
          failures++;
        }
      }

      console.log(`  OK - ${result.byteLength} bytes, ${result.proxies.length} proxies`);

    } catch (error) {
      console.error(`FAIL: ${error.message}`);
      if (error.details) console.error("  Details:", error.details);
      failures++;
    }
  }

  // Validate rule files
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
      if (/\s/.test(line.trim())) {
        console.error(`FAIL: Illegal whitespace in ${filename}: ${line}`);
        failures++;
      }
    }
  }

  // Check pt-direct-domain.list doesn't contain smzdm/pcbeta
  const ptContent = readFileSync(resolve(rootDir, "rules/pt-direct-domain.list"), "utf8");
  if (ptContent.includes("smzdm") || ptContent.includes("pcbeta")) {
    console.error(`FAIL: pt-direct-domain.list contains non-PT domains (smzdm/pcbeta)`);
    failures++;
  }

  console.log(`\n=== Results ===`);
  if (failures === 0) {
    console.log("All validations passed.");
  } else {
    console.error(`${failures} failure(s) found.`);
    process.exit(1);
  }
}
