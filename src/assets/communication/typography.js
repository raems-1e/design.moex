(() => {
  const control = document.querySelector('.type-weight-control');
  if (!control) return;
  const input = control.querySelector('input');
  const output = control.querySelector('output');
  const preview = document.querySelector('.type-weight-preview');
  const ticks = control.querySelector('.builder-radius__ticks');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const symbolCard = document.querySelector('.type-tile--symbols');
  const symbolGrid = symbolCard.querySelector('.type-symbol-grid');
  const symbolPause = symbolCard.querySelector('.type-symbol-pause');
  const alphabet = Array.from('!@#$%&*();/<>“”{}+?');
  const cells = Array.from({ length: 18 }, () => {
    const cell = document.createElement('span'); symbolGrid.append(cell); return cell;
  });
  const words = ['DESIGN', 'MOEX', 'INTER'];
  let symbolTimer, symbolVisible = false, symbolPaused = false, symbolHovered = false, lastWord = '';
  function nextWord() {
    const choices = words.filter(word => word !== lastWord);
    lastWord = choices[Math.floor(Math.random() * choices.length)];
    return lastWord;
  }
  function pattern(word) {
    // Each grid uses every sign once; a cell also changes from its previous sign.
    let result;
    do {
      result = [...alphabet];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    } while (cells.some((cell, index) => cell.textContent === result[index]));
    if (word) {
      const start = 6 + Math.floor((6 - word.length) / 2);
      Array.from(word).forEach((char, i) => { result[start + i] = char; });
    }
    return result.slice(0, cells.length);
  }
  function showSymbols(word, immediate = false) {
    pattern(word).forEach((char, index) => {
      const cell = cells[index];
      cell.getAnimations().forEach(animation => animation.cancel());
      if (immediate || reduced.matches) { cell.textContent = char; return; }
      const fade = cell.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-3px)' }], { duration: 160, delay: index * 35, fill: 'forwards' });
      fade.finished.then(() => {
        cell.textContent = char; fade.cancel();
        cell.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 350, fill: 'both', easing: 'ease-out' });
      }).catch(() => {});
    });
  }
  function queueSymbols(delay = 2400) {
    clearTimeout(symbolTimer);
    if (!symbolVisible || symbolPaused || reduced.matches || document.hidden) return;
    symbolTimer = setTimeout(() => {
      const word = symbolHovered ? nextWord() : '';
      showSymbols(word); queueSymbols(2800);
    }, delay);
  }
  function enterSymbols() {
    if (symbolHovered) return;
    symbolHovered = true;
    if (!symbolPaused) showSymbols(nextWord());
    queueSymbols(2400);
  }
  function leaveSymbols() { symbolHovered = false; showSymbols(''); queueSymbols(1600); }
  symbolCard.addEventListener('pointerenter', enterSymbols);
  symbolCard.addEventListener('pointerleave', leaveSymbols);
  symbolCard.addEventListener('focusin', enterSymbols);
  symbolCard.addEventListener('focusout', event => { if (!symbolCard.contains(event.relatedTarget)) leaveSymbols(); });
  symbolPause.addEventListener('click', () => {
    symbolPaused = !symbolPaused;
    symbolPause.setAttribute('aria-pressed', String(symbolPaused));
    symbolPause.setAttribute('aria-label', symbolPaused ? 'Продолжить смену символов' : 'Приостановить смену символов');
    symbolPause.textContent = symbolPaused ? '▷' : 'Ⅱ';
    queueSymbols();
  });
  showSymbols('', true);
  new IntersectionObserver(entries => { symbolVisible = entries[0].isIntersecting; queueSymbols(1700); }, { threshold: .5 }).observe(symbolCard);
  document.addEventListener('visibilitychange', () => queueSymbols());
  reduced.addEventListener('change', () => { showSymbols('', true); queueSymbols(); });
  const names = ['Light', 'Regular', 'Medium', 'Semibold', 'Bold', 'Extra Bold'];
  const clamp = value => Math.max(300, Math.min(800, value));
  let value = 500, drag = null, frame = 0;
  for (let weight = 100; weight <= 1000; weight += 10) {
    const tick = document.createElement('i');
    tick.style.left = `${(weight - 300) * .7}px`;
    if (weight % 100 === 0) tick.classList.add('is-major');
    if (weight < 300 || weight > 800) tick.classList.add('is-outside');
    else if (weight % 100 === 0) {
      const label = document.createElement('span'); label.textContent = weight; tick.append(label);
    }
    ticks.append(tick);
  }
  function render(next) {
    value = clamp(next);
    const rounded = Math.round(value);
    const name = names[Math.round((rounded - 300) / 100)];
    input.value = rounded;
    preview.style.fontWeight = rounded;
    control.style.setProperty('--radius-offset', `${-(value - 300) * .7}px`);
    output.value = `${rounded} · ${name}`;
    input.setAttribute('aria-valuetext', `${rounded}, ${name}`);
  }
  function stop() { cancelAnimationFrame(frame); control.classList.remove('is-coasting'); }
  input.addEventListener('input', () => { stop(); render(Number(input.value)); });
  input.addEventListener('keydown', () => { stop(); control.classList.remove('is-pointer'); });
  input.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); stop();
    control.classList.add('is-pointer', 'is-dragging');
    input.focus({ preventScroll: true }); input.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, value, lastX: event.clientX, time: performance.now(), velocity: 0 };
  });
  input.addEventListener('pointermove', event => {
    if (!drag) return;
    const now = performance.now();
    drag.velocity = -(event.clientX - drag.lastX) / .7 / Math.max(8, now - drag.time);
    drag.lastX = event.clientX; drag.time = now;
    render(drag.value - (event.clientX - drag.x) / .7);
  });
  function finish(event) {
    if (!drag) return;
    const last = drag; drag = null; control.classList.remove('is-dragging');
    if (event.type !== 'pointerup' || reduced.matches || performance.now() - last.time > 120) return;
    const from = value, target = clamp(value + Math.max(-40, Math.min(40, last.velocity * 100)));
    const start = performance.now(); control.classList.add('is-coasting');
    const animate = now => {
      const t = Math.min(1, (now - start) / 340);
      render(from + (target - from) * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(animate); else control.classList.remove('is-coasting');
    };
    frame = requestAnimationFrame(animate);
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => input.addEventListener(name, finish));
  input.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault(); stop(); control.classList.add('is-pointer'); render(value + event.deltaX);
  }, { passive: false });
  render(value);
  // Align the construction lines with the loaded font's actual ink bounds.
  document.fonts.ready.then(() => {
    const drawing = document.querySelector('.type-anatomy__drawing');
    const context = document.createElement('canvas').getContext('2d');
    if (!drawing || !context) return;
    context.font = '700 100px Inter';
    for (const [name, glyph] of [['cap', 'A'], ['lower', 'a']]) {
      const y = 104 - context.measureText(glyph).actualBoundingBoxAscent;
      drawing.querySelector(`[data-anatomy-line="${name}"]`).setAttribute('d', `M0 ${y}H480`);
      drawing.querySelector(`[data-anatomy-label="${name}"]`).setAttribute('y', y - 5);
    }
    const letters = drawing.querySelector('.type-anatomy__letters--base');
    const rightA = letters.getStartPositionOfChar(0).x + context.measureText('A').actualBoundingBoxRight;
    const leftA = letters.getStartPositionOfChar(1).x - context.measureText('a').actualBoundingBoxLeft;
    drawing.querySelector('[data-anatomy-gap]').setAttribute('d', `M${rightA} 108V120 M${leftA} 108V120 M${rightA} 116H${leftA}`);
    function alignAnatomy() {
      const matrix = drawing.getScreenCTM();
      if (!matrix) return;
      const edge = new DOMPoint(drawing.closest('.type-anatomy').getBoundingClientRect().right - 20, 0).matrixTransform(matrix.inverse()).x;
      const bounds = letters.getBBox();
      const shift = edge - bounds.x - bounds.width;
      drawing.querySelectorAll('.type-anatomy__letters,.type-anatomy__vertical,.type-anatomy__detail').forEach(element => element.setAttribute('transform', `translate(${shift} 0)`));
      drawing.querySelector('#anatomy-mask rect').setAttribute('width', edge + 20);
      drawing.querySelectorAll('.type-anatomy__guides > path:not(.type-anatomy__vertical)').forEach(path => {
        path.setAttribute('d', path.getAttribute('d').replace(/H[\d.]+$/, `H${edge + 20}`));
      });
    }
    new ResizeObserver(alignAnatomy).observe(drawing);
    alignAnatomy();
  });
})();
