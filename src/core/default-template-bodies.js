export const ANDROID_TEMPLATE_BODY = `mixed-port: 7890
allow-lan: false
bind-address: '*'
mode: rule
log-level: info
ipv6: false
external-controller: 127.0.0.1:9090
external-ui: ./ui
external-ui-url: https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip
secret: ""
unified-delay: true
tcp-concurrent: true
geodata-mode: true
geo-auto-update: true
geo-update-interval: 24
geox-url:
  geoip: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat
  geosite: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat
  mmdb: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb
  asn: https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb
profile:
  store-selected: true
  store-fake-ip: true
hosts:
  19970626.xyz: 192.168.2.220
  '*.19970626.xyz': 192.168.2.220
  nas.tailc1b432.ts.net: 100.118.67.82
  vivo.tailc1b432.ts.net: 100.94.59.105
sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  sniff:
    HTTP:
      ports:
        - 80
        - 8080-8880
      override-destination: true
    TLS:
      ports:
        - 443
        - 8443
    QUIC:
      ports:
        - 443
        - 8443
tun:
  enable: true
  stack: mixed
  auto-route: true
  strict-route: true
  auto-detect-interface: true
  route-address:
    - 0.0.0.0/0
  dns-hijack:
    - any:53
dns:
  enable: true
  listen: 127.0.0.1:1053
  ipv6: false
  respect-rules: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - '*.lan'
    - '*.local'
    - '*.19970626.xyz'
    - '*.tailc1b432.ts.net'
    - connectivitycheck.gstatic.com
    - connectivitycheck.android.com
    - time.android.com
    - localhost.ptlogin2.qq.com
    - +.srv.nintendo.net
    - +.stun.playstation.net
    - dns.msftncsi.com
    - +.msftconnecttest.com
    - +.msftncsi.com
    - +.xboxlive.com
    - '*.battlenet.com.cn'
    - '*.battlenet.com'
    - '*.blzstatic.cn'
    - '*.battle.net'
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver-follow-policy: true
  nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query
  fallback:
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
    - https://dns.google/dns-query
    - https://cloudflare-dns.com/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
    domain:
      - +.google.com
      - +.facebook.com
      - +.youtube.com
      - +.twitter.com
      - +.github.com
  nameserver-policy:
    geosite:cn:
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    geosite:private:
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    geosite:geolocation-!cn:
      - https://1.1.1.1/dns-query
      - https://8.8.8.8/dns-query
    geosite:google:
      - https://8.8.8.8/dns-query
      - https://dns.google/dns-query
    geosite:github:
      - https://1.1.1.1/dns-query
      - https://cloudflare-dns.com/dns-query
    geosite:openai:
      - https://1.1.1.1/dns-query
      - https://8.8.8.8/dns-query
    geosite:telegram:
      - https://1.1.1.1/dns-query
      - https://8.8.8.8/dns-query
rule-providers:
  pt-direct:
    type: http
    behavior: domain
    format: text
    path: ./ruleset/pt-direct.list
    url: https://raw.githubusercontent.com/milikii/t-sub/master/rules/pt-direct.list
    interval: 86400
  fcm-domain:
    type: http
    behavior: domain
    format: text
    path: ./ruleset/fcm-domain.list
    url: https://raw.githubusercontent.com/milikii/t-sub/master/rules/fcm-domain.list
    interval: 86400
  fcm-ipcidr:
    type: http
    behavior: ipcidr
    format: text
    path: ./ruleset/fcm-ipcidr.list
    url: https://raw.githubusercontent.com/milikii/t-sub/master/rules/fcm-ipcidr.list
    interval: 86400

# 订阅转换基础模板。生成配置时会把节点插入到这里。
# Android 端内置 mihomo tailscale 出站，用于访问家里 192.168.1.x 内网。
# 首次启动会在 mihomo 日志里打印 https://login.tailscale.com/... 登录 URL，
# 浏览器登录一次即可，state 持久化到 state-dir，无需重复登录或配置 auth-key。
proxies:
  - name: tailscale
    type: tailscale
    hostname: mihomo-android
    control-url: https://controlplane.tailscale.com
    state-dir: ./tailscale
    ephemeral: false
    udp: true
    accept-routes: true
    exit-node-allow-lan-access: true
    ip-version: dual

proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ⚡ 自动选择
      - 🇺🇸 美国节点
      - 🇯🇵 日本节点
      - 🏠 回家
      - DIRECT
  - name: ⚡ 自动选择
    type: url-test
    include-all: true
    filter: (?i)(^|[^a-z])(us|jp)([^a-z]|$)|美国|美國|日本|United States|USA|Japan|Tokyo|Osaka|Los Angeles|San Jose|Seattle|Dallas|Chicago|New York|东京|大阪
    exclude-filter: (?i)(nas|回家|home|tailscale|direct)
    url: https://cp.cloudflare.com/generate_204
    interval: 300
    tolerance: 50
  - name: 🇺🇸 美国节点
    type: select
    proxies:
      - DIRECT
    include-all: true
    filter: (?i)(^|[^a-z])us([^a-z]|$)|美国|美國|USA|United States|America|Los Angeles|San Jose|Seattle|Dallas|Chicago|New York
    url: https://cp.cloudflare.com/generate_204
    interval: 300
  - name: 🇯🇵 日本节点
    type: select
    proxies:
      - DIRECT
    include-all: true
    filter: (?i)(^|[^a-z])jp([^a-z]|$)|日本|Japan|Tokyo|Osaka|东京|大阪
    url: https://cp.cloudflare.com/generate_204
    interval: 300
  - name: 🏠 回家
    type: select
    proxies:
      - tailscale
      - DIRECT
    url: https://www.baidu.com/favicon.ico
    interval: 300
  - name: 📲 谷歌推送
    type: select
    proxies:
      - 🚀 节点选择
      - ⚡ 自动选择
      - 🇺🇸 美国节点
      - 🇯🇵 日本节点
      - DIRECT

rules:
  - DOMAIN-SUFFIX,19970626.xyz,tailscale
  - DOMAIN,nas.tailc1b432.ts.net,tailscale
  - DOMAIN,vivo.tailc1b432.ts.net,tailscale
  - DOMAIN-SUFFIX,lan,tailscale
  - DOMAIN-SUFFIX,local,tailscale
  - DOMAIN-SUFFIX,localhost,DIRECT
  - IP-CIDR,192.168.1.0/24,tailscale,no-resolve
  - IP-CIDR,192.168.2.0/24,tailscale,no-resolve
  - IP-CIDR,100.64.0.0/10,tailscale,no-resolve
  - RULE-SET,fcm-domain,📲 谷歌推送
  - RULE-SET,fcm-ipcidr,📲 谷歌推送,no-resolve
  - RULE-SET,pt-direct,DIRECT
  - GEOSITE,openai,🇺🇸 美国节点
  - GEOSITE,github,🇺🇸 美国节点
  - DOMAIN-SUFFIX,jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,co.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,ne.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,or.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,go.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,ac.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,ed.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,abema.tv,🇯🇵 日本节点
  - DOMAIN-SUFFIX,dmm.com,🇯🇵 日本节点
  - DOMAIN-SUFFIX,niconico.com,🇯🇵 日本节点
  - DOMAIN-SUFFIX,nicovideo.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,tver.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,radiko.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,pixiv.net,🇯🇵 日本节点
  - DOMAIN-SUFFIX,mercari.com,🇯🇵 日本节点
  - DOMAIN-SUFFIX,line.me,🇯🇵 日本节点
  - GEOSITE,ABEMA,🇯🇵 日本节点
  - GEOSITE,CATEGORY-BANK-JP,🇯🇵 日本节点
  - GEOSITE,CATEGORY-NTP-JP,🇯🇵 日本节点
  - GEOSITE,PURIKONEJP,🇯🇵 日本节点
  - GEOSITE,NICONICO,🇯🇵 日本节点
  - GEOSITE,PIXIV,🇯🇵 日本节点
  - GEOSITE,RADIKO,🇯🇵 日本节点
  - GEOSITE,TVER,🇯🇵 日本节点
  - GEOSITE,LINE,🇯🇵 日本节点
  - GEOSITE,cn,DIRECT
  - GEOIP,CN,DIRECT,no-resolve
  - MATCH,🚀 节点选择
`;

