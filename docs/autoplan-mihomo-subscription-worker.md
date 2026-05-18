<!-- /autoplan restore point: /root/.gstack/projects/t-sub/master-autoplan-restore-20260518-020900.md -->

# t-sub Autoplan: Mihomo One-Time Subscription Converter

Captured: 2026-05-18 Asia/Shanghai
Branch: master
Remote: git@github.com:milikii/t-sub.git
Repository state: empty Git repository, no application code yet

## Source Request

Build a Cloudflare Worker deployable subscription converter around the latest mihomo alpha core/config surface.

Primary workflow:

1. The owner opens a web page protected by authentication.
2. The owner pastes self-hosted proxy nodes into a text area, one node per line.
3. The owner selects a preset configuration template, such as Android, NAS, or Windows.
4. The app generates a one-time subscription URL and QR code.
5. A mihomo client fetches that URL once.
6. The generated config is returned once, then the one-time entry becomes invalid.

Hard requirements:

- Deployable on Cloudflare Workers.
- Frontend can edit, add, and delete configuration templates.
- Persist templates only.
- Never persist node information beyond the short-lived one-time fetch payload.
- No subscription update feature.
- No long-lived subscription links.
- Intended for one owner using self-hosted nodes.
- Web UI requires authentication so only the owner can use it.

## Current External Facts Checked

- mihomo GitHub Releases currently show stable `v1.19.25` and a `Prerelease-Alpha` created on 2026-05-17 23:53 CST. The alpha release notes state that older alpha builds are automatically deleted when the latest alpha is published. Source: https://github.com/MetaCubeX/mihomo/releases
- Cloudflare Workers KV supports write-time expiration controls through `expirationTtl`, which fits one-time token storage with a short maximum lifetime. Source: https://developers.cloudflare.com/kv/api/write-key-value-pairs/
- Cloudflare Workers KV is eventually consistent and is not ideal for atomic read/write transactions; Cloudflare recommends Durable Objects when stronger consistency is needed. Source: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- Cloudflare Durable Objects provide stateful compute with strongly consistent, serializable storage, which fits strict consume-on-read token state. Source: https://developers.cloudflare.com/durable-objects/
- Cloudflare Workers supports serving frontend static assets with Worker-backed dynamic routes. Source: https://developers.cloudflare.com/workers/static-assets/
- mihomo supports structured proxy provider configuration, but this project should generate direct one-shot full configs instead of becoming a subscription updater or provider host. Source: https://wiki.metacubex.one/en/config/proxy-providers/

## Product Definition

This is a private, zero-retention mihomo config handoff tool, not a public subscription service.

The product should feel like a small operations console:

- The dominant first-screen job is generating a validated config once.
- Template management is secondary but always available.
- The generated URL and QR code are transient output, not saved subscriptions.
- The app should make it hard to accidentally persist secrets.

## Proposed MVP

### Owner Flow

1. Login with owner authentication.
2. Paste nodes into `NodesInput`.
3. Select template from `TemplatePicker`.
4. Click `Generate`.
5. Worker validates node lines and template variables.
6. Worker renders a final mihomo YAML config.
7. Worker stores the rendered config in a Durable Object under a random one-time token with short TTL.
8. UI shows URL and QR code.
9. mihomo client requests `/s/:token`.
10. Worker atomically consumes token, returns YAML, then invalidates the token.
11. Any later request returns `410 Gone`.

### Template Flow

1. Owner opens template manager.
2. Owner creates, edits, deletes, duplicates, and previews templates.
3. Templates are stored in KV. They are read-heavy, owner-edited records and do not need strict consume-on-read semantics.
4. Template JSON stores name, target platform, YAML body, variables, updated timestamp, and version.
5. Template preview can use sample redacted node values only.

### Auth Flow

Use Cloudflare Access if available, otherwise a built-in session auth path:

- Preferred deployment: protect the whole Worker route with Cloudflare Access.
- Built-in fallback: password login using a Worker secret `OWNER_PASSWORD_HASH`, HMAC-signed session cookie, `HttpOnly`, `Secure`, `SameSite=Strict`.
- The one-time subscription fetch endpoint `/s/:token` must not require browser login because mihomo clients fetch it directly. It must rely on token entropy, TTL, and consume-on-read.

## Recommended Architecture

