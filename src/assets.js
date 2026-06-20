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
  --bg: #eef2f7;
  --surface: #f8fafc;
  --panel: #ffffff;
  --panel-strong: #f1f5f9;
  --ink: #0f172a;
  --muted: #475569;
  --soft: #64748b;
  --line: #d8e0eb;
  --line-strong: #b8c4d6;
  --accent: #0f766e;
  --accent-soft: #ccfbf1;
  --accent-ink: #ffffff;
  --danger: #b42318;
  --danger-soft: #fff1f0;
  --warn: #a15c07;
  --warn-soft: #fff7ed;
  --code: #111827;
  --code-bg: #0b1220;
  --shadow: 0 18px 55px rgba(15, 23, 42, 0.12);
  --shadow-soft: 0 8px 22px rgba(15, 23, 42, 0.08);
  font-family: Inter, "Plus Jakarta Sans", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

* { box-sizing: border-box; }
html {
  min-width: 0;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.06), transparent 240px),
    radial-gradient(circle at 16% 0%, rgba(20, 184, 166, 0.14), transparent 260px),
    var(--bg);
  color: var(--ink);
  overflow-x: hidden;
}

button, input, textarea, select {
  font: inherit;
}

button {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink);
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  line-height: 1;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
}

button:hover:not(:disabled) {
  border-color: var(--line-strong);
  background: var(--panel-strong);
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid rgba(20, 184, 166, 0.24);
  outline-offset: 2px;
}

button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 10px 22px rgba(15, 118, 110, 0.22);
}

button.primary:hover:not(:disabled) {
  border-color: #115e59;
  background: #115e59;
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
  font-size: 12px;
  font-weight: 600;
}

input, textarea, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink);
  padding: 10px 12px;
  min-height: 42px;
  transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

textarea, code, pre {
  font-family: "JetBrains Mono", "Cascadia Code", "SFMono-Regular", monospace;
}

textarea {
  resize: vertical;
}

.app-shell {
  width: min(1540px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 18px 0 32px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(216, 224, 235, 0.92);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
  padding: 12px;
  backdrop-filter: blur(16px);
}

.brand {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--code-bg);
  color: #99f6e4;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.brand-copy {
  min-width: 0;
}

.brand h1 {
  margin: 0;
  font-size: 21px;
  letter-spacing: 0;
  line-height: 1.1;
}

.brand span {
  color: var(--muted);
  font-size: 13px;
  display: block;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.metric {
  min-height: 42px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--muted);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
  font-size: 13px;
}

.metric strong {
  color: var(--ink);
}

.metric-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12);
}

