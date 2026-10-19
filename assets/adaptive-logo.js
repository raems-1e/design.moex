(() => {
  const header = document.querySelector('[data-site-header], .materials-site-header');
  const logo = header?.querySelector('.logo, .materials-site-logo');
  const image = logo?.querySelector('img');
  if (!image) return;
  // Preview the original brand red on every surface.
  const adaptiveColorEnabled = false;
  if (!adaptiveColorEnabled) {
    logo.classList.add('adaptive-logo');
    image.style.filter = 'none';
    return;
  }
  let frame = 0;
  function update() {
    frame = 0;
    if (!image.complete || !image.naturalWidth) return;
    logo.classList.add('adaptive-logo');
    const rect = image.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    // Sample the rendered stacking order, including sticky sections and the
    // revealed footer. Ignore our own transparent header/backdrop layers.
    const under = document.elementsFromPoint(x, y).find(node =>
      !header.contains(node) && !node.closest('.moex-preloader, .materials-mobile-drawer') &&
      node !== document.body && node !== document.documentElement);
    let color = '#ff0508';
    for (let node = under; node && node !== document.documentElement; node = node.parentElement) {
      if (node.matches('.mission-team,.projects-carousel,.footer,.product-style')) {
        color = '#eee6dc'; break;
      }
      if (node.matches('.communication-style,.product-tech')) {
        color = '#766454'; break;
      }
      const channels = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3 || (channels[3] ?? 1) < .6) continue;
      const [r,g,b] = channels;
      const brightness = .2126*r + .7152*g + .0722*b;
      if (brightness < 145 || (r > g * 1.5 && r > b * 1.5)) color = '#eee6dc';
      else if (r - b > 10 && r >= g && g >= b) color = '#766454';
      else if (brightness < 220) color = '#494441';
      break;
    }
    // Filters operate on the loaded image itself; no second asset request or
    // mask support is needed, and unsupported filters leave the red logo visible.
    const filters = {
      '#ff0508': 'none',
      '#eee6dc': 'brightness(0) invert(94%) sepia(10%) saturate(310%)',
      '#766454': 'brightness(0) invert(42%) sepia(18%) saturate(640%) hue-rotate(348deg)',
      '#494441': 'brightness(0) invert(27%) sepia(7%) saturate(420%)'
    };
    image.style.filter = filters[color];
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  image.addEventListener('load', schedule);
  document.addEventListener('moex:preloader-complete', schedule);
  schedule();
})();
