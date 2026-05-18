# TODOs

## P1: Verify Real Mihomo Client Fetch Semantics

What: Test Android, NAS, and Windows mihomo clients against `/s/:token`.

Why: One-time links can be broken by retries, HEAD requests, previews, QR scanners, or validation fetches. The product promise depends on knowing what real clients do.

Pros: Prevents accidental token burn and gives clear compatibility docs.

Cons: Requires manual device/client testing and fixture maintenance.

Context: The revised plan says HEAD must not consume and GET consumes once. If a real client does preflight or retry behavior, the Durable Object consume semantics may need a short same-client retry grace.

Effort: M human / S with CC+gstack.

Priority: P1.

Depends on: Worker scaffold and `/s/:token` route.

## P1: Add Stable and Alpha Compatibility Fixtures

What: Maintain fixture templates and sample rendered YAML for stable mihomo and latest alpha behavior.

Why: Building only for latest alpha creates churn. Stable-first with alpha fixtures catches breaking config changes before users discover them on devices.

Pros: Makes upgrades safer and keeps templates honest.

Cons: Requires periodic fixture updates when mihomo changes.

Context: As of 2026-05-17/18, mihomo publishes a stable release and a rolling alpha prerelease. Alpha-only targeting was flagged by both review voices as risky.

Effort: M human / S with CC+gstack.

Priority: P1.

Depends on: Template renderer and YAML validation.

## P2: Evaluate Browser-Local Rendering Variant

What: Prototype browser-local config rendering with server-side one-time URL as only one delivery option.

Why: The strongest privacy story avoids sending node payloads to Cloudflare until the user explicitly needs remote mihomo fetch.

Pros: Better zero-retention posture and potential offline export mode.

Cons: More complex client code and may not satisfy QR/subscription import flows by itself.

Context: Both review voices noted that short-lived Cloudflare storage is still transient platform storage. Browser-local rendering could reduce that exposure for file/export workflows.

Effort: L human / M with CC+gstack.

Priority: P2.

Depends on: Core renderer abstraction.

## P2: Add Template Revision History

What: Store template revisions or exportable backups.

Why: A bad template edit can break all generated configs. Revision history makes recovery obvious.

Pros: Safer template editing and easier rollback.

Cons: More persisted records and a more complex UI.

Context: The MVP stores only current templates. This is acceptable for launch but risky once templates become important.

Effort: M human / S with CC+gstack.

Priority: P2.

Depends on: Template CRUD.

## P3: Consider Private Revocable Device Profiles

What: Explore owner-only device profiles that are revocable and private, without becoming public long-lived subscriptions.

Why: Manual paste-generate-scan may become repetitive if the same devices are configured often.

Pros: Could reduce repeated work while preserving private owner control.

Cons: Risks drifting toward the subscription-update product the user explicitly does not want right now.

Context: This is deliberately out of MVP scope. It should only be revisited if repeated one-shot generation becomes painful.

Effort: L human / M with CC+gstack.

Priority: P3.

Depends on: Real usage feedback after MVP.

