export const INDEX_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>t-sub</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main id="app" class="app-shell"></main>
  <script type="module" src="/app.js"></script>
</body>
</html>`;

export const STYLES_CSS = `
:root {
  color-scheme: light;
  --bg: #f6f7f4;
  --panel: #ffffff;
  --ink: #17201b;
  --muted: #68746e;
  --line: #d8ded9;
  --accent: #176b55;
  --accent-ink: #ffffff;
  --danger: #a83232;
  --warn: #8c5b12;
  --code: #102019;
  --shadow: 0 12px 30px rgba(19, 31, 24, 0.08);
  font-family: "Aptos", "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

button, input, textarea, select {
  font: inherit;
}

button {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink);
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
}

button.danger {
  color: var(--danger);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

input, textarea, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink);
  padding: 10px 11px;
  min-height: 40px;
}

textarea, code, pre {
  font-family: "JetBrains Mono", "Cascadia Code", "SFMono-Regular", monospace;
}

textarea {
  resize: vertical;
}

.app-shell {
  width: min(1480px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 20px 0 32px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand h1 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0;
}

.brand span {
  color: var(--muted);
  font-size: 13px;
}

.login-panel {
  width: min(420px, 100%);
  margin: 14vh auto 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 24px;
}

.login-panel h1 {
  margin: 0 0 6px;
  font-size: 24px;
}

.login-panel p {
  margin: 0 0 20px;
  color: var(--muted);
}

.stack {
  display: grid;
  gap: 12px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
  gap: 16px;
  align-items: start;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  padding: 14px 16px;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
}

.panel-body {
  padding: 16px;
}

.nodes-input {
  min-height: 260px;
}

.template-editor {
  min-height: 360px;
}

.split {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
}

.template-list {
  display: grid;
  gap: 8px;
  align-content: start;
}

.template-item {
  text-align: left;
  min-height: auto;
  padding: 10px;
}

.template-item.active {
  border-color: var(--accent);
  box-shadow: inset 3px 0 0 var(--accent);
}

.template-item strong {
  display: block;
}

.template-item span {
  color: var(--muted);
  display: block;
  font-size: 12px;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.result {
  display: grid;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: #fbfcfa;
}

.result-url {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.qr-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

#qr {
  width: 192px;
  height: 192px;
  image-rendering: pixelated;
  border: 1px solid var(--line);
  background: #fff;
}

.notice {
  color: var(--muted);
  font-size: 13px;
}

.error {
  color: var(--danger);
  background: #fff4f2;
  border: 1px solid #f1cbc5;
  border-radius: 6px;
  padding: 10px;
}

.ok {
  color: var(--accent);
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  .split {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .app-shell {
    width: min(100vw - 20px, 1480px);
    padding-top: 12px;
  }
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .result-url {
    grid-template-columns: 1fr;
  }
}
`;

export const APP_JS = `
const state = {
  authenticated: false,
  templates: [],
  selectedId: "",
  nodesText: "",
  variables: {},
  result: null,
  error: "",
  busy: false,
};

const RESERVED_VARS = new Set(["PROXIES_YAML", "PROXY_NAMES_YAML", "GENERATED_AT", "NODE_COUNT"]);
const app = document.querySelector("#app");

init();

async function init() {
  const session = await api("/api/session", { silent: true });
  state.authenticated = Boolean(session?.authenticated);
  if (state.authenticated) await loadTemplates();
  render();
}

async function api(path, options = {}) {
  const init = { ...options };
  delete init.silent;
  if (init.body && typeof init.body !== "string") {
    init.body = JSON.stringify(init.body);
    init.headers = { "content-type": "application/json", ...(init.headers || {}) };
  }
  const res = await fetch(path, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const message = data?.error?.message || "请求失败";
    if (!options.silent) state.error = message;
    throw new Error(message);
  }
  return data;
}

async function loadTemplates() {
  const data = await api("/api/templates");
  state.templates = data.templates;
  if (!state.selectedId && state.templates[0]) state.selectedId = state.templates[0].id;
}

function selectedTemplate() {
  return state.templates.find((template) => template.id === state.selectedId) || state.templates[0] || null;
}

function render() {
  if (!state.authenticated) {
    renderLogin();
    return;
  }
  const template = selectedTemplate();
  app.innerHTML = \`
    <header class="topbar">
      <div class="brand">
        <h1>t-sub</h1>
        <span>私有的一次性 mihomo 配置交付工具</span>
      </div>
      <div class="actions">
        <button id="reloadTemplates">刷新</button>
        <button id="logout">退出</button>
      </div>
    </header>
    <div class="workspace">
      <section class="panel">
        <div class="panel-header">
          <h2>生成一次性配置</h2>
          <span class="notice">节点只用于本次临时生成，不会长期保存。</span>
        </div>
        <div class="panel-body stack">
          \${state.error ? \`<div class="error">\${escapeHtml(state.error)}</div>\` : ""}
          <label>节点，一行一个
            <textarea id="nodesText" class="nodes-input" spellcheck="false" placeholder="ss://...&#10;vmess://...">\${escapeHtml(state.nodesText)}</textarea>
          </label>
          <label>配置模板
            <select id="templateSelect">
              \${state.templates.map((item) => \`<option value="\${item.id}" \${item.id === state.selectedId ? "selected" : ""}>\${escapeHtml(item.name)}（\${escapeHtml(platformLabel(item.platform))}）</option>\`).join("")}
            </select>
          </label>
          <div id="variables" class="stack">
            \${renderVariableInputs(template)}
          </div>
          <div class="actions">
            <button class="primary" id="generate" \${state.busy ? "disabled" : ""}>生成链接和二维码</button>
            <button id="clearNodes">清空节点</button>
          </div>
          \${state.result ? renderResult() : ""}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>模板</h2>
          <div class="actions">
            <button id="newTemplate">新建</button>
            <button id="duplicateTemplate" \${template ? "" : "disabled"}>复制</button>
          </div>
        </div>
        <div class="panel-body split">
          <div class="template-list">
            \${state.templates.map((item) => \`
              <button class="template-item \${item.id === state.selectedId ? "active" : ""}" data-template-id="\${item.id}">
                <strong>\${escapeHtml(item.name)}</strong>
                <span>\${escapeHtml(item.description || platformLabel(item.platform))}</span>
              </button>
            \`).join("")}
          </div>
          <form id="templateForm" class="stack">
            \${template ? renderTemplateEditor(template) : "<p>暂无模板。</p>"}
          </form>
        </div>
      </section>
    </div>
  \`;
  bindAppEvents();
  if (state.result) drawQr(document.querySelector("#qr"), state.result.url);
}

function renderLogin() {
  app.innerHTML = \`
    <section class="login-panel">
      <h1>t-sub</h1>
      <p>请输入站主密码。</p>
      \${state.error ? \`<div class="error">\${escapeHtml(state.error)}</div>\` : ""}
      <form id="loginForm" class="stack">
        <label>密码
          <input id="password" type="password" autocomplete="current-password" autofocus>
        </label>
        <button class="primary" type="submit">登录</button>
      </form>
    </section>
  \`;
  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.error = "";
    try {
      await api("/api/login", {
        method: "POST",
        body: { password: document.querySelector("#password").value },
      });
      state.authenticated = true;
      await loadTemplates();
    } catch {}
    render();
  });
}

function renderVariableInputs(template) {
  if (!template) return "";
  const variables = template.variables || [];
  if (!variables.length) return "";
  return variables.map((item) => \`
    <label>\${escapeHtml(item.name)}
      <input data-var="\${item.name}" value="\${escapeHtml(state.variables[item.name] ?? item.defaultValue ?? "")}" \${item.required ? "required" : ""}>
    </label>
  \`).join("");
}

function renderResult() {
  return \`
    <div class="result">
      <strong>一次性链接过期时间：\${escapeHtml(new Date(state.result.expiresAt).toLocaleString())}</strong>
      <div class="result-url">
        <input id="resultUrl" readonly value="\${escapeHtml(state.result.url)}">
        <button id="copyUrl" type="button">复制</button>
      </div>
      <div class="qr-wrap">
        <canvas id="qr" width="256" height="256" aria-label="二维码"></canvas>
        <span class="notice">首次成功拉取会返回 YAML，之后同一链接返回 410 Gone。</span>
      </div>
    </div>
  \`;
}

function renderTemplateEditor(template) {
  return \`
    <label>名称
      <input id="templateName" value="\${escapeHtml(template.name)}" required>
    </label>
    <label>平台
      <select id="templatePlatform">
        \${["android", "nas", "windows", "custom"].map((platform) => \`<option value="\${platform}" \${platform === template.platform ? "selected" : ""}>\${platformLabel(platform)}</option>\`).join("")}
      </select>
    </label>
    <label>说明
      <input id="templateDescription" value="\${escapeHtml(template.description || "")}">
    </label>
    <label>YAML 模板
      <textarea id="templateBody" class="template-editor" spellcheck="false">\${escapeHtml(template.body)}</textarea>
    </label>
    <div class="notice">节点注入：可写 {{PROXIES_YAML}} 精确指定位置；如果不写，系统会自动把节点插入顶层 proxies: 段。{{PROXY_NAMES_YAML}} 只在需要显式列出节点名称时使用。</div>
    <div class="actions">
      <button class="primary" type="submit">保存模板</button>
      <button class="danger" id="deleteTemplate" type="button">删除</button>
    </div>
  \`;
}

function bindAppEvents() {
  document.querySelector("#logout").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    state.authenticated = false;
    state.templates = [];
    render();
  });
  document.querySelector("#reloadTemplates").addEventListener("click", async () => {
    await loadTemplates();
    render();
  });
  document.querySelector("#nodesText").addEventListener("input", (event) => {
    state.nodesText = event.target.value;
  });
  document.querySelector("#templateSelect").addEventListener("change", (event) => {
    state.selectedId = event.target.value;
    state.result = null;
    render();
  });
  document.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.templateId;
      state.result = null;
      render();
    });
  });
  document.querySelectorAll("[data-var]").forEach((input) => {
    input.addEventListener("input", () => {
      state.variables[input.dataset.var] = input.value;
    });
  });
  document.querySelector("#generate").addEventListener("click", generateConfig);
  document.querySelector("#clearNodes").addEventListener("click", () => {
    state.nodesText = "";
    state.result = null;
    render();
  });
  document.querySelector("#newTemplate").addEventListener("click", () => {
    const id = crypto.randomUUID();
    state.templates.push({
      id,
      name: "新模板",
      platform: "custom",
      description: "",
      body: "mixed-port: 7890\\\\nmode: rule\\\\nproxies:\\\\n{{PROXIES_YAML}}\\\\nproxy-groups:\\\\n  - name: Proxy\\\\n    type: select\\\\n    proxies:\\\\n{{PROXY_NAMES_YAML}}\\\\nrules:\\\\n  - MATCH,Proxy\\\\n",
      variables: [],
      revision: 0,
    });
    state.selectedId = id;
    render();
  });
  document.querySelector("#duplicateTemplate").addEventListener("click", () => {
    const template = selectedTemplate();
    if (!template) return;
    const copy = { ...template, id: crypto.randomUUID(), name: \`\${template.name} 副本\`, revision: 0 };
    state.templates.push(copy);
    state.selectedId = copy.id;
    render();
  });
  document.querySelector("#templateForm").addEventListener("submit", saveTemplate);
  const deleteButton = document.querySelector("#deleteTemplate");
  if (deleteButton) deleteButton.addEventListener("click", deleteTemplate);
  const copyButton = document.querySelector("#copyUrl");
  if (copyButton) copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(state.result.url);
    copyButton.textContent = "已复制";
    setTimeout(() => { copyButton.textContent = "复制"; }, 1200);
  });
}

async function generateConfig() {
  state.error = "";
  state.result = null;
  state.busy = true;
  render();
  try {
    const variables = {};
    document.querySelectorAll("[data-var]").forEach((input) => {
      variables[input.dataset.var] = input.value;
    });
    state.result = await api("/api/render", {
      method: "POST",
      body: {
        templateId: state.selectedId,
        nodesText: state.nodesText,
        variables,
      },
    });
  } catch {}
  state.busy = false;
  render();
}

async function saveTemplate(event) {
  event.preventDefault();
  const template = selectedTemplate();
  const body = document.querySelector("#templateBody").value;
  const variables = extractVariables(body);
  state.error = "";
  try {
    const saved = await api("/api/templates", {
      method: "POST",
      body: {
        id: template.id,
        name: document.querySelector("#templateName").value,
        platform: document.querySelector("#templatePlatform").value,
        description: document.querySelector("#templateDescription").value,
        body,
        variables,
      },
    });
    state.templates = state.templates.map((item) => item.id === saved.template.id ? saved.template : item);
    state.selectedId = saved.template.id;
  } catch {}
  render();
}

async function deleteTemplate() {
  const template = selectedTemplate();
  if (!template || !confirm(\`确认删除模板“\${template.name}”？\`)) return;
  state.error = "";
  try {
    await api(\`/api/templates/\${encodeURIComponent(template.id)}\`, { method: "DELETE" });
    state.templates = state.templates.filter((item) => item.id !== template.id);
    state.selectedId = state.templates[0]?.id || "";
  } catch {}
  render();
}

function extractVariables(body) {
  const names = [...body.matchAll(/{{\\s*([A-Z0-9_]+)\\s*}}/g)]
    .map((match) => match[1])
    .filter((name) => !RESERVED_VARS.has(name));
  return [...new Set(names)].map((name) => ({
    name,
    required: name === "PROFILE_NAME",
    defaultValue: name === "PROFILE_NAME" ? "mihomo" : "",
  }));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function platformLabel(platform) {
  return {
    android: "安卓",
    nas: "NAS",
    windows: "Windows",
    custom: "自定义",
  }[platform] || platform;
}

function drawQr(canvas, text) {
  const matrix = makeQr(text);
  const ctx = canvas.getContext("2d");
  const quiet = 4;
  const count = matrix.length + quiet * 2;
  const scale = Math.floor(canvas.width / count);
  const offset = Math.floor((canvas.width - count * scale) / 2);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix.length; x += 1) {
      if (matrix[y][x]) {
        ctx.fillRect(offset + (x + quiet) * scale, offset + (y + quiet) * scale, scale, scale);
      }
    }
  }
}

function makeQr(text) {
  const data = [...new TextEncoder().encode(text)];
  const caps = [0, 19, 34, 55, 80, 108];
  const eccs = [0, 7, 10, 15, 20, 26];
  let version = caps.findIndex((cap, index) => index > 0 && data.length <= cap - 2);
  if (version < 1) version = 5;
  const dataCodewords = caps[version];
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, data.length, 8);
  for (const byte of data) appendBits(bits, byte, 8);
  appendBits(bits, 0, Math.min(4, dataCodewords * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0; codewords.length < dataCodewords; pad += 1) codewords.push(pad % 2 ? 0x11 : 0xec);
  return buildQrMatrix(version, [...codewords, ...reedSolomon(codewords, eccs[version])]);
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}

function buildQrMatrix(version, codewords) {
  const size = 21 + (version - 1) * 4;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunc = Array.from({ length: size }, () => Array(size).fill(false));
  const setFunc = (r, c, dark) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    modules[r][c] = dark;
    isFunc[r][c] = true;
  };
  const finder = (r, c) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const yy = r + y;
        const xx = c + x;
        const dark = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
        setFunc(yy, xx, dark);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let i = 8; i < size - 8; i += 1) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }
  if (version > 1) {
    const p = 4 * version + 10;
    alignment(6, p);
    alignment(p, 6);
    alignment(p, p);
  }
  reserveFormat();
  setFunc(4 * version + 9, 8, true);
  const bits = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));
  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col -= 1;
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx += 1) {
        const c = col - dx;
        if (isFunc[row][c]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
        modules[row][c] = Boolean(bit ^ (((row + c) % 2) === 0 ? 1 : 0));
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
  drawFormatBits();
  return modules;

  function alignment(r, c) {
    if (isFunc[r][c]) return;
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        setFunc(r + y, c + x, Math.max(Math.abs(x), Math.abs(y)) !== 1);
      }
    }
  }

  function reserveFormat() {
    for (let i = 0; i < 9; i += 1) {
      if (i !== 6) {
        setFunc(8, i, false);
        setFunc(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i += 1) {
      setFunc(8, size - 1 - i, false);
      setFunc(size - 1 - i, 8, false);
    }
  }

  function drawFormatBits() {
    const bits15 = formatBits(1, 0);
    const bit = (i) => Boolean((bits15 >>> i) & 1);
    for (let i = 0; i <= 5; i += 1) setFunc(8, i, bit(i));
    setFunc(8, 7, bit(6));
    setFunc(8, 8, bit(7));
    setFunc(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) setFunc(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i += 1) setFunc(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) setFunc(8, size - 15 + i, bit(i));
    setFunc(size - 8, 8, true);
  }
}

function formatBits(ecl, mask) {
  const data = (ecl << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function reedSolomon(data, degree) {
  const gen = rsGenerator(degree);
  const result = [...data, ...Array(degree).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const coef = result[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j += 1) {
      result[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return result.slice(data.length);
}

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    poly = polyMul(poly, [1, gfPow(2, i)]);
  }
  return poly;
}

function polyMul(a, b) {
  const out = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) out[i + j] ^= gfMul(a[i], b[j]);
  }
  return out;
}

function gfPow(x, power) {
  let result = 1;
  for (let i = 0; i < power; i += 1) result = gfMul(result, x);
  return result;
}

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    if ((y >>> i) & 1) z ^= x;
  }
  return z & 0xff;
}
`;