.icon {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.login-panel {
  width: min(440px, 100%);
  margin: 14vh auto 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 26px;
}

.login-panel h1 {
  margin: 0 0 6px;
  font-size: 26px;
  letter-spacing: 0;
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
  grid-template-columns: minmax(410px, 0.92fr) minmax(0, 1.08fr);
  gap: 16px;
  align-items: start;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
  min-width: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  padding: 13px 16px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.panel-title .icon {
  color: var(--accent);
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
}

.panel-body {
  padding: 16px;
}

.nodes-input {
  min-height: 300px;
}

.template-editor {
  min-height: 432px;
  background: var(--code-bg);
  color: #dbeafe;
  border-color: #1e293b;
  line-height: 1.48;
  tab-size: 2;
}

.split {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 14px;
}

.template-list {
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
}

.template-item {
  text-align: left;
  min-height: auto;
  padding: 11px;
  display: grid;
  gap: 5px;
  justify-content: stretch;
  line-height: 1.25;
  background: #fbfdff;
}

.template-item.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: inset 3px 0 0 var(--accent);
}

.template-item strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-item span {
  color: var(--muted);
  display: block;
  font-size: 12px;
  line-height: 1.35;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.result {
  display: grid;
  gap: 12px;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  padding: 14px;
  background: linear-gradient(180deg, #f0fdfa, #ffffff);
}

.result strong {
  color: #115e59;
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
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}

.notice {
  color: var(--muted);
  font-size: 13px;
}

.error {
  color: var(--danger);
  background: var(--danger-soft);
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px;
  font-weight: 650;
}

.ok {
  color: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
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
  .brand {
    grid-template-columns: 38px minmax(0, 1fr);
  }
  .brand-mark {
    width: 38px;
    height: 38px;
  }
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .actions {
    width: 100%;
  }
  .actions button {
    flex: 1 1 auto;
  }
  .result-url {
    grid-template-columns: 1fr;
  }
  .qr-wrap {
    justify-content: center;
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
const REQUIRED_VARS = new Set(["PROFILE_NAME", "TAILSCALE_AUTH_KEY"]);
const VARIABLE_ALIASES = new Map([
  ["TAIL_SCALE_AUTH_KEY", "TAILSCALE_AUTH_KEY"],
]);
const BUILT_IN_TEMPLATE_IDS = new Set(["android", "nas", "windows"]);
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
        <div class="brand-mark" aria-hidden="true">\${icon("terminal")}</div>
        <div class="brand-copy">
          <h1>t-sub</h1>
          <span>私有的一次性 mihomo 配置交付工具</span>
        </div>
      </div>
      <div class="actions">
        <button id="reloadTemplates" type="button">\${icon("refresh")}刷新</button>
        <button id="logout" type="button">\${icon("logout")}退出</button>
      </div>
    </header>
    <div class="status-strip" aria-label="工作区状态">
      <div class="metric"><span class="metric-dot"></span><strong>\${state.templates.length}</strong> 个模板</div>
      <div class="metric">\${icon("layers")}当前：<strong>\${escapeHtml(template?.name || "未选择")}</strong></div>
      <div class="metric">\${icon("file")}节点行：<strong>\${nodeLineCount(state.nodesText)}</strong></div>
      <div class="metric">\${icon("shield")}一次性链接，读取后失效</div>
    </div>
    <div class="workspace">
      <section class="panel">
        <div class="panel-header">
          <div class="panel-title">
            \${icon("send")}
            <h2>生成一次性配置</h2>
          </div>
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
            <button class="primary" id="generate" \${state.busy ? "disabled" : ""}>\${icon("spark")}生成链接和二维码</button>
            <button id="clearNodes" type="button">\${icon("x")}清空节点</button>
          </div>
          \${state.result ? renderResult() : ""}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div class="panel-title">
            \${icon("layout")}
            <h2>模板工作台</h2>
          </div>
          <div class="actions">
            <button id="newTemplate" type="button">\${icon("plus")}新建</button>
            <button id="duplicateTemplate" type="button" \${template ? "" : "disabled"}>\${icon("copy")}复制</button>
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
      <div class="brand-mark" aria-hidden="true">\${icon("terminal")}</div>
      <h1>t-sub</h1>
      <p>请输入站主密码。</p>
      \${state.error ? \`<div class="error">\${escapeHtml(state.error)}</div>\` : ""}
      <form id="loginForm" class="stack">
        <label>密码
          <input id="password" type="password" autocomplete="current-password" autofocus>
        </label>
        <button class="primary" type="submit">\${icon("login")}登录</button>
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
      <strong>\${icon("clock")}一次性链接过期时间：\${escapeHtml(new Date(state.result.expiresAt).toLocaleString())}</strong>
      <div class="result-url">
        <input id="resultUrl" readonly value="\${escapeHtml(state.result.url)}">
        <button id="copyUrl" type="button">\${icon("copy")}复制</button>
      </div>
      <div class="qr-wrap">
        <canvas id="qr" width="256" height="256" aria-label="二维码"></canvas>
        <span class="notice">首次成功拉取会返回 YAML，之后同一链接返回 410 Gone。</span>
      </div>
    </div>
  \`;
}

function renderTemplateEditor(template) {
  const canReset = BUILT_IN_TEMPLATE_IDS.has(template.id);
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
      <button class="primary" type="submit">\${icon("save")}保存模板</button>
      <button id="resetTemplate" type="button" \${canReset ? "" : "disabled"}>\${icon("refresh")}恢复内置模板</button>
      <button class="danger" id="deleteTemplate" type="button">\${icon("trash")}删除</button>
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
  const resetButton = document.querySelector("#resetTemplate");
  if (resetButton) resetButton.addEventListener("click", resetTemplate);
  const copyButton = document.querySelector("#copyUrl");
  if (copyButton) copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(state.result.url);
    copyButton.innerHTML = \`\${icon("check")}已复制\`;
    setTimeout(() => { copyButton.innerHTML = \`\${icon("copy")}复制\`; }, 1200);
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

async function resetTemplate() {
  const template = selectedTemplate();
  if (!template || !BUILT_IN_TEMPLATE_IDS.has(template.id)) return;
  if (!confirm(\`恢复内置模板会覆盖“\${template.name}”当前内容，确认继续？\`)) return;
  state.error = "";
  try {
    const saved = await api(\`/api/templates/\${encodeURIComponent(template.id)}/reset\`, { method: "POST" });
    state.templates = state.templates.map((item) => item.id === saved.template.id ? saved.template : item);
    state.selectedId = saved.template.id;
  } catch {}
  render();
}

function extractVariables(body) {
  const names = [...body.matchAll(/{{\\s*([A-Z0-9_]+)\\s*}}/gi)]
    .map((match) => normalizeVariableName(match[1]))
    .filter((name) => !RESERVED_VARS.has(name));
  return [...new Set(names)].map((name) => ({
    name,
    required: REQUIRED_VARS.has(name),
    defaultValue: name === "PROFILE_NAME" ? "mihomo" : "",
  }));
}

function normalizeVariableName(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Z0-9_]/gi, "_")
    .toUpperCase();
  return VARIABLE_ALIASES.get(normalized) || normalized;
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

function nodeLineCount(value) {
  return String(value || "")
    .split(/\\r?\\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function icon(name) {
  const icons = {
    terminal: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>',
    refresh: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M21 21v-5h-5"/></svg>',
    logout: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-5"/><path d="M14 21h5a2 2 0 0 0 2-2"/></svg>',
    layers: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
    file: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>',
    send: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    spark: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"/></svg>',
    x: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    layout: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h18"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    copy: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>',
    login: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    save: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>',
  };
  return icons[name] || "";
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
