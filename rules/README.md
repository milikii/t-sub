# t-sub rule sets

Mihomo built-in templates fetch these files through `rule-providers`. Rule URLs are mirrored through `ghp.564672.xyz` so updates do not depend on direct GitHub access.

This directory is only for standalone rule-provider files. Full client templates live in `../templates/`, and the generated Worker bundle lives in `../src/core/default-template-bodies.js`.

`upstream-sources.json` records optional upstream rule sources. They are disabled by default; enable one deliberately, then run `npm run rules:update`. Templates still reference this repository's `/rules/*.list` URLs, not upstream URLs.

## Custom direct/proxy

Use these two files for manual overrides:

| File | Route |
| --- | --- |
| `custom-direct-domain.list` | `DIRECT` |
| `custom-proxy-domain.list` | `🚀 节点选择` |

These rules are evaluated before PT, FCM, Google Play, OpenAI/GitHub, Japan, CN, and final `MATCH` rules. Keep a domain in only one custom file; if it appears in both, the direct file wins because it is matched first.

Use one rule per line:

```text
+.example.com
example.org
```

`+.example.com` matches `example.com` and its subdomains. Use a bare domain only when you want to match that exact domain.

## PT

`pt-direct.list` is the dedicated direct list for PT/private tracker and related domains. It is evaluated after the custom direct/proxy lists, so a temporary manual proxy override can still be placed in `custom-proxy-domain.list`.

## FCM

`fcm-domain.list` and `fcm-ipcidr.list` are used by the Android template's `📲 谷歌推送` group.

## Google Play

`google-play-domain.list` is used by the Android template to route Play Store browsing, downloads, and update endpoints through `🚀 节点选择`.

## Fake IP filter

`fake-ip-filter-domain.list` is injected into all built-in templates by `scripts/generate-template-bodies.mjs`. `fake-ip-filter-tailnet-domain.list` is injected only where `TS_DOMAIN` is supported, and `fake-ip-filter-android-domain.list` is Android-only. Mihomo's `fake-ip-filter` is part of the `dns` block, so these are generated template includes rather than `rule-providers`.
