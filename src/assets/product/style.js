(() => {
  const section = document.querySelector('.product-style');
  if (!section) return;
  let visible = false;
  const update = () => section.classList.toggle('is-motion-paused', !visible || document.hidden);
  update();
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }, { rootMargin:'100px' });
  observer.observe(section);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', () => section.classList.add('is-motion-paused'));
  window.addEventListener('pageshow', update);
})();

// Native CSS transitions reverse smoothly even when the pointer leaves early.
(() => {
  const card = document.querySelector('.product-style .style-card--variants');
  if (!card) return;
  card.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') card.classList.add('is-variant-preview');
  });
  card.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'touch') card.classList.remove('is-variant-preview');
  });
  card.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') card.classList.toggle('is-variant-preview');
  });
  card.addEventListener('blur', () => card.classList.remove('is-variant-preview'));
})();

// One continuous two-position glide, with no intermediate stop or DOM swap.
(() => {
  const card = document.querySelector('.product-style .style-card--palette');
  if (!card) return;
  const swatches = card.querySelector('.product-style__swatches');
  const label = card.querySelector('.product-style__hex');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const colors = new Map([
    ['style-color-1.svg', '#FF0508'],
    ['style-color-2.svg', '#FF4D61'],
    ['style-color-3.svg', '#FF8E9C']
  ]);
  let busy = false;
  let hovered = false;
  let finish = null;
  async function advance() {
    if (busy) return;
    busy = true;
    const old = [...swatches.querySelectorAll('img')];
    const first = old[2].cloneNode(true);
    const second = old[1].cloneNode(true);
    [first, second].forEach(image => image.classList.add('is-entering'));
    swatches.append(first, second);
    // Preserve back-to-front order for the entire glide, including its end.
    second.style.zIndex = '0';
    first.style.zIndex = '1';
    old.forEach((image, index) => { image.style.zIndex = String(index + 2); });
    const hexes = [old[0], first, second].map(image => {
      const span = document.createElement('span');
      span.textContent = `HEX ${colors.get(image.getAttribute('src').split('/').pop())}`;
      return span;
    });
    label.replaceChildren(...hexes);
    const animations = [];
    let completed = false;
    finish = () => {
      if (completed) return;
      completed = true;
      animations.forEach(animation => animation.cancel());
      [first, second].forEach(image => image.classList.remove('is-entering'));
      [first, second, ...old].forEach(image => { image.style.zIndex = ''; });
      swatches.replaceChildren(second, first, old[0]);
      label.textContent = hexes[2].textContent;
      finish = null;
      busy = false;
    };
    if (reduced.matches) { finish(); return; }
    const step = old[1].offsetLeft - old[0].offsetLeft;
    const options = { duration:720, easing:'cubic-bezier(.3,0,.2,1)', fill:'forwards' };
    animations.push(first.animate([
      { transform:`translateX(${-step}px)`, opacity:0 },
      { opacity:1, offset:.4 },
      { transform:`translateX(${step}px)`, opacity:1 }
    ], options));
    animations.push(second.animate([
      { transform:`translateX(${-2 * step}px)`, opacity:0 },
      { opacity:0, offset:.2 },
      { transform:'translateX(0)', opacity:1 }
    ], options));
    old.forEach((image, index) => animations.push(image.animate([
      { transform:'translateX(0)', opacity:1 },
      { opacity:index === 2 ? 0 : 1, offset:.45 },
      { transform:`translateX(${2 * step}px)`, opacity:index === 0 ? 1 : 0 }
    ], options)));
    animations.push(hexes[0].animate([
      { opacity:1, transform:'translateX(0)' },
      { opacity:0, transform:'translateX(10px)', offset:.4 },
      { opacity:0, transform:'translateX(10px)' }
    ], options));
    animations.push(hexes[1].animate([
      { opacity:0, transform:'translateX(-10px)' },
      { opacity:1, transform:'translateX(0)', offset:.4 },
      { opacity:0, transform:'translateX(10px)', offset:.8 },
      { opacity:0, transform:'translateX(10px)' }
    ], options));
    animations.push(hexes[2].animate([
      { opacity:0, transform:'translateX(-10px)' },
      { opacity:0, transform:'translateX(-10px)', offset:.55 },
      { opacity:1, transform:'translateX(0)' }
    ], options));
    const complete = finish;
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
    complete();
  }
  function stop() {
    finish?.();
    busy = false;
  }
  card.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovered = true;
    advance();
  });
  card.addEventListener('pointerleave', () => { hovered = false; });
  card.addEventListener('focus', () => { if (card.matches(':focus-visible') && !hovered) advance(); });
  card.addEventListener('click', () => { if (!hovered) advance(); });
  card.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    advance();
  });
  window.addEventListener('pagehide', stop);
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
})();
// Lift the background wordmark as the cards move upward through the viewport.
(() => {
  const showcase = document.querySelector('.product-style__showcase');
  const wordmark = showcase?.querySelector('.product-style__wordmark');
  if (!wordmark) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let frame = 0, current = 0, target = 0, previous = 0;
  const render = now => {
    frame = 0;
    const dt = previous ? Math.min(64, now - previous) : 16;
    previous = now;
    current += (target - current) * (1 - Math.exp(-dt / 110));
    if (Math.abs(target - current) < .05) current = target;
    wordmark.style.setProperty('--wordmark-rise', `${current.toFixed(2)}px`);
    if (current !== target) frame = requestAnimationFrame(render);
    else previous = 0;
  };
  const update = () => {
    if (document.hidden || reduced.matches) {
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      if (reduced.matches) { current = target = 0; wordmark.style.setProperty('--wordmark-rise', '0px'); }
      return;
    }
    const progress = Math.max(0, Math.min(1, (innerHeight * .85 - showcase.getBoundingClientRect().top) / (innerHeight * .7)));
    target = -progress * (innerWidth <= 600 ? 18 : 36);
    if (!frame) frame = requestAnimationFrame(render);
  };
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  update();
})();
