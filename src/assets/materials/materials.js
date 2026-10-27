(() => {
  'use strict';

  const mobileViewport = window.matchMedia('(max-width:760px)');

  // The mobile Figma ticker has its own content and a 40-second timeline.
  const tickerGroups = [...document.querySelectorAll('.moex-preloader__ticker-group')];
  const desktopTicker = tickerGroups.map((group) => group.innerHTML);
  const mobileTickerItems = [
    ['DESIGNSYS', 'v3.0', '+120 компонентов'], ['REDSGN', '48 экранов', '+32%'],
    ['SPEED', '2x быстрее', '+100%'], ['FIGMALIB', '1 200 фреймов', '+45%'],
    ['TOKENS', '380 токенов', '+60%'], ['A11Y', 'AA+', '+25%'],
    ['PROTOS', '24 флоу', '+8 новых'], ['UXRSRCH', '52 исследования', '+18%'],
    ['ICONSET', '640 иконок', '+210']
  ];
  const mobileTicker = mobileTickerItems.map(([label, value, badge]) =>
    `<span class="moex-preloader__ticker-cluster"><span class="moex-preloader__ticker-item"><strong>${label}</strong><span>${value}</span></span><span class="moex-preloader__ticker-item moex-preloader__ticker-item--positive"><span>${badge}</span></span></span>`
  ).join('');
  const syncTicker = () => tickerGroups.forEach((group, index) => {
    group.innerHTML = mobileViewport.matches ? mobileTicker : desktopTicker[index];
  });
  syncTicker();
  mobileViewport.addEventListener('change', syncTicker);

  const groupLogos = [
    { id: 'moex', name: 'Московская Биржа', src: 'assets/materials/group-logos/moex.png' },
    { id: 'group', name: 'MOEX Group', src: 'assets/materials/group-logos/moex-group.png' },
    { id: 'ncc', name: 'Национальный клиринговый центр', src: 'assets/materials/group-logos/ncc.png' },
    { id: 'nsd', name: 'Национальный расчётный депозитарий', src: 'assets/materials/group-logos/nsd.png' },
    { id: 'school', name: 'Школа Московской Биржи', src: 'assets/materials/group-logos/moex-school.png' },
    { id: 'academy', name: 'Академия для эмитентов', src: 'assets/materials/group-logos/moex-academy.png' }
  ];

  const logoById = Object.fromEntries(groupLogos.map((logo) => [logo.id, logo]));
  const marqueeRows = [
    { direction: 'right', logos: ['group', 'academy', 'moex', 'nsd', 'ncc', 'group'].map((id) => logoById[id]) },
    { direction: 'left', logos: ['school', 'moex', 'ncc', 'group', 'academy', 'nsd'].map((id) => logoById[id]) }
  ];

  const createLogoMiniCard = (logo) => {
    const card = document.createElement('figure');
    card.className = 'group-logos-wall__card';
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', `Логотип: ${logo.name}`);
    card.style.setProperty('--group-logo-image', `url("${new URL(logo.src, document.baseURI).href}")`);
    return card;
  };

  const createLogoMarqueeRow = ({ direction, logos }) => {
    const row = document.createElement('div');
    const track = document.createElement('div');
    const createSet = (isDuplicate = false) => {
      const set = document.createElement('div');
      set.className = 'group-logos-wall__set';
      if (isDuplicate) set.setAttribute('aria-hidden', 'true');
      logos.forEach((logo) => set.append(createLogoMiniCard(logo)));
      return set;
    };

    row.className = `group-logos-wall__row group-logos-wall__row--${direction}`;
    track.className = 'group-logos-wall__track';
    track.append(createSet(), createSet(true));
    row.append(track);
    return row;
  };

  document.querySelectorAll('[data-group-logos-wall]').forEach((wall) => {
    marqueeRows.forEach((row) => wall.append(createLogoMarqueeRow(row)));
  });

  const downloads = window.MOEX_MATERIAL_DOWNLOADS || {};
  document.querySelectorAll('[data-download-key]').forEach((link) => {
    const url = downloads[link.dataset.downloadKey];
    if (url) {
      link.href = url;
      link.removeAttribute('aria-disabled');
      return;
    }
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (event) => event.preventDefault());
  });

  const nav = document.querySelector('[data-materials-nav]');
  const kitHeader = nav?.closest('.materials-header');
  const kitHero = document.querySelector('.materials-hero');
  const kitFooter = document.querySelector('footer.footer');
  if (kitHeader && kitHero) {
    const slot = document.createElement('div');
    slot.className = 'materials-nav-slot';
    kitHeader.before(slot);
    slot.append(kitHeader);
    const main = document.querySelector('.materials-main');
    let docked = false;
    let switching = false;
    const dockReducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
    let dockFrame = 0;
    const switchDock = async (nextDocked) => {
      switching = true;
      const reduced = dockReducedMotion.matches;
      const fromTransform = docked ? 'translate(-50%,0)' : 'translateY(0)';
      const toTransform = docked ? 'translate(-50%,14px)' : 'translateY(-8px)';
      if (!reduced) {
        const outgoing = kitHeader.animate([
          {opacity:1, transform:fromTransform},
          {opacity:0, transform:toTransform}
        ], {duration:220, easing:'cubic-bezier(.4,0,1,1)', fill:'forwards'});
        await outgoing.finished;
        outgoing.cancel();
      }
      if (nextDocked) {
        slot.style.height = `${kitHeader.offsetHeight}px`;
        document.body.append(kitHeader);
      } else {
        slot.append(kitHeader);
        slot.style.height = '';
      }
      docked = nextDocked;
      kitHeader.classList.toggle('is-bottom-dock', docked);
      syncNavIndicator();
      updateDock();
      if (!reduced && !kitHeader.inert) {
        const incoming = kitHeader.animate([
          {opacity:0, transform:docked ? 'translate(-50%,18px)' : 'translateY(-8px)'},
          {opacity:1, transform:docked ? 'translate(-50%,0)' : 'translateY(0)'}
        ], {duration:480, easing:'cubic-bezier(.22,1,.36,1)'});
        await incoming.finished;
      }
      switching = false;
      queueDock();
    };
    const updateDock = () => {
      dockFrame = 0;
      const headerHeight = mobileViewport.matches ? 70 : 90;
      const tickerHeight = document.body.classList.contains('has-site-ticker') ? 44 : 0;
      const shouldDock = slot.getBoundingClientRect().bottom <= headerHeight + tickerHeight;
      if (shouldDock !== docked && !switching) switchDock(shouldDock);
      // A fixed footer sits behind main even at the top of the page.
      const footerEdge = kitFooter?.classList.contains('footer--sticky') && main
        ? main.getBoundingClientRect().bottom : kitFooter?.getBoundingClientRect().top;
      const footerVisible = footerEdge != null && footerEdge < window.innerHeight;
      const visible = !docked || (!document.body.classList.contains('is-preloader-active') && !footerVisible);
      kitHeader.classList.toggle('is-dock-visible', visible);
      kitHeader.inert = !visible;
      kitHeader.setAttribute('aria-hidden', String(!visible));
    };
    const queueDock = () => { if (!dockFrame) dockFrame = requestAnimationFrame(updateDock); };
    addEventListener('scroll', queueDock, {passive:true});
    addEventListener('resize', queueDock);
    document.addEventListener('moex:preloader-complete', queueDock);
    queueDock();
  }
  const navLinks = [...document.querySelectorAll('[data-materials-nav] .materials-nav__scroller a[href^="#"]')];
  const sections = [...document.querySelectorAll('[data-materials-section]')];
  const navScroller = nav?.querySelector('.materials-nav__scroller');
  let navIndicator;
  const syncNavIndicator = () => {
    const active = navLinks.find((link) => link.classList.contains('is-active'));
    if (!active || !navIndicator) return;
    navIndicator.style.width = `${active.offsetWidth}px`;
    navIndicator.style.height = `${active.offsetHeight}px`;
    navIndicator.style.transform = `translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    if (active.offsetLeft < navScroller.scrollLeft + 8 || active.offsetLeft + active.offsetWidth > navScroller.scrollLeft + navScroller.clientWidth - 8) {
      navScroller.scrollTo({ left: active.offsetLeft - (navScroller.clientWidth - active.offsetWidth) / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  if (navScroller && navLinks.length) {
    navIndicator = document.createElement('span');
    navIndicator.className = 'materials-nav__indicator';
    navIndicator.setAttribute('aria-hidden', 'true');
    navScroller.prepend(navIndicator);
    syncNavIndicator();
    navScroller.classList.add('has-motion-pill');
    requestAnimationFrame(() => navIndicator.classList.add('is-ready'));
    window.addEventListener('resize', syncNavIndicator, { passive: true });
    document.fonts?.ready.then(syncNavIndicator);
  }
  if (nav && navLinks.length && sections.length && 'IntersectionObserver' in window) {
    let userSelectedUntil = 0;
    const setActive = (id) => {
      navLinks.forEach((link) => {
        const active = link.hash === `#${id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      syncNavIndicator();
    };
    navLinks.forEach((link) => link.addEventListener('click', () => {
      userSelectedUntil = performance.now() + 1100;
      setActive(link.hash.slice(1));
    }));
    const observer = new IntersectionObserver((entries) => {
      if (performance.now() < userSelectedUntil) return;
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActive(current.target.id);
    }, { rootMargin: '-24% 0px -62%', threshold: [0.05, 0.3, 0.6] });
    sections.forEach((section) => observer.observe(section));
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealCards = [...document.querySelectorAll('.materials-logo-item,.materials-card')];
  let revealObserver;
  const startCardReveals = () => {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    revealCards.forEach((card, index) => {
      if (card.getBoundingClientRect().bottom <= 0) return;
      card.style.setProperty('--reveal-delay', `${index % 2 * 75}ms`);
      card.classList.add('materials-motion-reveal');
      revealObserver.observe(card);
    });
  };
  if (document.body.classList.contains('is-preloader-active')) {
    document.addEventListener('moex:preloader-complete', startCardReveals, { once: true });
  } else {
    startCardReveals();
  }
  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    revealObserver?.disconnect();
    revealCards.forEach((card) => card.classList.add('is-revealed'));
  });

  const pageMain = document.querySelector('.materials-main');
  const footer = document.querySelector('.footer');
  if (pageMain && footer) {
    const syncFooter = () => {
      const height = footer.offsetHeight;
      const canStick = window.innerWidth > 800 && height < window.innerHeight * .94;
      document.documentElement.style.setProperty('--footer-space', `${height}px`);
      footer.classList.toggle('footer--sticky', canStick);
      pageMain.classList.toggle('footer-is-sticky', canStick);
    };
    syncFooter();
    window.addEventListener('resize', syncFooter, { passive: true });

    // A tall mobile footer cannot be fixed like the desktop footer without
    // hiding its content, so counter its scroll slightly during the reveal.
    const mobileFooterMotion = window.matchMedia('(max-width:760px) and (prefers-reduced-motion:no-preference)');
    let footerMotionFrame = 0;
    const updateFooterMotion = () => {
      footerMotionFrame = 0;
      if (!mobileFooterMotion.matches || footer.classList.contains('footer--sticky')) {
        footer.style.removeProperty('--materials-footer-parallax');
        return;
      }
      const bounds = footer.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / bounds.height));
      footer.style.setProperty('--materials-footer-parallax', `${Math.sin(progress * Math.PI) * 56}px`);
    };
    const queueFooterMotion = () => {
      if (!footerMotionFrame) footerMotionFrame = window.requestAnimationFrame(updateFooterMotion);
    };
    queueFooterMotion();
    window.addEventListener('scroll', queueFooterMotion, { passive: true });
    window.addEventListener('resize', queueFooterMotion, { passive: true });
    mobileFooterMotion.addEventListener('change', queueFooterMotion);
  }
})();
