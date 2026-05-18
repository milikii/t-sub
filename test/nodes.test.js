import assert from "node:assert/strict";
import test from "node:test";

import { parseNodeLine, parseNodeLines } from "../src/core/nodes.js";

test("parses common node URI schemes", () => {
  const vmessPayload = Buffer.from(JSON.stringify({
    ps: "vmess node",
    add: "vmess.example.com",
    port: "443",
    id: "11111111-1111-4111-8111-111111111111",
    aid: "0",
    scy: "auto",
    tls: "tls",
    net: "ws",
    path: "/ws",
    host: "cdn.example.com",
  })).toString("base64url");

  const nodes = parseNodeLines([
    "ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#ss%20node",
    `vmess://${vmessPayload}`,
    "trojan://secret@trojan.example.com:443?sni=trojan.example.com#trojan%20node",
    "vless://11111111-1111-4111-8111-111111111111@vless.example.com:443?security=tls&type=ws&path=%2Fvless#vless%20node",
    "hysteria2://secret@hy2.example.com:443?sni=hy2.example.com#hy2%20node",
  ].join("\n"));

  assert.equal(nodes.length, 5);
  assert.equal(nodes[0].type, "ss");
  assert.equal(nodes[1]["ws-opts"].path, "/ws");
  assert.equal(nodes[2].sni, "trojan.example.com");
  assert.equal(nodes[3].network, "ws");
  assert.equal(nodes[4].type, "hysteria2");
});

test("reports invalid lines with line numbers", () => {
  assert.throws(
    () => parseNodeLines("ss://YWVzLTI1Ni1nY206cGFzc0Bzcy5leGFtcGxlLmNvbTo4Mzg4#ok\nhttp://bad"),
    (error) => {
      assert.equal(error.name, "NodeValidationError");
      assert.equal(error.details[0].line, 2);
      return true;
    },
  );
});

test("parses vless reality mihomo options", () => {
  const proxy = parseNodeLine(
    "vless://00000000-0000-4000-8000-000000000000@example.com:443?security=reality&type=tcp&sni=www.microsoft.com&fp=chrome&pbk=public-key&sid=abcd&flow=xtls-rprx-vision&alpn=h2,http/1.1&udp=1&packetEncoding=xudp#home",
  );

  assert.equal(proxy.name, "home");
  assert.equal(proxy.type, "vless");
  assert.equal(proxy.tls, true);
  assert.equal(proxy.servername, "www.microsoft.com");
  assert.equal(proxy["client-fingerprint"], "chrome");
  assert.deepEqual(proxy["reality-opts"], {
    "public-key": "public-key",
    "short-id": "abcd",
  });
  assert.deepEqual(proxy.alpn, ["h2", "http/1.1"]);
  assert.equal(proxy.udp, true);
  assert.equal(proxy["packet-encoding"], "xudp");
});

test("parses vless xhttp cdn options with extra padding and reuse settings", () => {
  const extra = encodeURIComponent(JSON.stringify({
    headers: {
      "User-Agent": "t-sub",
    },
    noGRPCHeader: true,
    xPaddingBytes: "100-1000",
    xPaddingObfsMode: true,
    xPaddingKey: "pad",
    xPaddingHeader: "X-Padding",
    xPaddingPlacement: "header",
    xPaddingMethod: "base64",
    uplinkHttpMethod: "POST",
    scMaxEachPostBytes: "1000000-2000000",
    scMinPostsIntervalMs: "30-80",
    xmux: {
      maxConcurrency: 16,
      maxConnections: 4,
      cMaxReuseTimes: 8,
      hMaxRequestTimes: 64,
      hMaxReusableSecs: 300,
      hKeepAlivePeriod: 45,
    },
  }));
  const proxy = parseNodeLine(
    `vless://00000000-0000-4000-8000-000000000000@203.0.113.10:443?security=tls&type=xhttp&sni=up.example.com&host=cdn.example.com&path=%2Fxh&mode=packet-up&fp=chrome&alpn=h3&encryption=mlkem768x25519plus&extra=${extra}#xhttp-cdn`,
  );

  assert.equal(proxy.name, "xhttp-cdn");
  assert.equal(proxy.network, "xhttp");
  assert.equal(proxy.servername, "up.example.com");
  assert.equal(proxy["client-fingerprint"], "chrome");
  assert.equal(proxy.encryption, "mlkem768x25519plus");
  assert.deepEqual(proxy.alpn, ["h3"]);
  assert.deepEqual(proxy["xhttp-opts"], {
    path: "/xh",
    host: "cdn.example.com",
    mode: "packet-up",
    headers: {
      "User-Agent": "t-sub",
    },
    "no-grpc-header": true,
    "x-padding-bytes": "100-1000",
    "x-padding-obfs-mode": true,
    "x-padding-key": "pad",
    "x-padding-header": "X-Padding",
    "x-padding-placement": "header",
    "x-padding-method": "base64",
    "uplink-http-method": "POST",
    "sc-max-each-post-bytes": "1000000-2000000",
    "sc-min-posts-interval-ms": "30-80",
    "reuse-settings": {
      "max-concurrency": 16,
      "max-connections": 4,
      "c-max-reuse-times": 8,
      "h-max-request-times": 64,
      "h-max-reusable-secs": 300,
      "h-keep-alive-period": 45,
    },
  });
});

test("parses vless xhttp split upload cdn and download reality settings", () => {
  const extra = encodeURIComponent(JSON.stringify({
    downloadSettings: {
      address: "down.example.net",
      port: 443,
      security: "reality",
      network: "xhttp",
      realitySettings: {
        serverName: "download-sni.example",
        publicKey: "download-public-key",
        shortId: "download-short-id",
        fingerprint: "chrome",
      },
      xhttpSettings: {
        path: "/down",
        host: "download-cdn.example",
        extra: {
          xPaddingBytes: "32-128",
          xmux: {
            maxConnections: 2,
          },
        },
      },
    },
  }));
  const proxy = parseNodeLine(
    `vless://00000000-0000-4000-8000-000000000000@up-cdn.example:443?security=tls&type=xhttp&sni=upload-sni.example&host=upload-cdn.example&path=%2Fup&mode=packet-up&extra=${extra}#split`,
  );

  assert.deepEqual(proxy["xhttp-opts"]["download-settings"], {
    server: "down.example.net",
    port: 443,
    tls: true,
    servername: "download-sni.example",
    "client-fingerprint": "chrome",
    "reality-opts": {
      "public-key": "download-public-key",
      "short-id": "download-short-id",
    },
    path: "/down",
    host: "download-cdn.example",
    "x-padding-bytes": "32-128",
    "reuse-settings": {
      "max-connections": 2,
    },
  });
});

test("parses shadowsocks sip002 plugin options", () => {
  const proxy = parseNodeLine(
    "ss://aes-128-gcm:pass@example.com:8388?plugin=obfs-local%3Bobfs%3Dhttp%3Bobfs-host%3Dedge.example&udp=true#ss",
  );

  assert.equal(proxy.name, "ss");
  assert.equal(proxy.plugin, "obfs");
  assert.deepEqual(proxy["plugin-opts"], {
    mode: "http",
    host: "edge.example",
  });
  assert.equal(proxy.udp, true);
});