```
Browser Owner UI
  |
  | HTTPS authenticated owner requests
  v
Cloudflare Worker
  |-- Static assets: app shell, CSS, JS
  |-- Auth middleware: owner-only UI and template APIs
  |-- Template API: CRUD persisted templates
  |-- Render API: nodes + template -> one-time token
  |-- Subscribe API: /s/:token -> one YAML response, then gone
  |
  |-- KV namespace: TEMPLATES
  |     |-- template:<id> -> TemplateRecord
  |
  |-- Durable Object namespace: ONE_TIME_CONFIGS
        |-- token object -> encrypted RenderedConfigRecord
        |-- single-threaded consume endpoint
        |-- alarm-based cleanup
```

## Data Model

### TemplateRecord

```ts
type TemplateRecord = {
  id: string;
  name: string;
  platform: "android" | "nas" | "windows" | "custom";
  description?: string;
  body: string;
  variables: Array<{
    name: string;
    required: boolean;
    defaultValue?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  revision: number;
};
```

### RenderedConfigRecord

```ts
type RenderedConfigRecord = {
  configYaml: string;
  templateId: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
};
```

Node lines are included only inside the rendered short-lived config payload. They are never written to template records, logs, analytics, or durable history. The short-lived one-time object is transient delivery state, not retained subscription data.

## API Surface

Owner-only endpoints:

- `POST /api/login`
- `POST /api/logout`
- `GET /api/session`
- `GET /api/templates`
- `POST /api/templates`
- `PUT /api/templates/:id`
- `DELETE /api/templates/:id`
- `POST /api/render`

Client fetch endpoint:

- `GET /s/:token`

`POST /api/render` request:

```json
{
  "templateId": "android",
  "nodesText": "ss://...\nvmess://...",
  "variables": {
    "profileName": "Phone"
  },
  "ttlSeconds": 300
}
```

Response:

```json
{
  "url": "https://example.com/s/opaque-token",
  "expiresAt": "2026-05-18T02:14:00+08:00"
}
```

## Security Decisions

1. Do not store raw nodes in durable template records.
2. Do not log request bodies.
3. Use random 128-bit or 192-bit URL tokens.
4. Default one-time config TTL: 5 minutes.
5. Maximum one-time config TTL: 15 minutes.
6. Consume token on first successful `GET`.
7. Return `410 Gone` after consume or expiration.
8. Set `Cache-Control: no-store` for all API and subscription responses.
9. CORS should be same-origin only.
10. Keep `/s/:token` unauthenticated but unguessable.
11. Validate rendered YAML size to stay within Worker/KV practical limits.
12. Keep auth/session secrets in Worker secrets, not source files.
13. Never consume on `HEAD` or metadata preflight requests.
14. Add a short same-client retry grace only if real mihomo clients need it, and document the tradeoff.

## Implementation Plan

### Phase A: Scaffold

- Use a Cloudflare Worker TypeScript project.
- Use Wrangler for local dev and deployment.
- Use static Worker assets for the frontend.
- Add KV binding for `TEMPLATES`.
- Add Durable Object binding for `ONE_TIME_CONFIGS`.
- Add environment variable docs for auth secrets and public base URL.

### Phase B: Core Conversion

- Parse node input as lines.
- Trim empty lines.
- Reject unsupported or malformed node schemes with line-specific errors.
- Keep node payloads opaque where possible. Do not decode more than required for validation.
- Render YAML through a constrained template renderer.
- Avoid arbitrary JS execution in templates.
- Provide built-in templates for Android, NAS, and Windows.

### Phase C: One-Time Delivery

- Generate cryptographically random token.
- Store encrypted rendered YAML in a per-token Durable Object with an alarm-based expiration.
- On `/s/:token`, route to the token Durable Object, atomically mark consumed, then return YAML.
- If already consumed, expired, or missing, return `410 Gone`.
- Return mihomo-compatible content headers.

### Phase D: Template Manager UI

- Three-pane console:
  - left: template list
  - middle: YAML editor
  - right: preview/validation
- Add template CRUD.
- Add duplicate from preset.
- Add validation before save.
- Add unsaved-change guard.
- Add import/export JSON for templates.

### Phase E: Auth

- Implement Cloudflare Access compatibility docs.
- Implement built-in owner login fallback.
- Protect all UI and `/api/*` except `/api/login`.
- Do not protect `/s/:token`, because mihomo clients cannot use the browser session.

### Phase F: Verification

- Unit tests for template rendering, token generation, validation, and consume-on-read.
- Integration tests for Worker routes.
- Browser QA for mobile and desktop layout.
- Manual mihomo import check using generated QR code.

## NOT in Scope

