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
  const MENU_PAGES = ['index', 'hub', 'guestbook'];

  // 小试牛刀子页面（page/ 下 + new/ 下）
  const myWorks = [
    { icon: '🔢', name: '校验码计算器', href: 'page/checksun/' },
    { icon: '🐍', name: '贪吃蛇',       href: 'page/snake/' },
    { icon: '🎄', name: '圣诞树',       href: 'page/xmas/' },
    { icon: '📂', name: '站点浏览器',   href: 'page/finder/' },
    { icon: '🐱', name: '猫图工坊',     href: 'page/catpic/' },
    { icon: '😂', name: '随机笑话',     href: 'page/joke/' },
    { icon: '🔤', name: '字符编码',     href: 'new/charset/' },
    { icon: '📖', name: '英语日读',     href: 'new/english/' },
    { icon: '🏮', name: '中文诗句',     href: 'new/chinese-qwen/' },
    { icon: '📜', name: '每日古诗',     href: 'new/chinese-mimo/' },
    { icon: '🎨', name: '画画板',       href: 'new/paint/' },
  ];

  // 垃圾箱子页面
  const trashBin = [
    { icon: '🎄', name: '圣诞树 v1', href: 'page/xmas/1.html' },
    { icon: '🎄', name: '圣诞树 v2', href: 'page/xmas/2.html' },
    { icon: '🎄', name: '圣诞树 v3', href: 'page/xmas/3.html' },
    { icon: '📂', name: '站点浏览器 v1', href: 'page/finder/01.html' },
    { icon: '📂', name: '站点浏览器 v2', href: 'page/finder/02.html' },
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
      { icon: '🛠️', name: '小试牛刀',   href: '#' },
    ]},
    { label: '小试牛刀', items: myWorks },
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
    const allIds = ['index', 'hub', 'guestbook'];
    if (allIds.indexOf(last) !== -1) currentPage = last;
  }
  currentPage = currentPage || 'index';

  // 路径计算
  const urlPath = window.location.pathname;
  const urlSegs = urlPath.replace(/\/+$/, '').split('/').filter(Boolean);
  const urlDepth = urlSegs.length;
  const isSubPage = urlDepth > 0;
  const pathPrefix = '../'.repeat(urlDepth);

  // 仅在根目录首页才新标签页打开子页面
  const isIndex = !isSubPage;
  const blankAttr = isIndex ? ' target="_blank" rel="noopener"' : '';

  function resolveHref(href) {
    if (href === '' || href === './') return isSubPage ? '../' : './';
    return pathPrefix + href;
  }

  // ============================================================
  //  模式管理
  // ============================================================
  function detectMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pc' || saved === 'mobile') return saved;
    return window.matchMedia('(min-width: ' + BREAKPOINT + 'px)').matches ? 'pc' : 'mobile';
  }

  let viewMode = detectMode();
  let dropdownOpen = false;
  let trashDropdownOpen = false;
  let mobilePanelOpen = false;
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
    // 顺序：首页 - 精选推荐 - 留言广场 - 小试牛刀（下拉）
    pcHeader.innerHTML = `
      <div class="site-header__inner">
        <a href="${resolveHref('')}" class="site-header__logo">🏠</a>
        <nav class="site-header__nav">
          <a href="${resolveHref('')}" class="site-header__item ${currentPage === 'index' ? 'active' : ''}">🏠 首页</a>
          <a href="${resolveHref('menu/hub/')}" class="site-header__item ${currentPage === 'hub' ? 'active' : ''}">🪟 精选推荐</a>
          <a href="${resolveHref('menu/guestbook/')}" class="site-header__item ${currentPage === 'guestbook' ? 'active' : ''}">💬 留言广场</a>
          <!-- 小试牛刀（下拉菜单） -->
          <div class="site-header__dropdown" id="worksDropdown">
            <button class="site-header__item site-header__trigger ${currentPage === 'index' ? 'active' : ''}" id="worksTrigger" aria-haspopup="true" aria-expanded="false">
              🛠️ 小试牛刀 ▾
            </button>
            <div class="site-header__dropdown-menu" id="worksMenu" role="menu">
              ${myWorks.map(w => `
                <a href="${resolveHref(w.href)}" class="site-header__dropdown-item" role="menuitem"${blankAttr}>
                  <span class="site-header__dropdown-icon">${w.icon}</span> ${w.name}
                </a>
              `).join('')}
              <div class="site-header__dropdown-sep"></div>
              <div class="site-header__sub-dropdown" id="trashDropdown">
                <button class="site-header__dropdown-item site-header__sub-trigger" id="trashTrigger">
                  <span class="site-header__dropdown-icon">🗑️</span> 垃圾箱 ▸
                </button>
                <div class="site-header__sub-menu" id="trashMenu">
                  ${trashBin.map(t => `
                    <a href="${resolveHref(t.href)}" class="site-header__dropdown-item site-header__dropdown-item--sm"${blankAttr}>
                      <span class="site-header__dropdown-icon">${t.icon}</span> ${t.name}
                    </a>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </nav>
        <button class="site-header__toggle" id="toggleBtn" title="切换到手机版" aria-label="切换PC/手机版">📱</button>
      </div>
    `;
  } else {
    // 非白名单页面：只有 logo + 汉堡按钮
    pcHeader.innerHTML = `
      <div class="site-header__inner">
        <a href="${resolveHref('')}" class="site-header__logo">🏠</a>
        <button class="site-header__hamburger" id="hamburgerBtn" aria-label="打开菜单" title="打开菜单">☰</button>
        <button class="site-header__toggle" id="toggleBtn" title="切换到手机版" aria-label="切换PC/手机版">📱</button>
      </div>
    `;
  }

  // ============================================================
  //  构建手机底部标签栏（仅白名单页面）
  // ============================================================
  const mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-nav';
  mobileNav.setAttribute('aria-label', '底部导航');

  if (MENU_PAGES.includes(currentPage)) {
    mobileNav.innerHTML = `
      <a href="${resolveHref('')}" class="mobile-nav__item ${currentPage === 'index' ? 'active' : ''}">
        <span class="mobile-nav__icon">🏠</span>
        <span class="mobile-nav__label">首页</span>
      </a>
      <a href="${resolveHref('menu/hub/')}" class="mobile-nav__item ${currentPage === 'hub' ? 'active' : ''}">
        <span class="mobile-nav__icon">🪟</span>
        <span class="mobile-nav__label">精选推荐</span>
      </a>
      <a href="${resolveHref('menu/guestbook/')}" class="mobile-nav__item ${currentPage === 'guestbook' ? 'active' : ''}">
        <span class="mobile-nav__icon">💬</span>
        <span class="mobile-nav__label">留言广场</span>
      </a>
      <button class="mobile-nav__item" id="mobileWorksBtn" aria-label="小试牛刀">
        <span class="mobile-nav__icon">🛠️</span>
        <span class="mobile-nav__label">小试牛刀</span>
      </button>
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
    <div class="works-panel__section-label">小工具</div>
    <div class="works-panel__grid">
      ${myWorks.map(w => `
        <a href="${resolveHref(w.href)}" class="works-panel__item"${blankAttr}>
          <span class="works-panel__icon">${w.icon}</span>
          <span class="works-panel__name">${w.name}</span>
        </a>
      `).join('')}
    </div>
    <div class="works-panel__section-label">🗑️ 垃圾箱</div>
    <div class="works-panel__grid">
      ${trashBin.map(t => `
        <a href="${resolveHref(t.href)}" class="works-panel__item"${blankAttr}>
          <span class="works-panel__icon">${t.icon}</span>
          <span class="works-panel__name">${t.name}</span>
        </a>
      `).join('')}
    </div>
  `;

  // ============================================================
  //  构建汉堡弹出面板（非白名单页面用）
  // ============================================================
  const hamburgerPanel = document.createElement('div');
  hamburgerPanel.className = 'hamburger-panel';
  hamburgerPanel.id = 'hamburgerPanel';
  hamburgerPanel.setAttribute('aria-label', '导航菜单');
  hamburgerPanel.innerHTML = `
    <div class="hamburger-panel__header">
      <span class="hamburger-panel__title">🧭 导航</span>
      <button class="hamburger-panel__close" id="hamburgerPanelClose" aria-label="关闭">✕</button>
    </div>
    <div class="hamburger-panel__body">
      ${hamburgerSections.map(s => `
        <div class="hamburger-panel__section">
          <div class="hamburger-panel__section-label">${s.label}</div>
          <div class="hamburger-panel__grid">
            ${s.items.map(item => {
              // 小试牛刀项点击后关闭面板并打开子面板
              if (item.href === '#') {
                return `<button class="hamburger-panel__item hamburger-panel__item--arrow" data-target="subWorks" aria-label="小试牛刀">
                  <span class="hamburger-panel__icon">${item.icon}</span>
                  <span class="hamburger-panel__name">${item.name}</span>
                </button>`;
              }
              return `<a href="${resolveHref(item.href)}" class="hamburger-panel__item"${blankAttr}>
                <span class="hamburger-panel__icon">${item.icon}</span>
                <span class="hamburger-panel__name">${item.name}</span>
              </a>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
      <!-- 小试牛刀子面板（默认隐藏） -->
      <div class="hamburger-panel__sub" id="subWorks" style="display:none;">
        <div class="hamburger-panel__sub-header">
          <button class="hamburger-panel__back" id="subWorksBack" aria-label="返回">← 返回</button>
          <span class="hamburger-panel__title">🛠️ 小试牛刀</span>
        </div>
        <div class="hamburger-panel__grid">
          ${myWorks.map(w => `
            <a href="${resolveHref(w.href)}" class="hamburger-panel__item"${blankAttr}>
              <span class="hamburger-panel__icon">${w.icon}</span>
              <span class="hamburger-panel__name">${w.name}</span>
            </a>
          `).join('')}
        </div>
        <div class="hamburger-panel__section-label">🗑️ 垃圾箱</div>
        <div class="hamburger-panel__grid">
          ${trashBin.map(t => `
            <a href="${resolveHref(t.href)}" class="hamburger-panel__item"${blankAttr}>
              <span class="hamburger-panel__icon">${t.icon}</span>
              <span class="hamburger-panel__name">${t.name}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // 遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'works-overlay';
  overlay.id = 'worksOverlay';

  // ============================================================
  //  注入 DOM
  // ============================================================
  document.body.appendChild(pcHeader);
  document.body.appendChild(mobileNav);
  document.body.appendChild(mobilePanel);
  document.body.appendChild(hamburgerPanel);
  document.body.appendChild(overlay);

  // ============================================================
  //  事件绑定
  // ============================================================
  const toggleBtn = document.getElementById('toggleBtn');
  const worksTrigger = document.getElementById('worksTrigger');
  const worksDropdown = document.getElementById('worksDropdown');
  const trashTrigger = document.getElementById('trashTrigger');
  const trashDropdown = document.getElementById('trashDropdown');
  const trashMenu = document.getElementById('trashMenu');
  const mobileWorksBtn = document.getElementById('mobileWorksBtn');
  const worksPanelClose = document.getElementById('worksPanelClose');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const hamburgerPanelClose = document.getElementById('hamburgerPanelClose');
  const subWorks = document.getElementById('subWorks');
  const subWorksBack = document.getElementById('subWorksBack');

  // ---- 切换按钮 ----
  toggleBtn.addEventListener('click', function () {
    saveMode(viewMode === 'pc' ? 'mobile' : 'pc');
    applyMode();
  });

  // ---- PC "小试牛刀" 下拉菜单 ----
  function openDropdown() {
    dropdownOpen = true;
    worksDropdown.classList.add('open');
    worksTrigger.setAttribute('aria-expanded', 'true');
  }
  function closeDropdown() {
    dropdownOpen = false;
    worksDropdown.classList.remove('open');
    worksTrigger.setAttribute('aria-expanded', 'false');
    closeTrashDropdown();
  }

  worksTrigger.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdownOpen ? closeDropdown() : openDropdown();
  });

  worksTrigger.addEventListener('mouseenter', function () {
    if (!dropdownOpen) openDropdown();
  });

  worksDropdown.addEventListener('mouseleave', function () {
    setTimeout(function () {
      if (!worksDropdown.matches(':hover')) closeDropdown();
    }, 100);
  });

  // ---- 垃圾箱子菜单 ----
  function openTrashDropdown() {
    trashDropdownOpen = true;
    trashDropdown.classList.add('open');
  }
  function closeTrashDropdown() {
    trashDropdownOpen = false;
    trashDropdown.classList.remove('open');
  }

  trashTrigger.addEventListener('click', function (e) {
    e.stopPropagation();
    trashDropdownOpen ? closeTrashDropdown() : openTrashDropdown();
  });

  trashTrigger.addEventListener('mouseenter', function () {
    if (!trashDropdownOpen) openTrashDropdown();
  });

  trashDropdown.addEventListener('mouseleave', function () {
    setTimeout(function () {
      if (!trashDropdown.matches(':hover')) closeTrashDropdown();
    }, 100);
  });

  // 点击菜单外关闭
  document.addEventListener('click', function (e) {
    if (dropdownOpen && !worksDropdown.contains(e.target)) closeDropdown();
  });

  // ESC 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (dropdownOpen) closeDropdown();
      if (mobilePanelOpen) closeWorksPanel();
      if (hamburgerOpen) closeHamburger();
    }
  });

  // ---- 手机弹出面板 ----
  function openWorksPanel() {
    mobilePanelOpen = true;
    mobilePanel.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  function closeWorksPanel() {
    mobilePanelOpen = false;
    mobilePanel.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  if (mobileWorksBtn) {
    mobileWorksBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      mobilePanelOpen ? closeWorksPanel() : openWorksPanel();
    });
  }

  worksPanelClose.addEventListener('click', closeWorksPanel);
  overlay.addEventListener('click', closeWorksPanel);

  // ---- 汉堡菜单 ----
  function openHamburger() {
    hamburgerOpen = true;
    hamburgerPanel.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  function closeHamburger() {
    hamburgerOpen = false;
    hamburgerPanel.classList.remove('open');
    // 关闭子面板
    if (subWorks) subWorks.style.display = 'none';
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openHamburger);
  }
  hamburgerPanelClose.addEventListener('click', closeHamburger);
  overlay.addEventListener('click', closeHamburger);

  // 小试牛刀子面板切换
  if (subWorks) {
    const subArrowBtns = hamburgerPanel.querySelectorAll('.hamburger-panel__item--arrow');
    subArrowBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        subWorks.style.display = 'block';
      });
    });
    subWorksBack.addEventListener('click', function () {
      subWorks.style.display = 'none';
    });
  }
})();
