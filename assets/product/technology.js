(() => {
  const root = document.querySelector('.product-tech');
  if (!root) return;
  const slides = [...root.querySelectorAll('.product-tech__slide')];
  const buttons = [...root.querySelectorAll('[data-tech-slide]')];
  const status = root.querySelector('.product-tech__status');
  let current = 0;
  let scheduleAutoplay = () => {};
  const show = (index, automatic = false) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      buttons[i].setAttribute('aria-current', String(active));
    });
    if (!automatic) status.textContent = slides[current].getAttribute('aria-label');
    scheduleAutoplay(true);
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => show(i)));
  root.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
    buttons[current].focus();
  });
  let start = null;
  root.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
    start = { x:event.clientX, y:event.clientY, id:event.pointerId };
    root.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointerup', (event) => {
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) show(current + (dx < 0 ? 1 : -1));
    start = null;
  });
  root.addEventListener('pointercancel', () => { start = null; });
  root.addEventListener('lostpointercapture', () => { start = null; });
  let wheelDistance = 0;
  let wheelTime = 0;
  let wheelLockedUntil = 0;
  root.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelTime > 160) wheelDistance = 0;
    wheelTime = now;
    if (now < wheelLockedUntil) return;
    wheelDistance += event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientWidth : 1);
    if (Math.abs(wheelDistance) >= 65) {
      show(current + Math.sign(wheelDistance));
      wheelDistance = 0;
      wheelLockedUntil = now + 700;
    }
  }, {passive:false});
  const measure = () => {
    const mobile = matchMedia('(max-width:800px)').matches;
    const scale = Math.min(1, root.clientWidth / 1440);
    root.style.setProperty('--tech-scale', scale);
    root.style.setProperty('--tech-art-scale', Math.min(.8, root.clientWidth / 680));
    root.style.height = mobile ? '760px' : 827 * scale + 'px';
  };
  measure();
  new ResizeObserver(measure).observe(root);

  // Same sand-gradient renderer and motion parameters as Communication Design.
  const canvas = root.querySelector('.product-tech__gradient canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const autoplayDuration = 6000;
  let autoplayFrame = 0;
  let autoplayElapsed = 0;
  let autoplayLastTime = null;
  let inView = false;
  let focused = false;
  let touching = false;
  let pageHidden = false;
  const paintProgress = () => {
    const progress = Math.min(1, autoplayElapsed / autoplayDuration);
    root.style.setProperty('--tech-progress', reduced.matches ? 1 : progress);
    // Share the indicator clock: pause/resume together, freeze the outgoing artwork.
    const eased = progress * progress * (3 - 2 * progress);
    slides[current].style.setProperty('--tech-creative-scale', reduced.matches ? 1 : 1 + .06 * (1 - eased));
  };
  const autoplayTick = now => {
    autoplayFrame = 0;
    if (autoplayLastTime !== null) autoplayElapsed += now - autoplayLastTime;
    autoplayLastTime = now;
    paintProgress();
    if (autoplayElapsed >= autoplayDuration) {
      show(current + 1, true);
      return;
    }
    autoplayFrame = requestAnimationFrame(autoplayTick);
  };
  scheduleAutoplay = (reset = false) => {
    cancelAnimationFrame(autoplayFrame);
    autoplayFrame = 0;
    autoplayLastTime = null;
    if (reset === true) autoplayElapsed = 0;
    paintProgress();
    if (slides.length < 2 || !inView || focused || touching || pageHidden || document.hidden || reduced.matches) return;
    autoplayFrame = requestAnimationFrame(autoplayTick);
  };
  // Only keyboard focus pauses playback; hovering/clicking must not stall it.
  root.addEventListener('focusin', event => {
    focused = event.target.matches(':focus-visible');
    scheduleAutoplay();
  });
  root.addEventListener('focusout', event => {
    focused = root.contains(event.relatedTarget) && event.relatedTarget.matches(':focus-visible');
    scheduleAutoplay();
  });
  root.addEventListener('pointerdown', () => { focused = false; touching = true; scheduleAutoplay(); });
  const release = () => { touching = false; scheduleAutoplay(); };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  root.addEventListener('lostpointercapture', release);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .25;
    scheduleAutoplay();
  }, {threshold:[0, .25]}).observe(root);
  document.addEventListener('visibilitychange', scheduleAutoplay);
  reduced.addEventListener('change', scheduleAutoplay);
  window.addEventListener('pagehide', () => { pageHidden = true; scheduleAutoplay(); });
  window.addEventListener('pageshow', () => { pageHidden = false; scheduleAutoplay(); });
  let gradient = null;
  let visible = false;
  const updateGradient = () => {
    if (gradient && (!visible || document.hidden || reduced.matches)) {
      gradient.destroy();
      gradient = null;
    }
    if (!gradient && canvas && visible && !document.hidden && !reduced.matches) {
      gradient = window.MOEXAnimatedGradient?.mount(canvas, {
        color1:'#f3ebdd', color2:'#e3cbaa', color3:'#faf6ee',
        speed:8, softness:75, scale:.01, distortion:0, swirl:50
      });
    }
  };
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    updateGradient();
  }, {rootMargin:'100px'}).observe(root);
  reduced.addEventListener('change', updateGradient);
  document.addEventListener('visibilitychange', updateGradient);
  window.addEventListener('pagehide', () => { gradient?.destroy(); gradient = null; });
  window.addEventListener('pageshow', updateGradient);
})();
