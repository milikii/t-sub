import { decodeBase64Text, safeDecodeURIComponent } from "./encoding.js";

const SUPPORTED_SCHEMES = new Set(["ss", "vmess", "vless", "trojan", "hysteria2", "hy2"]);

export class NodeValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "NodeValidationError";
    this.details = details;
  }
}

export function parseNodeLines(nodesText, options = {}) {
  const maxBytes = options.maxBytes ?? 65536;
  if (typeof nodesText !== "string") {
    throw new NodeValidationError("节点内容必须是文本。");
  }
  if (new TextEncoder().encode(nodesText).byteLength > maxBytes) {
    throw new NodeValidationError(`节点内容过大，最大 ${maxBytes} 字节。`);
  }

  const lines = nodesText
    .split(/\r?\n/)
    .map((line, index) => ({ raw: line.trim(), line: index + 1 }))
    .filter((item) => item.raw && !item.raw.startsWith("#"));

  if (lines.length === 0) {
    throw new NodeValidationError("请至少粘贴一个节点。");
  }

  const errors = [];
  const proxies = [];
  for (const item of lines) {
    try {
      proxies.push(parseNodeLine(item.raw, item.line));
    } catch (error) {
      errors.push({
        line: item.line,
        message: error.message,
      });
    }
  }

  if (errors.length) {
    throw new NodeValidationError("部分节点格式无效。", errors);
  }

  return dedupeNames(proxies);
}

