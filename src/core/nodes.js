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
  const params = queryIndex >= 0 ? new URLSearchParams(rest.slice(queryIndex + 1)) : new URLSearchParams();
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

  const proxy = {
    name,
    type: "ss",
    server: host,
    port,
    cipher,
    password,
  };
  applyCommonUrlOptions(proxy, params);
  applyShadowsocksPlugin(proxy, params);
  return proxy;
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
  if (data.sni) proxy.servername = data.sni;
  if (data.fp) proxy["client-fingerprint"] = data.fp;
  if (data.alpn) proxy.alpn = splitList(data.alpn);
  if (data.allowInsecure === true || data.allowInsecure === "1" || data.skipCertVerify === true) {
    proxy["skip-cert-verify"] = true;
  }
  if (data.udp === true || data.udp === "1") proxy.udp = true;

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
  const network = normalizeNetwork(firstParam(params, "type", "network") || "tcp");
  const security = String(firstParam(params, "security") || "").toLowerCase();
  const encryption = firstParam(params, "encryption", "enc");
  const proxy = {
    name: nodeName(url, "vless"),
    type: "vless",
    server: url.hostname,
    port: Number(url.port),
    uuid: safeDecodeURIComponent(url.username),
    tls: security === "tls" || security === "reality",
    servername: firstParam(params, "sni", "servername", "serverName", "peer") || undefined,
    network,
  };

  if (params.get("flow")) proxy.flow = params.get("flow");
  if (encryption && encryption !== "none") {
    proxy.encryption = encryption;
  }
  if (security === "reality") {
    applyRealityOptions(proxy, params);
  }
  applyCommonUrlOptions(proxy, params);
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
    sni: firstParam(params, "sni", "servername", "serverName", "peer") || undefined,
    network,
  };

  applyCommonUrlOptions(proxy, params);
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
    sni: firstParam(params, "sni", "servername", "serverName") || undefined,
  };
  applyCommonUrlOptions(proxy, params);
  if (firstParam(params, "obfs")) proxy.obfs = firstParam(params, "obfs");
  if (firstParam(params, "obfs-password", "obfsPassword")) {
    proxy["obfs-password"] = firstParam(params, "obfs-password", "obfsPassword");
  }
  requireHostPort(proxy, "hysteria2");
  if (!proxy.password) throw new Error("无效的 hysteria2 URI：缺少密码。");
  return proxy;
}

function applyNetworkOptions(proxy, params, network) {
  if (network === "ws") {
    proxy["ws-opts"] = {
      path: params.get("path") || "/",
      headers: firstParam(params, "host", "Host") ? { Host: firstParam(params, "host", "Host") } : undefined,
    };
  }
  if (network === "grpc") {
    proxy["grpc-opts"] = {
      "grpc-service-name": firstParam(params, "serviceName", "service") || "",
    };
  }
  if (network === "xhttp") {
    const opts = buildXhttpOptions(params);
    if (Object.keys(opts).length) proxy["xhttp-opts"] = opts;
  }
}

function applyCommonUrlOptions(proxy, params) {
  const alpn = firstParam(params, "alpn");
  if (alpn) proxy.alpn = splitList(alpn);

  const fingerprint = firstParam(params, "fp", "fingerprint", "client-fingerprint");
  if (fingerprint) proxy["client-fingerprint"] = fingerprint;

  const packetEncoding = firstParam(params, "packetEncoding", "packet-encoding");
  if (packetEncoding) proxy["packet-encoding"] = packetEncoding;

  const certFingerprint = firstParam(params, "certFingerprint", "cert-fingerprint", "certificate-fingerprint");
  if (certFingerprint) proxy.fingerprint = certFingerprint;

  const skipCertVerify = booleanParam(params, "allowInsecure", "insecure", "skip-cert-verify");
  if (skipCertVerify !== undefined) proxy["skip-cert-verify"] = skipCertVerify;

  const udp = booleanParam(params, "udp");
  if (udp !== undefined) proxy.udp = udp;
}

