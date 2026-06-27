# Mihomo Template Refactor Implementation

## Original Problems

1. **Android 🏠 回家 rules bypass the group** — HOME_DOMAIN/TS_DOMAIN/CIDR rules wrote `tailscale` directly instead of `🏠 回家`
2. **Android DOMAIN-SUFFIX,lan and DOMAIN-SUFFIX,local too broad** — deleted, only forward explicit home domains and Tailnet domains
3. **Android exit-node-allow-lan-access: true** — invalid field without exit-node, deleted
4. **NAS tun.enable: false** — not a side router, just allow-lan proxy. Changed to true transparent Linux side router
5. **Windows find-process-mode: strict** — with no process rules, changed to off
6. **pt-direct.list** — contained non-PT domains (smzdm.com, pcbeta.com, 19970626.xyz) and duplicate hdsky.me
7. **fcm-ipcidr.list** — all /32, no reliable update source, moved to legacy
8. **GEOSITE/GEOIP with geodata-mode** — migrated to MRS rule-providers from meta-rules-dat
9. **DNS fallback/fallback-filter** — overly complex, simplified
10. **Proxy groups with redundant url/interval on select groups** — cleaned up
11. **Configs referenced hardcoded GitHub URLs** — switched to RULE_BASE_URL for custom rules

## Changes

### Rule Directory Reorganization

| Old | New | Type |
|-----|-----|------|
| `rules/pt-direct.list` | `rules/pt-direct-domain.list` | Renamed, deduped, cleaned |
| — | `rules/misc-direct-domain.list` | New file for non-PT misc domains |
| `rules/fcm-domain.list` | `rules/android-fcm-domain.list` | Renamed |
| `rules/google-play-domain.list` | `rules/android-google-play-domain.list` | Renamed |
| — | `rules/japan-services-domain.list` | New file for Japan service domains |
| `rules/fcm-ipcidr.list` | `rules/legacy/fcm-ipcidr.list` | Moved to legacy |

### Template Differences

| Feature | Android | Windows | NAS |
|---------|---------|---------|-----|
| Tailscale proxy | ✅ | ❌ | ❌ |
| 🏠 回家 group | ✅ | ❌ | ❌ |
| 📲 谷歌推送 group | ✅ | ❌ | ❌ |
| TUN | enable: true | — | enable: true, auto-redirect |
| allow-lan | false | false | true |
| find-process-mode | — | off | off |
| DNS listen | 127.0.0.1:1053 | 127.0.0.1:1053 | 0.0.0.0:1053 |
| dns-hijack | any:53 | — | any:53, tcp://any:53 |
| fake-ip-filter | domain + tailnet + android | domain + tailnet | domain |

### Proxy Groups (Common)

- `🚀 默认代理` (select) — default outbound
- `⚡ 全部自动` (url-test) — auto pick best
- `🇯🇵 日本节点` (select, first: ♻️ 日本自动)
- `♻️ 日本自动` (url-test)
- `🇺🇸 美国节点` (select, first: ♻️ 美国自动)
- `♻️ 美国自动` (url-test)

Android adds: `🏠 回家` and `📲 谷歌推送`

All url-test groups: lazy, interval: 600, timeout: 3000, max-failed-times: 3, expected-status: 204, empty-fallback: REJECT

All groups: `include-all-proxies: true`, `exclude-filter` for traffic/expire keywords

### Rule Priority

Android:
1. HOME_DOMAIN + TS_DOMAIN + home CIDR → 🏠 回家
2. localhost + private → DIRECT
3. custom-direct-domain → DIRECT
4. custom-proxy-domain → 🚀 默认代理
5. pt-direct-domain → DIRECT
6. misc-direct-domain → DIRECT
7. android-fcm-domain → 📲 谷歌推送
8. android-google-play-domain → 🚀 默认代理
9. openai → 🚀 默认代理
10. github → 🚀 默认代理
11. japan-services-domain → 🇯🇵 日本节点
12. cn → DIRECT
13. geoip-cn → DIRECT,no-resolve
14. MATCH → 🚀 默认代理

Windows/NAS:
1. localhost + lan/local + HOME_DOMAIN + private → DIRECT
2. custom-direct-domain → DIRECT
3. custom-proxy-domain → 🚀 默认代理
4. pt-direct-domain → DIRECT
5. misc-direct-domain → DIRECT
6. openai → 🇺🇸 美国节点
7. github → 🇺🇸 美国节点
8. japan-services-domain → 🇯🇵 日本节点
9. cn → DIRECT
10. geoip-cn → DIRECT,no-resolve
11. MATCH → 🚀 默认代理

### DNS Design

- `cache-algorithm: arc` — ARC cache for efficiency
- `enhanced-mode: fake-ip` — fake IP for domain-based routing
- `fake-ip-range: 198.18.0.1/16`
- `default-nameserver: [223.5.5.5, 119.29.29.29]`
- `proxy-server-nameserver` → Chinese DoH (alidns, dns.pub)
- `direct-nameserver` → Chinese DoH
- `nameserver` → 1.1.1.1, 8.8.8.8 (overseas)
- `nameserver-policy`:
  - `geosite:cn` → Chinese DoH
  - `geosite:private` → Chinese DoH
  - Other → nameserver (overseas)

### Worker /rules Route

- `GET /rules/<filename>` — whitelisted rule files served from bundled JS
- Whitelist enforced: no path traversal, no slashes, strict filename match
- Content-Type: text/plain; charset=utf-8
- Cache-Control: public, max-age=300
- ETag based on SHA-256 content hash
- RULE_BASE_URL injected automatically at render time
- Not shown in web UI (reserved variable)

### MRS Rule Providers

- `RULE-SET,private,DIRECT` → geosite/private.mrs
- `RULE-SET,cn,DIRECT` → geosite/cn.mrs
- `RULE-SET,geoip-cn,DIRECT,no-resolve` → geoip/cn.mrs
- `RULE-SET,openai,...` → geosite/openai.mrs
- `RULE-SET,github,...` → geosite/github.mrs

Sources: `https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/`

### Deleted Config

- `geodata-mode`, `geo-auto-update`, `geo-update-interval`, `geox-url`
- `dns.fallback`, `dns.fallback-filter`
- `DOMAIN-SUFFIX,lan,tailscale` (Android)
- `DOMAIN-SUFFIX,local,tailscale` (Android)
- `exit-node-allow-lan-access` (Android tailscale)
- `find-process-mode: strict` (Windows, replaced with `off`)
- `lan-allowed-ips` (NAS, unnecessary for TUN mode)
- `external-controller` (NAS)
- Hardcoded Japan domain rules (replaced with RULE-SET)
- old rule-providers for ghp-mirrored GitHub URLs

## NAS Deployment

NAS template changed from Docker proxy to transparent side router:
- `tun.enable: true`, `stack: mixed`, `auto-route`, `auto-redirect`, `strict-route`
- `dns-hijack: [any:53, tcp://any:53]`
- `dns.listen: 0.0.0.0:1053`
- `route-exclude-address` for RFC1918
- Deployed with native systemd (not Docker bridge)
- See `docs/debian-nas-router.md` for detailed instructions

## Migration Steps

1. Deploy updated Worker code
2. Open web UI
3. For each template (Android, Windows, NAS), click "恢复内置模板"
4. New renders will use updated templates
5. Existing `/s/` links continue to work (they use previously rendered snapshots)

## Rollback

```bash
git revert HEAD --no-edit
npm run templates:generate
npm run rules:generate
npm test
```

Re-deploy Worker code.
