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
私人小规则从本 Worker 的 `/rules` 路由托管。

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
# t-sub:include rules/fake-ip-filter-domain.list
```

引用在生成时展开。引用文件中的每一行变成 YAML 列表项。

## 规则 providers

规则 URL 使用 `{{RULE_BASE_URL}}`，在 Worker 渲染时自动注入。
Worker 的 `/rules/` 路由提供白名单规则文件。

MRS rule-providers（`private_domain`、`cn_domain`、`openai_domain`、`github_domain`、`tracker_domain`、`jp_ip` 等）从 `MetaCubeX/meta-rules-dat` 的 GitHub raw URL 拉取。
