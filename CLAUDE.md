# CLAUDE.md

> AI 编程指南 —— 本项目约定、技术栈和代码风格

## 技术栈

- **纯静态站点**：HTML + CSS + JS，无框架、无构建工具、无 npm 依赖
- **部署**：任意静态服务器（Live Server / Vercel / Netlify），无服务端运行时
- **外部 API**（均为客户端 fetch）：The Cat API、JokeAPI、TMDb API（通过代理）、Google Favicons API、DuckDuckGo图标服务
- **CORS 代理**：`corsproxy.io`、`api.allorigins.win` 用于跨域 HTML 读取
- **localStorage**：guestbook 数据持久化

## 目录结构

```
webTest/
  index.html                     # 首页（9 张卡片导航）
  web-css/common.css             # 共享设计系统（CSS 变量 + 公共组件样式）
  web-js/nav.js                  # 共享导航组件（IIFE，自动创建浮动面板）
  web-data/webData.json          # 网站橱窗数据（categories + sites）
  web-data/userData.json         # 留言板示例数据
  showcase/index.html            # 网站橱窗（数据驱动、连通性测试、导入导出）
  guestbook/index.html           # 留言广场（localStorage 持久化）
  probe/index.html               # 网站探测（跨域元数据抓取）
  catpark/index.html             # 猫咪乐园（Canvas 互动游戏）
  cat/index.html                 # 猫图工坊（The Cat API）
  joke/index.html                # 随机笑话（JokeAPI）
  navigation/index.html          # 网站导航（硬编码链接）
  tmdb-netlify/index.html        # TMDb 电影（Netlify 代理）
  tmdb-vercel/index.html         # TMDb 电影（Vercel Serverless）
  tmdb-vercel/api/tmdb.js        # Vercel Serverless Function（Node.js）
  tmdb-netlify/_redirects        # Netlify 代理规则
```

## 页面命名和路由

- Clean URL：所有子页面用文件夹 `page-name/index.html`，链接写 `page-name/`
- `index.html`（根目录）为首页，`data-nav-current="index"`，链接用 `""`
- 子页面从根目录算路径：`../web-css/`、`../web-js/`、`../web-data/`

## CSS 设计系统

### 命名规范：BEM + 自定义属性

- **Block**：`.nav-panel`、`.page-header`、`.btn`、`.card`
- **Element**：`__` 分隔（`.nav-panel__title`、`.page-card__icon`）
- **Modifier**：`--` 分隔（`.btn--primary`、`.btn--sm`）
- **State**：`.active`、`.open`、`.visible`、`.testing`（JS 添加/移除）

### 调色板（暖色系）

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-primary` | `#E07A5F` | 主色（terracotta） |
| `--color-primary-light` | `#F2A68D` | 主色浅色 |
| `--color-primary-dark` | `#C5604A` | 主色深色 |
| `--color-secondary` | `#3D405B` | 辅色（dark slate） |
| `--color-accent` | `#81B29A` | 强调色（sage green） |
| `--color-bg` | `#F4F1DE` | 背景（warm cream） |
| `--color-bg-warm` | `#FEF9EF` | 暖白背景 |
| `--color-card` | `#FFFFFF` | 卡片背景 |
| `--color-text` | `#2C2C2C` | 正文 |
| `--color-text-light` | `#6B6B6B` | 次要文字 |
| `--color-text-muted` | `#999999` | 弱化文字 |
| `--color-border` | `#E8E0D5` | 边框 |
| `--color-nav-bg` | `#F2CC8F` | 导航面板背景 |
| `--color-nav-hover` | `#E8B86D` | 导航 hover |

### 阴影 / 圆角 / 过渡 / 字体

- **阴影**：`--shadow-sm` → `--shadow-md` → `--shadow-lg` → `--shadow-glow`（逐步增强，色相一致）
- **圆角**：`--radius-sm: 8px`、`--radius-md: 16px`、`--radius-lg: 24px`、`--radius-xl: 32px`、`--radius-full: 9999px`
- **缓动**：`--ease-out-expo: cubic-bezier(0.19,1,0.22,1)`、`--ease-spring: cubic-bezier(0.34,1.56,0.64,1)`
- **字体**：`--font-sans`（系统中文栈）、`--font-mono`（代码栈）

### 公共组件类

