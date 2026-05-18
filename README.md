# t-sub

私有的一次性 mihomo 配置生成器，运行在 Cloudflare Workers 上。

`t-sub` 的工作流是：登录网页，粘贴自建节点，选择或编辑 mihomo YAML 模板，生成一次性订阅 URL 和二维码，然后让 mihomo 客户端拉取一次配置。模板会持久保存；节点不会进入长期存储，只会短期加密保存在 Durable Object 中，链接被拉取一次或过期后失效。

## 功能

- 只有站主能登录的 Web UI。
- 模板 CRUD，内置 Android、NAS、Windows 模板，也可以新建自定义模板。
- 支持常见 `ss`、`vmess`、`vless`、`trojan`、`hysteria2` 节点 URI。
- 一次性 `/s/:token` 配置链接由 Durable Object 管理。
- `HEAD /s/:token` 不会消费链接，方便客户端探测。
- 第一次 `GET /s/:token` 返回 mihomo YAML。
- 第二次及之后 `GET /s/:token` 返回 `410 Gone`。
- 不提供订阅更新、不保存节点库存、不生成长期公开订阅链接。

## 架构

- Cloudflare Worker：提供网页、API、一次性订阅入口。
- Cloudflare KV：只保存配置模板。
- Cloudflare Durable Object：保存一次性配置状态，负责首次读取后失效。
- Worker Secrets：保存登录密码哈希和会话加密密钥。
- 前端：纯静态 HTML/CSS/JS，由 Worker 直接返回，无单独构建步骤。

`wrangler.toml` 里已经配置好 Worker 入口、KV binding、Durable Object binding 和 Durable Object migration。第一次部署前只需要把你的 Cloudflare KV namespace ID 写进去。

## Cloudflare 部署

### 1. 准备环境

需要：

- Node.js 22+
- 一个 Cloudflare 账号
- 本地可以运行 `npm` 和 `npx`

安装依赖：

```bash
npm install
```

登录 Cloudflare：

```bash
npx wrangler login
```

确认登录成功：

```bash
npx wrangler whoami
```

### 2. 创建 KV namespace

本项目的模板保存在 KV binding `TEMPLATES`。直接运行：

```bash
npm run cf:setup
```

这个脚本会做三件事：

- 创建生产 KV namespace：`npx wrangler kv namespace create TEMPLATES`
- 创建本地预览 KV namespace：`npx wrangler kv namespace create TEMPLATES --preview`
- 自动把生成的 `id` 和 `preview_id` 写入 `wrangler.toml`

如果你想手动配置，也可以在 Cloudflare 控制台创建 KV namespace，然后把 ID 填到：

```toml
[[kv_namespaces]]
binding = "TEMPLATES"
id = "你的生产 KV namespace ID"
preview_id = "你的 preview KV namespace ID"
```

KV namespace ID 不是密码，但它是账号相关配置。个人项目里提交也可以；如果多人共用代码仓库，建议每个环境单独维护自己的 `wrangler.toml` 或 Cloudflare 环境配置。

### 3. 确认 Durable Object 设置

`wrangler.toml` 已经包含一次性配置需要的 Durable Object：

```toml
[[durable_objects.bindings]]
name = "ONE_TIME_CONFIGS"
class_name = "OneTimeConfig"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["OneTimeConfig"]
```

这里使用 SQLite-backed Durable Object。第一次 `npm run deploy` 时 Wrangler 会把 migration 应用到 Cloudflare。不要删除这段配置；否则一次性链接无法严格做到“读取一次后失效”。

### 4. 设置登录密码

生成密码哈希：

```bash
npm run hash-password -- "你的登录密码"
```

输出类似：

