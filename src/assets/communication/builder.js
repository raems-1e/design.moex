(() => {
  const root = document.querySelector('.banner-builder');
  if (!root) return;
  const stage = root.querySelector('.banner-builder__stage');
  const preview = root.querySelector('.builder-preview');
  const art = preview.querySelector('.builder-preview__art');
  const illustrations = [
    ['trading-sessions', 'Торговые сессии'], ['rate', 'Процентная ставка'],
    ['candles', 'Биржевые котировки'], ['gold', 'Золото'], ['api', 'API НРД'],
    ['silver', 'Серебро'], ['auction', 'Аукцион открытия'],
    ['gold-mini', 'Мини-фьючерс на золото'], ['radar', 'Трейд-радар'], ['currency', 'Валютные облигации']
  ];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const carousel = document.createElement('div');
  carousel.className = 'builder-gallery';
  carousel.setAttribute('role', 'group');
  carousel.setAttribute('aria-label', 'Выберите иллюстрацию для баннера');
  const buttons = illustrations.map(([file, label], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'builder-gallery__item';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(index === 2));
    const image = document.createElement('img');
    image.src = `assets/communication/${file}.png`;
    image.alt = '';
    image.draggable = false;
    button.append(image);
    carousel.append(button);
    return button;
  });
  root.querySelector('.banner-builder__settings').append(carousel);
  const radiusControl = document.createElement('div');
  radiusControl.className = 'builder-radius';
  radiusControl.innerHTML = '<div class="builder-radius__heading"><label for="banner-radius">Скругление</label><output for="banner-radius">4 px</output></div><div class="builder-radius__dial"><div class="builder-radius__window"><div class="builder-radius__ticks" aria-hidden="true">' + Array.from({ length: 49 }, (_, index) => {
    const value = index - 12;
    return `<i style="left:${value * 14}px" class="${value % 4 === 0 ? 'is-major' : ''} ${value < 0 || value > 24 ? 'is-outside' : ''}">${value >= 0 && value <= 24 && value % 4 === 0 ? `<span>${value}</span>` : ''}</i>`;
  }).join('') + '</div></div><span class="builder-radius__indicator" aria-hidden="true"></span><input id="banner-radius" type="range" min="0" max="24" step="1" value="4" aria-valuetext="4 px" /></div>';
  carousel.after(radiusControl);
  const radiusInput = radiusControl.querySelector('input');
  const radiusOutput = radiusControl.querySelector('output');
  function updateRadius() {
    const value = Number(radiusInput.value);
    preview.style.setProperty('--banner-radius', `${value}px`);
    radiusControl.style.setProperty('--radius-offset', `${-value * 14}px`);
    radiusOutput.value = `${value} px`;
    radiusInput.setAttribute('aria-valuetext', `${value} px`);
  }
  radiusInput.addEventListener('input', updateRadius);
  let radiusDrag = null;
  let radiusFrame = 0;
  const stopRadiusMotion = () => {
    cancelAnimationFrame(radiusFrame);
    radiusControl.classList.remove('is-coasting');
  };
  radiusInput.addEventListener('keydown', () => {
    stopRadiusMotion();
    radiusControl.classList.remove('is-pointer');
  });
  radiusInput.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    stopRadiusMotion();
    radiusControl.classList.add('is-pointer');
    radiusInput.focus({ preventScroll: true });
    radiusDrag = { x: event.clientX, value: Number(radiusInput.value), lastX: event.clientX, time: performance.now(), velocity: 0, current: Number(radiusInput.value) };
    radiusInput.setPointerCapture(event.pointerId);
    radiusControl.classList.add('is-dragging');
  });
  radiusInput.addEventListener('pointermove', event => {
    if (!radiusDrag) return;
    const value = Math.max(0, Math.min(24, radiusDrag.value - (event.clientX - radiusDrag.x) / 14));
    const now = performance.now();
    radiusDrag.velocity = -(event.clientX - radiusDrag.lastX) / 14 / Math.max(8, now - radiusDrag.time);
    radiusDrag.lastX = event.clientX;
    radiusDrag.time = now;
    radiusDrag.current = value;
    radiusInput.value = Math.round(value);
    updateRadius();
    radiusControl.style.setProperty('--radius-offset', `${-value * 14}px`);
  });
  const finishRadiusDrag = event => {
    if (!radiusDrag) return;
    const drag = radiusDrag;
    radiusDrag = null;
    radiusControl.classList.remove('is-dragging');
    const coast = event.type === 'pointerup' && !reducedMotion.matches && performance.now() - drag.time < 120
      ? Math.max(-3, Math.min(3, drag.velocity * 115)) : 0;
    const target = Math.round(Math.max(0, Math.min(24, drag.current + coast)));
    if (Math.abs(target - drag.current) < .05 || !coast) { updateRadius(); return; }
    const start = performance.now();
    radiusControl.classList.add('is-coasting');
    const animate = now => {
      const t = Math.min(1, (now - start) / 360);
      const value = drag.current + (target - drag.current) * (1 - Math.pow(1 - t, 3));
      radiusInput.value = Math.round(value);
      updateRadius();
      radiusControl.style.setProperty('--radius-offset', `${-value * 14}px`);
      wheelValue = value;
      if (t < 1) radiusFrame = requestAnimationFrame(animate);
      else { radiusControl.classList.remove('is-coasting'); updateRadius(); }
    };
    radiusFrame = requestAnimationFrame(animate);
  };
  radiusInput.addEventListener('pointerup', finishRadiusDrag);
  radiusInput.addEventListener('pointercancel', finishRadiusDrag);
  radiusInput.addEventListener('lostpointercapture', finishRadiusDrag);
  let wheelValue = 4;
  radiusInput.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    stopRadiusMotion();
    radiusControl.classList.add('is-pointer');
    wheelValue = Math.max(0, Math.min(24, wheelValue + event.deltaX / 28));
    radiusInput.value = Math.round(wheelValue);
    updateRadius();
  }, { passive: false });
  radiusInput.addEventListener('input', () => { wheelValue = Number(radiusInput.value); });
  radiusInput.addEventListener('pointerup', () => { wheelValue = Number(radiusInput.value); });
  updateRadius();
  let selected = 2;
  let manualScroll = false;
  carousel.addEventListener('wheel', () => { manualScroll = true; }, { passive: true });
  let selectionVersion = 0;
  let artAnimation;
  async function select(index) {
    if (selected === index) return;
    selected = index;
    const version = ++selectionVersion;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const source = buttons[index].querySelector('img');
    try { await source.decode(); } catch { return; }
    if (version !== selectionVersion) return;
    artAnimation?.cancel();
    if (!reducedMotion.matches) {
      artAnimation = art.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
      try { await artAnimation.finished; } catch { return; }
    }
    if (version !== selectionVersion) return;
    art.src = source.src;
    artAnimation?.cancel();
    if (!reducedMotion.matches) artAnimation = art.animate([{ opacity: 0, transform: 'translateY(8px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.18,.9,.28,1)' });
    update(true);
  }
  function center(index, smooth = true) {
    manualScroll = false;
    carousel.scrollTo({ left: buttons[index].offsetLeft - carousel.clientWidth / 2 + buttons[index].offsetWidth / 2, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
  }
  let scrollTimer;
  carousel.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!manualScroll) return;
      const middle = carousel.scrollLeft + carousel.clientWidth / 2;
      const nearest = buttons.reduce((best, button, index) => Math.abs(button.offsetLeft + button.offsetWidth / 2 - middle) < Math.abs(buttons[best].offsetLeft + buttons[best].offsetWidth / 2 - middle) ? index : best, 0);
      select(nearest);
    }, 100);
  }, { passive: true });
  let drag = null;
  let dragged = false;
  carousel.addEventListener('pointerdown', event => {
    manualScroll = true;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, scroll: carousel.scrollLeft };
    dragged = false;
  });
  carousel.addEventListener('pointermove', event => {
    if (!drag) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 5) {
      dragged = true;
      carousel.classList.add('is-dragging');
      carousel.setPointerCapture(event.pointerId);
      carousel.scrollLeft = drag.scroll - distance;
    }
  });
  const endDrag = () => { drag = null; carousel.classList.remove('is-dragging'); };
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);
  carousel.addEventListener('click', event => { if (dragged) { event.preventDefault(); event.stopPropagation(); dragged = false; } }, true);
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => { select(index); center(index); });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
      buttons[next].focus({ preventScroll: true }); select(next); center(next);
    });
  });
  const formats = { square: [1, 'Квадратный 1:1', 400], landscape: [2, 'Горизонтальный 2:1', 520], portrait: [2 / 3, 'Вертикальный 2:3', 360] };
  const colors = { blue: 'голубая', beige: 'бежевая', red: 'красная' };
  function update(announce = false) {
    const format = root.querySelector('[name="banner-format"]:checked').value;
    const color = root.querySelector('[name="banner-color"]:checked').value;
    const [ratio, label, maxWidth] = formats[format];
    const width = Math.min(maxWidth, stage.clientWidth - 56, (stage.clientHeight - 90) * ratio);
    const height = width / ratio;
    preview.dataset.format = format;
    preview.dataset.color = color;
    preview.style.setProperty('--preview-width', `${width}px`);
    preview.style.setProperty('--preview-height', `${height}px`);
    preview.style.setProperty('--logo-scale', Math.min(1, height * (format === 'landscape' ? .09 : .055) / 24));
    preview.style.setProperty('--title-scale', Math.min(1, width * (format === 'landscape' ? .35 : .8) / 208, height * (format === 'landscape' ? .35 : .12) / 62));
    const description = `${label}, ${colors[color]} подложка, ${illustrations[selected][1]}`;
    preview.setAttribute('aria-label', `Макет баннера: ${description}`);
    if (announce) root.querySelector('.builder-status').textContent = description;
  }
  root.addEventListener('change', () => update(true));
  const resizeObserver = new ResizeObserver(() => { update(); center(selected, false); });
  resizeObserver.observe(stage);
  resizeObserver.observe(carousel);
  update();
})();
