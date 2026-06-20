import assert from "node:assert/strict";
import test from "node:test";

import worker, { OneTimeConfig, TemplateStore } from "../src/worker.js";

test("worker login, render, and one-time subscription flow", async () => {
  const env = await makeEnv("test-password");

  const unauthorized = await worker.fetch(new Request("http://local.test/api/templates"), env);
  assert.equal(unauthorized.status, 401);

  const login = await worker.fetch(
    new Request("http://local.test/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "test-password" }),
    }),
    env,
  );
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const templates = await worker.fetch(
    new Request("http://local.test/api/templates", {
      headers: { cookie },
    }),
    env,
  );
  assert.equal(templates.status, 200);
  assert.ok((await templates.json()).templates.some((template) => template.id === "android"));

  const overwriteAndroid = await worker.fetch(
    new Request("http://local.test/api/templates/android", {
      method: "PUT",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Android",
        platform: "android",
        description: "temporary",
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
        variables: [],
      }),
    }),
    env,
  );
  assert.equal(overwriteAndroid.status, 200);

  const resetAndroid = await worker.fetch(
    new Request("http://local.test/api/templates/android/reset", {
      method: "POST",
      headers: { cookie },
    }),
    env,
  );
  assert.equal(resetAndroid.status, 200);
  const resetBody = await resetAndroid.json();
  assert.match(resetBody.template.body, /external-ui-url:/);
  assert.match(resetBody.template.body, /MATCH,🚀 节点选择/);
  assert.deepEqual(resetBody.template.variables, [
    { name: "HOME_DOMAIN", required: false, defaultValue: "19970626.xyz" },
    { name: "TS_DOMAIN", required: false, defaultValue: "tailc1b432.ts.net" },
  ]);

  const saveAndroidWithoutVariables = await worker.fetch(
    new Request("http://local.test/api/templates/android", {
      method: "PUT",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Android",
        platform: "android",
        description: "saved without variables",
        body: resetBody.template.body,
      }),
    }),
    env,
  );
  assert.equal(saveAndroidWithoutVariables.status, 200);
  assert.deepEqual((await saveAndroidWithoutVariables.json()).template.variables, [
    { name: "HOME_DOMAIN", required: false, defaultValue: "" },
    { name: "TS_DOMAIN", required: false, defaultValue: "" },
  ]);

  const customTemplate = await worker.fetch(
    new Request("http://local.test/api/templates", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Custom",
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
      }),
    }),
    env,
  );
  assert.equal(customTemplate.status, 200);
  const createdTemplate = (await customTemplate.json()).template;

  const updateTemplate = await worker.fetch(
    new Request(`http://local.test/api/templates/${createdTemplate.id}`, {
      method: "PUT",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...createdTemplate, name: "Custom Updated" }),
    }),
    env,
  );
  assert.equal(updateTemplate.status, 200);
  assert.equal((await updateTemplate.json()).template.name, "Custom Updated");

  const dropRemovedVariables = await worker.fetch(
    new Request(`http://local.test/api/templates/${createdTemplate.id}`, {
      method: "PUT",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...createdTemplate,
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
        ],
      }),
    }),
    env,
  );
  assert.equal(dropRemovedVariables.status, 200);
  assert.deepEqual((await dropRemovedVariables.json()).template.variables, []);

  const normalizedTemplate = await worker.fetch(
    new Request("http://local.test/api/templates", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Normalized",
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
      }),
    }),
    env,
  );
  assert.equal(normalizedTemplate.status, 200);
  const normalizedTemplateBody = (await normalizedTemplate.json()).template;
  assert.deepEqual(normalizedTemplateBody.variables, [
    { name: "PROFILE_NAME", required: true, defaultValue: "mihomo" },
  ]);

  const renderNormalizedTemplate = await worker.fetch(
    new Request("http://local.test/api/render", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateId: normalizedTemplateBody.id,
        nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#Normalized",
        variables: { profileName: "Proxy" },
      }),
    }),
    env,
  );
  assert.equal(renderNormalizedTemplate.status, 200);
  const normalizedRenderBody = await renderNormalizedTemplate.json();
  const normalizedYaml = await (await worker.fetch(new Request(normalizedRenderBody.url), env)).text();
  assert.match(normalizedYaml, /proxies:\n  - name: "Normalized"/);
  assert.match(normalizedYaml, /    proxies:\n      - "Normalized"/);
  assert.match(normalizedYaml, /DOMAIN,example\.test,Proxy/);

  const deleteTemplate = await worker.fetch(
    new Request(`http://local.test/api/templates/${createdTemplate.id}`, {
      method: "DELETE",
      headers: { cookie },
    }),
    env,
  );
  assert.equal(deleteTemplate.status, 200);

  const render = await worker.fetch(
    new Request("http://local.test/api/render", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateId: "android",
        nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#Sample",
        variables: {},
        ttlSeconds: 60,
      }),
    }),
    env,
  );
  assert.equal(render.status, 200);
  const body = await render.json();
  assert.match(body.url, /^http:\/\/local\.test\/s\/[A-Za-z0-9_-]+$/);
  assert.equal(body.nodeCount, 1);

  const head = await worker.fetch(new Request(body.url, { method: "HEAD" }), env);
  assert.equal(head.status, 204);

  const firstGet = await worker.fetch(new Request(body.url), env);
  assert.equal(firstGet.status, 200);
  const yaml = await firstGet.text();
  assert.match(yaml, /proxies:/);
  assert.match(yaml, /name: "Sample"/);
  assert.doesNotMatch(yaml, /auth-key:/);
  assert.match(yaml, /state-dir: \.\/tailscale/);
  assert.match(yaml, /RULE-SET,custom-direct-domain,DIRECT/);
  assert.match(yaml, /RULE-SET,custom-proxy-domain,🚀 节点选择/);
  assert.match(yaml, /RULE-SET,google-play-domain,🚀 节点选择/);
  assert.match(yaml, /MATCH,🚀 节点选择/);

  const secondGet = await worker.fetch(new Request(body.url), env);
  assert.equal(secondGet.status, 200);
  assert.match(await secondGet.text(), /name: "Sample"/);

  const thirdGet = await worker.fetch(new Request(body.url), env);
  assert.equal(thirdGet.status, 410);
  assert.match(await thirdGet.text(), /链接已使用/);
});

