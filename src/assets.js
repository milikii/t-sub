export const INDEX_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#eef2f7" media="(prefers-color-scheme: light)">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>t-sub</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main id="app" class="app-shell"></main>
  <script type="module" src="/app.js"></script>
</body>
</html>`;

export const STYLES_CSS = `
/* ===== Design Tokens ===== */
:root {
  color-scheme: light dark;

  /* Palette — Light */
  --bg: #f0f4f8;
  --bg-radial: rgba(20, 184, 166, 0.08);
  --surface: #f8fafc;
  --panel: #ffffff;
  --panel-hover: #f1f5f9;
  --panel-raised: #fafbfd;
  --ink: #0f172a;
  --ink-heavy: #020617;
  --muted: #475569;
  --soft: #64748b;
  --line: #e2e8f0;
  --line-strong: #cbd5e1;

  /* Accent — Teal */
  --accent: #0d9488;
  --accent-hover: #0f766e;
  --accent-soft: #ccfbf1;
  --accent-ink: #ffffff;
  --accent-glow: rgba(13, 148, 136, 0.18);

  /* Secondary — Indigo */
  --secondary: #6366f1;
  --secondary-soft: #e0e7ff;
  --secondary-hover: #4f46e5;

  /* Semantic */
  --danger: #dc2626;
  --danger-hover: #b91c1c;
  --danger-soft: #fef2f2;
  --warn: #d97706;
  --warn-soft: #fffbeb;
  --success: #059669;
  --success-soft: #ecfdf5;

  /* Code */
  --code: #e2e8f0;
  --code-bg: #0f172a;
  --code-line: #1e293b;

  /* Depth */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow: 0 4px 6px rgba(15, 23, 42, 0.04), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 10px 15px rgba(15, 23, 42, 0.06), 0 4px 6px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 20px 40px rgba(15, 23, 42, 0.08), 0 8px 16px rgba(15, 23, 42, 0.04);
  --shadow-xl: 0 25px 50px rgba(15, 23, 42, 0.12);

  /* Radius */
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: "Inter", "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  --font-mono: "JetBrains Mono", "Cascadia Code", "SF Mono", "Fira Code", "Consolas", monospace;

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-fast: 150ms;
  --duration: 200ms;
  --duration-slow: 300ms;
}

/* ===== Dark Theme ===== */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b1120;
    --bg-radial: rgba(20, 184, 166, 0.06);
    --surface: #0f172a;
    --panel: #1e293b;
    --panel-hover: #263348;
    --panel-raised: #243044;
    --ink: #e2e8f0;
    --ink-heavy: #f8fafc;
    --muted: #94a3b8;
    --soft: #64748b;
    --line: #334155;
    --line-strong: #475569;

    --accent: #2dd4bf;
    --accent-hover: #5eead4;
    --accent-soft: rgba(45, 212, 191, 0.12);
    --accent-ink: #042f2e;
    --accent-glow: rgba(45, 212, 191, 0.22);

    --secondary: #818cf8;
    --secondary-soft: rgba(99, 102, 241, 0.16);
    --secondary-hover: #a5b4fc;

    --danger: #f87171;
    --danger-hover: #fca5a5;
    --danger-soft: rgba(220, 38, 38, 0.12);
    --warn: #fbbf24;
    --warn-soft: rgba(217, 119, 6, 0.12);
    --success: #34d399;
    --success-soft: rgba(5, 150, 105, 0.12);

    --code: #cbd5e1;
    --code-bg: #020617;
    --code-line: #1a2332;

    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 10px 15px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.35);
    --shadow-xl: 0 25px 50px rgba(0, 0, 0, 0.4);
  }
}

/* ===== Reset & Base ===== */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  min-width: 0;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(ellipse 80% 60% at 50% -10%, var(--bg-radial), transparent),
    var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  transition: background-color var(--duration-slow) var(--ease-out);
}

