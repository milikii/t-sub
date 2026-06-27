# Mihomo Template Refactor Plan

## Original Problems

1. **Android 🏠 回家 rules bypass the group** — HOME_DOMAIN/TS_DOMAIN/CIDR rules write `tailscale` directly instead of `🏠 回家`
2. **Android DOMAIN-SUFFIX,lan** and **DOMAIN-SUFFIX,local** too broad, deleted
3. **Android exit-node-allow-lan-access** invalid without exit-node, deleted
4. **NAS tun.enable: false** — not a side router, just an allow-lan proxy. Need true transparent Linux side router
5. **Windows find-process-mode: strict** with no process rules → `off`
6. **pt-direct.list** contains non-PT domains (smzdm, pcbeta, 19970626.xyz) and duplicate hdsky.me
7. **fcm-ipcidr.list** all /32, unreliable, moved to legacy
8. **GEOSITE/GEOIP** rules still use geodata mode — migrate to MRS rule-providers
9. **geodata-mode/geo-auto-update/geox-url** — remove after migration
10. **DNS fallback/fallback-filter** overly complex, simplify
11. **Proxy group naming** inconsistent, redundant url/interval on select groups
12. **Rules reference `🚀 节点选择` and `⚡ 自动选择`** — rename to `🚀 默认代理` and `⚡ 全部自动`

## Template Differences

| Feature | Android | Windows | NAS |
|---------|---------|---------|-----|
| Tailscale proxy | ✅ | ❌ | ❌ |
| 🏠 回家 group | ✅ | ❌ | ❌ |
| 📲 谷歌推送 group | ✅ | ❌ | ❌ |
| TUN | ✅ (enable: true) | ❌ | ✅ (enable: true, transparent) |
| allow-lan | false | false | true |
| find-process-mode | — | off | off |
| DNS listen | 127.0.0.1:1053 | 127.0.0.1:1053 | 0.0.0.0:1053 |
| auto-redirect | — | — | true |
| strict-route | true | — | true |
| dns-hijack | any:53 | — | any:53 + tcp://any:53 |
| fake-ip-filter | domain + tailnet + android | domain + tailnet | domain |

## Proxy Group Structure (Windows/NAS — 6 groups)

```
🚀 默认代理          (select)
⚡ 全部自动          (url-test)
🇯🇵 日本节点          (select, first: ♻️ 日本自动)
♻️ 日本自动          (url-test)
🇺🇸 美国节点          (select, first: ♻️ 美国自动)
♻️ 美国自动          (url-test)
```

Android adds:
```
🏠 回家              (select: tailscale, DIRECT)
📲 谷歌推送          (select)
```

## DNS Design

- cache-algorithm: arc
- enhanced-mode: fake-ip
- fake-ip-range: 198.18.0.1/16
- default-nameserver: [223.5.5.5, 119.29.29.29]
- proxy-server-nameserver → DoH via proxy (overseas)
- nameserver: [国内 DoH, 海外 DoH via proxy]
- nameserver-policy:
  - geosite:cn / geosite:private → 国内 DoH
  - rule-set:openai / rule-set:github → 海外 DoH
  - Other → proxy-server-nameserver (overseas)

## Rule Priority (Android)

1. HOME_DOMAIN + TS_DOMAIN → 🏠 回家
2. RULE-SET private → DIRECT
3. RULE-SET custom-direct → DIRECT
4. RULE-SET custom-proxy → 🚀 默认代理
5. RULE-SET pt-direct → DIRECT
6. RULE-SET misc-direct → DIRECT
7. RULE-SET fcm-domain → 📲 谷歌推送
8. RULE-SET google-play-domain → 🚀 默认代理
9. RULE-SET openai → 🚀 默认代理
10. RULE-SET github → 🚀 默认代理
11. RULE-SET japan-services → 🇯🇵 日本节点
12. GEOSITE cn → DIRECT
13. GEOIP CN → DIRECT, no-resolve
14. MATCH → 🚀 默认代理

## Worker Rule Hosting

- `GET /rules/<filename>` served from bundled JS
- Whitelist: custom-direct-domain.list, custom-proxy-domain.list, pt-direct-domain.list, misc-direct-domain.list, android-fcm-domain.list, android-google-play-domain.list, japan-services-domain.list
- RULE_BASE_URL injected at render time, hidden from web UI
- rule-provider URL = `{{RULE_BASE_URL}}/<filename>`
- Large MRS files from meta-rules-dat GitHub raw

## NAS Transparent Side Router

- tun.enable: true, stack: mixed, auto-route, auto-redirect, strict-route
- dns-hijack: any:53 + tcp://any:53
- dns.listen: 0.0.0.0:1053
- allow-lan: true (for Docker containers using 7890 explicitly)
- route-exclude-address: exclude RFC1918 from TUN routing
- NOT Docker bridge — needs host networking or dedicated deployment

## Files Changed

- templates/android.yaml (rewrite)
- templates/windows.yaml (rewrite)
- templates/nas-debian.yaml (rewrite → transparent side router)
- rules/pt-direct.list → pt-direct-domain.list (dedupe, remove non-PT)
- rules/misc-direct-domain.list (new)
- rules/android-fcm-domain.list (renamed from fcm-domain.list)
- rules/android-google-play-domain.list (renamed from google-play-domain.list)
- rules/japan-services-domain.list (new)
- rules/legacy/fcm-ipcidr.list (moved from fcm-ipcidr.list)
- rules/upstream-sources.json (add type: manual/generated)
- src/core/default-rule-bodies.js (new generated)
- src/core/default-template-bodies.js (regenerated)
- src/core/template-vars.js (RULE_BASE_URL as RESERVED)
- src/core/render.js (inject RULE_BASE_URL)
- src/worker.js (add /rules route)
- scripts/generate-rule-bodies.mjs (new)
- scripts/update-rules.mjs (refactored)
- test/render.test.js (rewritten)
- test/worker.test.js (add /rules tests)
- docs/debian-nas-router.md (new)
- docs/mihomo-template-refactor.md (new)
- templates/README.md (update)
- rules/README.md (update)
- README.md (update)

## Migration Steps

1. Deploy code
2. Open web UI → Templates → Android → "恢复内置模板"
3. Repeat for Windows and NAS
4. Existing /s/ links still work (template content only changes for new renders)
5. /rules/ endpoints available immediately

## Rollback

```bash
git revert HEAD
npm run templates:generate
npm run rules:generate
```
