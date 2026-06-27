# Debian NAS 透明旁路由部署

本文档说明如何将 mihomo 作为透明旁路由部署在 Debian NAS 上。

## 适用场景

- NAS 上运行 mihomo，为局域网提供透明代理
- 不需要 Docker bridge
- 不需要旁路由专用设备
- 在同一台 Debian 上同时运行 NAS 服务和 mihomo

## 工作原理

NAS 模板（`nas-debian.yaml`）配置 mihomo 开启 TUN 模式，接管本机所有流量：
- TUN 设备拦截出站流量，按 MRS-first 规则分流
- DNS 监听 `0.0.0.0:1053`，接受局域网 DNS 转发
- `allow-lan: true` + `mixed-port: 7890` 保留给 Docker 容器显式使用

## 为什么不是 Docker Bridge

mihomo 的 **TUN + auto-route** 模式需要在主机网络命名空间中创建 TUN 设备和操作路由表。Docker bridge 网络模式下：

1. **TUN 设备在容器内创建**，对宿主机不可见。auto-route 只会修改容器内的路由表，不会影响宿主机或局域网。
2. **auto-redirect / 透明代理需要 root net namespace**，Docker bridge 容器默认没有这个能力。
3. **DNS 劫持**需要主机级别干预。

即使配合 `network_mode: host` 可以工作，也失去了 Docker 网络隔离的意义。因此使用**原生 systemd 安装**。

## 前提条件

- Debian 系统（11/12）
- root 权限（TUN 需要 CAP_NET_ADMIN）
- 网络接口能接入局域网

## 1. 安装 mihomo 原生二进制

```bash
# 以 amd64 为例，根据架构替换
MIHOMO_VERSION="1.19.25"
wget "https://github.com/MetaCubeX/mihomo/releases/download/v${MIHOMO_VERSION}/mihomo-linux-amd64-v${MIHOMO_VERSION}.gz"
gunzip mihomo-linux-amd64-v${MIHOMO_VERSION}.gz
chmod +x mihomo-linux-amd64-v${MIHOMO_VERSION}
sudo mv mihomo-linux-amd64-v${MIHOMO_VERSION} /usr/local/bin/mihomo
```

## 2. 配置目录

```bash
sudo mkdir -p /etc/mihomo/ruleset/local
sudo mkdir -p /etc/mihomo/ruleset/meta
sudo mkdir -p /var/lib/mihomo
```

- `/etc/mihomo/config.yaml` — 主配置
- `/etc/mihomo/ruleset/local/` — 本地 text 规则文件（由 t-sub Worker 托管）
- `/etc/mihomo/ruleset/meta/` — 远程 MRS 规则文件（由 mihomo 自动下载）
- `/var/lib/mihomo/` — mihomo 运行时数据

## 3. systemd unit

```bash
sudo tee /etc/systemd/system/mihomo.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=mihomo transparent proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/mihomo -d /etc/mihomo
Restart=always
RestartSec=5
LimitNOFILE=65536
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW

[Install]
WantedBy=multi-user.target
SERVICEEOF

sudo systemctl daemon-reload
```

## 4. 权限说明

mihomo TUN 模式需要：
- **root 运行**，或
- **CAP_NET_ADMIN**：创建和管理 TUN 设备，设置路由
- **CAP_NET_BIND_SERVICE**：绑定低端口（如 53）
- **CAP_NET_RAW**：原始套接字

## 5. sysctl

```bash
# 临时生效
sudo sysctl -w net.ipv4.ip_forward=1

# 永久生效
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 可选：IPv6 转发
echo "net.ipv6.conf.all.forwarding=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6. DNS 配置

mihomo DNS 监听 `0.0.0.0:1053`。需要把 LAN 的 53 端口转发到 1053。

### dnsmasq（推荐）

```bash
# 编辑 /etc/dnsmasq.conf
server=127.0.0.1#1053
# 或监听所有接口，把 LAN DNS 转发到 1053：
# server=/#/127.0.0.1#1053
# no-resolv

