# t-sub UI 设计图生成提示词

为 image-2 生成 t-sub（私有一次性 mihomo 配置交付工具）的前端 UI 设计图。
每个风格生成 **3 张图**：登录页、桌面主工作区、移动端。

---

## 项目背景注入（附加到每条 prompt 末尾）

```
Context: A private one-time mihomo proxy config delivery web tool called "t-sub". 
Users login with a password, paste proxy nodes (one per line), select a config template 
(Android/NAS/Windows), optionally fill template variables, and generate a one-time 
subscription link with QR code. The tool also has a template editor where users can 
edit YAML config templates.

Key pages:
1. Login page — centered card with password input, brand logo "t-sub"
2. Desktop main workspace — two-column layout: left panel "Generate one-time config" 
   (textarea for nodes, template selector, variable inputs, generate button, result 
   with QR code and URL), right panel "Template workspace" (template list sidebar + 
   YAML editor with save/reset/delete buttons). Top bar with brand, status pills 
   showing template count/current template/node count. Chinese UI text.
3. Mobile — tab-based switching between "生成配置" and "模板管理", full-width inputs, 
   horizontal scrolling status pills, bottom-aligned actions.
```

---

## 风格 1：Warm Glass — 暖色毛玻璃

```
A modern web application UI design in warm glassmorphism style, soft and elegant. 
Color palette: warm cream/amber backgrounds, soft terracotta and coral accents, 
frosted glass panels with subtle blur and light borders, gentle rounded corners 
(16-20px). Typography: rounded sans-serif, generous spacing.

Show 3 screens of the app:
1. Login page: Centered glass card on warm gradient background, large password 
   input with soft inner shadow, coral accent login button with subtle glow.
2. Desktop workspace: Two-column layout with translucent glass panels. Left panel 
   has a large textarea for proxy nodes, dropdown template selector, and a coral 
   "generate" button. Below the button, a result card shows the one-time URL and a 
   QR code. Right panel has a sidebar template list and a dark-themed YAML code 
   editor. Top bar has brand logo and pill-shaped status indicators.
3. Mobile view: Shows tab bar at top ("生成配置" / "模板管理"), selected tab 
   showing full-width form, bottom-aligned primary button, horizontal scrollable 
   status pills.

Use soft natural lighting, subtle drop shadows, warm and inviting atmosphere.
Add context about the t-sub tool.
```

---

## 风格 2：Cyber Terminal — 赛博终端

```
A futuristic dark-themed web application UI in cyberpunk/terminal style. 
Color scheme: deep navy/charcoal backgrounds (#0a0e17), neon cyan (#00f0ff) and 
electric green (#00ff88) accents, subtle grid lines and scan-line effects on 
background. UI panels have thin neon borders with subtle glow, monospace font 
for headings, sharp corners with minimal radius (4px).

Show 3 screens of the app:
1. Login page: Dark background with subtle hexagonal grid, centered card with 
   cyan neon border glow, terminal-style password input with blinking cursor, 
   neon green login button.
2. Desktop workspace: Dark panels with thin cyan borders. Left panel has a code-like 
   textarea for nodes with line numbers, glowing dropdown selector, neon green 
   "GENERATE" button. Result card has QR code with cyan border and the URL displayed 
   in monospace. Right panel has a dark code editor with syntax-highlighting colors. 
   Top bar is a sleek dark bar with cyan status indicators.
3. Mobile view: Dark full-screen, neon-accented tab bar, glowing input fields, 
   compact status pills with cyan dots.

Add subtle particle effects, data-stream aesthetics, hacker/terminal vibes.
Add context about the t-sub tool.
```

---

## 风格 3：Zen Paper — 禅意纸质感

```
A minimalist web application UI in Japanese zen/paper-inspired style. 
Color palette: warm off-white and rice paper backgrounds (#faf7f2, #f5f0e8), 
charcoal ink text (#2d2d2d), muted indigo and burnt sienna accents. 
Subtle paper texture on cards, delicate 1px borders in warm gray, 
elegant serif + sans-serif font pairing. Asymmetric whitespace, 
generous line-height, calligraphy-inspired thin decorative lines.

Show 3 screens of the app:
1. Login page: Off-white fullscreen with a simple centered card that looks like 
   washi paper, minimal "t-sub" logo in indigo, single password field with thin 
   underline instead of box, subtle "登录" button in burnt sienna.
2. Desktop workspace: Clean layout with delicate paper-card panels, thin dividers. 
   Left panel has a spacious textarea with subtle border, elegant dropdown with 
   thin arrow, indigo "生成" button. Result area shows QR code on white card with 
   URL in small monospace. Right panel has sidebar template list with indigo active 
   indicator, and a warm-tinted code editor. Top bar minimal — just logo and three 
   small text status indicators.
3. Mobile view: Single column, full-width paper cards, tabs as simple underlined 
   text, generous touch targets, all actions bottom-anchored.

Use natural lighting, no heavy shadows, weightless and calm feeling.
Add context about the t-sub tool.
```

---

## 风格 4：Brutalist Pop — 粗野波普

