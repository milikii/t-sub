import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_TEMPLATES, builtInTemplateById, normalizeTemplate } from "../src/core/templates.js";
import { renderConfig } from "../src/core/render.js";

test("renders mihomo yaml from template and node lines", () => {
  const template = builtInTemplateById("nas");
  const result = renderConfig({
    template,
    nodesText: "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#ss%20node",
    variables: { PROFILE_NAME: "NAS" },
  });

  assert.match(result.configYaml, /NAS 生成于/);
  assert.match(result.configYaml, /type: "ss"|type: ss/);
  assert.match(result.configYaml, /ss node/);
  assert.equal(result.proxies.length, 1);
});

test("android built-in template injects generated proxies into top-level proxies", () => {
  const result = renderConfig({
    template: builtInTemplateById("android"),
    nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#Android%20Sample",
    variables: {},
  });

  assert.match(result.configYaml, /tun:\n  enable: true/);
  assert.match(result.configYaml, /route-address:\n    - 0\.0\.0\.0\/0/);
  assert.doesNotMatch(result.configYaml, /::\/0/);
  assert.match(result.configYaml, /dns-hijack:\n    - any:53/);
  assert.doesNotMatch(result.configYaml, /tcp:\/\/any:53/);
  assert.match(result.configYaml, /^ipv6: false$/m);
  assert.match(result.configYaml, /dns:\n  enable: true\n  listen: 127\.0\.0\.1:1053\n  ipv6: false/);
  assert.doesNotMatch(result.configYaml, /^ipv6: true$/m);
  assert.match(result.configYaml, /respect-rules: true/);
  assert.match(result.configYaml, /direct-nameserver:\n    - https:\/\/dns\.alidns\.com\/dns-query\n    - https:\/\/doh\.pub\/dns-query/);
  assert.match(result.configYaml, /direct-nameserver-follow-policy: true/);
  assert.match(result.configYaml, /connectivitycheck\.gstatic\.com/);
  assert.match(result.configYaml, /connectivitycheck\.android\.com/);
  assert.match(result.configYaml, /time\.android\.com/);
  assert.match(result.configYaml, /dns\.msftncsi\.com/);
  assert.match(result.configYaml, /- '\*\.19970626\.xyz'/);
  assert.match(result.configYaml, /- '\*\.tailc1b432\.ts\.net'/);
  assert.doesNotMatch(result.configYaml, /global-client-fingerprint/);
  assert.match(result.configYaml, /proxies:\n  - name: "Android Sample"/);
  assert.match(result.configYaml, /type: tailscale/);
  assert.match(result.configYaml, /name: tailscale/);
  assert.match(result.configYaml, /hostname: mihomo-android/);
  assert.match(result.configYaml, /state-dir: \.\/tailscale/);
  assert.match(result.configYaml, /exit-node-allow-lan-access: true/);
  assert.doesNotMatch(result.configYaml, /dialer-proxy:/);
  assert.doesNotMatch(result.configYaml, /auth-key:/);
  assert.match(result.configYaml, /ip-version: dual/);
  assert.match(result.configYaml, /IP-CIDR,192\.168\.1\.0\/24,tailscale,no-resolve/);
  assert.match(result.configYaml, /IP-CIDR,192\.168\.2\.0\/24,tailscale,no-resolve/);
  assert.doesNotMatch(result.configYaml, /IP-CIDR6/);
  assert.match(result.configYaml, /GEOSITE,openai,🇺🇸 美国节点/);
  assert.match(result.configYaml, /GEOSITE,github,🇺🇸 美国节点/);
  assert.match(result.configYaml, /geosite:openai:/);
  assert.match(result.configYaml, /external-ui-url: https:\/\/github\.com\/MetaCubeX\/metacubexd\/archive\/refs\/heads\/gh-pages\.zip/);
  assert.match(result.configYaml, /url: https:\/\/raw\.githubusercontent\.com\/milikii\/t-sub\/master\/rules\/pt-direct\.list\n    interval: 86400/);
  assert.match(result.configYaml, /url: https:\/\/raw\.githubusercontent\.com\/milikii\/t-sub\/master\/rules\/fcm-domain\.list\n    interval: 86400/);
  assert.match(result.configYaml, /url: https:\/\/raw\.githubusercontent\.com\/milikii\/t-sub\/master\/rules\/fcm-ipcidr\.list\n    interval: 86400/);
  assert.doesNotMatch(result.configYaml, /proxy: ⚡ 自动选择\n    interval: 86400/);
  assert.match(result.configYaml, /RULE-SET,fcm-domain,📲 谷歌推送/);
  assert.match(result.configYaml, /RULE-SET,fcm-ipcidr,📲 谷歌推送,no-resolve/);
  assert.doesNotMatch(result.configYaml, /testingcf\.jsdelivr\.net/);
  assert.doesNotMatch(result.configYaml, /DOMAIN-SUFFIX,jsdelivr\.net/);
  assert.match(result.configYaml, /name: 🏠 回家\n    type: select\n    proxies:\n      - tailscale\n      - DIRECT\n    url:/);
  assert.doesNotMatch(result.configYaml, /name: 🏠 回家[\s\S]*?include-all: true/);
  assert.match(result.configYaml, /MATCH,🚀 节点选择/);
});

