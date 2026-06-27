# Debian NAS 透明旁路由部署

本文档说明如何将 mihomo 作为透明旁路由部署在 Debian NAS 上。

## 工作原理

NAS 模板 (`nas-debian.yaml`) 配置 mihomo 开启 TUN 模式，接管本机所有流量：
- TUN 设备拦截出站流量，按规则分流
- DNS 监听 `0.0.0.0:1053`，接受局域网 DNS 转发
- `allow-lan: true` 允许 Docker 容器通过 `7890` 端口显式使用代理
- `mixed-port: 7890` 保留给需要显式代理的场景

## 前提条件

- Debian 系统（11/12）
- root 权限（TUN 需要）
- 网络接口能接入局域网

## 1. 使用 mihomo 原生 Systemd 安装

```bash
# 下载 mihomo 二进制（以 amd64 为例，根据架构替换）
MIHOMO_VERSION="1.19.25"
wget "https://github.com/MetaCubeX/mihomo/releases/download/v${MIHOMO_VERSION}/mihomo-linux-amd64-v${MIHOMO_VERSION}.gz"
gunzip mihomo-linux-amd64-v${MIHOMO_VERSION}.gz
chmod +x mihomo-linux-amd64-v${MIHOMO_VERSION}
sudo mv mihomo-linux-amd64-v${MIHOMO_VERSION} /usr/local/bin/mihomo

# 创建配置目录
sudo mkdir -p /etc/mihomo/ruleset

# 创建 systemd 服务
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

## 2. 权限说明

mihomo TUN 模式需要：
- **CAP_NET_ADMIN**：创建和管理 TUN 设备，设置路由
- **CAP_NET_BIND_SERVICE**：绑定低端口（如 53）
- **CAP_NET_RAW**：原始套接字
- **root 用户**或 systemd `AmbientCapabilities`

## 3. 启用 IP 转发

```bash
# 临时生效
sudo sysctl -w net.ipv4.ip_forward=1

# 永久生效
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 4. DNS 配置

mihomo DNS 监听 `0.0.0.0:1053`。将系统 DNS 转发到这个端口：

### 方法一：修改 dnsmasq（推荐，如果 dnsmasq 已运行）

```bash
# 编辑 /etc/dnsmasq.conf，添加：
# server=/lan/1053
# server=/local/1053
# server=/#/127.0.0.1#1053
# no-resolv

sudo systemctl restart dnsmasq
```

### 方法二：直接修改 /etc/resolv.conf

```bash
# 将 nameserver 指向本机 1053
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
# 注意：某些系统会覆盖这个文件，需要设置不可变属性
sudo chattr +i /etc/resolv.conf
```

### 方法三：使用 systemd-resolved

```bash
# 编辑 /etc/systemd/resolved.conf
# [Resolve]
# DNS=127.0.0.1#1053

sudo systemctl restart systemd-resolved
```

## 5. 部署配置

从 t-sub 网页生成配置，保存到 `/etc/mihomo/config.yaml`：

```bash
curl -sSL "https://your-t-sub.workers.dev/s/TOKEN" | sudo tee /etc/mihomo/config.yaml
```

首次启动 mihomo 后，它会自动下载 MRS 规则文件到 `/etc/mihomo/ruleset/`。

## 6. 启动 mihomo

```bash
sudo systemctl enable mihomo
sudo systemctl start mihomo
sudo journalctl -u mihomo -f
```

## 7. LAN 客户端配置

局域网其他设备将网关和 DNS 指向这台 NAS 的 IP 即可使用透明代理。

### 示例（假设 NAS IP 为 192.168.1.100）：

| 设置 | 值 |
|------|-----|
| IP 地址 | DHCP 或静态 |
| 子网掩码 | 255.255.255.0 |
| 网关 | 192.168.1.100 |
| DNS | 192.168.1.100 |

### 路由器 DHCP 推送（推荐）

在路由器 DHCP 设置中将网关和 DNS 选项指向 NAS IP。这样所有设备自动生效，无需逐个配置。

## 8. 避免 NAS 自身代理回环

TUN 配置中的 `route-exclude-address` 排除了 RFC1918 私有地址段：

```yaml
route-exclude-address:
  - 127.0.0.0/8
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16
```

这样局域网流量不会经过 TUN，避免了回环。同时 `auto-detect-interface` 自动检测物理接口，确保 TUN 流量走正确的网卡。

外部（公网）流量仍然正常通过 TUN 进行代理。

## 9. 验证旁路由生效

```bash
# 检查 mihomo 日志
sudo journalctl -u mihomo -n 50 --no-pager

# 检查 TUN 设备
ip link show utun

# 检查路由表
ip route show table all | grep -E "utun|mihomo"

# 在 LAN 客户端上检查 IP
curl -s ifconfig.me

# 检查 DNS 解析
nslookup google.com 192.168.1.100

# 检查国内网站直连
curl -s https://www.baidu.com -o /dev/null -w "%{http_code}"
```

## 10. 回滚

```bash
# 停止并禁用 mihomo
sudo systemctl stop mihomo
sudo systemctl disable mihomo

# 恢复系统 DNS
# 如果改了 resolv.conf，恢复
echo "nameserver 223.5.5.5" | sudo tee /etc/resolv.conf
sudo chattr -i /etc/resolv.conf

# 重启 dnsmasq/systemd-resolved
sudo systemctl restart dnsmasq || sudo systemctl restart systemd-resolved

# 确认 TUN 设备已移除
ip link show utun 2>&1 || echo "TUN removed"

# 恢复 IP 转发（如果在回滚局域网透明代理）
# 如果只想关闭而不用回滚，保持 ip_forward=1 不影响本机使用
```

## 11. 为什么不直接用 Docker Bridge

mihomo 的 **TUN + auto-route** 模式需要在主机网络命名空间中创建 TUN 设备和操作路由表。Docker bridge 网络模式下，容器使用独立的网络命名空间：

1. **TUN 设备在容器内创建**，对宿主机不可见。auto-route 只会修改容器内的路由表，不会影响宿主机或局域网。
2. **auto-redirect / 透明代理需要 root net namespace**，Docker bridge 容器默认没有这个能力。
3. **DNS 劫持**需要主机级别干预。
4. 即使配合 `network_mode: host` 可以工作，也失去了 Docker 网络隔离的意义。

因此本部署方式使用 **原生 systemd 安装**，mihomo 直接在宿主机上运行。Docker 容器需要代理时，通过 `7890` mixed-port 显式配置 HTTP/SOCKS 代理。

## 12. 注意事项

- mihomo TUN 模式会在本机创建 utun 设备，配置路由规则。这不会影响已有 Docker 容器网络。
- 确保 mihomo 配置目录的规则集定期更新（通过 rule-provider 的 interval）。
- 如果局域网客户端无法解析域名，检查防火墙是否放行了 1053 端口的 UDP/TCP 入站。
- 不建议在生产 NAS（存有重要数据）上作为实验性功能开启。
