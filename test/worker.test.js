import assert from "node:assert/strict";
import test from "node:test";

import worker, { OneTimeConfig } from "../src/worker.js";

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
        variables: { PROFILE_NAME: "E2E" },
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
  assert.match(yaml, /MATCH,Proxy/);

  const secondGet = await worker.fetch(new Request(body.url), env);
  assert.equal(secondGet.status, 410);
  assert.match(await secondGet.text(), /already used/i);
});

async function makeEnv(password) {
  const env = {
    TEMPLATES: new FakeKv(),
    OWNER_PASSWORD: password,
    SESSION_SECRET: "test-session-secret-with-at-least-32-chars",
    SESSION_TTL_SECONDS: "86400",
    ONE_TIME_TTL_SECONDS: "300",
    MAX_ONE_TIME_TTL_SECONDS: "900",
    MAX_NODES_BYTES: "65536",
    MAX_RENDERED_BYTES: "131072",
  };
  env.ONE_TIME_CONFIGS = new FakeDurableObjectNamespace(env);
  return env;
}

class FakeKv {
  constructor() {
    this.records = new Map();
  }

  async get(key) {
    return this.records.get(key) ?? null;
  }

  async put(key, value) {
    this.records.set(key, String(value));
  }

  async delete(key) {
    this.records.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || "";
    return {
      keys: [...this.records.keys()]
        .filter((name) => name.startsWith(prefix))
        .sort()
        .map((name) => ({ name })),
    };
  }
}

class FakeDurableObjectNamespace {
  constructor(env) {
    this.env = env;
    this.objects = new Map();
  }

  idFromName(name) {
    return name;
  }

  get(id) {
    if (!this.objects.has(id)) {
      this.objects.set(id, new OneTimeConfig({ storage: new FakeDurableObjectStorage() }, this.env));
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

  async setAlarm() {}
}