export const NAS_TEMPLATE_BODY = defaultTemplateBody({
  allowLan: true,
  ipv6: false,
  logLevel: "info",
  findProcessMode: "off",
  lanAllowedIps: [
    "192.168.0.0/16",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "100.64.0.0/10",
  ],
});

export const WINDOWS_TEMPLATE_BODY = `${defaultTemplateBody({ allowLan: false, ipv6: false, logLevel: "info" })}
external-controller: 127.0.0.1:9090
`;

function defaultTemplateBody({ allowLan, ipv6, logLevel, findProcessMode = "strict", lanAllowedIps = [] }) {
  const lanAllowedIpsYaml = renderLanAllowedIps(lanAllowedIps);
  return `# {{PROFILE_NAME}} 生成于 {{GENERATED_AT}}
mixed-port: 7890
allow-lan: ${allowLan}
bind-address: '*'
${lanAllowedIpsYaml ? `${lanAllowedIpsYaml}\n` : ""}ipv6: ${ipv6}
mode: rule
log-level: ${logLevel}
find-process-mode: ${findProcessMode}
unified-delay: true
tcp-concurrent: true
geodata-mode: true
profile:
  store-selected: true
  store-fake-ip: true
dns:
  enable: true
  listen: 127.0.0.1:1053
  ipv6: ${ipv6}
  respect-rules: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - '*.lan'
    - '*.local'
    - localhost
    - localhost.ptlogin2.qq.com
    - dns.msftncsi.com
    - +.msftconnecttest.com
    - +.msftncsi.com
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  proxy-server-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
  direct-nameserver-follow-policy: true
  nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query
  fallback:
    - https://1.1.1.1/dns-query
    - https://8.8.8.8/dns-query
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 240.0.0.0/4
      - 0.0.0.0/32
  nameserver-policy:
    geosite:cn:
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    geosite:private:
      - https://doh.pub/dns-query
      - https://dns.alidns.com/dns-query
    geosite:geolocation-!cn:
      - https://1.1.1.1/dns-query
      - https://8.8.8.8/dns-query
    geosite:openai:
      - https://1.1.1.1/dns-query
      - https://8.8.8.8/dns-query
    geosite:github:
      - https://1.1.1.1/dns-query
      - https://cloudflare-dns.com/dns-query

proxies:
{{PROXIES_YAML}}

proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ⚡ 自动选择
      - 🇺🇸 美国节点
      - 🇯🇵 日本节点
      - DIRECT
  - name: ⚡ 自动选择
    type: url-test
    include-all: true
    filter: (?i)(^|[^a-z])(us|jp)([^a-z]|$)|美国|美國|日本|United States|USA|Japan|Tokyo|Osaka|Los Angeles|San Jose|Seattle|Dallas|Chicago|New York|东京|大阪
    url: https://cp.cloudflare.com/generate_204
    interval: 300
    tolerance: 50
  - name: 🇺🇸 美国节点
    type: select
    proxies:
      - DIRECT
    include-all: true
    filter: (?i)(^|[^a-z])us([^a-z]|$)|美国|美國|USA|United States|America|Los Angeles|San Jose|Seattle|Dallas|Chicago|New York
    url: https://cp.cloudflare.com/generate_204
    interval: 300
  - name: 🇯🇵 日本节点
    type: select
    proxies:
      - DIRECT
    include-all: true
    filter: (?i)(^|[^a-z])jp([^a-z]|$)|日本|Japan|Tokyo|Osaka|东京|大阪
    url: https://cp.cloudflare.com/generate_204
    interval: 300

rules:
  - DOMAIN-SUFFIX,lan,DIRECT
  - DOMAIN-SUFFIX,local,DIRECT
  - DOMAIN-SUFFIX,localhost,DIRECT
  - GEOSITE,private,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,100.64.0.0/10,DIRECT,no-resolve
  - GEOSITE,openai,🇺🇸 美国节点
  - GEOSITE,github,🇺🇸 美国节点
  - DOMAIN-SUFFIX,jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,co.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,ne.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,or.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,go.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,ac.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,ed.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,abema.tv,🇯🇵 日本节点
  - DOMAIN-SUFFIX,dmm.com,🇯🇵 日本节点
  - DOMAIN-SUFFIX,niconico.com,🇯🇵 日本节点
  - DOMAIN-SUFFIX,nicovideo.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,tver.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,radiko.jp,🇯🇵 日本节点
  - DOMAIN-SUFFIX,pixiv.net,🇯🇵 日本节点
  - DOMAIN-SUFFIX,line.me,🇯🇵 日本节点
  - GEOSITE,ABEMA,🇯🇵 日本节点
  - GEOSITE,CATEGORY-BANK-JP,🇯🇵 日本节点
  - GEOSITE,CATEGORY-NTP-JP,🇯🇵 日本节点
  - GEOSITE,NICONICO,🇯🇵 日本节点
  - GEOSITE,PIXIV,🇯🇵 日本节点
  - GEOSITE,RADIKO,🇯🇵 日本节点
  - GEOSITE,TVER,🇯🇵 日本节点
  - GEOSITE,LINE,🇯🇵 日本节点
  - GEOSITE,cn,DIRECT
  - GEOIP,CN,DIRECT,no-resolve
  - MATCH,🚀 节点选择
`;
}

function renderLanAllowedIps(value) {
  if (!value.length) return "";
  return `lan-allowed-ips:\n${value.map((cidr) => `  - ${cidr}`).join("\n")}`;
}