- Long-lived subscription links.
- Scheduled subscription update.
- User accounts.
- Multi-tenant sharing.
- Remote provider crawling.
- Node inventory management.
- Persisted node history.
- Analytics over node content.
- Public template marketplace.
- Server-side mihomo binary execution.

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | Intake | Treat this as a new product plan because the repo has no source code | Mechanical | P6 | The repository contains no app code, so review must produce an executable plan instead of diff analysis | Pretend existing implementation exists |
| 2 | Intake | Run UI, engineering, and DX review because the product includes web UI, APIs, deployment, and client integration | Mechanical | P1 | The app has screens, auth, template editing, Worker APIs, and external client fetch behavior | Skip design or DX as "private tool" |
| 3 | Product | Persist templates only and keep nodes only inside short-lived one-time rendered configs | Mechanical | User hard requirement | This preserves the requested privacy model while still allowing the mihomo client to fetch once | Save nodes for convenience |
| 4 | Architecture | Use Cloudflare Workers KV for templates and one-time config tokens in MVP | Taste | P3 | KV is the simplest Cloudflare-native store for single-owner templates and TTL one-time records | Start with D1 for relational history |
| 5 | Auth | Prefer Cloudflare Access, but include built-in password session fallback | Taste | P1 | Access is stronger at the edge, while fallback keeps the project usable without paid or external setup | Only one auth mode |
| 6 | Security | Keep `/s/:token` unauthenticated but high-entropy, short-lived, and consume-on-read | Mechanical | P5 | mihomo clients need plain URL fetches; security comes from token entropy and short lifetime | Require owner cookie on subscription fetch |
| 7 | Scope | Exclude subscription update and node inventory features | Mechanical | User hard requirement | The user explicitly wants one-shot conversion for self-hosted nodes only | Add provider scheduler |
| 8 | Template | Use constrained template rendering rather than arbitrary JavaScript templates | Mechanical | P5 | This lowers security risk and makes template behavior inspectable | Execute user-authored JS |
| 9 | CEO | Reframe from generic subscription converter to private zero-retention mihomo config handoff | User Challenge | Dual voice consensus | Both voices flagged generic conversion as commodity and privacy/compatibility as the defensible wedge | Position as broad SubConv competitor |
| 10 | CEO/Eng | Move one-time config storage from KV to Durable Objects | Mechanical | P1 | KV cannot guarantee atomic consume-on-read; Durable Objects fit strict one-token state | KV for one-time tokens |
| 11 | CEO | Treat latest alpha as optional compatibility target, not sole baseline | User Challenge | Dual voice consensus | Alpha churn is high; stable-first with alpha fixtures lowers maintenance risk | Alpha-only templates |
| 12 | CEO | Verify real mihomo client fetch semantics before finalizing consume behavior | Mechanical | P1 | Retries, HEAD, previews, or QR scanners can burn one-time links | Assume every client fetches exactly once |
| 13 | Product | Keep full template CRUD in MVP but stage it after core token/auth/render path | Taste | P3 | User explicitly asked for template editing, but compatibility/security should land first | Remove template editing from MVP |

## GSTACK REVIEW REPORT

### Phase 1: CEO Review

#### 0A Premise Challenge

| Premise | Evaluation | Decision |
|---|---|---|
| Private owner-only tool | Valid. The user explicitly wants only personal use and authentication. | Keep |
| One-time subscription handoff | Valid, but wording should be “one-time config delivery” because the product is not a subscription updater. | Reframe |
| Store templates only | Valid as durable storage policy. Short-lived delivery state may temporarily contain rendered nodes. | Keep with explicit transient exception |
| Latest mihomo alpha core | Risky if treated as the only target. Alpha releases churn and clients may lag. | Stable baseline, alpha compatibility fixtures |
| Cloudflare Worker deployment | Valid and well matched to a private edge tool. | Keep |
| KV for all storage | Invalid for strict one-time consumption. KV is fine for templates but not atomic token consumption. | Change to Durable Objects for one-time configs |

#### 0B Existing Code Leverage

No application code exists in this repository. There is no README, package manifest, Worker scaffold, UI component library, test framework, or existing deployment config to reuse.

| Sub-problem | Existing Code | Reuse Decision |
|---|---|---|
| Worker routing | None | Scaffold from Cloudflare Worker TypeScript patterns |
| Auth | None | Implement explicitly; prefer Access docs plus built-in fallback |
| Template CRUD | None | Build small KV-backed module |
| One-time token consumption | None | Build Durable Object module |
| YAML rendering | None | Add constrained renderer and validation tests |
| UI | None | Build app console from scratch |

#### 0C Dream State Mapping

