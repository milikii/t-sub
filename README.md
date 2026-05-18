# t-sub

Private one-time mihomo config handoff for Cloudflare Workers.

`t-sub` lets the owner paste self-hosted node URIs, select or edit a mihomo YAML template, generate a one-time URL and QR code, and let a mihomo client fetch the rendered config once. Templates are persisted. Node data is not stored as durable template data; it only exists in short-lived one-time Durable Object state until the link is consumed or expires.

## What It Does

- Owner-authenticated web UI.
- Template CRUD for Android, NAS, Windows, and custom templates.
- Node URI parsing for common `ss`, `vmess`, `vless`, `trojan`, and `hysteria2` links.
- One-time `/s/:token` config delivery backed by a Durable Object.
- `HEAD /s/:token` does not consume the token.
- First `GET /s/:token` returns YAML.
- Later `GET /s/:token` returns `410 Gone`.
- No subscription updater, no node inventory, no long-lived public subscription links.

## Cloudflare Deploy

Prerequisites:

- Node.js 22+
- Cloudflare account
- Wrangler login: `npx wrangler login`

Install dependencies:

```bash
npm install
```

Create the KV namespace and patch `wrangler.toml` automatically:

```bash
npm run cf:setup
```

Create a password hash:

```bash
npm run hash-password -- "your owner password"
```

Set Worker secrets:

```bash
npx wrangler secret put OWNER_PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
```

Use the `sha256:...` output from `hash-password` for `OWNER_PASSWORD_HASH`.

`SESSION_SECRET` should be at least 32 random characters.

Deploy:

```bash
npm run deploy
```

## Local Development

Copy the example env file:

```bash
cp .dev.vars.example .dev.vars
```

Fill in:

- `OWNER_PASSWORD_HASH`
- `SESSION_SECRET`
- `PUBLIC_BASE_URL`

Start local Worker:

```bash
npm run dev
```

Open the Wrangler URL, usually `http://127.0.0.1:8787`.

## Template Placeholders

Every template must include:

- `{{PROXIES_YAML}}`
- `{{PROXY_NAMES_YAML}}`

Useful built-ins:

- `{{PROFILE_NAME}}`
- `{{GENERATED_AT}}`
- `{{NODE_COUNT}}`

Any additional uppercase placeholder, such as `{{DNS_MODE}}`, becomes a template variable in the UI after saving.

## Tests

```bash
npm test
```

Current tests cover:

- Owner password/session auth helpers.
- Common node URI parsing.
- Template rendering and unresolved variable rejection.

## Notes

Cloudflare KV is used only for templates. One-time config delivery uses Durable Objects because strict consume-on-read requires a stronger consistency boundary than KV provides.

