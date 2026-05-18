export const ANDROID_TEMPLATE_BODY = `mixed-port: 7890
allow-lan: false
bind-address: '*'
mode: rule
log-level: info
ipv6: true
external-controller: 127.0.0.1:9090
external-ui: ./ui
external-ui-url: https://testingcf.jsdelivr.net/gh/MetaCubeX/metacubexd@gh-pages/metacubexd.zip
secret: ""
unified-delay: true
tcp-concurrent: true
geodata-mode: true
global-client-fingerprint: chrome
geo-auto-update: true
geo-update-interval: 24
geox-url:
  geoip: https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat
  geosite: https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat
  mmdb: https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb
  asn: https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb
profile:
  store-selected: true
  store-fake-ip: true
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
  dns-hijack:
    - any:53
dns:
  enable: true
  listen: 127.0.0.1:1053
  ipv6: true
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - '*.lan'
    - '*.local'
    - localhost.ptlogin2.qq.com
    - +.srv.nintendo.net
    - +.stun.playstation.net
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
    geosite:
      - gfw
      - geolocation-!cn
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
    geosite:telegram:
      - https://1.1.1.1/dns-query
      - https://8.8.8.8/dns-query
rule-providers:
  pt-direct:
    type: http
    behavior: domain
    format: text
    path: ./ruleset/pt-direct.list
    url: https://testingcf.jsdelivr.net/gh/milikii/sing-box-geosite@main/pt.list
    interval: 86400
  fcm-proxy:
    type: http
    behavior: domain
    format: text
    path: ./ruleset/fcm-proxy.list
    url: https://testingcf.jsdelivr.net/gh/milikii/sing-box-geosite@main/FCM.list
    interval: 86400

# 订阅转换基础模板。生成配置时会把节点插入到这里。
# 如果有回家节点，节点名建议包含 nas、回家 或 home。
proxies:
  - name: __HOME_NODE_MISSING__
    type: reject

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
    proxies:
      - DIRECT
    include-all: true
    exclude-filter: (?i)(nas|回家|home|direct)
    url: https://cp.cloudflare.com/generate_204
    interval: 300
    tolerance: 50
  - name: 🇺🇸 美国节点
    type: select
    proxies:
      - DIRECT
    include-all: true
    filter: (?i)(美国|美國|US|USA|United States|America|Los Angeles|San Jose|Seattle|Dallas|Chicago|New York)
    url: https://cp.cloudflare.com/generate_204
    interval: 300
  - name: 🇯🇵 日本节点
    type: select
    proxies:
      - DIRECT
    include-all: true
    filter: (?i)(日本|JP|Japan|Tokyo|Osaka|东京|大阪)
    url: https://cp.cloudflare.com/generate_204
    interval: 300
  - name: 🏠 回家
    type: select
    proxies:
      - __HOME_NODE_MISSING__
    include-all: true
    filter: (?i)(nas|回家|home)
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
  - DOMAIN,home.19970626.xyz,DIRECT
  - DOMAIN-SUFFIX,lan,🏠 回家
  - DOMAIN-SUFFIX,local,🏠 回家
  - DOMAIN-SUFFIX,localhost,DIRECT
  - IP-CIDR,192.168.0.0/16,🏠 回家,no-resolve
  - IP-CIDR,10.0.0.0/8,🏠 回家,no-resolve
  - IP-CIDR,172.16.0.0/12,🏠 回家,no-resolve
  - IP-CIDR6,fc00::/7,🏠 回家,no-resolve
  - IP-CIDR6,fe80::/10,🏠 回家,no-resolve
  - RULE-SET,fcm-proxy,📲 谷歌推送
  - DOMAIN,mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt1-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt2-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt3-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt4-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt5-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt6-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt7-mtalk.google.com,📲 谷歌推送
  - DOMAIN,alt8-mtalk.google.com,📲 谷歌推送
  - IP-CIDR,108.177.125.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,142.250.10.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,142.250.31.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,142.250.4.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,142.250.96.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,172.217.194.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,172.217.218.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,172.217.219.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,172.253.122.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,172.253.63.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,173.194.175.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,173.194.218.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,209.85.233.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,64.233.177.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,64.233.186.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,64.233.187.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,64.233.188.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,64.233.189.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.127.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.137.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.203.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.204.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.206.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.23.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.24.188/32,📲 谷歌推送,no-resolve
  - IP-CIDR,74.125.28.188/32,📲 谷歌推送,no-resolve
  - RULE-SET,pt-direct,DIRECT
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

export const NAS_TEMPLATE_BODY = defaultTemplateBody({ allowLan: true, ipv6: true, logLevel: "info" });

export const WINDOWS_TEMPLATE_BODY = `${defaultTemplateBody({ allowLan: false, ipv6: true, logLevel: "info" })}
external-controller: 127.0.0.1:9090
`;

function defaultTemplateBody({ allowLan, ipv6, logLevel }) {
  return `# {{PROFILE_NAME}} 生成于 {{GENERATED_AT}}
mixed-port: 7890
allow-lan: ${allowLan}
ipv6: ${ipv6}
mode: rule
log-level: ${logLevel}

proxies:
{{PROXIES_YAML}}

proxy-groups:
  - name: Proxy
    type: select
    proxies:
{{PROXY_NAMES_YAML}}

rules:
  - MATCH,Proxy
`;
}