```
CURRENT STATE
  Empty repository and product intent
      |
      v
THIS PLAN
  Private authenticated Worker app that renders mihomo configs from pasted nodes,
  stores templates, and serves one generated config once through a Durable Object
      |
      v
12-MONTH IDEAL
  Version-tested mihomo config workbench with stable/alpha compatibility fixtures,
  safe redacted previews, template revision history, client import recipes,
  local-first optional rendering, and still no durable node retention
```

Dream state delta: this plan reaches the core trust boundary and delivery flow, but it leaves richer compatibility automation, local-first generation, and template revision ergonomics for later.

#### 0C-bis Implementation Alternatives

| Approach | Summary | Effort | Risk | Pros | Cons | Decision |
|---|---|---:|---|---|---|---|
| A. Worker + KV for everything | Store templates and one-time configs in KV. | M | High | Simple Cloudflare setup; TTL built in | Cannot guarantee atomic consume-on-read; weakens core promise | Rejected |
| B. Worker + KV templates + Durable Object tokens | KV stores templates; Durable Object owns each one-time token. | M | Medium | Matches strict consume-on-read; still Cloudflare-native; low infra | More moving parts than KV-only | Accepted |
| C. Browser-local render + fragment encrypted payload | Render in browser; URL fragment or encrypted handoff avoids server storing nodes. | L | Medium | Strongest zero-retention story; less platform trust | Harder mihomo client flow; QR/import compatibility uncertain | Deferred |
| D. D1 transactional store | D1 stores templates and tokens with transaction semantics. | M | Medium | Familiar SQL inspection; transactions | More schema/migration overhead; less natural per-token actor model | Deferred |

Recommendation: Approach B. It is the smallest architecture that can truthfully claim consume-once delivery.

#### 0D Selective Expansion Decisions

Accepted into plan:

- Durable Objects for one-time delivery.
- Stable-first compatibility target with alpha fixtures.
- Client fetch behavior matrix before locking token consumption semantics.
- Explicit privacy language that distinguishes durable template storage from transient delivery state.

Deferred:

- Browser-local encrypted vault or URL-fragment payload.
- Full template revision history.
- Private revocable device profiles.
- Public/template marketplace features.

#### 0E Temporal Interrogation

| Implementation Window | Decision Needed Now | Resolution |
|---|---|---|
| Hour 1 foundations | Storage primitive for one-time token | Durable Object, not KV |
| Hour 1 foundations | Auth boundary for `/s/:token` | Unauthenticated token endpoint, all UI/API owner-authenticated |
| Hour 2-3 core logic | Template execution model | Constrained placeholder renderer, no arbitrary JS |
| Hour 2-3 core logic | Node parsing depth | Opaque validation by supported URI scheme, avoid secret decoding unless required |
| Hour 4-5 integration | Client retry and HEAD behavior | Do not consume HEAD; test real clients; add retry grace only if necessary |
| Hour 6+ polish/tests | Compatibility target | Stable baseline, alpha optional via fixtures and template metadata |

#### CEO Dual Voices

CLAUDE SUBAGENT (CEO - strategic independence):

- Critical: KV breaks atomic one-time consumption. Use Durable Objects or D1 transactions.
- High: Reframe away from commodity subscription conversion toward private zero-retention, version-tested mihomo profile handoff.
- High: Latest-alpha-only target is risky; stable baseline with alpha opt-in is safer.
- High: Client fetch behavior is assumed; retries, previews, HEAD, and QR scanners can burn tokens.
- Medium: Full template manager may be premature before core compatibility and security.
- High: Existing tools already cover generic conversion; own the narrow privacy wedge.

CODEX SAYS (CEO - strategy challenge):

- The most valuable job may be safe mihomo config generation, not disposable URL delivery.
- Alpha is a weak anchor unless pinned by compatibility fixtures.
- Short TTL is not the same as no persistence; transient Cloudflare storage must be explicit.
- KV cannot deliver true consume-on-read semantics.
- Manual one-shot generation may age badly if private revocable profiles become valuable.
- Full template CMS may be too much before proving editing frequency.
- Client import behavior should drive architecture before implementation.

CEO DUAL VOICES - CONSENSUS TABLE:

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| Premises valid? | Mostly, with storage and alpha caveats | Mostly, with privacy caveat | CONFIRMED with changes |
| Right problem to solve? | Reframe to private version-tested handoff | Reframe to safe config workbench | DISAGREE with original wording |
| Scope calibration correct? | Core good, template manager may be heavy | Core good, template CMS may be heavy | TASTE |
| Alternatives sufficiently explored? | No | No | CONFIRMED gap fixed by alternatives table |
| Competitive risks covered? | No | No | CONFIRMED gap fixed by wedge definition |
| 6-month trajectory sound? | Risky if alpha-only/manual-only | Risky if alpha-only/manual-only | CONFIRMED with stable-first adjustment |

