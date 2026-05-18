import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createSessionCookie, getSession, verifyOwnerPassword } from "../src/core/auth.js";

test("verifies owner password secret", async () => {
  assert.equal(await verifyOwnerPassword("owner-pass", { OWNER_PASSWORD: "owner-pass" }), true);
  assert.equal(await verifyOwnerPassword("wrong", { OWNER_PASSWORD: "owner-pass" }), false);
});

test("verifies sha256 owner password hash", async () => {
  const password = "correct horse battery staple";
  const hash = createHash("sha256").update(password).digest("hex");
  assert.equal(await verifyOwnerPassword(password, { OWNER_PASSWORD_HASH: `sha256:${hash}` }), true);
  assert.equal(await verifyOwnerPassword("wrong", { OWNER_PASSWORD_HASH: `sha256:${hash}` }), false);
});

test("creates and verifies signed session cookie", async () => {
  const env = {
    SESSION_SECRET: "a-session-secret-with-more-than-24-characters",
  };
  const cookie = await createSessionCookie(env, 60);
  const request = new Request("https://example.com", {
    headers: {
      cookie: cookie.split(";")[0],
    },
  });
  const session = await getSession(request, env);
  assert.equal(session.authenticated, true);
  assert.equal(session.method, "password");
});
