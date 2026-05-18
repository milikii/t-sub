import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_TEMPLATES, builtInTemplateById } from "../src/core/templates.js";
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
  assert.match(result.configYaml, /proxies:\n  - name: "Android Sample"/);
  assert.match(result.configYaml, /name: __HOME_NODE_MISSING__/);
  assert.match(result.configYaml, /MATCH,🚀 节点选择/);
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
