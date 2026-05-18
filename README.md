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
| `MAX_NODES_BYTES` | `65536` | 节点输入最大体积 |
| `MAX_RENDERED_BYTES` | `131072` | 生成 YAML 最大体积 |

## 模板占位符

节点注入有两种方式：

```text
{{PROXIES_YAML}}
{{PROXY_NAMES_YAML}}
```

推荐完整模板直接保留顶层 `proxies:` 段。没有 `{{PROXIES_YAML}}` 时，系统会自动把你粘贴的节点插入到顶层 `proxies:` 下面，并保留模板里已有的兜底节点。

如果你想精确控制节点插入位置，就在模板里写 `{{PROXIES_YAML}}`。

`{{PROXY_NAMES_YAML}}` 只在你的代理组需要显式列出所有节点名称时使用；如果模板使用 `include-all` 和 `filter`，通常不需要它。

内置占位符：

```text
{{PROFILE_NAME}}
{{GENERATED_AT}}
{{NODE_COUNT}}
```

保存模板后，其他大写占位符会变成前端变量输入项。例如：

```text
{{DNS_MODE}}
```

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