/* ===== Typography ===== */
h1, h2, h3 {
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* ===== Interactive Elements ===== */
button, input, textarea, select {
  font: inherit;
  color: inherit;
}

button {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink);
  min-height: 42px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

button:hover:not(:disabled) {
  border-color: var(--line-strong);
  background: var(--panel-hover);
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Primary button */
button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 2px 8px var(--accent-glow);
}

button.primary:hover:not(:disabled) {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
  box-shadow: 0 4px 16px var(--accent-glow);
}

/* Danger button */
button.danger {
  color: var(--danger);
  border-color: transparent;
  background: var(--danger-soft);
}

button.danger:hover:not(:disabled) {
  color: var(--danger-hover);
  border-color: var(--danger);
  background: var(--danger-soft);
}

/* Ghost button */
button.ghost {
  border-color: transparent;
  background: transparent;
  color: var(--muted);
}

button.ghost:hover:not(:disabled) {
  background: var(--panel-hover);
  color: var(--ink);
}

/* Secondary button */
button.secondary {
  border-color: var(--secondary-soft);
  background: var(--secondary-soft);
  color: var(--secondary);
}

button.secondary:hover:not(:disabled) {
  border-color: var(--secondary);
  background: var(--secondary-soft);
  color: var(--secondary-hover);
}

/* ===== Forms ===== */
label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

input, textarea, select {
  width: 100%;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel);
  color: var(--ink);
  padding: 10px 14px;
  min-height: 44px;
  font-size: 14px;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

input:hover:not(:disabled):not(:focus),
textarea:hover:not(:disabled):not(:focus),
select:hover:not(:disabled):not(:focus) {
  border-color: var(--line-strong);
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  outline: none;
}

textarea, code, pre {
  font-family: var(--font-mono);
  font-size: 13px;
}

textarea {
  resize: vertical;
  line-height: 1.55;
}

select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

/* ===== Layout ===== */
.app-shell {
  width: min(1440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 16px 0 40px;
}

/* ===== Top Bar ===== */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 12px 20px;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transition: background-color var(--duration-slow) var(--ease-out),
              border-color var(--duration-slow) var(--ease-out);
}

@media (prefers-color-scheme: dark) {
  .topbar {
    background: rgba(30, 41, 59, 0.78);
    border-color: rgba(51, 65, 85, 0.8);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent), #0d9488);
  color: #ffffff;
  box-shadow: 0 4px 12px var(--accent-glow);
  flex-shrink: 0;
}

.brand-copy {
  min-width: 0;
}

.brand h1 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: var(--ink-heavy);
}

.brand span {
  color: var(--muted);
  font-size: 12px;
  display: block;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Status Strip ===== */
.status-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.metric {
  min-height: 38px;
  padding: 6px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--panel);
  color: var(--muted);
  box-shadow: var(--shadow-xs);
  font-size: 13px;
  font-weight: 500;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.metric strong {
  color: var(--ink);
  font-weight: 700;
}

.metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  animation: pulse-dot 2s var(--ease-in-out) infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px var(--accent-glow); }
  50% { box-shadow: 0 0 0 6px rgba(13, 148, 136, 0.08); }
}

/* ===== Icons ===== */
.icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

/* ===== Login Panel ===== */
.login-overlay {
  display: grid;
  place-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.08), transparent),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99, 102, 241, 0.06), transparent),
    var(--bg);
}

.login-panel {
  width: min(420px, 100%);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: 36px 32px;
  text-align: center;
}

.login-panel .brand-mark {
  margin: 0 auto 20px;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  font-size: 0;
}