```
A bold neo-brutalist web application UI with pop art influences. 
Color scheme: stark off-white and concrete gray backgrounds, thick 3-4px solid 
black borders on all containers and inputs, vibrant pops of color — hot magenta 
(#ff2d78), electric yellow (#ffe600), and cobalt blue (#0047ff) for accents 
and buttons. Heavy bold typography, no border-radius (0px), raw visible grid 
structure, intentional asymmetry. Drop shadows as solid black offset blocks 
(6px 6px 0 #000).

Show 3 screens of the app:
1. Login page: Off-white background, centered chunky card with thick black border, 
   "t-sub" in massive bold black type, password field with 3px black border, 
   hot magenta "LOGIN" button with black offset shadow block.
2. Desktop workspace: Two columns with thick-bordered panels. Left panel: large 
   black-bordered textarea, dropdown with black border, huge magenta "GENERATE" 
   button. Result card with black border housing QR code in yellow accent box and 
   URL in bold monospace. Right panel: sidebar with heavy black active state markers, 
   dark code editor with thick border. Top bar is a solid black strip with white 
   text and yellow status indicators.
3. Mobile view: Black-bordered tab bar with bold type, full-width chunky inputs, 
   bottom-attached primary button spanning full width, horizontally scrollable 
   status tags with black borders.

Use harsh lighting, high contrast, punk/DIY aesthetic but highly structured.
Add context about the t-sub tool.
```

---

## 风格 5：Cosmic Gradient — 宇宙渐变

```
A premium SaaS-style web application UI with cosmic/aurora gradient aesthetics. 
Color scheme: deep space indigo backgrounds transitioning to purple nebulae, 
vibrant gradient accents in teal-to-cyan and purple-to-pink, white and light 
lavender text. Panels with subtle glass effect and inner glow, large border-radius 
(24px), smooth gradient overlays on interactive elements. Inter/Plus Jakarta Sans 
typography, generous spacing, floating card aesthetic.

Show 3 screens of the app:
1. Login page: Deep space gradient background with subtle star/particle effect, 
   centered floating glass card with aurora-tinted glow, large "t-sub" logo with 
   gradient text, sleek password input with gradient focus ring, teal-to-cyan 
   gradient login button with pulsing glow.
2. Desktop workspace: Two floating glass-morphism panels with subtle purple/teal 
   gradient borders. Left panel: gradient-accented textarea, sleek dropdown with 
   glow focus, gradient "生成链接和二维码" button with hover shimmer effect. 
   Result card with rainbow-edged QR code and URL display. Right panel: sidebar 
   with gradient active state, dark code editor with teal syntax accents. 
   Top bar is translucent with blur, gradient brand mark, pill indicators with 
   subtle glow dots.
3. Mobile view: Gradient glass tab bar, full-width aurora-bordered inputs, 
   floating gradient primary button, compact glowing status pills.

Use atmospheric lighting, premium feel, like a well-funded SaaS dashboard.
Add context about the t-sub tool.
```

---

## 风格 6：Dot Matrix Retro — 点阵复古

```
A retro computing web application UI inspired by 1980s dot-matrix printers 
and early terminals. Color palette: warm amber or green phosphor on dark 
charcoal (#1a1a1a), paper-color (#f4e4c1) secondary surfaces, dot-matrix 
texture patterns as decorative elements. Monospace font throughout, 
horizontal rules made of dotted lines, inputs with dashed borders, 
pixel-art icons. All corners slightly rounded (2-3px), subtle halftone 
dot patterns on larger surfaces.

Show 3 screens of the app:
1. Login page: Charcoal background with dot-matrix border frame, centered 
   paper-toned card with perforated-edge top (like continuous feed paper), 
   amber monospace "t-sub" header, password field with dashed border, 
   amber phosphor login button.
2. Desktop workspace: Paper-toned panels with dot-matrix perforation lines 
   at top/bottom. Left panel: large textarea with dotted border and line 
   numbers in amber, dropdown with dashed border, amber "GENERATE" button. 
   Result area on paper card with QR code rendered in dot-matrix style and 
   URL in monospace with amber highlight. Right panel: sidebar with dot 
   indicators for active state, amber-green phosphor code editor. Top bar 
   simple with dot-separated status text.
3. Mobile view: Compact dot-matrix bordered panels, amber tab indicators, 
   full-width dashed inputs, bottom paper-toned action bar.

Use warm amber monitor glow lighting, nostalgic computing aesthetic.
Add context about the t-sub tool.
```

---

## 使用建议

1. 每条 prompt 可以独立喂给 image-2，生成 3 张图
2. 如果 image-2 支持，可以加 `--ar 16:9`（桌面）和 `--ar 9:16`（移动）
3. 先跑 2-3 个最喜欢的风格，对比效果后再决定方向
4. 选定风格后，我可以根据设计图精确调整 `src/assets.js` 的 CSS 变量和组件样式
5. 如果某个风格跑出来的细节不对，告诉我我可以微调 prompt

**推荐优先级**：Warm Glass > Cosmic Gradient > Zen Paper（这三个对代理工具场景最友好）
