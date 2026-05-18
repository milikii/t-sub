import { json, text } from "./core/http.js";
import { base64UrlDecodeToBytes, base64UrlEncode } from "./core/encoding.js";

const RECORD_KEY = "record";

export class OneTimeConfig {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/create" && request.method === "POST") {
      return this.create(request);
    }
    if (url.pathname === "/consume" && (request.method === "GET" || request.method === "HEAD")) {
      return this.consume(request);
    }
    return json({ error: { message: "未找到。" } }, { status: 404 });
  }

  async create(request) {
    const body = await request.json();
    const now = Date.now();
    const expiresAtMs = Date.parse(body.expiresAt);
    if (!body.configYaml || !Number.isFinite(expiresAtMs) || expiresAtMs <= now) {
      return json({ error: { message: "一次性配置记录无效。" } }, { status: 400 });
    }

    const encrypted = await encryptConfig(body.configYaml, this.env);
    await this.state.storage.put(RECORD_KEY, {
      encryptedConfig: encrypted.ciphertext,
      iv: encrypted.iv,
      templateId: body.templateId,
      createdAt: body.createdAt,
      expiresAt: body.expiresAt,
      consumedAt: null,
    });
    await this.state.storage.setAlarm(expiresAtMs + 60_000);
    return json({ ok: true });
  }

  async consume(request) {
    const record = await this.state.storage.get(RECORD_KEY);
    if (!record) {
      return text("未找到\n", { status: 404 });
    }

    const now = Date.now();
    if (Date.parse(record.expiresAt) <= now) {
      await this.state.storage.delete(RECORD_KEY);
      return text("链接已过期\n", { status: 410 });
    }

    if (record.consumedAt || !record.encryptedConfig || !record.iv) {
      return text("链接已使用\n", { status: 410 });
    }

    if (request.method === "HEAD") {
      return new Response(null, {
        status: 204,
        headers: {
          "cache-control": "no-store",
          "x-t-sub-token-state": "pending",
        },
      });
    }

    const configYaml = await decryptConfig(record, this.env);
    await this.state.storage.put(RECORD_KEY, {
      templateId: record.templateId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      consumedAt: new Date().toISOString(),
    });

    return new Response(configYaml, {
      status: 200,
      headers: {
        "content-type": "text/yaml; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": "inline; filename=\"mihomo.yaml\"",
      },
    });
  }

  async alarm() {
    await this.state.storage.delete(RECORD_KEY);
  }
}

async function encryptConfig(configYaml, env) {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await aesKey(env);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(configYaml),
  );
  return {
    iv: base64UrlEncode(iv),
    ciphertext: base64UrlEncode(new Uint8Array(ciphertext)),
  };
}

async function decryptConfig(record, env) {
  const key = await aesKey(env);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlDecodeToBytes(record.iv) },
    key,
    base64UrlDecodeToBytes(record.encryptedConfig),
  );
  return new TextDecoder().decode(plaintext);
}

async function aesKey(env) {
  const secret = env.SESSION_SECRET || "";
  if (secret.length < 24) {
    throw new Error("SESSION_SECRET 至少需要 24 个字符才能加密一次性配置。");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
