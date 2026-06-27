# t-sub

私有的一次性 mihomo 配置生成器，部署在 Cloudflare Workers 上。

[![一键连接当前仓库部署到 Cloudflare](https://img.shields.io/badge/Cloudflare-连接当前仓库部署-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/workers-and-pages)

## 这是做什么的

`t-sub` 用来把你自己的节点临时转换成 mihomo 配置：

1. 打开网页并登录。
2. 一行一个粘贴自建节点。
3. 选择 Android、NAS、Windows 或自定义模板。
4. 生成一次性订阅链接和二维码。
5. mihomo 客户端拉取一次配置。
6. 这个链接立刻失效。

项目只长期保存配置模板，不长期保存节点信息，不做订阅更新。

## 一键连接当前仓库部署

点上面的橙色按钮，进入 Cloudflare 的 `Workers & Pages` 页面，然后连接当前 GitHub 仓库 `milikii/t-sub`。这条路径不会创建新仓库。

在 Cloudflare 控制台操作：

1. 打开 Cloudflare Dashboard。
2. 进入 `Workers & Pages`。
3. 点击 `Create application`。
4. 选择 `Import a repository`。
5. 连接 GitHub。
6. 仓库权限选择 `Only select repositories`，只授权 `milikii/t-sub`。
7. 选择仓库 `milikii/t-sub`。
8. 项目名填 `t-sub`。
9. 生产分支选择 `master`。
10. Root directory 填 `/` 或保持默认。
11. Deploy command 使用默认值 `npx wrangler deploy`。
12. 在变量/Secrets 区域添加 `OWNER_PASSWORD` 和 `SESSION_SECRET`。
13. 保存并部署。

需要填写的 secrets：

| 名称 | 怎么填 |
| --- | --- |
| `OWNER_PASSWORD` | 网页登录密码。请填写你自己的密码。 |
| `SESSION_SECRET` | 随机密钥。填一串 32 位以上随机字符，例如 `d5f6a9b4c2e7f1a8d0c3b6e9a4f2c8d1`。 |

如果创建页面没显示变量/Secrets 区域，先创建项目，然后到这里补上两个 secret，再重新部署：

```text
Workers & Pages -> t-sub -> Settings -> Variables and Secrets
```

Cloudflare 会根据 `wrangler.toml` 自动部署这些资源：

- Worker：网页和 API。
- Durable Object `TEMPLATE_STORE`：保存配置模板。
- Durable Object `ONE_TIME_CONFIGS`：保存一次性配置并负责“读取一次后失效”。
- Secrets：保存 `OWNER_PASSWORD` 和 `SESSION_SECRET`。

你不需要在本机运行 `npm install`、`wrangler login`、`wrangler deploy`，也不需要手动创建 KV namespace。

部署完成后，Cloudflare 会从当前 GitHub 仓库拉代码。以后你 push 到 `master`，Cloudflare 会自动重新构建和部署。

## 部署后怎么用

部署完成后，Cloudflare 会给你一个访问地址，通常类似：

```text
https://t-sub.<你的账号>.workers.dev
```

打开这个地址：

1. 密码输入你部署时填写的 `OWNER_PASSWORD`。
2. 在节点框里粘贴节点，一行一个。
3. 选择模板。
4. 点击生成。
5. 复制订阅链接或扫描二维码。
6. mihomo 客户端拉取后，链接会失效。

## 自定义域名

如果你想用自己的域名：

1. 进入 Cloudflare 控制台。
2. 打开 `Workers & Pages`。
3. 选择 `t-sub`。
4. 进入 `Settings -> Domains & Routes`。
5. 添加你的域名，例如 `sub.example.com`。

如果生成的订阅链接域名不是你想要的，可以设置环境变量：

```text
PUBLIC_BASE_URL=https://sub.example.com
```

设置位置：

```text
Workers & Pages -> t-sub -> Settings -> Variables and Secrets
```

保存后重新部署一次即可。

## Cloudflare 里应该看到什么

部署完成后，在 Cloudflare 控制台检查：

```text
Workers & Pages -> t-sub -> Settings
```

应该有这些绑定：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Durable Object | `TEMPLATE_STORE` | 保存配置模板 |
| Durable Object | `ONE_TIME_CONFIGS` | 保存一次性配置状态 |
| Secret | `OWNER_PASSWORD` | 网页登录密码 |
| Secret | `SESSION_SECRET` | 会话签名和一次性配置加密 |

默认非敏感变量：

| 名称 | 默认值 | 含义 |
| --- | --- | --- |
| `SESSION_TTL_SECONDS` | `86400` | 登录有效期，默认 1 天 |
| `ONE_TIME_TTL_SECONDS` | `300` | 一次性链接默认有效期，默认 5 分钟 |
| `MAX_ONE_TIME_TTL_SECONDS` | `900` | 一次性链接最大有效期，默认 15 分钟 |
| `ONE_TIME_GRACE_SECONDS` | `20` | 首次拉取后的兼容宽限时间，避免客户端二次请求失败 |
| `ONE_TIME_MAX_GETS` | `2` | 宽限时间内最多返回配置的 GET 次数 |
| `MAX_NODES_BYTES` | `65536` | 节点输入最大体积 |
| `MAX_RENDERED_BYTES` | `131072` | 生成 YAML 最大体积 |

## 模板占位符

仓库里的内置默认模板源文件在：

```text
templates/android.yaml
templates/nas-debian.yaml
templates/windows.yaml
```

`src/core/default-template-bodies.js` 是生成产物，Cloudflare Worker 实际从这里打包默认模板。改完 `templates/*.yaml` 后运行 `npm run templates:generate`，提交 YAML 和生成后的 JS。

Android 内置模板已经是完整 mihomo alpha 配置，不需要手写 `{{PROXIES_YAML}}`。系统会自动把你粘贴的节点插入顶层 `proxies:` 段，并保留模板里的兜底节点。

三端内置模板现在按用途分开：

- Android：开启 TUN、fake-ip DNS、FCM 规则、Google Play 规则、US/JP 分组，并内置 `type: tailscale` 出站和 `🏠 回家` 策略组。家庭/Tailnet 域名和 CIDR 走 🏠 回家。
- NAS：**透明旁路由**。`tun.enable: true`，`auto-route` + `auto-redirect`，DNS 监听 `0.0.0.0:1053`。部署方式为原生 systemd，不推荐 Docker bridge。详见 `docs/debian-nas-router.md`。
- Windows：本机桌面代理。`allow-lan: false`，`find-process-mode: off`，不包含 Tailscale。

节点命名建议在订阅转换阶段给美国节点加 `us` 前缀、日本节点加 `jp` 前缀。模板也兼容常见地区词，例如 `美国`、`日本`、`USA`、`Japan`、`Tokyo`、`Los Angeles`。

NAS 和 Windows 会把 OpenAI/GitHub 走美国节点，把日本域名和常见日区服务走日本节点；Android 的 OpenAI 和 Play 商店下载规则跟随 `🚀 节点选择`。YouTube、Netflix 这类媒体服务不强行固定地区，默认跟随 `🚀 节点选择`，避免干扰你手动选择日区或美区。

DNS 使用 fake-ip 与 `respect-rules`。直连域名使用阿里/腾讯 DoH，代理域名使用对应规则分流后的 DoH，避免直连域名被国外 DNS 解析、代理域名被国内 DNS 污染。NAS 和 Windows 默认关闭 Mihomo IPv6（顶层 `ipv6: false`，`dns.ipv6: false`）；Android 模板按新版基线开启 IPv6（顶层和 DNS 均为 `true`）。

Android 模板的 WebUI/规则依赖：

- WebUI：`MetaCubeX/metacubexd`，通过 `external-ui-url` 从 GitHub 下载。
- Geo 数据：`MetaCubeX/meta-rules-dat` 的 `geoip.dat`、`geosite.dat`、`country.mmdb`、`GeoLite2-ASN.mmdb`。
- 规则集：本仓库 `rules/` 目录里的规则文件通过 `GET /rules/<filename>` 提供服务。包括 custom-direct-domain、custom-proxy-domain、pt-direct-domain、misc-direct-domain、japan-services-domain、android-fcm-domain、android-google-play-domain。
- MRS 规则：private、cn、geoip-cn、openai、github 从 `MetaCubeX/meta-rules-dat` 的 GitHub raw URL 拉取。

本项目按“模板”和“规则”分开维护：`templates/` 管三端完整配置模板，`rules/` 只放 `rule-providers` 会拉取的规则文件。规则公开路径继续保持 `/rules/*.list`，避免已经保存到客户端里的规则 URL 失效。

`rule-providers` 默认走默认拨号器更新规则，不绑定具体代理组，避免启动时代理组未就绪导致规则集拉取失败。WebUI 的 `external-ui-url` 在 mihomo 配置里没有独立 `proxy` 字段；如果本地 WebUI 下载失败，可以直接使用在线版 `https://metacubex.github.io/metacubexd/`，后端地址填 `http://127.0.0.1:9090`。

如果有网站需要手动指定直连或代理，写入：

```text
rules/custom-direct-domain.list  # 强制 DIRECT
rules/custom-proxy-domain.list   # 强制走 🚀 节点选择
```

每行一个域名规则：

```text
+.example.com
example.org
```

`+.example.com` 匹配 `example.com` 和它的所有子域名；裸域名只匹配该域名本身。提交并推送后，客户端下次规则集更新会生效。自定义直连/代理规则排在 PT、FCM、Google Play、OpenAI/GitHub、日区、CN 和最终 `MATCH` 前面；同一个域名不要同时放进两个自定义文件，如果重复，直连优先生效。PT/private tracker 这类长期直连规则继续放在 `rules/pt-direct.list`。

Android 模板不需要在生成阶段填变量。Tailscale 出站走交互式登录：首次启动 mihomo 后查看日志，会有一条 `https://login.tailscale.com/...` URL，浏览器打开扫码或登录一次即可，state 持久化到 `state-dir: ./tailscale`，之后启动自动复用，不再需要手动操作。NAS 和 Windows 模板也不需要填变量，并且不包含 Tailscale 出站。

Android 端注意两点：

- Android 客户端内核必须使用 mihomo v1.19.25 或更新版本——对应 ClashMetaForAndroid (cmfa) **2.11.28-alpha 及以上**（cmfa 2.11.28-alpha 内嵌的 mihomo core commit 5e22035 与 v1.19.25 tag 完全一致）。更老的内核要么直接报 `unsupport proxy type: tailscale`，要么虽然能加载配置但日志里反复出现 `tsnet: wgengine: magicsock: Rebind IPv4 failed: failed to bind any ports (tried [0])`——这是 Android 沙箱拒绝 mihomo 进程做 netlink / UDP bind 的内核 bug，已在 v1.19.25 的 `fix: netlink permission denied on android for tailscale` 和 `chore: tailscale using ListenPacket for UDP` 修掉，配置层面绕不过去。
- 关闭系统“私人 DNS”，否则 TUN 的 DNS 劫持可能被绕过。
- `type: tailscale` 出站会在首次命中回家规则时启动，第一次访问 `192.168.1.x` 可能比后续访问慢。
- Tailscale 出站按 mihomo 官方推荐字段组合：`hostname: mihomo-android`、`state-dir: ./tailscale`、`ip-version: dual`，不设 `dialer-proxy`，让 mihomo 用默认拨号器直连 `controlplane.tailscale.com`。`100.100.92.21` 这类地址是 Tailscale 控制面给该 `tsnet` 节点分配的 IP，不需要写进模板。`fake-ip-filter` 已加入 `*.19970626.xyz` 和 `*.tailc1b432.ts.net`，确保 ts.net 域名 / 内网域名走真实解析而不是 fake-ip，否则 tailscale 节点会收到 198.18.x.x 的假地址直接连不上。

线上已经保存过的模板不会被仓库里的新默认模板强行覆盖。代码部署后，打开网页进入模板编辑区，选择 `Android`，点击 `恢复内置模板`，就会把线上保存的 Android 模板同步成仓库里的新版内置模板。

如果要同步 NAS 或 Windows 的新版内置模板，也分别选择对应模板后点击 `恢复内置模板`。

节点注入有两种方式：

```text
{{PROXIES_YAML}}
{{PROXY_NAMES_YAML}}
```

推荐完整模板直接保留顶层 `proxies:` 段。没有 `{{PROXIES_YAML}}` 时，系统会自动把你粘贴的节点插入到顶层 `proxies:` 下面，并保留模板里已有的兜底节点。

## NAS 透明旁路由部署

NAS 模板改为真正的 Linux 透明旁路由：

- `tun.enable: true`、`stack: mixed`、`auto-route: true`、`auto-redirect: true`、`strict-route: true`
- DNS 监听 `0.0.0.0:1053`，`dns-hijack: [any:53, tcp://any:53]`
- `allow-lan: true` 保留 7890 端口供 Docker 容器显式使用

部署方式为**原生 systemd**（root / CAP_NET_ADMIN），不推荐 Docker bridge。

详见 `docs/debian-nas-router.md`。

### 共享变量

内置模板暴露以下可改变量，用来定制家用域名 / Tailnet 域名通配过滤：

| 变量 | 默认值 | 出现位置 |
|---|---|---|
| `HOME_DOMAIN` | `19970626.xyz` | Android / NAS / Windows 的 `fake-ip-filter` 通配；Android 走 `tailscale`，NAS/Windows 走 `DIRECT` |
| `TS_DOMAIN` | `tailc1b432.ts.net` | 仅 Android / Windows；Android 走 `tailscale`，Windows 只做 fake-ip 过滤 |

Fork 此项目时直接改这些变量的 `defaultValue`（`src/core/templates.js`）或者在 t-sub 网页"模板编辑→变量"里覆盖即可，不必再手改 YAML 主体。Android 模板的 `hosts` 表里仍硬编码了具体 IP 映射（`19970626.xyz: 192.168.1.220` 等），那是个人化的内网寻址表，fork 时在 `templates/android.yaml` 里一并替换，然后运行 `npm run templates:generate`。


如果你想精确控制节点插入位置，就在模板里写 `{{PROXIES_YAML}}`。

`{{PROXY_NAMES_YAML}}` 只在你的代理组需要显式列出所有节点名称时使用；如果模板使用 `include-all` 和 `filter`，通常不需要它。

内置占位符：

```text
{{PROFILE_NAME}}
{{GENERATED_AT}}
{{NODE_COUNT}}
```

保存模板后，其他自定义占位符会变成前端变量输入项。占位符名会统一成大写下划线，`{{profileName}}` 和 `{{PROFILE_NAME}}` 等价。例如：

```text
{{DNS_MODE}}
{{dnsMode}}
```

## VLESS 节点解析

节点解析器优先覆盖 VLESS 系列：

- Reality 单节点：`security=reality`、`pbk/publicKey`、`sid/shortId`、`sni/serverName`、`fp/fingerprint`、`alpn`、`packetEncoding`。
- XHTTP 节点：`type=xhttp`、`host`、`path`、`mode`。
- XHTTP CDN + padding：支持 Xray `extra` JSON 里的 `headers`、`noGRPCHeader`、`xPaddingBytes`、`xPaddingObfsMode`、`xPaddingKey`、`xPaddingHeader`、`xPaddingPlacement`、`xPaddingMethod`、`uplinkHttpMethod`、`scMaxEachPostBytes`、`scMinPostsIntervalMs`、`xmux`。
- 上下行分离：支持 `extra.downloadSettings`，可把上行配置为 XHTTP CDN，同时把下行配置为 Reality + XHTTP。

链接里可以用 Xray 的 camelCase 参数，也可以用 mihomo 的 kebab-case 参数。生成 YAML 时会输出为 mihomo 可读的字段，例如 `xhttp-opts`、`download-settings`、`reuse-settings`、`reality-opts`。

## 常见问题

### Cloudflare 让我创建新仓库怎么办

你点到的是 Cloudflare 的模板部署流程。不要用那个流程。回到本 README 顶部，点击“连接当前仓库部署”按钮，然后选择 `Import a repository` 和 `milikii/t-sub`。

### 没看到 `milikii/t-sub` 仓库

重新连接 GitHub，并在仓库权限里选择：

```text
Only select repositories -> milikii/t-sub
```

如果已经授权过 GitHub App，到 GitHub 的 Cloudflare Workers and Pages App 设置里补选这个仓库。

### 部署成功，但网页登录不了

到 Cloudflare 控制台重新设置 `OWNER_PASSWORD`：

```text
Workers & Pages -> t-sub -> Settings -> Variables and Secrets
```

设置后重新部署。

### 一次性链接太快过期

在 Cloudflare 控制台修改：

```text
ONE_TIME_TTL_SECONDS=600
MAX_ONE_TIME_TTL_SECONDS=1800
```

不建议设置太长。链接被 mihomo 拉取前，配置会短期保存在 Durable Object 中。

### mihomo 提示 `cannot unmarshal !!str`

如果错误里看到 `链接已使用` 或 `链接已过期`，说明客户端拿到的不是 YAML，而是一次性链接失效后的提示文本。重新生成一个链接再导入。

当前默认设置允许首次拉取后的 20 秒内最多返回 2 次 YAML，用来兼容客户端导入时的二次请求。超过这个次数或时间后，链接仍会失效。

### 仓库更新后 Cloudflare 会同步吗

会。你 push 到 `master` 后，Cloudflare Git 集成会自动重新部署代码。

但模板内容保存在 Durable Object 里，不会因为部署自动覆盖。需要同步内置模板时，在网页里点击 `恢复内置模板`。

### 想换密码

修改 secret：

```text
OWNER_PASSWORD=你的新密码
```

保存后重新部署。

### 想换 SESSION_SECRET

可以换，但注意：

- 旧登录状态会失效。
- 尚未被拉取的一次性链接会无法解密。

建议没有待消费链接时再换。

## 本地开发备用

正常使用不需要本机部署。只有你要改代码时才需要：

```bash
npm install
npm test
npm run dev
```

本地部署到 Cloudflare 的备用命令：

```bash
npx wrangler login
npx wrangler secret put OWNER_PASSWORD
npx wrangler secret put SESSION_SECRET
npm run deploy
```

## 官方文档

- Cloudflare Git 集成：https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- Wrangler：https://developers.cloudflare.com/workers/wrangler/
- Durable Objects：https://developers.cloudflare.com/durable-objects/
- Worker Secrets：https://developers.cloudflare.com/workers/configuration/secrets/
