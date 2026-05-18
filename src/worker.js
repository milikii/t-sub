import { APP_JS, INDEX_HTML, STYLES_CSS } from "./assets.js";
import { asset, errorResponse, html, json, methodNotAllowed, notFound, readJson } from "./core/http.js";
import { clearSessionCookie, createSessionCookie, getSession, requireOwner, verifyOwnerPassword } from "./core/auth.js";
import { makeRandomToken } from "./core/encoding.js";
import { deleteTemplate, getTemplate, listTemplates, saveTemplate } from "./core/template-store.js";
import { renderConfig } from "./core/render.js";
import { OneTimeConfig } from "./one-time-config.js";

export { OneTimeConfig };

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
    return json({ error: { type: "Unauthorized", message: "Wrong password." } }, { status: 401 });
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

  if (request.method === "GET" && !id) {
    return json({ templates: await listTemplates(env) });
  }

  if (request.method === "POST" && !id) {
    const body = await readJson(request);
    const template = await saveTemplate(env, body);
    return json({ template });
  }

  if (request.method === "PUT" && id) {
    const body = await readJson(request);
    const template = await saveTemplate(env, { ...body, id });
    return json({ template });
  }

  if (request.method === "DELETE" && id) {
    await deleteTemplate(env, id);
    return json({ ok: true });
  }

  return methodNotAllowed();
}

async function renderRoute(request, env, url) {
  const body = await readJson(request);
  const template = await getTemplate(env, body.templateId);
  const rendered = renderConfig({
    template,
    nodesText: body.nodesText || "",
    variables: body.variables || {},
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

  if (!env.ONE_TIME_CONFIGS) throw new Error("ONE_TIME_CONFIGS Durable Object binding is missing.");
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
  if (!createResponse.ok) throw new Error("Could not create one-time config token.");

  const baseUrl = publicBaseUrl(env, url);
  return json({
    url: `${baseUrl}/s/${token}`,
    expiresAt,
    nodeCount: rendered.proxies.length,
    byteLength: rendered.byteLength,
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
