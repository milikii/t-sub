# t-sub Rule Sets

## Directory Structure

```
rules/
├── README.md
├── upstream-sources.json          # Upstream rule source definitions
├── custom-direct-domain.list      # [manual] User-maintained DIRECT overrides
├── custom-proxy-domain.list       # [manual] User-maintained proxy overrides
├── pt-direct-domain.list          # [generated] PT/Tracker domains → DIRECT
├── misc-direct-domain.list        # [manual] Misc non-PT domains → DIRECT
├── android-fcm-domain.list        # [manual] FCM push domains → 📲 谷歌推送
├── android-google-play-domain.list # [manual] Google Play domains → 🚀 默认代理
├── japan-services-domain.list     # [manual] Japan service domains → 🇯🇵 日本节点
├── fake-ip-filter-domain.list     # [manual] DNS fake-ip filter (all templates)
├── fake-ip-filter-tailnet-domain.list # [manual] Tailnet DNS filter (Android/Windows)
├── fake-ip-filter-android-domain.list  # [manual] Android DNS filter
└── legacy/
    └── fcm-ipcidr.list            # Deprecated /32 FCM IPs (unreliable)
```

## Manual vs Generated

- **manual**: Files never modified by `update-rules.mjs`. Edit by hand.
- **generated**: Files that can be rebuilt from upstream sources via `npm run rules:update`. Enable sources in `upstream-sources.json` first.

## Rule Files

Rule files are served by the Worker at `GET /rules/<filename>` with whitelist protection.

| File | Content | Route |
|------|---------|-------|
| `custom-direct-domain.list` | User domain overrides → DIRECT | `RULE-SET,custom-direct-domain,DIRECT` |
| `custom-proxy-domain.list` | User domain overrides → proxy | `RULE-SET,custom-proxy-domain,🚀 默认代理` |
| `pt-direct-domain.list` | PT/Tracker domains | `RULE-SET,pt-direct-domain,DIRECT` |
| `misc-direct-domain.list` | Misc non-PT direct domains | `RULE-SET,misc-direct-domain,DIRECT` |
| `android-fcm-domain.list` | FCM push (Android only) | `RULE-SET,android-fcm-domain,📲 谷歌推送` |
| `android-google-play-domain.list` | Google Play (Android only) | `RULE-SET,android-google-play-domain,🚀 默认代理` |
| `japan-services-domain.list` | Japan region services | `RULE-SET,japan-services-domain,🇯🇵 日本节点` |

Other rule providers (private, cn, geoip-cn, openai, github) use MRS format from `MetaCubeX/meta-rules-dat`.

## Usage

```bash
# Update generated rule files from enabled upstream sources
npm run rules:update

# Check if rule bodies are in sync with Worker bundle
npm run rules:check

# Generate Worker rule bundle
npm run rules:generate
```

## Format

One domain rule per line:
- `+.example.com` matches `example.com` and all subdomains
- `example.org` matches only `example.org`