function applyRealityOptions(proxy, source) {
  const realityOpts = compactObject({
    "public-key": sourceValue(source, "pbk", "publicKey", "public-key"),
    "short-id": sourceValue(source, "sid", "shortId", "short-id"),
  });
  const supportHybrid = booleanSourceValue(
    source,
    "supportX25519MLKEM768",
    "support-x25519mlkem768",
    "supportX25519Mlkem768",
  );
  if (supportHybrid !== undefined) realityOpts["support-x25519mlkem768"] = supportHybrid;
  if (Object.keys(realityOpts).length) proxy["reality-opts"] = realityOpts;
}

function buildXhttpOptions(params) {
  const opts = {};
  applyXhttpSource(opts, paramsToObject(params));

  const extra = parseJsonParam(firstParam(params, "extra"));
  if (extra) applyXhttpSource(opts, extra);

  const downloadSettings = parseJsonParam(firstParam(params, "downloadSettings", "download-settings"));
  if (downloadSettings) {
    opts["download-settings"] = mergeObjects(opts["download-settings"], mapDownloadSettings(downloadSettings));
  }

  const directDownloadSettings = downloadSettingsFromParams(params);
  if (Object.keys(directDownloadSettings).length) {
    opts["download-settings"] = mergeObjects(opts["download-settings"], directDownloadSettings);
  }

  return compactDeep(opts);
}

function applyXhttpSource(opts, source) {
  setStringField(opts, "path", source, "path");
  setStringField(opts, "host", source, "host");
  setStringField(opts, "mode", source, "mode");
  setObjectField(opts, "headers", source, "headers", "header");
  setBooleanField(opts, "no-grpc-header", source, "noGRPCHeader", "no-grpc-header");
  setFlexibleField(opts, "x-padding-bytes", source, "xPaddingBytes", "x-padding-bytes");
  setBooleanField(opts, "x-padding-obfs-mode", source, "xPaddingObfsMode", "x-padding-obfs-mode");
  setStringField(opts, "x-padding-key", source, "xPaddingKey", "x-padding-key");
  setStringField(opts, "x-padding-header", source, "xPaddingHeader", "x-padding-header");
  setStringField(opts, "x-padding-placement", source, "xPaddingPlacement", "x-padding-placement");
  setStringField(opts, "x-padding-method", source, "xPaddingMethod", "x-padding-method");
  setStringField(opts, "uplink-http-method", source, "uplinkHttpMethod", "uplink-http-method");
  setStringField(opts, "session-placement", source, "sessionPlacement", "session-placement");
  setStringField(opts, "session-key", source, "sessionKey", "session-key");
  setStringField(opts, "seq-placement", source, "seqPlacement", "seq-placement");
  setStringField(opts, "seq-key", source, "seqKey", "seq-key");
  setStringField(opts, "uplink-data-placement", source, "uplinkDataPlacement", "uplink-data-placement");
  setStringField(opts, "uplink-data-key", source, "uplinkDataKey", "uplink-data-key");
  setFlexibleField(opts, "uplink-chunk-size", source, "uplinkChunkSize", "uplink-chunk-size");
  setFlexibleField(opts, "sc-max-each-post-bytes", source, "scMaxEachPostBytes", "sc-max-each-post-bytes");
  setFlexibleField(opts, "sc-min-posts-interval-ms", source, "scMinPostsIntervalMs", "sc-min-posts-interval-ms");

  const reuse = mapReuseSettings(sourceValueRaw(source, "xmux", "reuseSettings", "reuse-settings"));
  if (reuse) opts["reuse-settings"] = mergeObjects(opts["reuse-settings"], reuse);

  const download = sourceValueRaw(source, "downloadSettings", "download-settings");
  if (download && typeof download === "object") {
    opts["download-settings"] = mergeObjects(opts["download-settings"], mapDownloadSettings(download));
  }
}

function mapReuseSettings(value) {
  if (!value || typeof value !== "object") return null;
  const out = {};
  setFlexibleField(out, "max-concurrency", value, "maxConcurrency", "max-concurrency");
  setFlexibleField(out, "max-connections", value, "maxConnections", "max-connections");
  setFlexibleField(out, "c-max-reuse-times", value, "cMaxReuseTimes", "c-max-reuse-times");
  setFlexibleField(out, "h-max-request-times", value, "hMaxRequestTimes", "h-max-request-times");
  setFlexibleField(out, "h-max-reusable-secs", value, "hMaxReusableSecs", "h-max-reusable-secs");
  setFlexibleField(out, "h-keep-alive-period", value, "hKeepAlivePeriod", "h-keep-alive-period");
  return Object.keys(out).length ? out : null;
}

