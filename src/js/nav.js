/**
 * 共享导航组件 — 双模式菜单系统
 * PC（≥768px）：顶部固定横条 + 下拉菜单
 * 手机（<768px）：底部固定标签栏 + 弹出面板
 * 非白名单页面：右上角汉堡按钮展开完整导览
 *
 * 菜单栏顺序：首页 - 精选推荐 - 留言广场 - 小试牛刀
 * 除菜单4项外，其他页面都是小试牛刀的子页面
 */
(function () {
  'use strict';

  // ============================================================
  //  配置
  // ============================================================
  const BREAKPOINT = 768;
  const STORAGE_KEY = 'viewMode';

  // 保留菜单栏的页面（白名单）
  const MENU_PAGES = ['index', 'hub', 'guestbook', 'works'];

  // 小试牛刀子页面（page/ 下 + new/ 下）
  const myWorks = [
    { icon: '🔢', name: '校验码计算器', href: 'page/checksun/' },
    { icon: '🐍', name: '贪吃蛇',       href: 'page/snake/' },
    { icon: '📂', name: '站点浏览器',   href: 'page/finder/' },
    { icon: '🐱', name: '猫图工坊',     href: 'page/catpic/' },
    { icon: '😂', name: '随机笑话',     href: 'page/joke/' },
    { icon: '🎄', name: '圣诞树',       href: 'page/xmas/' },
    { icon: '🔤', name: '字符编码',     href: 'new/charset/' },
    { icon: '📖', name: '英语日读',     href: 'new/english/' },
    { icon: '🏮', name: '中文诗句',     href: 'new/chinese-qwen/' },
    { icon: '📜', name: '每日古诗',     href: 'new/chinese-mimo/' },
    { icon: '🎨', name: '画画板',       href: 'new/paint/' },
  ];

  // 其他（特殊版本 HTML）
  const othersWorks = [
    { icon: '🎄', name: '圣诞树 v1', href: 'page/xmas/1.html' },
    { icon: '🎄', name: '圣诞树 v2', href: 'page/xmas/2.html' },
    { icon: '🎄', name: '圣诞树 v3', href: 'page/xmas/3.html' },
    { icon: '📂', name: '站点浏览器 v1', href: 'page/finder/01.html' },
    { icon: '📂', name: '站点浏览器 v2', href: 'page/finder/02.html' },
  ];

  // 垃圾箱子页面
  const trashBin = [
    { icon: '🐈', name: '猫咪乐园',    href: 'trash/catpark/' },
    { icon: '✦', name: '猫咪梦境',    href: 'trash/catdream/' },
    { icon: '🔍', name: '网站探测',    href: 'trash/probe/' },
    { icon: '🔗', name: '网站导航',    href: 'trash/hub0/' },
    { icon: '🎬', name: 'TMDb Netlify', href: 'trash/tmdb-netlify/' },
    { icon: '🎞️', name: 'TMDb Vercel',  href: 'trash/tmdb-vercel/' },
  ];

  // 汉堡菜单全部导航项
  const hamburgerSections = [
    { label: '主要功能', items: [
      { icon: '🏠', name: '首页',       href: '' },
      { icon: '🪟', name: '精选推荐',   href: 'menu/hub/' },
      { icon: '💬', name: '留言广场',   href: 'menu/guestbook/' },
      { icon: '🛠️', name: '小试牛刀',   href: 'menu/works/' },
    ]},
    { label: '垃圾箱', items: trashBin },
  ];

  // ============================================================
  //  当前页检测
  // ============================================================
  let currentPage = document.body.getAttribute('data-nav-current');
  if (!currentPage) {
    const path = window.location.pathname;
    const segs = path.replace(/\/+$/, '').split('/').filter(Boolean);
    const last = segs.length > 0 ? segs[segs.length - 1] : 'index';
    const allIds = ['index', 'hub', 'guestbook', 'works'];
    if (allIds.indexOf(last) !== -1) currentPage = last;
  }
  currentPage = currentPage || 'index';

  // 导航链接的根目录 — 用 URL API 正确解析相对路径
  const rootOrigin = window.location.origin + '/';
  function resolveHref(href) {
    if (href === '' || href === './') return rootOrigin;
    // 用 URL API 正确解析相对路径
    try {
      return new URL(href, rootOrigin).href;
    } catch {
      // 兜底
      return href.startsWith('/') ? href : '/' + href;
    }
  }

  // 真正的首页检测 — 排除 data-nav-current 为 "index" 的子页
  function isRootIndex() {
    return currentPage === 'index' && window.location.pathname.split('/').filter(Boolean).length === 0;
  }

  // ============================================================
  //  导航高亮
  //  根据当前 URL 判断高亮哪个菜单项
  // ============================================================
  let navCurrent = isRootIndex() ? 'index' : 'index'; // 非菜单页高亮首页
  if (currentPage === 'hub') navCurrent = 'hub';
  else if (currentPage === 'guestbook') navCurrent = 'guestbook';
  else if (currentPage === 'works') navCurrent = 'works';

  // ============================================================
  //  模式管理
  // ============================================================
  function detectMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pc' || saved === 'mobile') return saved;
    return window.matchMedia('(min-width: ' + BREAKPOINT + 'px)').matches ? 'pc' : 'mobile';
  }

  let viewMode = detectMode();
  let hamburgerOpen = false;

  function saveMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    viewMode = mode;
  }

  function applyMode() {
    const isPC = viewMode === 'pc';
    const showMenu = MENU_PAGES.includes(currentPage);
    document.body.classList.toggle('has-pc-header', isPC && showMenu);
    document.body.classList.toggle('has-mobile-nav', !isPC && showMenu);
    document.body.classList.toggle('has-hamburger', !showMenu);
    if (toggleBtn) {
      toggleBtn.innerHTML = isPC ? '📱' : '💻';
      toggleBtn.setAttribute('title', isPC ? '切换到手机版' : '切换到电脑版');
    }
  }

  // ============================================================
  //  构建 PC 顶部菜单栏（仅白名单页面）
  // ============================================================
  const pcHeader = document.createElement('header');
  pcHeader.className = 'site-header';
  pcHeader.setAttribute('aria-label', '主导航');

  if (MENU_PAGES.includes(currentPage)) {
    // 白名单页面：完整菜单栏
    // 顺序：首页 - 精选推荐 - 留言广场 - 小试牛刀（指向作品合集页）
    pcHeader.innerHTML = `
      <div class="site-header__inner">
        <nav class="site-header__nav">
          <a href="${resolveHref('')}" class="site-header__item ${navCurrent === 'index' ? 'active' : ''}">首页</a>
          <a href="${resolveHref('menu/hub/')}" class="site-header__item ${navCurrent === 'hub' ? 'active' : ''}">精选推荐</a>
          <a href="${resolveHref('menu/guestbook/')}" class="site-header__item ${navCurrent === 'guestbook' ? 'active' : ''}">留言广场</a>
          <a href="${resolveHref('menu/works/')}" class="site-header__item ${navCurrent === 'works' ? 'active' : ''}">小试牛刀</a>
        </nav>
        <button class="site-header__toggle" id="toggleBtn" title="切换到手机版" aria-label="切换PC/手机版">📱</button>
      </div>
    `;
  } else {
    // 非白名单页面：无菜单栏
    pcHeader.innerHTML = '';
  }

  // ============================================================
  //  构建手机底部标签栏（仅白名单页面）
  // ============================================================
  const mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-nav';
  mobileNav.setAttribute('aria-label', '底部导航');

  if (MENU_PAGES.includes(currentPage)) {
    mobileNav.innerHTML = `
      <a href="${resolveHref('')}" class="mobile-nav__item ${navCurrent === 'index' ? 'active' : ''}">
        <span class="mobile-nav__label">首页</span>
      </a>
      <a href="${resolveHref('menu/hub/')}" class="mobile-nav__item ${navCurrent === 'hub' ? 'active' : ''}">
        <span class="mobile-nav__label">精选推荐</span>
      </a>
      <a href="${resolveHref('menu/guestbook/')}" class="mobile-nav__item ${navCurrent === 'guestbook' ? 'active' : ''}">
        <span class="mobile-nav__label">留言广场</span>
      </a>
      <a href="${resolveHref('menu/works/')}" class="mobile-nav__item ${navCurrent === 'works' ? 'active' : ''}">
        <span class="mobile-nav__label">小试牛刀</span>
      </a>
    `;
  }

  // ============================================================
  //  构建手机弹出面板（小试牛刀子页面，仅白名单页面）
  // ============================================================
  const mobilePanel = document.createElement('div');
  mobilePanel.className = 'works-panel';
  mobilePanel.id = 'worksPanel';
  mobilePanel.setAttribute('aria-label', '小试牛刀子页面');
  mobilePanel.innerHTML = `
    <div class="works-panel__header">
      <span class="works-panel__title">🛠️ 小试牛刀</span>
      <button class="works-panel__close" id="worksPanelClose" aria-label="关闭">✕</button>
    </div>
    <div class="works-panel__section-label">小工具 · 语言学习</div>
    <div class="works-panel__grid">
      ${myWorks.map(w => `
        <a href="${resolveHref(w.href)}" class="works-panel__item">
          <span class="works-panel__icon">${w.icon}</span>
          <span class="works-panel__name">${w.name}</span>
        </a>
      `).join('')}
    </div>
    <div class="works-panel__section-label" id="othersSectionLabel" style="cursor:pointer; user-select:none; padding: 16px 8px 8px;">
      <span id="othersChevron" style="display:inline-block; transition:transform 0.3s; margin-right:4px;">›</span>
      其他（${othersWorks.length}）
    </div>
    <div class="works-panel__grid" id="othersPanelGrid" style="max-height:0; overflow:hidden; transition:max-height 0.35s var(--ease-out-expo);">
      ${othersWorks.map(o => `
        <a href="${resolveHref(o.href)}" class="works-panel__item">
          <span class="works-panel__icon">${o.icon}</span>
          <span class="works-panel__name">${o.name}</span>
        </a>
      `).join('')}
    </div>
    <div class="works-panel__section-label">🗑️ 垃圾箱</div>
    <div class="works-panel__grid">
      ${trashBin.map(t => `
        <a href="${resolveHref(t.href)}" class="works-panel__item">
          <span class="works-panel__icon">${t.icon}</span>
          <span class="works-panel__name">${t.name}</span>
        </a>
      `).join('')}
    </div>
  `;

  // 手机面板“其他”展开收起
  (function () {
    var label = document.getElementById('othersSectionLabel');
    var grid = document.getElementById('othersPanelGrid');
    var chevron = document.getElementById('othersChevron');
    if (label && grid) {
      var open = false;
      label.addEventListener('click', function () {
        open = !open;
        grid.style.maxHeight = open ? '500px' : '0';
        if (chevron) chevron.style.transform = open ? 'rotate(90deg)' : '';
      });
    }
  })();

  // ============================================================
  //  注入 DOM
  // ============================================================
  if (pcHeader.innerHTML) {
    document.body.appendChild(pcHeader);
  }
  document.body.appendChild(mobileNav);
  document.body.appendChild(mobilePanel);

  // ============================================================
  //  事件绑定
  // ============================================================
  const toggleBtn = document.getElementById('toggleBtn');

  // ---- 切换按钮 ----
  toggleBtn.addEventListener('click', function () {
    saveMode(viewMode === 'pc' ? 'mobile' : 'pc');
    applyMode();
  });
})();