sudo systemctl restart dnsmasq
```

也可以在路由器 DHCP 设置中直接分配 DNS 为 NAS IP。

### 直接监听 53

如果你确认端口和权限没有问题，也可以把 mihomo DNS 直接改成：

```yaml
dns:
  listen: 0.0.0.0:53
```

需要移除 systemd unit 的 `CapabilityBoundingSet` 限制，或用 root 运行。

## 7. 部署配置

从 t-sub 网页生成配置，保存到 `/etc/mihomo/config.yaml`：

```bash
# 从一次性链接拉取
curl -sSL "https://your-t-sub.workers.dev/s/TOKEN" | sudo tee /etc/mihomo/config.yaml
```

首次启动 mihomo 后，它会自动从 `MetaCubeX/meta-rules-dat` 下载 MRS 规则文件到 `/etc/mihomo/ruleset/meta/`。

## 8. 启动 mihomo

```bash
sudo systemctl enable mihomo
sudo systemctl start mihomo
sudo journalctl -u mihomo -f
```

## 9. LAN 客户端设置

局域网其他设备将网关和 DNS 指向这台 NAS 的 IP。

示例（假设 NAS IP 为 `192.168.1.100`）：

| 设置 | 值 |
|------|-----|
| IP 地址 | DHCP 或静态 |
| 子网掩码 | 255.255.255.0 |
| 网关 | 192.168.1.100 |
| DNS | 192.168.1.100 |

推荐在路由器 DHCP 设置中推送网关和 DNS，所有设备自动生效。

## 10. 验证

```bash
# 检查 mihomo 状态
sudo journalctl -u mihomo -n 50 --no-pager

# 检查 TUN 设备
ip link show utun

# 检查路由规则
ip route
ip rule

# 检查 nftables 规则
nft list ruleset

# 检查 mihomo HTTP 代理
curl -x http://127.0.0.1:7890 https://cp.cloudflare.com/generate_204

# 在 LAN 客户端上检查：
curl -s ifconfig.me          # 出口 IP
curl -s https://www.baidu.com -o /dev/null -w "%{http_code}"   # 国内直连
curl -s https://www.amazon.co.jp -o /dev/null -w "%{http_code}" # 日本出口
```

## 11. 注意事项

- MRS 规则文件由 mihomo 客户端根据 `rule-provider` 的 `interval` 自动更新，无需手动下载
- 日本强制规则：`japan-services-domain.list` 是主规则，`jp_ip.mrs` 是兜底。如果 `jp_ip` 误伤非日本 IP，可删除 `jp_ip` provider 和对应 RULE-SET
- `jp_ip` 和 `cn_ip` 默认使用 `no-resolve`。如果希望「域名未命中时再按解析 IP 判断」，可以移除 `no-resolve`
- NAS 模板 fake-ip-filter 使用 `fake-ip-filter-common-domain.list` + `fake-ip-filter-home-domain.list`，需要 `HOME_DOMAIN` 变量（默认 `19970626.xyz`），不需要 `TS_DOMAIN`
- NAS 模板不包含 tailscale 出站，不需要 `TS_DOMAIN`
- 如果防火墙阻挡了 1053 端口的入站 UDP/TCP，LAN 客户端 DNS 解析会失败
- 不建议在生产 NAS（存有重要数据）上作为实验性功能开启

## 12. 回滚

```bash
# 1. LAN 客户端网关改回主路由
# 2. 停止并禁用 mihomo
sudo systemctl stop mihomo
sudo systemctl disable mihomo

# 3. 恢复 DNS
sudo systemctl restart dnsmasq

# 4. 恢复 sysctl（如果不需要转发）
# 编辑 /etc/sysctl.conf，删除 net.ipv4.ip_forward=1，然后：
sudo sysctl -p

# 5. 确认 TUN 设备已移除
ip link show utun 2>&1 || echo "TUN 已移除"
```