Phase 1 result: 4 critical/high concerns, 2 taste choices, 2 user challenges.

### Phase 2: Design Review

Design scope detected: yes. This is an app UI, not a marketing page.

No `DESIGN.md` exists. No existing UI patterns exist. Proceed with universal app UI principles: calm hierarchy, dense but readable console, visible labels, keyboard support, high contrast, no generic SaaS card grid.

#### Design Ratings

| Pass | Before | After Plan Fix | Notes |
|---|---:|---:|---|
| Information architecture | 5/10 | 9/10 | Primary generation flow now leads; template manager is secondary |
| Interaction states | 4/10 | 9/10 | State table added below |
| User journey | 6/10 | 8/10 | Strong private workflow, still needs real client import evidence |
| AI slop risk | 7/10 | 9/10 | Explicit console layout avoids marketing/card patterns |
| Design system alignment | 3/10 | 7/10 | No DESIGN.md yet |
| Responsive & accessibility | 4/10 | 8/10 | Requirements specified below |
| Unresolved design decisions | 5/10 | 8/10 | Auth mode and mobile editor ergonomics remain taste choices |

#### Screen Structure

```
Authenticated App Shell
  |
  |-- Header: product name, session status, logout
  |
  |-- Primary Workspace: Generate One-Time Config
  |     |-- Nodes textarea
  |     |-- Template picker
  |     |-- Variables form
  |     |-- Generate button
  |     |-- Result panel: URL, QR, expires countdown, copy actions
  |
  |-- Secondary Workspace: Templates
        |-- Template list
        |-- YAML editor
        |-- Validation/preview panel
```

#### Interaction State Coverage

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Login | Button disabled with spinner | Login form visible | Problem + fix message | Redirect to app | Session expired banner |
| Nodes input | N/A | Placeholder plus visible label | Line-specific validation list | Accepted line count | Some lines invalid, valid lines preserved |
| Template picker | Loading skeleton | Built-in presets prompt | Cannot load templates | Selected template summary | Template stale after edit warning |
| Generate | Button busy, form locked | Disabled until nodes + template | Specific render/auth/storage error | URL + QR + countdown | URL generated but QR render failed, copy still available |
| `/s/:token` fetch | N/A | N/A | `404` invalid, `410` consumed/expired | YAML returned once | HEAD returns metadata/no consume |
| Template editor | Save busy | New blank template | YAML validation errors | Saved timestamp | Unsaved changes guard |

#### Responsive and Accessibility Requirements

- Desktop: two-column app, generation workspace left, template management right or in tabs.
- Tablet: tabs for Generate and Templates.
- Mobile: generation flow first; YAML editor opens full-screen with monospaced text and sticky save/cancel.
- All form controls need visible labels, not placeholder-only labels.
- Keyboard order: login -> nodes -> template -> variables -> generate -> copy URL -> QR actions.
- Touch targets minimum 44px.
- Body text contrast at least 4.5:1.
- Result URL copy button must expose an aria-live success message.
- QR code must have alternate copy URL action.

Design completion summary: 8/10. The remaining gap is visual design system creation, which is better handled when implementation begins or via `/design-consultation`.

### Phase 3: Engineering Review

#### Scope Challenge

The revised plan is appropriately scoped for an initial implementation: one Worker app, one KV namespace for templates, one Durable Object namespace for one-time config delivery, and a compact frontend. The main complexity risk is building a full YAML editor before the security and compatibility paths are proven.

#### Architecture Diagram

```
Owner Browser
  |
  | /login, /api/* with owner session or Cloudflare Access
  v
Worker Router
  |-- Auth Middleware
  |-- Static Asset Handler
  |-- TemplateService
  |      `-- TEMPLATES KV
  |-- RenderService
  |      |-- NodeLineValidator
  |      |-- TemplateRenderer
  |      `-- MihomoYamlValidator
  |-- OneTimeConfigClient
         `-- Durable Object: OneTimeConfigToken
               |-- state: pending -> consumed | expired
               |-- encrypted config payload
               `-- alarm cleanup

Mihomo Client
  |
  | GET /s/:token
  v
Worker Router -> Durable Object -> YAML once -> consumed
```

#### One-Time Token State Machine

```
created
  |
  v
pending --GET /s/:token--> consumed
  |                         |
  | alarm TTL               | later GET
  v                         v
expired                  gone_410

HEAD /s/:token from pending -> pending
invalid token -> gone_404
```

Invalid transitions:

