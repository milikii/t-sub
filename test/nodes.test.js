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
    "vless://00000000-0000-4000-8000-000000000000@example.com:443?security=reality&type=tcp&sni=www.microsoft.com&fp=chrome&pbk=public-key&sid=abcd&flow=xtls-rprx-vision&alpn=h2,http/1.1&udp=1#home",
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
