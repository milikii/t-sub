import { APP_JS, INDEX_HTML, STYLES_CSS } from "./assets.js";
import { asset, errorResponse, html, json, methodNotAllowed, notFound, readJson, text } from "./core/http.js";
import { clearSessionCookie, createSessionCookie, getSession, requireOwner, verifyOwnerPassword } from "./core/auth.js";
import { makeRandomToken } from "./core/encoding.js";
import { deleteTemplate, getTemplate, listTemplates, resetTemplate, saveTemplate } from "./core/template-store.js";
import { renderConfig } from "./core/render.js";
import { getRuleBody, listRuleFiles } from "./core/default-rule-bodies.js";
import { OneTimeConfig } from "./one-time-config.js";
import { TemplateStore } from "./template-store-do.js";

export { OneTimeConfig, TemplateStore };

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (!isClientError(error)) {
        console.error("request_error", {
          path: new URL(request.url).pathname,
          name: error.name,
          message: error.message,
        });
      }
      return errorResponse(error);
    }
  },
};

async function route(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/styles.css") return asset(STYLES_CSS, "text/css; charset=utf-8");
  if (url.pathname === "/app.js") return asset(APP_JS, "text/javascript; charset=utf-8");
  if (url.pathname === "/" || url.pathname === "/templates") return html(INDEX_HTML);

  if (url.pathname === "/api/session" && request.method === "GET") {
    const session = await getSession(request, env);
    return json(session);
  }

  if (url.pathname === "/api/login") return login(request, env);
  if (url.pathname === "/api/logout") return logout(request);

  if (url.pathname.startsWith("/api/templates")) {
    await requireOwner(request, env);
    return templatesRoute(request, env, url);
  }

  if (url.pathname === "/api/render") {
    await requireOwner(request, env);
    if (request.method !== "POST") return methodNotAllowed();
    return renderRoute(request, env, url);
  }

  if (url.pathname.startsWith("/rules/")) {
    return rulesRoute(request, url);
  }

  if (url.pathname.startsWith("/s/")) {
    return subscribeRoute(request, env, url);
  }

  return notFound();
}

async function login(request, env) {
  if (request.method !== "POST") return methodNotAllowed();
  const body = await readJson(request);
  const ok = await verifyOwnerPassword(body.password || "", env);
  if (!ok) {
    return json({ error: { type: "Unauthorized", message: "密码错误。" } }, { status: 401 });
  }
  const ttl = numberFromEnv(env.SESSION_TTL_SECONDS, 86400);
  const cookie = await createSessionCookie(env, ttl);
  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": cookie,
      },
    },
  );
}

async function logout(request) {
  if (request.method !== "POST") return methodNotAllowed();
  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": clearSessionCookie(),
      },
    },
  );
}

async function templatesRoute(request, env, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[2] ? decodeURIComponent(parts[2]) : "";
  const action = parts[3] || "";

  if (request.method === "GET" && !id) {
    return json({ templates: await listTemplates(env) });
  }

  if (request.method === "POST" && !id) {
    const body = await readJson(request);
    const template = await saveTemplate(env, body);
    return json({ template });
  }

  if (request.method === "POST" && id && action === "reset") {
    const template = await resetTemplate(env, id);
    return json({ template });
  }

  if (request.method === "PUT" && id && !action) {
    const body = await readJson(request);
    const template = await saveTemplate(env, { ...body, id });
    return json({ template });
  }

  if (request.method === "DELETE" && id && !action) {
    await deleteTemplate(env, id);
    return json({ ok: true });
  }

  return methodNotAllowed();
}

async function renderRoute(request, env, url) {
  const body = await readJson(request);
  const template = await getTemplate(env, body.templateId);
  const baseUrl = publicBaseUrl(env, url);
  const rendered = renderConfig({
    template,
    nodesText: body.nodesText || "",
    variables: {
      ...(body.variables || {}),
      RULE_BASE_URL: `${baseUrl}/rules`,
    },
    limits: {
      maxNodesBytes: numberFromEnv(env.MAX_NODES_BYTES, 65536),
      maxRenderedBytes: numberFromEnv(env.MAX_RENDERED_BYTES, 131072),
    },
  });

  const now = new Date();
  const requestedTtl = Number(body.ttlSeconds || env.ONE_TIME_TTL_SECONDS || 300);
  const maxTtl = numberFromEnv(env.MAX_ONE_TIME_TTL_SECONDS, 900);
  const ttlSeconds = Math.max(30, Math.min(Number.isFinite(requestedTtl) ? requestedTtl : 300, maxTtl));
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
  const token = makeRandomToken(24);

  if (!env.ONE_TIME_CONFIGS) throw new Error("缺少 ONE_TIME_CONFIGS Durable Object 绑定。");
  const id = env.ONE_TIME_CONFIGS.idFromName(token);
  const stub = env.ONE_TIME_CONFIGS.get(id);
  const createResponse = await stub.fetch("https://one-time/create", {
    method: "POST",
    body: JSON.stringify({
      configYaml: rendered.configYaml,
      templateId: template.id,
      createdAt: now.toISOString(),
      expiresAt,
    }),
  });
  if (!createResponse.ok) throw new Error("无法创建一次性配置链接。");

  return json({
    url: `${baseUrl}/s/${token}`,
    expiresAt,
    nodeCount: rendered.proxies.length,
    byteLength: rendered.byteLength,
  });
}

async function rulesRoute(request, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed();

  const filename = url.pathname.slice("/rules/".length);
  if (!filename || filename.includes("/") || filename.includes("..") || filename !== decodeURIComponent(filename)) {
    return notFound();
  }

  const allowedFiles = listRuleFiles();
  if (!allowedFiles.includes(filename)) {
    return notFound();
  }

  const body = getRuleBody(filename);
  if (body === null) {
    return notFound();
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  const hashArray = [...new Uint8Array(hashBuffer)];
  const etag = `"${hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")}"`;

  return new Response(request.method === "HEAD" ? null : body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
      etag,
    },
  });
}

async function subscribeRoute(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed();
  const token = decodeURIComponent(url.pathname.slice("/s/".length));
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }
  const id = env.ONE_TIME_CONFIGS.idFromName(token);
  const stub = env.ONE_TIME_CONFIGS.get(id);
  return stub.fetch("https://one-time/consume", { method: request.method });
}

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function publicBaseUrl(env, url) {
  const configured = String(env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  return configured || url.origin;
}

function isClientError(error) {
  return (
    (Number.isInteger(error.status) && error.status < 500) ||
    ["NodeValidationError", "RenderValidationError", "NotFoundError", "UnauthorizedError"].includes(error.name)
  );
}