function mapDownloadSettings(value) {
  const out = {};
  const xhttpSettings = sourceValueRaw(value, "xhttpSettings", "xhttp-settings") || {};
  const xhttpExtra = parseJsonLike(sourceValueRaw(xhttpSettings, "extra")) || sourceValueRaw(xhttpSettings, "extra") || {};

  setStringField(out, "server", value, "address", "server");
  setFlexibleField(out, "port", value, "port");
  applyDownloadTlsOptions(out, value);
  applyXhttpSource(out, xhttpSettings);
  if (xhttpExtra && typeof xhttpExtra === "object") applyXhttpSource(out, xhttpExtra);

  return compactDeep(out);
}

function applyDownloadTlsOptions(out, value) {
  const security = String(sourceValue(value, "security") || "").toLowerCase();
  const tlsSettings = sourceValueRaw(value, "tlsSettings", "tls-settings") || {};
  const realitySettings = sourceValueRaw(value, "realitySettings", "reality-settings") || {};
  const tlsLike = security === "reality" ? realitySettings : tlsSettings;

  if (security === "tls" || security === "reality") out.tls = true;
  const servername = sourceValue(value, "servername", "serverName", "sni")
    || sourceValue(tlsLike, "serverName", "servername", "sni");
  if (servername) out.servername = servername;

  const alpn = sourceValueRaw(tlsLike, "alpn") || sourceValue(value, "alpn");
  if (alpn) out.alpn = Array.isArray(alpn) ? alpn : splitList(alpn);

  const fingerprint = sourceValue(tlsLike, "fingerprint", "fp", "clientFingerprint", "client-fingerprint")
    || sourceValue(value, "fingerprint", "fp", "clientFingerprint", "client-fingerprint");
  if (fingerprint) out["client-fingerprint"] = fingerprint;

  const skipCertVerify = booleanSourceValue(tlsLike, "allowInsecure", "insecure", "skip-cert-verify")
    ?? booleanSourceValue(value, "allowInsecure", "insecure", "skip-cert-verify");
  if (skipCertVerify !== undefined) out["skip-cert-verify"] = skipCertVerify;

  if (security === "reality" || Object.keys(realitySettings).length) applyRealityOptions(out, realitySettings);
}

function downloadSettingsFromParams(params) {
  const out = {};
  setStringField(out, "server", params, "downloadAddress", "download-address", "downloadServer", "download-server");
  setFlexibleField(out, "port", params, "downloadPort", "download-port");

  const security = String(sourceValue(params, "downloadSecurity", "download-security") || "").toLowerCase();
  if (security === "tls" || security === "reality") out.tls = true;
  setStringField(out, "servername", params, "downloadSni", "download-sni", "downloadServername", "download-servername");
  setStringField(out, "client-fingerprint", params, "downloadFp", "download-fp", "downloadFingerprint", "download-fingerprint");
  setObjectField(out, "headers", params, "downloadHeaders", "download-headers");
  setStringField(out, "path", params, "downloadPath", "download-path");
  setStringField(out, "host", params, "downloadHost", "download-host");
  setStringField(out, "mode", params, "downloadMode", "download-mode");

  const alpn = sourceValue(params, "downloadAlpn", "download-alpn");
  if (alpn) out.alpn = splitList(alpn);

  const realitySource = compactObject({
    publicKey: sourceValue(params, "downloadPbk", "download-pbk", "downloadPublicKey", "download-public-key"),
    shortId: sourceValue(params, "downloadSid", "download-sid", "downloadShortId", "download-short-id"),
  });
  if (Object.keys(realitySource).length) applyRealityOptions(out, realitySource);
  return compactDeep(out);
}

function applyShadowsocksPlugin(proxy, params) {
  const plugin = firstParam(params, "plugin");
  if (!plugin) return;

  const [rawName, ...segments] = plugin.split(";");
  const pluginName = rawName === "obfs-local" ? "obfs" : rawName;
  const opts = {};
  for (const segment of segments) {
    if (!segment) continue;
    const separator = segment.indexOf("=");
    if (separator < 0) {
      opts[segment] = true;
      continue;
    }
    const rawKey = segment.slice(0, separator);
    const key = rawKey === "obfs" ? "mode" : rawKey === "obfs-host" ? "host" : rawKey;
    opts[key] = segment.slice(separator + 1);
  }

  proxy.plugin = pluginName;
  if (Object.keys(opts).length) proxy["plugin-opts"] = opts;
}

