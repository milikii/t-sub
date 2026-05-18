# t-sub

私有的一次性 mihomo 配置生成器，部署在 Cloudflare Workers 上。

## 这是做什么的

`t-sub` 用来把你自己的节点临时转换成 mihomo 配置：

1. 打开网页并登录。
2. 一行一个粘贴自建节点。
3. 选择 Android、NAS、Windows 或自定义模板。
4. 生成一次性订阅链接和二维码。
5. mihomo 客户端拉取一次配置。
6. 这个链接立刻失效。

项目只长期保存配置模板，不长期保存节点信息，不做订阅更新。

## 推荐部署方式：连接当前仓库

如果你就是这个仓库的 owner，推荐用这种方式。它会直接连接当前 GitHub 仓库 `milikii/t-sub`，不会创建新仓库。

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
12. 保存并部署。

需要填写的 secrets：

| 名称 | 怎么填 |
| --- | --- |
| `OWNER_PASSWORD` | 网页登录密码。你要的默认密码可以填 `alex007`。 |
| `SESSION_SECRET` | 随机密钥。填一串 32 位以上随机字符，例如 `d5f6a9b4c2e7f1a8d0c3b6e9a4f2c8d1`。 |

部署完成后，Cloudflare 会从这个 GitHub 仓库拉代码。以后你 push 到 `master`，Cloudflare 会自动重新构建和部署。

## Deploy Button 是什么

Cloudflare 的 Deploy Button 不是“直接绑定当前仓库”。它是模板部署入口，会把源码复制到部署者自己的 GitHub/GitLab 账号里，再从那个新仓库部署。

这个按钮适合别人拿这个项目部署自己的副本：

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/milikii/t-sub)

如果你不想创建新仓库，不要用这个按钮，使用上面的“连接当前仓库”方式。

Deploy Button 方式需要填写：

| 名称 | 怎么填 |
| --- | --- |
| `OWNER_PASSWORD` | 网页登录密码。你要的默认密码可以填 `alex007`。 |
| `SESSION_SECRET` | 随机密钥。填一串 32 位以上随机字符，例如 `d5f6a9b4c2e7f1a8d0c3b6e9a4f2c8d1`。 |

部署按钮会根据 `wrangler.toml` 创建并绑定：

- Worker：网页和 API。
- KV namespace：保存配置模板。
- Durable Object：保存一次性配置并负责“读取一次后失效”。
- Secrets：保存 `OWNER_PASSWORD` 和 `SESSION_SECRET`。

这两种部署方式都不需要你在本机运行 `npm install`、`wrangler login`、`wrangler deploy`。

## 部署后怎么用

部署完成后，Cloudflare 会给你一个访问地址，通常类似：

```text
https://t-sub.<你的账号>.workers.dev
```

打开这个地址：

1. 密码输入你部署时填写的 `OWNER_PASSWORD`，例如 `alex007`。
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
| KV Namespace | `TEMPLATES` | 保存配置模板 |
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

每个模板必须包含：

```text
{{PROXIES_YAML}}
{{PROXY_NAMES_YAML}}
```

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

### 点按钮后没有提示填写密码

确认仓库里存在 `.dev.vars.example`。Cloudflare Deploy Button 会读取这个文件并提示填写 secrets。

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
npm run cf:setup
npx wrangler secret put OWNER_PASSWORD
npx wrangler secret put SESSION_SECRET
npm run deploy
```

## 官方文档

- Cloudflare Deploy Button：https://developers.cloudflare.com/workers/tutorials/deploy-button/
- Wrangler：https://developers.cloudflare.com/workers/wrangler/
- KV：https://developers.cloudflare.com/kv/
- Durable Objects：https://developers.cloudflare.com/durable-objects/
- Worker Secrets：https://developers.cloudflare.com/workers/configuration/secrets/