test("one-time subscription can disable grace replay", async () => {
  const env = await makeEnv("test-password");
  env.ONE_TIME_GRACE_SECONDS = "0";
  const login = await worker.fetch(
    new Request("http://local.test/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "test-password" }),
    }),
    env,
  );
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const render = await worker.fetch(
    new Request("http://local.test/api/render", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        templateId: "android",
        nodesText: "ss://YWVzLTEyOC1nY206cGFzc0BleGFtcGxlLmNvbTo4Mzg4#Sample",
        variables: {},
      }),
    }),
    env,
  );
  const body = await render.json();
  assert.equal((await worker.fetch(new Request(body.url), env)).status, 200);
  const secondGet = await worker.fetch(new Request(body.url), env);
  assert.equal(secondGet.status, 410);
  assert.match(await secondGet.text(), /链接已使用/);
});

async function makeEnv(password) {
  const env = {
    OWNER_PASSWORD: password,
    SESSION_SECRET: "test-session-secret-with-at-least-32-chars",
    SESSION_TTL_SECONDS: "86400",
    ONE_TIME_TTL_SECONDS: "300",
    MAX_ONE_TIME_TTL_SECONDS: "900",
    ONE_TIME_GRACE_SECONDS: "20",
    ONE_TIME_MAX_GETS: "2",
    MAX_NODES_BYTES: "65536",
    MAX_RENDERED_BYTES: "131072",
  };
  env.ONE_TIME_CONFIGS = new FakeDurableObjectNamespace(OneTimeConfig, env);
  env.TEMPLATE_STORE = new FakeDurableObjectNamespace(TemplateStore, env);
  return env;
}

class FakeDurableObjectNamespace {
  constructor(ObjectClass, env) {
    this.ObjectClass = ObjectClass;
    this.env = env;
    this.objects = new Map();
  }

  idFromName(name) {
    return name;
  }

  get(id) {
    if (!this.objects.has(id)) {
      this.objects.set(id, new this.ObjectClass({ storage: new FakeDurableObjectStorage() }, this.env));
    }
    const object = this.objects.get(id);
    return {
      fetch(input, init) {
        return object.fetch(new Request(input, init));
      },
    };
  }
}

class FakeDurableObjectStorage {
  constructor() {
    this.records = new Map();
  }

  async get(key) {
    const value = this.records.get(key);
    return value === undefined ? undefined : structuredClone(value);
  }

  async put(key, value) {
    this.records.set(key, structuredClone(value));
  }

  async delete(key) {
    this.records.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || "";
    return new Map(
      [...this.records.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, structuredClone(value)]),
    );
  }

  async setAlarm() {}
}
