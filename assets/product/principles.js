(() => {
  const section = document.querySelector('.product-principles');
  if (!section) return;
  const cards = [...section.querySelectorAll('.pp-card')];
  const buttons = cards.map(card => card.querySelector('.pp-card__trigger'));
  const hover = matchMedia('(hover:hover) and (pointer:fine)');
  const mobile = matchMedia('(max-width:800px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const animations = new Map();
  let active = cards.findIndex(card => card.classList.contains('is-active'));
  // Keep copy at its final width while the surrounding swatch expands.
  const row = section.querySelector('.product-principles__cards');
  cards.forEach(card => {
    const label = document.createElement('span');
    label.className = 'pp-closed-label';
    label.textContent = card.querySelector('h3').textContent;
    label.setAttribute('aria-hidden', 'true');
    card.append(label);
    // Split on ordinary spaces only: prepositions joined by NBSP stay together.
    card.querySelectorAll('h3, .pp-card__detail p').forEach(element => {
      const text = element.textContent;
      const tokens = text.split(/([ \t\r\n]+)/);
      const count = tokens.filter(token => token && !/^[ \t\r\n]+$/.test(token)).length;
      const accessible = document.createElement('span');
      accessible.className = 'pp-text-readable';
      accessible.textContent = text;
      const visual = document.createElement('span');
      visual.className = 'pp-text-visual';
      visual.setAttribute('aria-hidden', 'true');
      let index = 0;
      tokens.forEach(token => {
        if (!token) return;
        if (/^[ \t\r\n]+$/.test(token)) {
          visual.append(document.createTextNode(token));
          return;
        }
        const word = document.createElement('span');
        word.className = 'pp-reveal-word';
        word.textContent = token;
        word.style.setProperty('--word-delay', Math.round(index++ * Math.min(35, 360 / Math.max(1, count - 1))) + 'ms');
        visual.append(word);
      });
      element.replaceChildren(accessible, visual);
      element.classList.add('pp-text-reveal');
    });
    const theme = ['clarity', 'system', 'trust', 'speed'].find(name => card.classList.contains('pp-card--' + name));
    const art = card.querySelector('.pp-card__art');
    const image = document.createElement('img');
    const illustrations = { clarity: 'radar', system: 'api', trust: 'gold', speed: 'trading-sessions' };
    image.src = 'assets/communication/' + illustrations[theme] + '.png';
    image.alt = '';
    image.draggable = false;
    art.replaceChildren(image);
    art.classList.add('pp-sculpture', 'pp-brand-art');
    const plus = document.createElement('span');
    plus.className = 'pp-plus';
    plus.setAttribute('aria-hidden', 'true');
    plus.textContent = '+';
    card.append(plus);
    const tags = card.querySelector('.pp-card__tags');
    if (tags) {
      card.append(tags);
      tags.setAttribute('aria-hidden', String(!card.classList.contains('is-active')));
    }
  });
  let elapsed = 0, last = 0, frame = 0, visible = false, pointed = false, touching = false;
  const duration = 6000;
  function canPlay() {
    return visible && !document.hidden && !pointed && !touching && !reducedMotion.matches &&
      !row.querySelector(':focus-visible');
  }
  function tick(time) {
    frame = 0;
    if (!canPlay()) { last = 0; return; }
    if (last) elapsed += Math.min(time - last, 100);
    last = time;
    if (elapsed >= duration) select((active + 1) % cards.length);
    row.style.setProperty('--pp-progress', String(elapsed / duration));
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; last = 0;
    if (canPlay()) frame = requestAnimationFrame(tick);
  }
  new IntersectionObserver(entries => { visible = entries[0].intersectionRatio >= .25; resume(); }, {threshold:[0,.25]}).observe(row);
  row.addEventListener('pointerenter', e => { if (hover.matches && e.pointerType !== 'touch') { pointed = true; resume(); } });
  row.addEventListener('pointerleave', () => { pointed = false; resume(); });
  row.addEventListener('pointerdown', () => { touching = true; resume(); });
  window.addEventListener('pointerup', () => { touching = false; resume(); });
  window.addEventListener('pointercancel', () => { touching = false; resume(); });
  row.addEventListener('focusin', resume);
  row.addEventListener('focusout', () => requestAnimationFrame(resume));
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);
  function sizeCopy() {
    const compact = matchMedia('(max-width:1100px)').matches;
    const ratio = compact ? 7 : 6;
    const width = (row.clientWidth - 36) * ratio / (ratio + 3) - 60;
    row.style.setProperty('--pp-copy-width', Math.max(180, width) + 'px');
  }
  new ResizeObserver(sizeCopy).observe(row);
  sizeCopy();
  buttons.forEach((button, i) => button.setAttribute('aria-expanded', String(i === active)));
  function resetMotion() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function select(index) {
    if (index === active) return;
    // Capture the current frame before cancelling: rapid taps stay continuous.
    const before = cards.map(card => ({
      height: card.getBoundingClientRect().height,
      copyTop: card.querySelector('.pp-card__copy').getBoundingClientRect().top - card.getBoundingClientRect().top
    }));
    resetMotion();
    active = index;
    elapsed = 0;
    row.style.setProperty('--pp-progress', '0');
    cards.forEach((card, i) => {
      const selected = i === index;
      card.classList.toggle('is-active', selected);
      buttons[i].setAttribute('aria-expanded', String(selected));
      card.querySelector('.pp-card__detail').hidden = !selected;
      card.querySelector('.pp-card__tags').setAttribute('aria-hidden', String(!selected));
    });
    if (reducedMotion.matches || !mobile.matches) return;
    cards.forEach((card, i) => {
      const copy = card.querySelector('.pp-card__copy');
      const rect = card.getBoundingClientRect();
      const target = mobile.matches ? card : copy;
      const frames = mobile.matches
        ? [{ height: `${before[i].height}px` }, { height: `${rect.height}px` }]
        : [{ transform: `translateY(${before[i].copyTop - (copy.getBoundingClientRect().top - rect.top)}px)` }, { transform: 'translateY(0)' }];
      const animation = target.animate(frames, { duration:700, easing:'cubic-bezier(.18,.8,.22,1)' });
      animations.set(card, animation);
      animation.onfinish = () => { if (animations.get(card) === animation) animations.delete(card); };
    });
  }
  mobile.addEventListener('change', resetMotion);
  reducedMotion.addEventListener('change', resetMotion);
  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', event => {
      if (hover.matches && !mobile.matches && event.pointerType !== 'touch') select(index);
    });
    buttons[index].addEventListener('click', () => select(index));
    buttons[index].addEventListener('focus', () => select(index));
    buttons[index].addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % cards.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + cards.length - 1) % cards.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = cards.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus({ preventScroll:true });
    });
  });
})();