.login-panel h1 {
  margin: 0 0 4px;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.login-panel .subtitle {
  margin: 0 0 28px;
  color: var(--muted);
  font-size: 15px;
}

.login-panel form {
  display: grid;
  gap: 16px;
  text-align: left;
}

.login-panel label {
  font-size: 13px;
  font-weight: 600;
}

.login-panel input {
  font-size: 16px;
  min-height: 48px;
  padding: 12px 16px;
}

.login-panel button {
  min-height: 48px;
  font-size: 16px;
  margin-top: 4px;
}

/* ===== Mobile Tabs ===== */
.mobile-tabs {
  display: none;
  gap: 4px;
  margin-bottom: 16px;
  padding: 4px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.mobile-tab {
  flex: 1;
  min-height: 40px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.mobile-tab.active {
  background: var(--accent);
  color: var(--accent-ink);
  box-shadow: 0 2px 8px var(--accent-glow);
}

/* ===== Workspace ===== */
.workspace {
  display: grid;
  grid-template-columns: minmax(420px, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
  align-items: start;
}

/* ===== Panels ===== */
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  min-width: 0;
  overflow: hidden;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.panel:hover {
  box-shadow: var(--shadow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  padding: 14px 20px;
  background: var(--panel-raised);
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
  font-weight: 700;
  color: var(--ink-heavy);
}

.panel-body {
  padding: 20px;
}

/* ===== Stack ===== */
.stack {
  display: grid;
  gap: 16px;
}

.stack-sm {
  display: grid;
  gap: 10px;
}

/* ===== Nodes Input ===== */
.nodes-input {
  min-height: 280px;
  font-size: 13px;
  line-height: 1.55;
  tab-size: 2;
}

/* ===== Template Editor ===== */
.template-editor {
  min-height: 400px;
  background: var(--code-bg);
  color: var(--code);
  border-color: var(--code-line);
  line-height: 1.55;
  tab-size: 2;
  font-size: 13px;
}

.template-editor:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

/* ===== Template Split ===== */
.split {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 0;
  min-height: 400px;
}

.template-list {
  display: grid;
  gap: 4px;
  align-content: start;
  min-width: 0;
  padding: 8px;
  border-right: 1px solid var(--line);
  background: var(--panel-raised);
  overflow-y: auto;
  max-height: 580px;
}

.template-item {
  text-align: left;
  min-height: auto;
  padding: 12px;
  display: grid;
  gap: 4px;
  justify-content: stretch;
  line-height: 1.3;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.template-item:hover {
  background: var(--panel-hover);
  border-color: var(--line);
}

.template-item.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.template-item.active strong {
  color: var(--accent);
}

.template-item strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
}

.template-item span {
  color: var(--muted);
  display: block;
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-form-wrap {
  padding: 20px;
  overflow-y: auto;
  max-height: 580px;
}

/* ===== Template List (Mobile Accordion) ===== */
.template-list-mobile {
  display: none;
  gap: 6px;
}

.template-select-mobile {
  width: 100%;
}

/* ===== Actions Row ===== */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* ===== Result Panel ===== */
.result {
  display: grid;
  gap: 14px;
  border: 1.5px solid var(--accent-soft);
  border-radius: var(--radius);
  padding: 20px;
  background: linear-gradient(135deg, var(--accent-soft), var(--panel));
  animation: result-in 0.4s var(--ease-out);
}

@keyframes result-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result strong {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
  font-size: 14px;
}

.result-url {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.result-url input {
  font-size: 13px;
  background: var(--panel);
  cursor: text;
}

.qr-wrap {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

#qr {
  width: 180px;
  height: 180px;
  image-rendering: pixelated;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: #ffffff;
  padding: 8px;
  flex-shrink: 0;
}

.qr-note {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  min-width: 0;
  flex: 1;
}

/* ===== Notice / Helper text ===== */
.notice {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

/* ===== Error / Success states ===== */
.error {
  color: var(--danger);
  background: var(--danger-soft);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  animation: shake 0.4s var(--ease-out);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.ok {
  color: var(--success);
}

/* ===== Loading Spinner ===== */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink-heavy);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: toast-in 0.3s var(--ease-out), toast-out 0.3s var(--ease-out) 1.5s forwards;
  pointer-events: none;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toast-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* ===== Reduced motion ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* ===== Responsive: Tablet ===== */
@media (max-width: 1024px) {
  .workspace {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .split {
    grid-template-columns: 200px minmax(0, 1fr);
  }
}

/* ===== Responsive: Mobile ===== */
@media (max-width: 768px) {
  .app-shell {
    width: min(100vw - 20px, 1440px);
    padding-top: 12px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius);
  }

  .brand {
    justify-content: space-between;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-sm);
  }

  .brand h1 {
    font-size: 20px;
  }

  .topbar .actions {
    justify-content: flex-end;
  }

  .status-strip {
    gap: 6px;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .status-strip::-webkit-scrollbar {
    display: none;
  }

  .metric {
    flex-shrink: 0;
    font-size: 12px;
    padding: 5px 12px;
    min-height: 32px;
  }

  /* Mobile tab switching */
  .mobile-tabs {
    display: flex;
  }

  .workspace {
    display: block;
  }

  .workspace > .panel {
    display: none;
  }

  .workspace.show-generate > .panel:first-child,
  .workspace.show-templates > .panel:last-child {
    display: block;
  }

  .panel-header {
    padding: 12px 16px;
  }

  .panel-body {
    padding: 16px;
  }

  .panel-header h2 {
    font-size: 15px;
  }

  /* Template editor on mobile */
  .split {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .template-list {
    display: none;
  }

  .template-list-mobile {
    display: grid;
  }

  .template-form-wrap {
    max-height: none;
    padding: 0;
  }

  .result-url {
    grid-template-columns: 1fr;
  }

  .qr-wrap {
    justify-content: center;
  }

  #qr {
    width: 200px;
    height: 200px;
  }

  /* Login on mobile */
  .login-panel {
    padding: 28px 20px;
    border-radius: var(--radius-lg);
  }

  .login-panel h1 {
    font-size: 24px;
  }

  /* Buttons on mobile */
  button {
    min-height: 44px;
    padding: 10px 16px;
    font-size: 14px;
  }

  .actions button {
    flex: 1 1 auto;
  }

  input, textarea, select {
    min-height: 46px;
  }
}

/* ===== Small Mobile ===== */
@media (max-width: 400px) {
  .app-shell {
    width: min(100vw - 12px, 1440px);
  }

  .topbar {
    padding: 10px 12px;
  }

  .panel-body {
    padding: 12px;
  }

  .login-panel {
    padding: 24px 16px;
  }

  #qr {
    width: 160px;
    height: 160px;
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
  mobileTab: "generate", // "generate" | "templates"
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
  const isMobile = window.innerWidth <= 768;
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
        <button id="reloadTemplates" type="button" class="ghost">\${icon("refresh")}刷新</button>
        <button id="logout" type="button" class="ghost">\${icon("logout")}退出</button>
      </div>
    </header>
    <div class="status-strip" aria-label="工作区状态">
      <div class="metric"><span class="metric-dot"></span><strong>\${state.templates.length}</strong> 个模板</div>
      <div class="metric">\${icon("layers")}当前：<strong>\${escapeHtml(template?.name || "未选择")}</strong></div>
      <div class="metric">\${icon("file")}节点：<strong>\${nodeLineCount(state.nodesText)}</strong> 行</div>
      <div class="metric">\${icon("shield")}一次性，读取后失效</div>
    </div>
    \${isMobile ? renderMobileTabs() : ""}
    <div class="workspace \${isMobile ? "show-" + state.mobileTab : ""}">
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
          <label>节点链接，一行一个
            <textarea id="nodesText" class="nodes-input" spellcheck="false" placeholder="ss://...&#10;vmess://...&#10;trojan://...">\${escapeHtml(state.nodesText)}</textarea>
          </label>
          <label>配置模板
            <select id="templateSelect">
              \${state.templates.map((item) => \`<option value="\${item.id}" \${item.id === state.selectedId ? "selected" : ""}>\${escapeHtml(item.name)}（\${escapeHtml(platformLabel(item.platform))}）</option>\`).join("")}
            </select>
          </label>
          <div id="variables" class="stack-sm">
            \${renderVariableInputs(template)}
          </div>
          <div class="actions">
            <button class="primary" id="generate" \${state.busy ? "disabled" : ""}>
              \${state.busy ? '<span class="spinner"></span>' : icon("spark")}
              \${state.busy ? "生成中..." : "生成链接和二维码"}
            </button>
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
            <button id="newTemplate" type="button" class="ghost">\${icon("plus")}新建</button>
            <button id="duplicateTemplate" type="button" class="ghost" \${template ? "" : "disabled"}>\${icon("copy")}复制</button>
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
          <div class="template-list-mobile">
            <select id="templateSelectMobile" class="template-select-mobile">
              \${state.templates.map((item) => \`<option value="\${item.id}" \${item.id === state.selectedId ? "selected" : ""}>\${escapeHtml(item.name)}（\${escapeHtml(platformLabel(item.platform))}）</option>\`).join("")}
            </select>
          </div>
          <form id="templateForm" class="template-form-wrap stack">
            \${template ? renderTemplateEditor(template) : "<p class=\\"notice\\">选择或新建一个模板开始编辑。</p>"}
          </form>
        </div>
      </section>
    </div>
  \`;
  bindAppEvents();
  if (state.result) drawQr(document.querySelector("#qr"), state.result.url);
}

function renderMobileTabs() {
  return \`
    <div class="mobile-tabs">
      <button class="mobile-tab \${state.mobileTab === "generate" ? "active" : ""}" data-mobile-tab="generate">
        \${icon("send")} 生成配置
      </button>
      <button class="mobile-tab \${state.mobileTab === "templates" ? "active" : ""}" data-mobile-tab="templates">
        \${icon("layout")} 模板管理
      </button>
    </div>
  \`;
}

function renderLogin() {
  app.innerHTML = \`
    <div class="login-overlay">
      <section class="login-panel">
        <div class="brand-mark" aria-hidden="true">\${icon("terminal")}</div>
        <h1>t-sub</h1>
        <p class="subtitle">私有的一次性 mihomo 配置交付工具</p>
        \${state.error ? \`<div class="error">\${escapeHtml(state.error)}</div>\` : ""}
        <form id="loginForm">
          <label>站主密码
            <input id="password" type="password" autocomplete="current-password" placeholder="请输入密码" autofocus>
          </label>
          <button class="primary" type="submit">\${icon("login")}登 录</button>
        </form>
      </section>
    </div>
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
      <input data-var="\${item.name}" value="\${escapeHtml(state.variables[item.name] ?? item.defaultValue ?? "")}" placeholder="\${item.required ? "必填" : "可选"}" \${item.required ? "required" : ""}>
    </label>
  \`).join("");
}

function renderResult() {
  return \`
    <div class="result">
      <strong>\${icon("clock")}一次性链接 · \${escapeHtml(new Date(state.result.expiresAt).toLocaleString())} 前有效</strong>
      <div class="result-url">
        <input id="resultUrl" readonly value="\${escapeHtml(state.result.url)}">
        <button id="copyUrl" type="button" class="primary">\${icon("copy")}复制链接</button>
      </div>
      <div class="qr-wrap">
        <canvas id="qr" width="256" height="256" aria-label="订阅二维码"></canvas>
        <div class="qr-note">
          扫描二维码或复制链接到 mihomo 客户端导入。<br>
          <strong>首次拉取返回 YAML 配置，之后即刻失效。</strong>
        </div>
      </div>
    </div>
  \`;
}

function renderTemplateEditor(template) {
  const canReset = BUILT_IN_TEMPLATE_IDS.has(template.id);
  return \`
    <label>模板名称
      <input id="templateName" value="\${escapeHtml(template.name)}" required>
    </label>
    <label>平台
      <select id="templatePlatform">
        \${["android", "nas", "windows", "custom"].map((platform) => \`<option value="\${platform}" \${platform === template.platform ? "selected" : ""}>\${platformLabel(platform)}</option>\`).join("")}
      </select>
    </label>
    <label>说明
      <input id="templateDescription" value="\${escapeHtml(template.description || "")}" placeholder="模板用途说明">
    </label>
    <label>YAML 模板内容
      <textarea id="templateBody" class="template-editor" spellcheck="false">\${escapeHtml(template.body)}</textarea>
    </label>
    <div class="notice">节点注入：{{PROXIES_YAML}} 精确定位；不写则自动插入顶层 proxies: 段。{{PROXY_NAMES_YAML}} 用于显式列出节点名称。</div>
    <div class="actions">
      <button class="primary" type="submit">\${icon("save")}保存模板</button>
      <button id="resetTemplate" type="button" class="secondary" \${canReset ? "" : "disabled"}>\${icon("refresh")}恢复内置</button>
      <button class="danger" id="deleteTemplate" type="button">\${icon("trash")}删除</button>
    </div>
  \`;
}

/* ===== Event Binding ===== */
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

  /* Mobile tabs */
  document.querySelectorAll("[data-mobile-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.mobileTab = tab.dataset.mobileTab;
      state.result = null;
      render();
    });
  });

  /* Nodes textarea */
  const nodesTextEl = document.querySelector("#nodesText");
  if (nodesTextEl) {
    nodesTextEl.addEventListener("input", (event) => {
      state.nodesText = event.target.value;
    });
  }

  /* Template select (generate panel) */
  const templateSelect = document.querySelector("#templateSelect");
  if (templateSelect) {
    templateSelect.addEventListener("change", (event) => {
      state.selectedId = event.target.value;
      state.result = null;
      render();
    });
  }

  /* Template select (mobile) */
  const templateSelectMobile = document.querySelector("#templateSelectMobile");
  if (templateSelectMobile) {
    templateSelectMobile.addEventListener("change", (event) => {
      state.selectedId = event.target.value;
      state.result = null;
      render();
    });
  }

  /* Template list sidebar items */
  document.querySelectorAll("[data-template-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.templateId;
      state.result = null;
      render();
    });
  });

  /* Variable inputs */
  document.querySelectorAll("[data-var]").forEach((input) => {
    input.addEventListener("input", () => {
      state.variables[input.dataset.var] = input.value;
    });
  });

  /* Generate button */
  const generateBtn = document.querySelector("#generate");
  if (generateBtn) generateBtn.addEventListener("click", generateConfig);

  /* Clear nodes */
  const clearBtn = document.querySelector("#clearNodes");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state.nodesText = "";
      state.result = null;
      render();
    });
  }

  /* Template form */
  const templateForm = document.querySelector("#templateForm");
  if (templateForm) templateForm.addEventListener("submit", saveTemplate);

  /* New template */
  const newBtn = document.querySelector("#newTemplate");
  if (newBtn) {
    newBtn.addEventListener("click", () => {
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
  }

  /* Duplicate template */
  const dupBtn = document.querySelector("#duplicateTemplate");
  if (dupBtn) {
    dupBtn.addEventListener("click", () => {
      const template = selectedTemplate();
      if (!template) return;
      const copy = { ...template, id: crypto.randomUUID(), name: \`\${template.name} 副本\`, revision: 0 };
      state.templates.push(copy);
      state.selectedId = copy.id;
      render();
    });
  }

  /* Delete template */
  const deleteBtn = document.querySelector("#deleteTemplate");
  if (deleteBtn) deleteBtn.addEventListener("click", deleteTemplate);

  /* Reset template */
  const resetBtn = document.querySelector("#resetTemplate");
  if (resetBtn) resetBtn.addEventListener("click", resetTemplate);

  /* Copy URL */
  const copyBtn = document.querySelector("#copyUrl");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(state.result.url);
      showToast("链接已复制到剪贴板");
    });
  }
}

/* ===== Toast ===== */
function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

/* ===== Generate Config ===== */
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

/* ===== Template CRUD ===== */
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
  if (!template || !confirm(\`确认删除模板"\${template.name}"？此操作不可恢复。\`)) return;
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
  if (!confirm(\`恢复内置模板会覆盖"\${template.name}"的当前内容，确认继续？\`)) return;
  state.error = "";
  try {
    const saved = await api(\`/api/templates/\${encodeURIComponent(template.id)}/reset\`, { method: "POST" });
    state.templates = state.templates.map((item) => item.id === saved.template.id ? saved.template : item);
    state.selectedId = saved.template.id;
  } catch {}
  render();
}

/* ===== Variable Extraction ===== */
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

/* ===== Utilities ===== */
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

/* ===== Icon SVGs ===== */
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

/* ===== QR Code ===== */
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
