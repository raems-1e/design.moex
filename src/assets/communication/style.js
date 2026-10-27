(() => {
  const section = document.querySelector('.communication-style');
  if (!section) return;
  const canvas = section.querySelector('canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let gradient = null;
  let visible = false;
  function update() {
    if (gradient && (!visible || document.hidden || reduced.matches)) {
      gradient.destroy(); gradient = null;
    }
    if (!gradient && visible && !document.hidden && !reduced.matches) {
      gradient = window.MOEXAnimatedGradient?.mount(canvas,{
        color1:'#f3ebdd',color2:'#e3cbaa',color3:'#faf6ee',
        speed:8,softness:75,scale:.01,distortion:0,swirl:50
      });
    }
  }
  new IntersectionObserver(entries => { visible=entries[0].isIntersecting; update(); },{rootMargin:'100px'}).observe(section);
  reduced.addEventListener('change',update);
  document.addEventListener('visibilitychange',update);
  window.addEventListener('pagehide',()=>{gradient?.destroy(); gradient=null;});
  window.addEventListener('pageshow',update);
})();
