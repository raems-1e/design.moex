(() => {
  const hero = document.querySelector('.product-hero');
  if (!hero) return;
  const measure = () => {
    const mobile = window.matchMedia('(max-width:800px)').matches;
    const scale = Math.min(1, hero.clientWidth / (mobile ? 750 : 1440));
    hero.style.setProperty('--product-hero-scale', scale);
    hero.style.height = `${102 + (mobile ? 900 : 621) * scale}px`;
  };
  measure();
  new ResizeObserver(measure).observe(hero);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  if (reducedMotion.matches) return;
  hero.classList.add('is-assembling');
  let started = false;
  const start = () => {
    if (started || document.hidden || document.body.classList.contains('is-preloader-active')) return;
    started = true;
    requestAnimationFrame(() => hero.classList.add('is-playing'));
    document.removeEventListener('visibilitychange', start);
    document.removeEventListener('moex:preloader-complete', start);
  };
  document.addEventListener('moex:preloader-complete', start);
  document.addEventListener('visibilitychange', start);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      started = true;
      hero.classList.remove('is-assembling', 'is-playing');
      document.removeEventListener('visibilitychange', start);
      document.removeEventListener('moex:preloader-complete', start);
    }
  });
  start();
})();

// Decorative live CSS: bounded rows, paused offscreen and in background tabs.
(() => {
  const hero = document.querySelector('.product-hero');
  const code = hero?.querySelector('.ph-code--left');
  if (!code) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const mobile = matchMedia('(max-width:800px)');
  const lines = [
    '.ph-card {', '  width: 240px;', '  height: 240px;',
    '  padding: 28px;', '  border-radius: 32px;',
    '  backdrop-filter: blur(10px);', '}',
    '.ph-circle {', '  width: 40px;', '  height: 40px;', '}',
    '.ph-skeleton {', '  display: flex;', '  flex-direction: column;',
    '  gap: 12px;', '}', '.ph-glass {', '  border-radius: 44px;',
    '  backdrop-filter: blur(18px);', '}'
  ];
  let frame = 0, last = 0, elapsed = 0, phase = 'entrance', index = 0;
  let visible = false, hiddenPage = false, nextLine = '', typed = -1;
  const normalize = () => {
    const count = mobile.matches ? 4 : 5;
    while (code.children.length > count) code.firstElementChild.remove();
    while (code.children.length < count) {
      const row = document.createElement('span');
      row.textContent = lines[index++ % lines.length];
      code.prepend(row);
    }
  };
  const tick = now => {
    frame = 0;
    elapsed += last ? Math.min(now - last, 80) : 0;
    last = now;
    if (phase === 'entrance' && elapsed >= 4500) {
      code.classList.add('is-live');
      normalize();
      phase = 'hold'; elapsed = 0;
    } else if (phase === 'hold' && elapsed >= 1100) {
      phase = 'shift'; elapsed = 0;
    } else if (phase === 'shift') {
      const progress = Math.min(elapsed / 850, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const step = mobile.matches ? 24 : 20;
      [...code.children].forEach((row, i) => {
        row.style.transform = `translateY(${-step * eased}px)`;
        row.style.opacity = i === 0 ? String(1 - eased) : '1';
      });
      if (progress === 1) {
        code.firstElementChild.remove();
        [...code.children].forEach(row => { row.style.transform = ''; row.style.opacity = ''; });
        const row = document.createElement('span');
        row.className = 'is-typing';
        code.append(row);
        nextLine = lines[index++ % lines.length];
        typed = -1; phase = 'type'; elapsed = 0;
      }
    } else if (phase === 'type') {
      const length = Math.min(nextLine.length, Math.floor(elapsed / 48));
      if (length !== typed) { code.lastElementChild.textContent = nextLine.slice(0, length); typed = length; }
      if (length === nextLine.length) {
        code.lastElementChild.classList.remove('is-typing');
        phase = 'hold'; elapsed = 0;
      }
    }
    frame = requestAnimationFrame(tick);
  };
  const update = () => {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (reduced.matches) {
      [...code.children].forEach(row => {
        row.style.transform = ''; row.style.opacity = ''; row.classList.remove('is-typing');
      });
      if (phase === 'type') code.lastElementChild.textContent = nextLine;
      if (phase !== 'entrance') { phase = 'hold'; elapsed = 0; }
      return;
    }
    if (visible && !document.hidden && !hiddenPage && !document.body.classList.contains('is-preloader-active')) {
      frame = requestAnimationFrame(tick);
    }
  };
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(hero);
  document.addEventListener('visibilitychange', update);
  document.addEventListener('moex:preloader-complete', update);
  reduced.addEventListener('change', update);
  mobile.addEventListener('change', () => {
    if (code.classList.contains('is-live')) {
      if (phase === 'type') code.lastElementChild.textContent = nextLine;
      [...code.children].forEach(row => { row.style.transform = ''; row.style.opacity = ''; row.classList.remove('is-typing'); });
      normalize(); phase = 'hold'; elapsed = 0;
    }
    update();
  });
  window.addEventListener('pagehide', () => { hiddenPage = true; update(); });
  window.addEventListener('pageshow', () => { hiddenPage = false; update(); });
})();