- `.page-header` — 子页标题区（居中、图标 + 标题 + 副标题）
- `.page-header__icon` — 标题图标（有 float 动画）
- `.page-header__title` — 标题文字
- `.page-header__subtitle` — 副标题
- `.btn` — 基础按钮（inline-flex、pill）
- `.btn--primary` / `.btn--secondary` / `.btn--accent` — 颜色变体
- `.btn--sm` / `.btn--lg` — 尺寸变体
- `.btn:hover` 和 `.btn:active` 有统一动效
- `.input` — 输入框（full-width、focus ring）
- `.card` — 卡片容器
- `.tag` — 标签 pill
- `.fade-in` — 入场动画
- 响应式断点：`640px`

## JS 编码约定

### 模块模式

所有脚本都用 **IIFE** 包裹：
```js
(function () {
  'use strict';
  // 所有代码
})();
```

### 命名规范

- **变量/函数**：`camelCase`（`currentPage`、`loadData`、`fetchHtml`）
- **常量**：`UPPER_SNAKE_CASE`（`STORAGE_KEY`、`MAX_IMAGE_SIZE`、`CONCURRENCY`）
- **类/构造函数**：`PascalCase`（仅 `Cat`）
- **DOM 引用**：描述性命名（`searchInput`、`btnTest`、`postList`）
- **事件处理**：`verbNoun` 命名（`submitPost`、`renderSites`、`closeLightbox`）

### 数据获取范式

```js
try {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  // 处理数据
} catch (err) {
  console.error('描述:', err.message);
  // DOM 中展示降级 UI
}
```

### 常用模式

- **DOM 就绪**：脚本放在 `</body>` 前，不需要 `DOMContentLoaded`
- **事件绑定**：直接 `el.addEventListener`；场景切换用 `e.target.closest()` 代理
- **防抖**：搜索用 `setTimeout` 250ms 延迟
- **中断**：网络请求用 `AbortController`
- **XSS 防护**：用户输入用 `escHtml()` / `escAttr()`（用 `textContent` 赋值或正则转义）
- **localStorage**：`try/catch` 处理 `QuotaExceededError`

### 跨页共享

- **nav.js**：唯一共享 JS 文件，自动检测当前页（`data-nav-current` 属性优先，URL 路径回退），hover 弹出/移走关闭（200ms 延迟）、ESC 关闭、遮罩点击关闭
- **escHtml/escAttr**：当前各页面独立定义，如需提取到公共文件，放 `web-js/utils.js`

## HTML 页面骨架

每个子页面遵循此结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面名称</title>
  <link rel="stylesheet" href="../web-css/common.css">
  <style>/* 页面特有样式，鼓励使用 common.css 变量 */</style>
</head>
<body data-nav-current="page-id">
  <header class="page-header">
    <span class="page-header__icon">🪟</span>
    <h1 class="page-header__title">页面标题</h1>
    <p class="page-header__subtitle">简短描述。</p>
  </header>
  <!-- 主要内容 -->
  <script src="../web-js/nav.js"></script>
  <script>(function(){ 'use strict'; /* 页面逻辑 */ })();</script>
</body>
</html>
```

首页 `index.html` 不同：用 `.hero` 代替 `.page-header`，路径无 `../` 前缀。

## 添加新页面

1. 创建 `new-page/index.html`（参考上方骨架）
2. 在 `web-js/nav.js` 的 `pages` 数组中添加条目：`{ id: 'new-page', name: '名称', icon: '🆕', href: 'new-page/' }`
3. 在 `index.html` 的 `.page-grid` 中添加卡片（带 `--accent` 颜色和 `animation-delay`）
4. 如页面需共享样式，引用 `../web-css/common.css` 并遵循 design token

## 重要注意事项

- **不要**在公共仓库中暴露真实 API Token（tmdb-netlify 目前有硬编码 JWT）
- **鼓励**使用 common.css 的 CSS 变量而不是硬编码颜色值
- 新页面应继承共享样式系统，保持视觉一致性（joke/cat/navigation/tmdb 页面风格独立是已知历史问题，后续可逐步统一）
- `web-data/webData.json` 中 `sites[].category` 字段值必须与 `categories[].name` 完全匹配
- showcase 同时兼容数组格式和 `{categories, sites}` 对象格式
- 测试连通性时：直接 fetch → CORS 代理 → no-cors（三步依次回退）