export function parseNodeLine(line, lineNumber = 1) {
  const schemeMatch = line.match(/^([a-z0-9+.-]+):\/\//i);
  if (!schemeMatch) {
    throw new Error(`第 ${lineNumber} 行：缺少节点 URI 协议。`);
  }

  const scheme = schemeMatch[1].toLowerCase();
  if (!SUPPORTED_SCHEMES.has(scheme)) {
    throw new Error(`第 ${lineNumber} 行：不支持节点协议 "${scheme}"。`);
  }

  if (scheme === "ss") return parseShadowsocks(line);
  if (scheme === "vmess") return parseVmess(line);
  if (scheme === "vless") return parseVless(line);
  if (scheme === "trojan") return parseTrojan(line);
  return parseHysteria2(line);
}

function parseShadowsocks(line) {
  let rest = line.slice("ss://".length);
  const hashIndex = rest.indexOf("#");
  const name = hashIndex >= 0 ? safeDecodeURIComponent(rest.slice(hashIndex + 1)) : "ss";
  if (hashIndex >= 0) rest = rest.slice(0, hashIndex);

  const queryIndex = rest.indexOf("?");
  if (queryIndex >= 0) rest = rest.slice(0, queryIndex);

  let userInfo;
  let hostPort;

  if (rest.includes("@")) {
    const at = rest.lastIndexOf("@");
    userInfo = safeDecodeURIComponent(rest.slice(0, at));
    hostPort = rest.slice(at + 1);
    if (!userInfo.includes(":")) {
      userInfo = decodeMaybeBase64(userInfo);
    }
  } else {
    const decoded = decodeMaybeBase64(rest);
    const at = decoded.lastIndexOf("@");
    if (at < 0) throw new Error("无效的 ss URI：缺少主机。");
    userInfo = decoded.slice(0, at);
    hostPort = decoded.slice(at + 1);
  }

  const colon = userInfo.indexOf(":");
  if (colon < 1) throw new Error("无效的 ss URI：缺少加密方式或密码。");
  const cipher = userInfo.slice(0, colon);
  const password = userInfo.slice(colon + 1);
  const { host, port } = splitHostPort(hostPort);

  return {
    name,
    type: "ss",
    server: host,
    port,
    cipher,
    password,
  };
}

function parseVmess(line) {
  const encoded = line.slice("vmess://".length).trim();
  const decoded = decodeBase64Text(encoded);
  let data;
  try {
    data = JSON.parse(decoded);
  } catch {
    throw new Error("无效的 vmess URI：内容不是 JSON。");
  }

  const network = data.net || "tcp";
  const proxy = {
    name: data.ps || data.add || "vmess",
    type: "vmess",
    server: data.add,
    port: Number(data.port),
    uuid: data.id,
    alterId: Number(data.aid || 0),
    cipher: data.scy || "auto",
    tls: data.tls === "tls" || data.tls === true,
    network,
  };

  if (!proxy.server || !proxy.port || !proxy.uuid) {
    throw new Error("无效的 vmess URI：缺少 server、port 或 uuid。");
  }

  if (network === "ws") {
    proxy["ws-opts"] = {
      path: data.path || "/",
      headers: data.host ? { Host: data.host } : undefined,
    };
  }

  return proxy;
}

function parseVless(line) {
  const url = new URL(line);
  const params = url.searchParams;
  const network = params.get("type") || "tcp";
  const proxy = {
    name: nodeName(url, "vless"),
    type: "vless",
    server: url.hostname,
    port: Number(url.port),
    uuid: safeDecodeURIComponent(url.username),
    tls: params.get("security") === "tls" || params.get("security") === "reality",
    servername: params.get("sni") || params.get("serverName") || undefined,
    network,
  };

  if (params.get("flow")) proxy.flow = params.get("flow");
  applyNetworkOptions(proxy, params, network);
  requireHostPort(proxy, "vless");
  if (!proxy.uuid) throw new Error("无效的 vless URI：缺少 uuid。");
  return proxy;
}

function parseTrojan(line) {
  const url = new URL(line);
  const params = url.searchParams;
  const network = params.get("type") || "tcp";
  const proxy = {
    name: nodeName(url, "trojan"),
    type: "trojan",
    server: url.hostname,
    port: Number(url.port),
    password: safeDecodeURIComponent(url.username),
    sni: params.get("sni") || params.get("peer") || undefined,
    skipCertVerify: params.get("allowInsecure") === "1" || params.get("skip-cert-verify") === "true",
    network,
  };

  applyNetworkOptions(proxy, params, network);
  requireHostPort(proxy, "trojan");
  if (!proxy.password) throw new Error("无效的 trojan URI：缺少密码。");
  return proxy;
}

function parseHysteria2(line) {
  const url = new URL(line.replace(/^hy2:\/\//, "hysteria2://"));
  const params = url.searchParams;
  const proxy = {
    name: nodeName(url, "hysteria2"),
    type: "hysteria2",
    server: url.hostname,
    port: Number(url.port),
    password: safeDecodeURIComponent(url.username),
    sni: params.get("sni") || undefined,
    "skip-cert-verify": params.get("insecure") === "1" || params.get("skip-cert-verify") === "true",
  };
  requireHostPort(proxy, "hysteria2");
  if (!proxy.password) throw new Error("无效的 hysteria2 URI：缺少密码。");
  return proxy;
}

function applyNetworkOptions(proxy, params, network) {
  if (network === "ws") {
    proxy["ws-opts"] = {
      path: params.get("path") || "/",
      headers: params.get("host") ? { Host: params.get("host") } : undefined,
    };
  }
  if (network === "grpc") {
    proxy["grpc-opts"] = {
      "grpc-service-name": params.get("serviceName") || params.get("service") || "",
    };
  }
}

function decodeMaybeBase64(value) {
  try {
    return decodeBase64Text(value);
  } catch {
    return safeDecodeURIComponent(value);
  }
}

function splitHostPort(value) {
  const trimmed = value.trim();
  const lastColon = trimmed.lastIndexOf(":");
  if (lastColon < 1) throw new Error("缺少主机或端口。");
  const host = trimmed.slice(0, lastColon).replace(/^\[/, "").replace(/\]$/, "");
  const port = Number(trimmed.slice(lastColon + 1));
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("主机或端口无效。");
  }
  return { host, port };
}

function nodeName(url, fallback) {
  const hash = url.hash ? url.hash.slice(1) : "";
  return safeDecodeURIComponent(hash || url.hostname || fallback);
}

function requireHostPort(proxy, type) {
  if (!proxy.server || !Number.isInteger(proxy.port) || proxy.port < 1 || proxy.port > 65535) {
    throw new Error(`无效的 ${type} URI：缺少 server 或 port。`);
  }
}

function dedupeNames(proxies) {
  const seen = new Map();
  return proxies.map((proxy) => {
    const base = proxy.name || proxy.server || proxy.type;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return {
      ...proxy,
      name: count === 0 ? base : `${base} ${count + 1}`,
    };
  });
}
