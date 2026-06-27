# MRS-first 最终收敛实施计划

## 目标
将 t-sub 收敛为「极简 MRS-first mihomo 模板生成器」。

## 步骤

### 1. 规则文件更新
- `rules/japan-services-domain.list` — 扩展大量日本网站
- `rules/misc-direct-domain.list` — 移除个人 home domain（19970626.xyz），保留 smzdm/pcbeta
- `rules/custom-direct-domain.list` — 保留为空
- `rules/custom-proxy-domain.list` — 保留为空

### 2. 模板重写（三端）
#### Windows
- 新 provider 名：private_domain/private_ip/cn_domain/cn_ip/openai_domain/github_domain/tracker_domain/jp_ip
- 本地小规则 provider：custom-direct/custom-proxy/pt-direct/misc-direct/japan-services-domain
- DNS 去除 geosite:cn/geosite:private，改为 rule-set:cn_domain / rule-set:private_domain / rule-set:japan-services-domain
- fake-ip-filter 仅 domain + tailnet
- 规则顺序按规范 Section 10
- 策略组：🚀 ⚡ 🇯🇵 ♻️🇯🇵 🇺🇸 ♻️🇺🇸，无 tailscale 无回家
- allow-lan: false, find-process-mode: off

#### Android
- Windows 基础 + tailscale 出站 + 🏠 回家 + 📲 谷歌推送
- Android 额外 provider：googlefcm_domain/googleplay_domain, android-fcm/android-google-play
- DNS 额外 fake-ip-filter 条目
- 规则顺序按规范 Section 11
- 删除 external-ui/external-ui-url
- 删除 exit-node-allow-lan-access
- allow-lan: false, tun.enable: true

#### NAS
- Windows 基础，但 allow-lan: true, tun.enable + auto-route + auto-redirect + strict-route + dns-hijack
- DNS listen 0.0.0.0:1053
- 无 tailscale/回家/谷歌推送
- 无 route-exclude-address（规则里已有直接 local IP 直连）

### 3. Worker /rules
- generate-rule-bodies.mjs 添加 fake-ip-filter-*.list 到白名单
- 已有代码正确，只需验证

### 4. update-rules.mjs
- 已有 manual/generated 分离，无需大改
- 默认不启用任何 generated 源

### 5. validate-configs.mjs
- 完全重写，按 Section 15 检查

### 6. 测试
- render.test.js 更新为新 provider/规则名
- worker.test.js 少量更新

### 7. 文档
- README.md — MRS-first 说明
- templates/README.md — 更新
- rules/README.md — 更新
- docs/mihomo-template-refactor.md — 更新
- docs/debian-nas-router.md — 完善

### 8. 生成和验证
- templates:generate, rules:generate, test, configs:validate