function setStringField(out, outputKey, source, ...sourceKeys) {
  const value = sourceValue(source, ...sourceKeys);
  if (value) out[outputKey] = value;
}

function setBooleanField(out, outputKey, source, ...sourceKeys) {
  const value = booleanSourceValue(source, ...sourceKeys);
  if (value !== undefined) out[outputKey] = value;
}

function setFlexibleField(out, outputKey, source, ...sourceKeys) {
  const value = sourceValueRaw(source, ...sourceKeys);
  if (value === undefined || value === null || value === "") return;
  out[outputKey] = coerceFlexibleValue(value);
}

function setObjectField(out, outputKey, source, ...sourceKeys) {
  const value = parseObjectLike(sourceValueRaw(source, ...sourceKeys));
  if (value && Object.keys(value).length) out[outputKey] = value;
}

function sourceValue(source, ...keys) {
  const value = sourceValueRaw(source, ...keys);
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function sourceValueRaw(source, ...keys) {
  if (!source) return undefined;
  if (source instanceof URLSearchParams) {
    for (const key of keys) {
      if (source.has(key)) return source.get(key);
    }
    return undefined;
  }
  if (typeof source !== "object") return undefined;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  const lowerKeys = keys.map((key) => key.toLowerCase());
  const actualKey = Object.keys(source).find((key) => lowerKeys.includes(key.toLowerCase()));
  return actualKey ? source[actualKey] : undefined;
}

function booleanSourceValue(source, ...keys) {
  const value = sourceValueRaw(source, ...keys);
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (/^(1|true|yes)$/i.test(String(value))) return true;
  if (/^(0|false|no)$/i.test(String(value))) return false;
  return undefined;
}

function coerceFlexibleValue(value) {
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function parseObjectLike(value) {
  const parsed = parseJsonLike(value);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  if (typeof value !== "string") return null;

  const entries = value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const out = {};
  for (const entry of entries) {
    const separator = entry.includes("=") ? "=" : entry.includes(":") ? ":" : "";
    if (!separator) continue;
    const index = entry.indexOf(separator);
    const key = entry.slice(0, index).trim();
    const headerValue = entry.slice(index + 1).trim();
    if (key) out[key] = headerValue;
  }
  return Object.keys(out).length ? out : null;
}

function parseJsonParam(value) {
  const parsed = parseJsonLike(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
}

function parseJsonLike(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  const text = String(value).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}

  try {
    return JSON.parse(decodeBase64Text(text));
  } catch {}

  return null;
}

function paramsToObject(params) {
  const out = {};
  for (const [key, value] of params) {
    if (!(key in out)) out[key] = value;
  }
  return out;
}

function normalizeNetwork(value) {
  const network = String(value || "tcp").toLowerCase();
  if (network === "splithttp" || network === "split-http") return "xhttp";
  return network;
}

function mergeObjects(base, next) {
  if (!base) return next || {};
  if (!next) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(next)) {
    if (value && typeof value === "object" && !Array.isArray(value) && out[key] && typeof out[key] === "object" && !Array.isArray(out[key])) {
      out[key] = mergeObjects(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function compactDeep(value) {
  if (Array.isArray(value)) {
    return value.map(compactDeep).filter((item) => item !== undefined);
  }
  if (!value || typeof value !== "object") return value;

  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined || item === null || item === "") continue;
    const compacted = compactDeep(item);
    if (compacted && typeof compacted === "object" && !Array.isArray(compacted) && Object.keys(compacted).length === 0) continue;
    out[key] = compacted;
  }
  return out;
}

function firstParam(params, ...keys) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  return "";
}

function booleanParam(params, ...keys) {
  const value = firstParam(params, ...keys);
  if (!value) return undefined;
  if (/^(1|true|yes)$/i.test(value)) return true;
  if (/^(0|false|no)$/i.test(value)) return false;
  return undefined;
}

function splitList(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ""));
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