- `consumed -> pending` is impossible.
- `expired -> pending` is impossible.
- `HEAD -> consumed` is forbidden.
- Any unauthenticated owner API mutation is rejected before service code.

#### Data Flow With Shadow Paths

```
nodesText + templateId + variables
  |
  v
Auth check
  |-- missing/expired -> 401 with login action
  v
Input validation
  |-- nil nodes -> 400 "Paste at least one node"
  |-- empty after trim -> 400 "Paste at least one node"
  |-- unsupported line -> 422 with line numbers
  |-- too large -> 413 with max size
  v
Template load
  |-- missing template -> 404
  |-- invalid template body -> 422
  v
Render YAML
  |-- missing variable -> 422
  |-- unsafe placeholder -> 422
  |-- output too large -> 413
  v
Compatibility validation
  |-- malformed YAML -> 422 with parser line
  v
Durable Object create token
  |-- object error -> 503 retryable
  v
URL + QR response
```

#### Error & Rescue Registry

| Method/Codepath | What Can Go Wrong | Exception/Class | Rescued | Rescue Action | User Sees |
|---|---|---|---|---|---|
| `AuthMiddleware.requireOwner` | Missing session | `Unauthorized` | Y | Return 401 | Login required |
| `AuthMiddleware.requireOwner` | Bad session signature | `Unauthorized` | Y | Clear cookie | Session expired |
| `TemplateService.list` | KV unavailable | `StorageUnavailable` | Y | Return 503 | Templates temporarily unavailable |
| `TemplateService.save` | Invalid YAML/template | `ValidationError` | Y | Return 422 | Field-level errors |
| `RenderService.validateNodes` | Empty input | `ValidationError` | Y | Return 400 | Paste at least one node |
| `RenderService.validateNodes` | Unsupported scheme | `ValidationError` | Y | Return 422 | Line-specific errors |
| `TemplateRenderer.render` | Missing variable | `ValidationError` | Y | Return 422 | Missing variable name |
| `TemplateRenderer.render` | Unsafe token | `ValidationError` | Y | Reject save/render | Unsupported placeholder |
| `YamlValidator.parse` | Malformed YAML | `ValidationError` | Y | Return parser line | YAML error with line |
| `OneTimeConfigToken.create` | DO unavailable | `StorageUnavailable` | Y | Return 503 | Try again |
| `OneTimeConfigToken.consume` | Already consumed | `Gone` | Y | Return 410 | Link already used |
| `OneTimeConfigToken.consume` | Expired | `Gone` | Y | Return 410 | Link expired |
| `QRCodeRenderer` | QR generation fails | `QrRenderError` | Y | Return URL only | Copy URL still works |

#### Failure Modes Registry

| Codepath | Failure Mode | Rescued | Test | User Sees | Logged |
|---|---|---|---|---|---|
| `/api/render` | Nodes too large | Y | Required | 413 with max size | Redacted |
| `/api/render` | Template missing | Y | Required | 404 | Redacted |
| `/api/render` | YAML invalid after render | Y | Required | 422 with line | Redacted |
| `/api/render` | Durable Object create fails | Y | Required | 503 retryable | Redacted |
| `/s/:token` | Invalid token | Y | Required | 404 | Token hash only |
| `/s/:token` | Already consumed | Y | Required | 410 | Token hash only |
| `/s/:token` | Concurrent GETs | Y | Required | one 200, rest 410 | Token hash only |
| `/s/:token` | HEAD request | Y | Required | 204/200 metadata, not consumed | Token hash only |
| Template save | Invalid YAML | Y | Required | 422 | No body log |
| Login | Brute force | Partial | Required | 429 after threshold | IP/session metadata only |

Critical gaps after review: none in the plan, provided Durable Object consumption and redacted logging are implemented.

#### Test Diagram

```
CODE PATHS                                      USER FLOWS
[+] Auth                                      [+] Owner login
  |-- valid password -> session                 |-- success redirect [E2E]
  |-- wrong password -> 401                     |-- wrong password [E2E]
  |-- expired cookie -> 401                     `-- expired session [E2E]

[+] TemplateService                           [+] Template manager
  |-- list empty/templates                       |-- create/edit/delete [E2E]
  |-- create valid/invalid                       |-- unsaved changes [E2E]
  |-- update revision conflict                   `-- import/export [Integration]
  `-- delete missing

[+] RenderService                             [+] Generate config
  |-- empty nodes                                |-- paste nodes + select template [E2E]
  |-- invalid line                               |-- invalid line shows row error [E2E]
  |-- missing variable                           |-- copy URL [E2E]
  |-- output too large                           `-- QR visible + URL fallback [E2E]
  `-- valid YAML

