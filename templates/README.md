# t-sub 配置模板

内置模板源文件目录。

| 文件 | 客户端 | 平台 |
|------|--------|------|
| `android.yaml` | Android（TUN + Tailscale + FCM/Play） | `android` |
| `nas-debian.yaml` | Debian NAS（TUN 透明旁路由） | `nas` |
| `windows.yaml` | Windows（本机代理，无 TUN，无 Tailscale） | `windows` |

## MRS-first

所有模板**纯 MRS-first**：

- 不使用 DAT (`geoip.dat` / `geosite.dat`)
- 不使用 MMDB (`country.mmdb`)
- 不使用 `GEOSITE`, `GEOIP`, `geosite:`, `geoip:`
- 不配置 `geodata-mode`、`geo-auto-update`、`geox-url`
- 不使用 `Loyalsoldier` / `v2ray-rules-dat`

公共大规则从 `MetaCubeX/meta-rules-dat` 的 MRS 文件自动更新（通过 `rule-provider` 的 `interval: 86400` 客户端侧自动拉取）。
私人小规则从本 Worker 的 `/rules` 路由托管（支持 GET 和 HEAD）。

## 模板变量说明

| 模板 | PROFILE_NAME | HOME_DOMAIN | TS_DOMAIN | 说明 |
|------|-------------|-------------|-----------|------|
| Windows | ✅ 默认 "Windows" | ❌ 不需要 | ❌ 不需要 | fake-ip-filter 只使用 common 文件，不含变量 |
| NAS | ✅ 默认 "NAS" | ✅ 默认 "19970626.xyz" | ❌ 不需要 | fake-ip-filter 使用 common + home-domain |
| Android | ✅ 自动推断 | ✅ 默认 "19970626.xyz" | ✅ 默认 "tailc1b432.ts.net" | fake-ip-filter 使用全部 4 个文件 |

- **Windows** 默认变量渲染无需额外传 HOME_DOMAIN / TS_DOMAIN，渲染结果不含占位符。
- **NAS** 需要 HOME_DOMAIN（若需覆盖默认值）；不含 TS_DOMAIN，不含 tailscale。
- **Android** 需要 HOME_DOMAIN 和 TS_DOMAIN；包含 tailscale 回家和 FCM/Google Play。

## fake-ip-filter 拆分

fake-ip-filter 已按平台需求拆分为 4 个文件，源文件在 `rules/` 目录下：

| 文件 | 内容 | Windows | NAS | Android |
|------|------|---------|-----|---------|
| `fake-ip-filter-common-domain.list` | *.lan, *.local, MS 连通性检查 | ✅ | ✅ | ✅ |
| `fake-ip-filter-home-domain.list` | `*.{{HOME_DOMAIN}}` | ❌ | ✅ | ✅ |
| `fake-ip-filter-tailnet-domain.list` | `*.{{TS_DOMAIN}}` | ❌ | ❌ | ✅ |
| `fake-ip-filter-android-domain.list` | Android 连通性 / FCM / 游戏 | ❌ | ❌ | ✅ |

## cn_ip / jp_ip 的 no-resolve

- `RULE-SET,jp_ip,🇯🇵 日本节点,no-resolve`
- `RULE-SET,cn_ip,DIRECT,no-resolve`

当前默认选择 `no-resolve`，是为了轻量、稳定、可排障。

如果用户希望「域名未命中时，再按解析 IP 判断国内/日本」，可以考虑移除 `cn_ip` / `jp_ip` 后面的 `no-resolve`。

如果 `jp_ip` 误伤非日本 IP，可以删除 `jp_ip` provider 和对应 `RULE-SET,jp_ip` 行。

## 编辑

编辑 YAML 后运行：

```bash
npm run templates:generate
```

这会更新 `src/core/default-template-bodies.js`，它会被打包进 Cloudflare Worker。

`npm test` 包含 `npm run templates:check`。

## 模板引用

模板文件可以引用规则片段：

```yaml
# t-sub:include rules/fake-ip-filter-common-domain.list
```

引用在生成时展开。引用文件中的每一行变成 YAML 列表项。

## 规则 providers

规则 URL 使用 `{{RULE_BASE_URL}}`，在 Worker 渲染时自动注入。
Worker 的 `/rules/` 路由提供白名单规则文件（支持 GET 和 HEAD）。

MRS rule-providers（`private_domain`、`cn_domain`、`openai_domain`、`github_domain`、`tracker_domain`、`jp_ip` 等）从 `MetaCubeX/meta-rules-dat` 的 GitHub raw URL 拉取。