test("nas and windows templates keep tailscale out while using shared us jp dns policy", () => {
  for (const id of ["nas", "windows"]) {
    const result = renderConfig({
      template: builtInTemplateById(id),
      nodesText: [
        "ss://YWVzLTEyOC1nY206cGFzc0B1cy5leGFtcGxlLmNvbTo4Mzg4#us-test",
        "ss://YWVzLTEyOC1nY206cGFzc0BqcC5leGFtcGxlLmNvbTo4Mzg4#jp-test",
      ].join("\n"),
      variables: { PROFILE_NAME: id.toUpperCase() },
    });

    assert.doesNotMatch(result.configYaml, /type: tailscale/);
    assert.match(result.configYaml, /^ipv6: false$/m);
    assert.match(result.configYaml, /dns:\n  enable: true\n  listen: 127\.0\.0\.1:1053\n  ipv6: false/);
    assert.doesNotMatch(result.configYaml, /^ipv6: true$/m);
    assert.match(result.configYaml, /respect-rules: true/);
    assert.match(result.configYaml, /direct-nameserver-follow-policy: true/);
    assert.doesNotMatch(result.configYaml, /connectivitycheck\.gstatic\.com/);
    assert.doesNotMatch(result.configYaml, /time\.android\.com/);
    assert.match(result.configYaml, /dns\.msftncsi\.com/);
    assert.doesNotMatch(result.configYaml, /global-client-fingerprint/);
    assert.match(result.configYaml, /\(\^\|\[\^a-z\]\)us\(\[\^a-z\]\|\$\)/);
    assert.match(result.configYaml, /\(\^\|\[\^a-z\]\)jp\(\[\^a-z\]\|\$\)/);
    assert.match(result.configYaml, /GEOSITE,private,DIRECT/);
    assert.match(result.configYaml, /GEOSITE,openai,🇺🇸 美国节点/);
    assert.match(result.configYaml, /GEOSITE,github,🇺🇸 美国节点/);
    assert.doesNotMatch(result.configYaml, /testingcf\.jsdelivr\.net/);
    assert.doesNotMatch(result.configYaml, /DOMAIN-SUFFIX,jsdelivr\.net/);
    assert.match(result.configYaml, /geosite:openai:/);
    assert.match(result.configYaml, /geosite:github:/);
    assert.match(result.configYaml, /IP-CIDR,192\.168\.0\.0\/16,DIRECT,no-resolve/);
    if (id === "nas") {
      assert.match(result.configYaml, /allow-lan: true/);
      assert.match(result.configYaml, /lan-allowed-ips:\n  - 192\.168\.0\.0\/16\n  - 10\.0\.0\.0\/8\n  - 172\.16\.0\.0\/12\n  - 100\.64\.0\.0\/10/);
      assert.match(result.configYaml, /find-process-mode: off/);
    } else {
      assert.match(result.configYaml, /allow-lan: false/);
      assert.doesNotMatch(result.configYaml, /lan-allowed-ips:/);
      assert.match(result.configYaml, /find-process-mode: strict/);
    }
  }
});

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
  ]);
});

test("template normalization discovers variables from yaml body", () => {
  const template = normalizeTemplate({
    id: "android",
    name: "Android",
    platform: "android",
    body: DEFAULT_TEMPLATES[0].body,
  });

  assert.deepEqual(template.variables, []);
});

test("render accepts normalized variable names from api callers", () => {
  const result = renderConfig({
    template: builtInTemplateById("nas"),
    nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#NAS%20Sample",
    variables: { profileName: "CustomProfile" },
  });

  assert.match(result.configYaml, /CustomProfile 生成于/);
});

test("template normalization accepts camel case variable metadata", () => {
  const template = normalizeTemplate({
    id: "nas",
    name: "NAS",
    platform: "nas",
    body: "mixed-port: 7890\nproxies:\n{{PROXIES_YAML}}\nprofile: {{profileName}}\n",
    variables: [
      { name: "profileName", required: false },
    ],
  });

  assert.deepEqual(template.variables, [
    { name: "PROFILE_NAME", required: true, defaultValue: "mihomo" },
  ]);
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

test("template normalization accepts normalized proxy injection placeholders", () => {
  const template = normalizeTemplate({
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
  });

  assert.deepEqual(template.variables, [
    { name: "PROFILE_NAME", required: true, defaultValue: "mihomo" },
  ]);
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
        body: `${DEFAULT_TEMPLATES[0].body}\\nextra: {{MISSING_VALUE}}\\n`,
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
