# mihomo 模板重构：MRS-first 收敛

## 最终架构

本项目已收敛为「极简 MRS-first mihomo 模板生成器」。

### MRS-first

- **纯 MRS-first**：所有公共规则使用 `MetaCubeX/meta-rules-dat` 的 MRS 文件
- **无需 DAT/MMDB**：不使用 `geoip.dat`、`geosite.dat`、`country.mmdb`
- **无 GeoX**：无 `GEOSITE`、`GEOIP`、`geodata-mode`、`geox-url`
- **无 Loyalsoldier**：不使用 `Loyalsoldier/v2ray-rules-dat`

### 公共规则来源

所有公共规则通过 `rule-provider` 的 `interval: 86400` 从 `MetaCubeX/meta-rules-dat` 的 GitHub raw MRS 文件自动更新，由 mihomo 客户端侧完成，无需本仓库下载。

| provider | 源 URL | 类型 |
|----------|--------|------|
| `private_domain` | `geosite/private.mrs` | behavior: domain, format: mrs |
| `private_ip` | `geoip/private.mrs` | behavior: ipcidr, format: mrs |
| `cn_domain` | `geosite/cn.mrs` | behavior: domain, format: mrs |
| `cn_ip` | `geoip/cn.mrs` | behavior: ipcidr, format: mrs |
| `openai_domain` | `geosite/openai.mrs` | behavior: domain, format: mrs |
| `github_domain` | `geosite/github.mrs` | behavior: domain, format: mrs |
| `tracker_domain` | `geosite/tracker.mrs` | behavior: domain, format: mrs |
| `jp_ip` | `geoip/jp.mrs` | behavior: ipcidr, format: mrs |

### 私人规则

由 Worker `/rules` 路由托管，通过 `{{RULE_BASE_URL}}` 注入。

### 三端模板

| 模板 | Tailscale | TUN | 特殊策略组 |
|------|-----------|-----|-----------|
| Windows | ❌ | 不强制 | 仅 6 个通用组 |
| Android | ✅ 回家 | ✅ enable | + 🏠 回家 + 📲 谷歌推送 |
| NAS | ❌ | ✅ 旁路由 | 仅 6 个通用组 |

### 策略组

三端通用（6 组）：

1. `🚀 默认代理` — select，包含 ⚡/🇯🇵/🇺🇸/♻️🇯🇵/♻️🇺🇸/DIRECT
2. `⚡ 全部自动` — url-test
3. `🇯🇵 日本节点` — select，filter 日本，不含 DIRECT
4. `♻️ 日本自动` — url-test，filter 日本
5. `🇺🇸 美国节点` — select，filter 美国，不含 DIRECT
6. `♻️ 美国自动` — url-test，filter 美国

Android 额外：

7. `🏠 回家` — select，含 tailscale/DIRECT
8. `📲 谷歌推送` — select，含 🚀/🇺🇸/DIRECT

### DNS

- `nameserver-policy` 使用 `rule-set:` 引用，而非 `geosite:`
- 国内域名/私有域名使用阿里/腾讯 DoH
- 日本域名使用 1.1.1.1/8.8.8.8
- `enhanced-mode: fake-ip`
- `cache-algorithm: arc`
- `respect-rules: true`

### 规则顺序

```
1. 本地安全直连（localhost/lan/local + private 直连）
2. 最高人工直连（custom-direct-domain）
3. 日本强制（japan-services-domain, jp_ip）
4. 人工指定代理（custom-proxy-domain）
5. PT/Tracker/杂项直连
6. AI/开发服务固定美国（openai_domain, github_domain）
7. 国内直连（cn_domain, cn_ip）
8. MATCH → 🚀 默认代理
```

### 删除的旧配置

- `geosite:cn` DNS 策略
- `geosite:private` DNS 策略
- 旧 provider 名：`private`、`cn`、`geoip-cn`、`openai`、`github`
- `GEOSITE,*`、`GEOIP,*` 规则
- `geodata-mode`、`geo-auto-update`、`geox-url`
- Android `external-ui-url`（无内置 WebUI 需求）
- Android `exit-node-allow-lan-access`
- `DOMAIN-SUFFIX,{{HOME_DOMAIN}},DIRECT`（Windows/NAS）
- `dns.fallback`、`dns.fallback-filter`

### 迁移

1. 部署 Worker 代码
2. 打开网页，对每个内置模板点「恢复内置模板」
3. 新生成的配置将使用新版

### 回滚

```bash
git revert HEAD --no-edit
npm run templates:generate
npm run rules:generate
npm test
```

重新部署 Worker。
