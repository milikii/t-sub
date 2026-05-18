import { constantTimeEqual } from "./encoding.js";

const COOKIE_NAME = "t_sub_session";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

export async function verifyOwnerPassword(password, env) {
  if (env.OWNER_PASSWORD) {
    return constantTimeEqual(String(password), String(env.OWNER_PASSWORD));
  }

  if (env.OWNER_PASSWORD_HASH) {
    const expected = String(env.OWNER_PASSWORD_HASH);
    if (!expected.startsWith("sha256:")) {
      throw new Error("OWNER_PASSWORD_HASH must use sha256:<hex> format.");
    }
    const digest = await sha256Hex(password);
    return constantTimeEqual(`sha256:${digest}`, expected);
  }

  return false;
}

export async function createSessionCookie(env, ttlSeconds = 86400) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + ttlSeconds,
    nonce: crypto.randomUUID(),
  };
  const payloadText = base64Url(JSON.stringify(payload));
  const signature = await hmacSha256(payloadText, sessionSecret(env));
  const cookieValue = `${payloadText}.${signature}`;
  return `${COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ttlSeconds}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function getSession(request, env) {
  if (request.headers.get("Cf-Access-Authenticated-User-Email")) {
    return {
      authenticated: true,
      method: "cloudflare-access",
      email: request.headers.get("Cf-Access-Authenticated-User-Email"),
    };
  }

  const cookie = parseCookies(request.headers.get("cookie") || "")[COOKIE_NAME];
  if (!cookie || !cookie.includes(".")) {
    return { authenticated: false };
  }

  const [payloadText, signature] = cookie.split(".", 2);
  const expected = await hmacSha256(payloadText, sessionSecret(env));
  if (!constantTimeEqual(signature, expected)) {
    return { authenticated: false };
  }

  try {
    const normalized = payloadText.replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return { authenticated: false };
    }
    return { authenticated: true, method: "password", exp: payload.exp };
  } catch {
    return { authenticated: false };
  }
}

export async function requireOwner(request, env) {
  const session = await getSession(request, env);
  if (!session.authenticated) throw new UnauthorizedError();
  return session;
}

function parseCookies(header) {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index >= 0 ? [part.slice(0, index), part.slice(index + 1)] : [part, ""];
      }),
  );
}

function sessionSecret(env) {
  const secret = env.SESSION_SECRET || env.OWNER_PASSWORD_HASH || "";
  if (secret.length < 24) {
    throw new Error("SESSION_SECRET must be set to at least 24 characters.");
  }
  return secret;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64Url(value) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
