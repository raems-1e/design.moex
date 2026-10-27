(() => {
  'use strict';
  const body = document.body;
  // Fixed navigation must not be trapped in a hero/main stacking context.
  document.querySelectorAll('[data-site-header]').forEach((header) => body.prepend(header));
  document.querySelectorAll('[data-site-header], .materials-site-header, .materials-header').forEach((header) => {
    let atmosphere = header.querySelector('.header-atmosphere');
    if (!atmosphere) {
      atmosphere = document.createElement('div');
      atmosphere.className = 'header-atmosphere';
      atmosphere.setAttribute('aria-hidden', 'true');
      header.prepend(atmosphere);
    }
    for (let layer = 0; layer < 3; layer += 1) {
      const glass = document.createElement('span');
      glass.className = 'header-atmosphere__layer';
      atmosphere.append(glass);
    }
  });
  if (!body || document.querySelector('.materials-mobile-drawer')) return;
  body.classList.add('has-mobile-drawer');
  const mobileViewport = window.matchMedia(body.classList.contains('materials-page') ? '(max-width:760px)' : '(max-width:800px)');
  const template = document.createElement('template');
  const groups = [
    ['Коммуникационный дизайн', 'communication.html', [['Стиль', 'style'], ['Рекламные баннеры', 'banners'], ['Типографика', 'typography'], ['Конструктор', 'banner-builder'], ['Результаты', 'results'], ['Проекты', 'portfolio']]],
    ['Продуктовый дизайн', 'product.html', [['Технологии', 'technology'], ['Как мы проектируем', 'principles'], ['Стиль', 'style'], ['Кастомизация', 'customization'], ['Результаты', 'results'], ['Проекты', 'portfolio']]],
    ['Скачать материалы', 'materials.html', [['Логотипы', 'logos'], ['Фирменный шрифт', 'typography'], ['Брендбук', 'brandbook'], ['3D-иллюстрации', 'illustrations'], ['Иконки', 'icons'], ['Презентации и шаблоны', 'presentations']]]
  ];
  template.innerHTML = `<aside class="materials-mobile-drawer" id="materials-mobile-drawer" aria-label="Навигация по сайту" aria-hidden="true" inert>
      <div class="materials-mobile-drawer__wave" aria-hidden="true"></div>
      <div class="materials-mobile-drawer__top">
        <img src="assets/moex-logotype.svg" alt="MOEX Design" />
        <button class="materials-mobile-drawer__close" type="button" aria-label="Закрыть меню"><span aria-hidden="true">×</span></button>
      </div>
      <nav class="materials-mobile-drawer__links" aria-label="Разделы сайта">
        ${groups.map(([label, page, links], index) => `<div class="mobile-nav-group"><button class="mobile-nav-group__toggle" type="button" aria-expanded="false" aria-controls="mobile-nav-panel-${index}"><span>${label}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="mobile-nav-group__panel" id="mobile-nav-panel-${index}" inert><div><a href="${page}">Открыть раздел <span aria-hidden="true">↗</span></a>${links.map(([text, id]) => `<a href="${page}#${id}">${text}</a>`).join('')}</div></div></div>`).join('')}
      </nav>
      <span class="materials-mobile-drawer__badge materials-orbit-badge" role="img" aria-label="MOEX Design 2026">
        <img class="materials-orbit-badge__ring" src="assets/materials/mobile/footer-badge.svg" alt="" />
        <img class="materials-orbit-badge__mark" src="assets/materials/mobile/footer-badge.svg" alt="" />
      </span>
      <span class="materials-mobile-drawer__caption">2026</span>
    </aside>
    <button class="materials-mobile-drawer-dismiss" type="button" tabindex="-1" aria-label="Закрыть меню"></button>`;
  body.prepend(template.content);
  const menuToggle = document.querySelector('.materials-menu-toggle, .menu-button');
  const drawer = document.querySelector('.materials-mobile-drawer');
  drawer.querySelectorAll('.mobile-nav-group__toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      drawer.querySelectorAll('.mobile-nav-group__toggle').forEach(button => {
        const expanded = button === toggle && open;
        button.setAttribute('aria-expanded', String(expanded));
        button.parentElement.classList.toggle('is-expanded', expanded);
        document.getElementById(button.getAttribute('aria-controls')).inert = !expanded;
      });
    });
  });
  const drawerClose = drawer?.querySelector('.materials-mobile-drawer__close');
  const drawerDismiss = document.querySelector('.materials-mobile-drawer-dismiss');
  const drawerPageMain = document.querySelector('body > main');
  const drawerPageFooter = document.querySelector('body > .footer');
  const setMenuOpen = (open) => {
    if (!mobileViewport.matches) open = false;
    document.body.classList.toggle('is-menu-open', open);
    document.documentElement.classList.toggle('is-materials-drawer-open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    menuToggle?.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    drawer?.setAttribute('aria-hidden', String(!open));
    if (drawer) drawer.inert = !open;
    if (drawerPageMain) drawerPageMain.inert = open;
    if (drawerPageFooter) drawerPageFooter.inert = open;
    document.querySelectorAll('body > [data-site-header], body > .materials-site-header').forEach((header) => { header.inert = open; });
    if (open) window.setTimeout(() => {
      if (document.body.classList.contains('is-menu-open')) drawerClose?.focus({ preventScroll: true });
    }, 80);
  };
  const closeMenu = () => setMenuOpen(false);
  menuToggle?.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
  drawerClose?.addEventListener('click', () => { closeMenu(); menuToggle?.focus({ preventScroll: true }); });
  drawerDismiss?.addEventListener('click', () => { closeMenu(); menuToggle?.focus({ preventScroll: true }); });
  drawer?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('is-menu-open')) { closeMenu(); menuToggle?.focus({ preventScroll: true }); }
  });
  mobileViewport.addEventListener('change', closeMenu);

  menuToggle?.setAttribute('aria-controls', 'materials-mobile-drawer');
})();
