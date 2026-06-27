# t-sub 规则目录

## fake-ip-filter 拆分说明

fake-ip-filter 按平台需求拆分为 4 个文件：

| 文件 | 变量 | Windows | NAS | Android |
|------|------|---------|-----|---------|
| `fake-ip-filter-common-domain.list` | 无 | ✅ | ✅ | ✅ |
| `fake-ip-filter-home-domain.list` | `HOME_DOMAIN` | ❌ | ✅ | ✅ |
| `fake-ip-filter-tailnet-domain.list` | `TS_DOMAIN` | ❌ | ❌ | ✅ |
| `fake-ip-filter-android-domain.list` | 无 | ❌ | ❌ | ✅ |

- **Windows** 只使用 common，不需要 `HOME_DOMAIN` / `TS_DOMAIN`，默认变量渲染成功。
- **NAS** 使用 common + home-domain，需要 `HOME_DOMAIN`（默认 `19970626.xyz`），不需要 `TS_DOMAIN`。
- **Android** 使用全部 4 个文件，需要 `HOME_DOMAIN` 和 `TS_DOMAIN`。

## 目录结构

```
rules/
├── README.md
├── upstream-sources.json                    # 上游规则源定义
├── custom-direct-domain.list                # [manual] 用户自维护 DIRECT 覆盖
├── custom-proxy-domain.list                 # [manual] 用户自维护 PROXY 覆盖
├── pt-direct-domain.list                    # [generated] PT/Tracker 域名 → DIRECT
├── misc-direct-domain.list                  # [manual] 非 PT 杂项直连域名
├── android-fcm-domain.list                  # [manual] FCM 推送域名 → 📲 谷歌推送
├── android-google-play-domain.list          # [manual] Google Play 域名 → 🚀 默认代理
├── japan-services-domain.list               # [manual] 日本服务域名 → 🇯🇵 日本节点
├── fake-ip-filter-common-domain.list        # [manual] DNS fake-ip 过滤（三端通用，无变量）
├── fake-ip-filter-home-domain.list          # [manual] 家庭域名 fake-ip 过滤（NAS/Android，含 HOME_DOMAIN）
├── fake-ip-filter-tailnet-domain.list       # [manual] Tailnet DNS 过滤（仅 Android，含 TS_DOMAIN）
├── fake-ip-filter-android-domain.list       # [manual] Android 专属 DNS 过滤（连通性/FCM/游戏）
```

> 旧 `fake-ip-filter-domain.list` 保留向后兼容（Worker 仍然白名单内），但已不被任何模板引用。

## MRS-first 路线

本项目采用纯 MRS-first 路线：

- 公共大规则（`private_domain`、`cn_domain`、`openai_domain`、`github_domain`、`tracker_domain`、`jp_ip` 等）使用 MRS 格式，从 `MetaCubeX/meta-rules-dat` 远程拉取
- 不使用 `GEOSITE`/`GEOIP`/`geosite.dat`/`geoip.dat`/`country.mmdb`
- 不使用 `Loyalsoldier`/`v2ray-rules-dat`
- 不配置 `geodata-mode`/`geox-url`

## Manual vs Generated

- **manual**：`update-rules.mjs` 不会修改的文件。手动编辑。
- **generated**：可以通过 `npm run rules:update` 从上游源重建的文件。需要在 `upstream-sources.json` 中启用源。

## 规则文件

规则文件由 Worker 在 `GET /rules/<filename>` 提供，白名单保护。

| 文件 | 内容 | 路由 |
|------|------|------|
| `custom-direct-domain.list` | 用户 DIRECT 覆盖 | `RULE-SET,custom-direct-domain,DIRECT` |
| `custom-proxy-domain.list` | 用户 PROXY 覆盖 | `RULE-SET,custom-proxy-domain,🚀 默认代理` |
| `pt-direct-domain.list` | PT 站点域名 | `RULE-SET,pt-direct-domain,DIRECT` |
| `misc-direct-domain.list` | 杂项直连域名 | `RULE-SET,misc-direct-domain,DIRECT` |
| `android-fcm-domain.list` | FCM 推送（仅 Android） | `RULE-SET,android-fcm-domain,📲 谷歌推送` |
| `android-google-play-domain.list` | Google Play（仅 Android） | `RULE-SET,android-google-play-domain,🚀 默认代理` |
| `japan-services-domain.list` | 日本服务域名 | `RULE-SET,japan-services-domain,🇯🇵 日本节点` |

其他规则 provider（`private_domain`、`private_ip`、`cn_domain`、`cn_ip`、`openai_domain`、`github_domain`、`tracker_domain`、`jp_ip`）使用 MRS 格式，从 `MetaCubeX/meta-rules-dat` 拉取。

## 用法

```bash
# 从启用的上游源更新 generated 规则文件
npm run rules:update

# 检查规则文件与 Worker bundle 同步
npm run rules:check

# 生成 Worker 规则 bundle
npm run rules:generate
```

## 格式

一行一条规则：
- `+.example.com` 匹配 `example.com` 及其所有子域名
- `example.org` 只匹配 `example.org`
