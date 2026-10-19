(() => {
  const section = document.querySelector('.communication-results');
  if (!section || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  const heading = section.querySelector('.communication-results__heading');
  const metrics = [...section.querySelectorAll('.communication-results__metric')];
  const animations = new Set();
  const pending = new Set([heading, ...metrics]);
  const originals = new Map();
  const counters = new Map();
  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation)).catch(() => {});
  }
  function reveal(element, delay) {
    animate(element, [{ opacity:0, transform:'translateY(14px)' }, { opacity:1, transform:'translateY(0)' }], {
      duration:850, delay, easing:'cubic-bezier(.16,1,.3,1)', fill:'both'
    });
  }
  function count(value, delay) {
    const text = value.textContent.trim();
    originals.set(value, text);
    value.setAttribute('aria-label', text);
    const numeric = text.match(/^\d+(?:\.\d+)?/);
    if (!numeric) return;
    const target = Number(numeric[0]);
    const decimals = (numeric[0].split('.')[1] || '').length;
    const factor = 10 ** decimals;
    const suffix = text.slice(numeric[0].length);
    value.style.setProperty('--counter-width', `${text.length}ch`);
    value.textContent = `${(0).toFixed(decimals)}${suffix}`;
    const start = performance.now() + delay;
    function tick(now) {
      const progress = Math.max(0, Math.min(1, (now - start) / 1400));
      const eased = 1 - Math.pow(1 - progress, 2);
      // One text node, not overlapping digit strips; the suffix never moves independently.
      value.textContent = `${(Math.floor(target * eased * factor) / factor).toFixed(decimals)}${suffix}`;
      if (progress < 1) counters.set(value, requestAnimationFrame(tick));
      else { value.textContent = text; counters.delete(value); }
    }
    counters.set(value, requestAnimationFrame(tick));
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      observer.unobserve(element); pending.delete(element);
      element.classList.remove('results-reveal-pending');
      if (element === heading) {
        [...heading.children].forEach((child, index) => reveal(child, index * 120));
      } else {
        const delay = matchMedia('(max-width:700px)').matches ? 0 : metrics.indexOf(element) * 140;
        reveal(element.querySelector('.communication-results__value'), delay);
        count(element.querySelector('.communication-results__value'), delay);
        reveal(element.querySelector('dt'), delay + 180);
        reveal(element.querySelector('.communication-results__description'), delay + 300);
      }
    });
  }, { threshold:.2, rootMargin:'0px 0px -30px 0px' });
  pending.forEach(element => { element.classList.add('results-reveal-pending'); observer.observe(element); });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    observer.disconnect();
    pending.forEach(element => element.classList.remove('results-reveal-pending'));
    animations.forEach(animation => animation.cancel());
    counters.forEach(frame => cancelAnimationFrame(frame));
    counters.clear();
    originals.forEach((text, value) => { value.textContent = text; });
  });
})();