[+] OneTimeConfigToken                        [+] Mihomo fetch
  |-- create token                               |-- first GET returns YAML [Integration]
  |-- first GET consumes                         |-- second GET returns 410 [Integration]
  |-- concurrent GET                             |-- HEAD does not consume [Integration]
  |-- expired alarm                              `-- expired token returns 410 [Integration]
  `-- invalid token
```

Coverage target: all listed branches get unit or integration coverage; the login/generate/template flows get Playwright E2E coverage.

#### Performance Review

- No database joins or N+1 risk in MVP.
- Primary memory risk is large node input and rendered YAML output. Add hard byte limits before render and before storage.
- Token operations are single-object Durable Object calls; acceptable for one-owner use.
- KV template listing should keep template count small; add pagination only if template count grows beyond 100.
- p99 slow path will be render + YAML validation + Durable Object create. Target under 500ms for normal inputs.

#### Deployment and Rollback

```
wrangler deploy
  |
  v
Worker version active
  |
  |-- smoke /api/session
  |-- create test template
  |-- render sample config
  |-- GET token once -> 200
  |-- GET same token -> 410
  v
healthy

rollback:
  wrangler rollback or redeploy previous version
  |
  |-- templates remain in KV
  |-- in-flight one-time tokens may expire naturally
```

Engineering completion summary: architecture issues found 1 critical and fixed; code quality issues 0 because no code exists; test gaps identified 24 required paths; performance issues 1 size-limit requirement.

### Phase 3.5: DX Review

Product type: Platform/API service for the owner-developer deploying a private Worker.

Developer persona: self-hosting power user comfortable with Cloudflare, Wrangler, secrets, and mihomo config files. Tolerance: 15-30 minutes to first successful deployment, but errors must explain exact Cloudflare binding or secret that is missing.

#### Developer Empathy Narrative

I clone an empty repo and want to deploy my private mihomo handoff tool. I expect a README to tell me exactly which Cloudflare resources to create, which secrets to set, and how to verify a one-time link. If the first deploy fails because a KV namespace or Durable Object migration is missing, I need the error to name the exact Wrangler command. I do not want a generic full-stack app setup. I want one path: install dependencies, create bindings, set password secret, deploy, paste nodes, scan QR, confirm second fetch is gone.

#### Developer Journey Map

| Stage | Developer Does | Friction Points | Status |
|---|---|---|---|
| Discover | Reads README | Needs clear product boundary | Add |
| Install | Runs package install | Package manager not chosen yet | Add |
| Configure | Creates KV/DO bindings and secrets | High chance of Wrangler mistakes | Add copy-paste commands |
| Hello World | Runs local dev and sample render | Needs sample nodes without secrets | Add redacted fixtures |
| Deploy | Runs Wrangler deploy | Needs Access/fallback auth choice | Add default path |
| Real Usage | Pastes real nodes and scans QR | Client import quirks | Add compatibility matrix |
| Debug | Token already gone or invalid YAML | Needs clear status codes | Add error guide |
| Upgrade | mihomo alpha changes | Needs fixture/version policy | Add compatibility docs |
| Operate | Checks logs | Must not leak nodes | Add redacted logging rules |

#### DX Scorecard

| Dimension | Score | Notes |
|---|---:|---|
| Getting Started | 7/10 | Plan needs exact Wrangler commands |
| API/CLI naming | 8/10 | Small HTTP surface is guessable |
| Error Messages | 8/10 | Plan requires problem/cause/fix |
| Documentation | 6/10 | README not written yet |
| Upgrade Path | 7/10 | Stable-first plus alpha fixtures added |
| Dev Environment | 7/10 | Worker local dev path clear, but not scaffolded |
| Community | 5/10 | Private project, minimal community need |
| DX Measurement | 6/10 | Manual TTHW target but no automated measurement |

TTHW target: under 15 minutes from clone to deployed private Worker after Cloudflare login.

DX implementation checklist:

- [ ] README has one-command install and exact Wrangler setup commands.
- [ ] README states KV namespace and Durable Object binding names.
- [ ] README shows how to set `OWNER_PASSWORD_HASH` and session secret.
- [ ] Local dev works with sample redacted nodes.
- [ ] First run produces a URL and QR code.
- [ ] Error messages include problem, cause, fix.
- [ ] Deployment smoke test documents first GET 200, second GET 410.
- [ ] Compatibility matrix covers Android, NAS, and Windows mihomo clients.
- [ ] Alpha compatibility fixtures are pinned by date/version.
- [ ] Logs are redacted by default.

### Cross-Phase Themes

Theme: strict one-time semantics. Flagged by CEO and Engineering. KV cannot satisfy this; Durable Objects are now required.

Theme: privacy language must be precise. Flagged by CEO and DX. The project must say "no durable node retention," not imply nodes never touch Cloudflare transient delivery state.

Theme: mihomo compatibility drives product value. Flagged by CEO, Design, Engineering, and DX. Templates and delivery semantics must be tested against real clients, not assumed.

### User Challenges

Challenge 1: Product wording

- You said: subscription conversion around mihomo latest alpha core.
- Both model voices recommend: private, zero-retention, version-tested mihomo config handoff.
- Why: generic subscription converters already exist; the defensible wedge is trust, compatibility, and consume-once delivery.
- What context might be missing: you may intentionally want the project name/category to stay "subscription converter" because mihomo clients consume subscription URLs.
- If models are wrong: reframing may make the project sound less familiar to users searching for subscription conversion.

Challenge 2: Alpha baseline

- You said: around mihomo latest alpha core.
- Both model voices recommend: stable baseline with alpha opt-in fixtures.
- Why: alpha churn can break templates and force constant maintenance.
- What context might be missing: your own devices may all track alpha and need alpha-only features.
- If models are wrong: stable-first docs may underemphasize the alpha behavior you care about most.

### Taste Decisions

Choice 1: Auth default

Recommendation: built-in owner password fallback as MVP default, with Cloudflare Access documented as stronger deployment mode. Cloudflare Access is cleaner if you already use Zero Trust, but fallback reduces setup friction.

Choice 2: Template editor scope

Recommendation: keep template CRUD because you explicitly requested it, but implement it after render/auth/token foundation. A smaller raw override first would ship faster, but would not meet your stated frontend editing requirement.

Choice 3: Durable Object vs D1 for one-time tokens

Recommendation: Durable Object. D1 transactions can work, but DO maps directly to per-token state and avoids SQL/migration overhead in the first version.

### Pre-Gate Verification

| Required Output | Status |
|---|---|
| Premise challenge | Complete |
| Existing code leverage map | Complete |
| Dream state delta | Complete |
| Implementation alternatives | Complete |
| CEO dual voices | Complete |
| CEO consensus table | Complete |
| Design 7-pass review | Complete |
| Architecture ASCII diagram | Complete |
| Error & rescue registry | Complete |
| Failure modes registry | Complete |
| Test diagram | Complete |
| DX journey and scorecard | Complete |
| Cross-phase themes | Complete |
| Decision audit trail | Complete |

## Final Approval Gate

### Plan Summary

This plan now defines `t-sub` as a private, authenticated Cloudflare Worker app for zero-retention mihomo config handoff. It stores templates durably, stores rendered node-containing configs only in transient Durable Object token state, and serves each generated URL once before returning `410 Gone`.

### Decisions Made

Total: 13 decisions.

- Auto-decided: 9.
- Taste choices: 3.
- User challenges: 2.

### User Challenges

1. Product wording: keep calling it a subscription converter for familiarity, or adopt the recommended framing: private zero-retention mihomo config handoff.
2. Alpha baseline: keep alpha-first as originally stated, or adopt the recommended framing: stable baseline with alpha opt-in fixtures.

Your original direction stands unless you explicitly choose the recommended changes. The implementation plan has been written to support the recommended changes because both external voices flagged them, but this is still your call.

### Taste Choices

1. Auth default: built-in owner password fallback as MVP default, Cloudflare Access documented as stronger deployment mode.
2. Template editor scope: keep CRUD in MVP but implement after auth/render/token foundations.
3. One-time token store: Durable Object over D1 because per-token actor state maps directly to consume-once behavior.

### Review Scores

- CEO: issues found and addressed; main unresolved user choice is alpha-first vs stable-first.
- Design: 8/10 after review; remaining gap is no formal `DESIGN.md`.
- Engineering: critical KV issue fixed by Durable Object architecture.
- DX: 7/10 overall; strongest missing artifact is README/Wrangler setup docs.

### Deferred to TODOS.md

- Real mihomo client fetch semantics.
- Stable and alpha compatibility fixtures.
- Browser-local rendering variant.
- Template revision history.
- Private revocable device profiles.

### Approval Options

- A: Approve as-is, accepting the recommended reframing and stable-first compatibility.
- B: Approve but keep original wording and alpha-first positioning.
- C: Ask about a specific decision before approval.
- D: Revise the plan before implementation.
- E: Reject and restart the plan.
