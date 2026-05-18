import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_TEMPLATES } from "../src/core/templates.js";
import { renderConfig } from "../src/core/render.js";

test("renders mihomo yaml from template and node lines", () => {
  const result = renderConfig({
    template: DEFAULT_TEMPLATES[0],
    nodesText: "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#ss%20node",
    variables: { PROFILE_NAME: "Phone" },
  });

  assert.match(result.configYaml, /Phone 生成于/);
  assert.match(result.configYaml, /type: "ss"|type: ss/);
  assert.match(result.configYaml, /ss node/);
  assert.equal(result.proxies.length, 1);
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