```text
sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

把这个完整的 `sha256:...` 写入 Worker secret：

```bash
npx wrangler secret put OWNER_PASSWORD_HASH
```

Wrangler 提示输入 value 时，粘贴刚才的 `sha256:...`。

`OWNER_PASSWORD_HASH` 是网页登录密码的哈希。不要把真实密码或 `.dev.vars` 提交到 Git。

### 5. 设置 SESSION_SECRET

生成一个随机密钥：

```bash
openssl rand -hex 32
```

写入 Worker secret：

```bash
npx wrangler secret put SESSION_SECRET
```

`SESSION_SECRET` 用于签名登录 cookie，也用于加密 Durable Object 里短期保存的一次性配置。建议至少 32 个随机字符。

### 6. 设置公开访问域名

默认情况下，生成的一次性链接会使用当前请求的域名。大多数情况可以保持：

```toml
[vars]
PUBLIC_BASE_URL = ""
```

如果你绑定了自定义域名，建议显式写成：

```toml
[vars]
PUBLIC_BASE_URL = "https://你的域名"
```

Cloudflare 控制台路径：

```text
Workers & Pages -> t-sub -> Settings -> Domains & Routes
```

可以在这里添加自定义域名。加了自定义域名后，把 `PUBLIC_BASE_URL` 改成这个域名再部署。

### 7. 部署前检查

运行测试：

```bash
npm test
```

检查 Cloudflare 打包配置：

```bash
npx wrangler deploy --dry-run
```

如果看到 `REPLACE_WITH_TEMPLATES_KV_ID`，说明你还没有运行 `npm run cf:setup`。

### 8. 正式部署

```bash
npm run deploy
```

`npm run deploy` 会先运行 `scripts/check-deploy-ready.mjs`。如果 KV ID 还是占位符，部署会被拦住并提示你先运行 `npm run cf:setup`。

部署成功后，Wrangler 会输出访问地址，通常类似：

```text
https://t-sub.<你的 workers 子域>.workers.dev
```

打开这个地址，输入你的登录密码，进入管理界面。

### 9. Cloudflare 控制台应看到的设置

部署完成后，可以在 Cloudflare 控制台检查：

```text
Workers & Pages -> t-sub
```

需要存在这些配置：

- Settings -> Bindings -> KV Namespace：变量名 `TEMPLATES`
- Settings -> Bindings -> Durable Object：变量名 `ONE_TIME_CONFIGS`，class `OneTimeConfig`
- Settings -> Variables and Secrets -> Secrets：`OWNER_PASSWORD_HASH`
- Settings -> Variables and Secrets -> Secrets：`SESSION_SECRET`
- Settings -> Variables and Secrets -> Environment Variables：`PUBLIC_BASE_URL` 以及 TTL/大小限制变量

当前默认非 secret 变量：

```toml
SESSION_TTL_SECONDS = "86400"
ONE_TIME_TTL_SECONDS = "300"
MAX_ONE_TIME_TTL_SECONDS = "900"
MAX_NODES_BYTES = "65536"
MAX_RENDERED_BYTES = "131072"
```

含义：

- `SESSION_TTL_SECONDS`：登录 cookie 有效期，默认 1 天。
- `ONE_TIME_TTL_SECONDS`：一次性订阅默认有效期，默认 5 分钟。
- `MAX_ONE_TIME_TTL_SECONDS`：一次性订阅最大有效期，默认 15 分钟。
- `MAX_NODES_BYTES`：节点输入最大体积。
- `MAX_RENDERED_BYTES`：生成的 YAML 最大体积。

### 10. 验证一次性订阅

部署后按这个顺序测试：

1. 打开 Worker URL。
2. 输入密码登录。
3. 在节点框粘贴一行自建节点。
4. 选择 Android、NAS 或 Windows 模板。
5. 点击生成。
6. 用 mihomo 客户端扫码或复制 URL 拉取配置。
7. 再访问同一个 URL，应该返回 `410 Gone`。

这说明一次性链接已经被消费，节点配置不会继续暴露。

### 11. 更新部署

以后改代码后：

```bash
npm install
npm test
npm run deploy
```

不需要重新创建 KV，也不需要重新设置 secrets。只有你要换登录密码、换会话密钥、换域名时，才需要重新执行对应步骤。

换密码：

```bash
npm run hash-password -- "新密码"
npx wrangler secret put OWNER_PASSWORD_HASH
```

换 `SESSION_SECRET` 会让旧登录 cookie 失效，也会让未消费的一次性配置无法解密。建议只在没有待消费链接时更换。

### 12. 常见问题

`Cloudflare deploy is not ready: KV namespace IDs are still placeholders.`

运行：

```bash
npm run cf:setup
```

`You are not authenticated. Please run wrangler login.`

运行：

```bash
npx wrangler login
```

登录后再执行部署命令。

网页能打开，但登录失败。

重新生成密码哈希并覆盖 secret：

```bash
npm run hash-password -- "你的密码"
npx wrangler secret put OWNER_PASSWORD_HASH
```

生成的二维码或订阅 URL 域名不对。

设置 `PUBLIC_BASE_URL` 为你的正式域名，然后重新部署。

一次性链接还没用就失效。

默认有效期是 300 秒。可以在 `wrangler.toml` 里调大：

```toml
ONE_TIME_TTL_SECONDS = "600"
MAX_ONE_TIME_TTL_SECONDS = "1800"
```

不要设置太长，否则一次性配置在被消费前会更久地保留在 Durable Object 中。

### 13. 官方文档

- Wrangler CLI：https://developers.cloudflare.com/workers/wrangler/
- Wrangler Worker commands：https://developers.cloudflare.com/workers/wrangler/commands/workers/
- KV namespace commands：https://developers.cloudflare.com/workers/wrangler/commands/kv/
- KV bindings：https://developers.cloudflare.com/kv/concepts/kv-namespaces/
- Durable Object migrations：https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- Worker secrets：https://developers.cloudflare.com/workers/configuration/secrets/

## 本地开发

复制本地环境变量示例：

```bash
cp .dev.vars.example .dev.vars
```

填写：

- `OWNER_PASSWORD_HASH`
- `SESSION_SECRET`
- `PUBLIC_BASE_URL`

启动本地 Worker：

```bash
npm run dev
```

打开 Wrangler 输出的地址，通常是 `http://127.0.0.1:8787`。

## 模板占位符

每个模板必须包含：

- `{{PROXIES_YAML}}`
- `{{PROXY_NAMES_YAML}}`

内置占位符：

- `{{PROFILE_NAME}}`
- `{{GENERATED_AT}}`
- `{{NODE_COUNT}}`

保存模板后，其他大写占位符会变成前端变量输入项。例如 `{{DNS_MODE}}`。

## 测试

```bash
npm test
```

当前测试覆盖：

- 登录密码和 session 辅助函数。
- 常见节点 URI 解析。
- 模板渲染和未解析变量校验。
- Worker 路由、登录、渲染、一次性链接消费流程。

## 说明

Cloudflare KV 只用于保存模板。一次性配置交付使用 Durable Object，因为“严格读取一次后失效”需要比 KV 更强的一致性边界。
