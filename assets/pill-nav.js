(() => {
  'use strict';
  const header = document.querySelector('[data-site-header], .materials-site-header');
  if (!header) return;
  const groups = [
    ['Коммуникационный дизайн', 'communication.html', [['Стиль', 'style'], ['Рекламные баннеры', 'banners'], ['Типографика', 'typography'], ['Конструктор', 'banner-builder'], ['Результаты', 'results'], ['Проекты', 'portfolio']]],
    ['Продуктовый дизайн', 'product.html', [['Технологии', 'technology'], ['Как мы проектируем', 'principles'], ['Стиль', 'style'], ['Кастомизация', 'customization'], ['Результаты', 'results'], ['Проекты', 'portfolio']]],
    ['Скачать материалы', 'materials.html', [['Логотипы', 'logos'], ['Фирменный шрифт', 'typography'], ['Брендбук', 'brandbook'], ['3D-иллюстрации', 'illustrations'], ['Иконки', 'icons'], ['Презентации и шаблоны', 'presentations']]]
  ];
  const nav = document.createElement('nav');
  nav.className = 'pill-nav';
  nav.setAttribute('aria-label', 'Основная навигация и разделы');
  const current = location.pathname.split('/').pop();
  nav.innerHTML = `<div class="pill-nav__bar">${groups.map(([label, page], index) => `<div class="pill-nav__item" data-group="${index}"><a class="pill-nav__page" href="${page}"${current === page ? ' aria-current="page"' : ''}>${label}</a><button class="pill-nav__toggle" type="button" aria-label="Разделы: ${label}" aria-expanded="false" aria-controls="pill-panel-${index}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 6.5 3 3 3-3"/></svg></button></div>`).join('')}</div><div class="pill-nav__drawer">${groups.map(([label, page, links], index) => `<div class="pill-nav__panel" id="pill-panel-${index}" aria-label="${label}" aria-hidden="true" inert>${links.map(([text, id], order) => `<a href="${current === page ? '' : page}#${id}" style="--order:${order}"><span>${text}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>`).join('')}</div>`;
  nav.querySelectorAll('.pill-nav__panel a > span:last-child').forEach(icon => {
    icon.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg>';
  });
  header.append(nav);
  header.classList.add('has-pill-nav');
  const items = [...nav.querySelectorAll('.pill-nav__item')];
  const panels = [...nav.querySelectorAll('.pill-nav__panel')];
  const desktop = matchMedia(document.body.classList.contains('materials-page') ? '(min-width:761px)' : '(min-width:801px)');
  let active = -1;
  let closeTimer;
  function show(index) {
    clearTimeout(closeTimer);
    if (!desktop.matches) index = -1;
    active = index;
    nav.classList.toggle('is-open', index >= 0);
    items.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      item.querySelector('button').setAttribute('aria-expanded', String(i === index));
      panels[i].classList.toggle('is-active', i === index);
      panels[i].inert = i !== index;
      panels[i].setAttribute('aria-hidden', String(i !== index));
    });
    nav.style.setProperty('--drawer-height', index >= 0 ? `${panels[index].scrollHeight}px` : '0px');
  }
  items.forEach((item, index) => {
    item.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(index); });
    item.querySelector('button').addEventListener('click', () => show(active === index ? -1 : index));
    item.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        show(index);
        panels[index].querySelector('a').focus();
      }
    });
  });
  nav.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  nav.addEventListener('pointerleave', () => {
    if (!nav.contains(document.activeElement)) closeTimer = setTimeout(() => show(-1), 160);
  });
  nav.addEventListener('focusout', event => { if (!nav.contains(event.relatedTarget)) show(-1); });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active >= 0) {
      const button = items[active].querySelector('button');
      show(-1);
      button.focus();
    }
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) show(-1); });
  document.addEventListener('pointerdown', event => { if (!nav.contains(event.target)) show(-1); });
  desktop.addEventListener('change', () => show(-1));
  window.addEventListener('resize', () => { if (active >= 0) show(active); });

  const bar = nav.querySelector('.pill-nav__bar');
  bar.id = 'pill-full-navigation';
  const compact = document.createElement('button');
  compact.className = 'pill-nav__compact';
  compact.type = 'button';
  compact.setAttribute('aria-label', 'Развернуть навигацию');
  compact.setAttribute('aria-controls', bar.id);
  compact.innerHTML = '<span class="pill-nav__section-label"></span><span class="pill-nav__more" aria-hidden="true"><i></i><i></i><i></i></span>';
  nav.append(compact);
  nav.classList.add('pill-nav--island');
  if (header.classList.contains('materials-site-header')) {
    const spacer = document.createElement('div');
    spacer.className = 'materials-island-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    header.before(spacer);
    document.body.prepend(header);
  }
  const sectionLabel = compact.querySelector('.pill-nav__section-label');
  const pageGroup = groups.find(group => group[1] === current);
  const sectionLinks = pageGroup ? pageGroup[2] : [['Команда', 'structure'], ['Результаты', 'results'], ['Проекты', 'portfolio']];
  const sections = sectionLinks.map(([label, id]) => ({label, element:document.getElementById(id)})).filter(item => item.element);
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let expanded = false, scrolled = false, scrollFrame = 0, collapseTimer;
  let currentLabel = '';
  let currentLabelNode;
  function setSectionLabel(label) {
    if (currentLabel === label) return;
    currentLabel = label;
    compact.setAttribute('aria-label', `${label} — развернуть навигацию`);
    sectionLabel.querySelectorAll('[data-outgoing]').forEach(node => {
      node.getAnimations().forEach(animation => animation.cancel());
      node.remove();
    });
    const previous = currentLabelNode;
    const next = document.createElement('span');
    next.className = 'pill-nav__label-text';
    next.textContent = label;
    next.setAttribute('aria-hidden', 'true');
    sectionLabel.append(next);
    currentLabelNode = next;
    if (reduced.matches || !previous || !nav.classList.contains('is-compact')) {
      previous?.getAnimations().forEach(animation => animation.cancel());
      previous?.remove();
      return;
    }
    const previousStyle = getComputedStyle(previous);
    const from = {opacity:previousStyle.opacity,transform:previousStyle.transform,filter:previousStyle.filter};
    previous.getAnimations().forEach(animation => animation.cancel());
    previous.dataset.outgoing = '';
    const outgoing = previous.animate([from,{opacity:0,transform:'translateY(-9px)',filter:'blur(2px)'}], {duration:360,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    outgoing.finished.then(() => previous.remove()).catch(() => {});
    next.animate([{opacity:0,transform:'translateY(9px)',filter:'blur(3px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}], {duration:600,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  function syncIsland() {
    const collapsed = desktop.matches && scrolled && !expanded;
    nav.classList.toggle('is-compact', collapsed);
    compact.inert = !collapsed;
    compact.setAttribute('aria-expanded', String(!collapsed));
    bar.inert = collapsed;
    bar.setAttribute('aria-hidden', String(collapsed));
    if (collapsed) show(-1);
  }
  function updateIsland() {
    scrollFrame = 0;
    scrolled = window.scrollY > 120;
    let label = pageGroup ? pageGroup[0] : 'Главная';
    const marker = innerHeight * .3;
    sections.forEach(section => { if (section.element.getBoundingClientRect().top <= marker) label = section.label; });
    setSectionLabel(label);
    if (desktop.matches) {
      const labelWidth = Math.ceil(currentLabelNode.scrollWidth) + 26;
      sectionLabel.style.width = `${labelWidth}px`;
      nav.style.setProperty('--island-compact-width', `${labelWidth + 60}px`);
    }
    syncIsland();
  }
  function measureIsland() {
    if (desktop.matches) {
      nav.style.setProperty('--island-width', `${bar.scrollWidth}px`);
      nav.style.setProperty('--island-height', `${bar.offsetHeight}px`);
    }
    updateIsland();
  }
  function expandIsland(focus = false) {
    clearTimeout(collapseTimer);
    expanded = true;
    syncIsland();
    if (focus) bar.querySelector('a').focus();
  }
  compact.addEventListener('click', () => expandIsland(true));
  nav.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') expandIsland(); });
  nav.addEventListener('pointerleave', () => {
    collapseTimer = setTimeout(() => {
      if (!nav.contains(document.activeElement)) { expanded = false; syncIsland(); }
    }, 240);
  });
  nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) { expanded = false; syncIsland(); }
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && scrolled) { expanded = false; syncIsland(); compact.focus(); }
  });
  document.addEventListener('pointerdown', event => {
    if (!nav.contains(event.target)) { expanded = false; syncIsland(); }
  });
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateIsland);
  }, {passive:true});
  window.addEventListener('resize', measureIsland);
  desktop.addEventListener('change', measureIsland);
  const enableIslandMotion = () => {
    measureIsland();
    requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('is-island-ready')));
  };
  if (document.fonts) document.fonts.ready.then(enableIslandMotion);
  else enableIslandMotion();
  measureIsland();
})();
