(() => {
  'use strict';

  const body = document.body;
  if (!body || document.querySelector('[data-moex-preloader]')) return;
  const componentBase = document.currentScript?.src
    ? new URL('.', document.currentScript.src)
    : new URL('assets/', document.baseURI);
  const asset = (name) => new URL(name, componentBase).href;

  const items = [
    ['DESIGNSYS', 'v3.0', '+120 компонентов'],
    ['ICON40', '40 экранов', '+12%'],
    ['SPEED', '2x быстрее', '+100%'],
    ['TOKENS', '1 200 фреймов', '+45%'],
    ['TOKENS', '360 токенов', '+60%'],
    ['A11Y', 'AA+', '+25%'],
    ['PHOTOS', '24 фото', '+6 новых']
  ];

  const tickerItems = items.map(([label, value, positive]) => `
    <span class="moex-preloader__ticker-cluster">
      <span class="moex-preloader__ticker-item"><strong>${label}</strong><span>${value}</span></span>
      <span class="moex-preloader__ticker-item moex-preloader__ticker-item--positive"><span>${positive}</span></span>
    </span>`).join('');

  const preloader = document.createElement('div');
  preloader.className = 'moex-preloader';
  preloader.dataset.moexPreloader = '';
  preloader.setAttribute('role', 'status');
  preloader.setAttribute('aria-label', 'Загрузка MOEX Design');
  preloader.innerHTML = `
    <div class="moex-preloader__gradient" aria-hidden="true">
      <canvas class="moex-preloader__gradient-canvas"></canvas>
    </div>
    <div class="moex-preloader__stage">
      <div class="moex-preloader__counter" aria-hidden="true">
        <span class="moex-preloader__slot moex-preloader__slot--tens is-empty"><span class="moex-preloader__digit">0</span></span>
        <span class="moex-preloader__slot moex-preloader__slot--units"><span class="moex-preloader__digit">0</span></span>
        <span class="moex-preloader__percent">%</span>
      </div>
      <span class="moex-preloader__value" aria-live="polite">Загрузка 0 процентов</span>
      <div class="moex-preloader__mark" aria-hidden="true">
        <img class="moex-preloader__mark-piece moex-preloader__mark-piece--left" src="${asset('moex-logotype-left.svg')}" alt="" />
        <img class="moex-preloader__mark-piece moex-preloader__mark-piece--right" src="${asset('moex-logotype-right.svg')}" alt="" />
      </div>
      <div class="moex-preloader__logo-text" aria-hidden="true"><img src="${asset('moex-logotype.svg')}" alt="" /></div>
    </div>
    <div class="moex-preloader__veil" aria-hidden="true"></div>
    <div class="moex-preloader__ticker" aria-hidden="true">
      <div class="moex-preloader__ticker-track">
        <div class="moex-preloader__ticker-group">${tickerItems}</div>
        <div class="moex-preloader__ticker-group">${tickerItems}</div>
      </div>
    </div>
    <div class="moex-preloader__scroll-cue" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" focusable="false">
        <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`;

  body.prepend(preloader);

  let gradient = null;
  const startGradient = () => {
    if (gradient) return;
    gradient = window.MOEXAnimatedGradient?.mount(
      preloader.querySelector('.moex-preloader__gradient-canvas')
    );
    preloader.classList.add('is-gradient-ready');
  };
  const tens = preloader.querySelector('.moex-preloader__slot--tens');
  const units = preloader.querySelector('.moex-preloader__slot--units');
  const accessibleValue = preloader.querySelector('.moex-preloader__value');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
  let ready = false;
  let leaving = false;
  let scrollIntent = false;
  let touchStartY = 0;

  const animateDigit = (slot, value, duration) => {
    const current = slot.lastElementChild;
    if (current?.textContent === value) return;

    const next = document.createElement('span');
    next.className = 'moex-preloader__digit';
    next.textContent = value;
    slot.append(next);

    current?.animate([
      { transform: 'translate3d(0,0,0)', opacity: 1 },
      { transform: 'translate3d(0,-115%,0)', opacity: .16 }
    ], { duration, easing: 'cubic-bezier(.55,0,.45,1)', fill: 'forwards' });

    const incoming = next.animate([
      { transform: 'translate3d(0,115%,0)', opacity: .16 },
      { transform: 'translate3d(0,0,0)', opacity: 1 }
    ], { duration, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });

    incoming.finished.then(() => {
      if (next !== slot.lastElementChild) return;
      slot.replaceChildren(next);
      next.style.transform = 'translate3d(0,0,0)';
      next.style.opacity = '1';
    }).catch(() => {});
  };

  const setValue = (value, duration) => {
    const tensValue = value >= 10 ? String(Math.floor(value / 10)) : '';
    const unitsValue = String(value % 10);
    const previousTens = tens.dataset.value || '';

    if (tensValue) {
      tens.classList.remove('is-empty');
      if (previousTens !== tensValue) animateDigit(tens, tensValue, duration);
    } else {
      tens.classList.add('is-empty');
    }

    tens.dataset.value = tensValue;
    animateDigit(units, unitsValue, duration);
    if (value % 10 === 0 || value === 99) {
      accessibleValue.textContent = `Загрузка ${value} процентов`;
    }
  };

  const removeIntentListeners = () => {
    window.removeEventListener('wheel', onScrollIntent);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onScrollIntent);
    window.removeEventListener('keydown', onKeyIntent);
  };

  const finish = () => {
    if (leaving) return;
    leaving = true;
    removeIntentListeners();
    preloader.classList.add('is-leaving');
    body.classList.add('is-site-entering', 'has-site-ticker');

    window.setTimeout(() => {
      gradient?.destroy();
      preloader.classList.add('is-site-shell');
      preloader.removeAttribute('role');
      preloader.setAttribute('aria-hidden', 'true');
      body.classList.remove('is-preloader-active', 'is-site-entering');
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      document.dispatchEvent(new CustomEvent('moex:preloader-complete'));
    }, reducedMotion ? 80 : 1120);
  };

  function onScrollIntent(event) {
    if (event.type === 'wheel' && event.deltaY <= 0) return;
    if (event.type === 'touchmove' && event.touches?.[0]?.clientY >= touchStartY) return;
    if (event.cancelable) event.preventDefault();
    scrollIntent = true;
    if (ready) finish();
  }

  function onTouchStart(event) {
    touchStartY = event.touches?.[0]?.clientY || 0;
  }

  function onKeyIntent(event) {
    if (!['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) return;
    event.preventDefault();
    scrollIntent = true;
    if (ready) finish();
  }

  window.addEventListener('wheel', onScrollIntent, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onScrollIntent, { passive: false });
  window.addEventListener('keydown', onKeyIntent);

  const run = async () => {
    if (reducedMotion) {
      startGradient();
      preloader.classList.add('is-mark-arriving', 'is-counter-complete', 'is-logo-ready', 'is-marquee-ready');
      ready = true;
      return;
    }

    await wait(180);
    for (let value = 1; value <= 99; value += 1) {
      const progress = value / 99;
      const stepDuration = Math.round((30 + 77 * ((1 - progress) ** 4)) / 3);
      setValue(value, Math.max(8, Math.round(stepDuration * .72)));
      if (value === 97) preloader.classList.add('is-mark-arriving');
      await wait(stepDuration);
    }

    await wait(160);
    startGradient();
    preloader.classList.add('is-counter-complete');
    await wait(340);
    preloader.classList.add('is-logo-ready', 'is-marquee-ready');
    await wait(760);
    ready = true;
    accessibleValue.textContent = 'MOEX Design загружен. Прокрутите вниз, чтобы открыть сайт.';
    document.dispatchEvent(new CustomEvent('moex:preloader-ready'));

    if (scrollIntent) {
      window.setTimeout(finish, 260);
    }
  };

  window.MOEXPreloader = { finish };
  run().catch(finish);
})();
