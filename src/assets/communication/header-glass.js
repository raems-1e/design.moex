(() => {
  const glass = document.querySelector('.header-atmosphere');
  if (!glass) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  // Safari keeps the CSS glass fallback: SVG backdrop filters are not reliable there.
  if (/Chrome|Chromium|Edg\//.test(navigator.userAgent)) {
    document.documentElement.classList.add('has-liquid-refraction');
  }
  const displacement = document.querySelector('#header-liquid-refraction feDisplacementMap');
  let frame = 0;
  function paint() {
    frame = 0;
    const phase = reduced.matches ? 0 : window.scrollY / 650;
    glass.style.setProperty('--glass-light-x', `${35 + Math.sin(phase) * (mobile.matches ? 8 : 22)}%`);
    displacement?.setAttribute('scale', String(reduced.matches || mobile.matches ? 0 : 52 + Math.sin(phase) * 12));
  }
  function update() { if (!frame) frame = requestAnimationFrame(paint); }
  window.addEventListener('scroll', update, { passive: true });
  reduced.addEventListener('change', update);
  mobile.addEventListener('change', update);
  paint();
})();
