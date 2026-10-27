(() => {
  'use strict';
  document.querySelectorAll('.coverflow').forEach(initCoverflow);
  function initCoverflow(gallery) {
  const banners = gallery.classList.contains('coverflow--banners');
  const stage = gallery.querySelector('.coverflow__stage');
  const originals = [...stage.children], count = originals.length;
  // Recycle only off-screen: copies never travel across the centre.
  for (let set = 0; set < 2; set++) originals.forEach(card => stage.append(card.cloneNode(true)));
  const cards = [...stage.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = () => innerWidth > 800;
  const step = () => banners ? (desktop() ? 290 : Math.min(238,innerWidth*.62)) : desktop() ? Math.min(227, gallery.clientWidth * .158) : 178;
  const wrap = (value,length) => ((value % length) + length) % length;
  let position = banners ? 0 : 2, target = position, velocity = 0, frame = 0, previousTime = 0;
  let drag = null, wheelTimer = 0, lastWheel = 0, suppressClickUntil = 0;
  const hero = gallery.closest('section');
  let entranceStarted = false;
  let entranceAnimations = [];
  function emphasizeCenter() {
    if (!entranceStarted || hero.classList.contains('is-entering') || frame || drag) return;
    cards.forEach((card,index) => card.classList.toggle('is-settled',Math.abs(distance(index)) < .01));
  }
  function finishEntrance() {
    entranceAnimations.forEach(animation => animation.cancel());
    entranceAnimations = [];
  }
  function enter() {
    if (entranceStarted) return;
    entranceStarted = true;
    hero.classList.remove('is-awaiting-entry');
    if (reduced.matches) { emphasizeCenter(); return; }
    hero.classList.add('is-entering');
    cards.forEach((card,index) => {
      const delta = distance(index);
      if (Math.abs(delta) >= 4) return;
      // Independent layers leave the live carousel transform intact.
      const travel = Math.sign(delta) * (innerWidth <= 800 ? 28 : 56) * Math.abs(delta);
      entranceAnimations.push(card.animate([
        {translate:travel+'px 0',scale:'.96',opacity:0},
        {translate:'0px 0px',scale:'1',opacity:card.style.opacity}
      ],{duration:1150,delay:320+Math.abs(delta)*65,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
    });
    setTimeout(() => { hero.classList.remove('is-entering'); emphasizeCenter(); },1800);
  }
  const distance = index => wrap(index - position + cards.length / 2,cards.length) - cards.length / 2;
  function render() {
    cards.forEach((card,index) => {
      const delta = distance(index), depth = Math.min(Math.abs(delta),3.5);
      // Banner cards leave the composition as they turn left, rather than
      // lingering behind the active banner. Keep the hero's symmetric flow.
      const exitOpacity = banners ? Math.max(0,Math.min(1,1+delta/.45)) : 1;
      const visible = Math.abs(delta) < 4 && exitOpacity > 0;
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.dataset.side = depth < .5 ? 'center' : depth < 1.5 ? 'near' : 'far';
      card.dataset.direction = delta > 0 ? 'right' : 'left';
      card.style.transform = `translate(-50%,-50%) translateX(${delta * step()}px) translateZ(${-depth * 38}px) rotateY(${-Math.max(-3,Math.min(3,delta)) * (banners ? 22 : 9)}deg) scale(${1-depth*.07})`;
      card.style.filter = `blur(${desktop() ? Math.pow(Math.max(0,depth-.5),1.6)*3.3 : Math.max(0,depth-.4)*1.7}px)`;
      card.style.opacity = String(Math.max(0,1-depth*.14)*exitOpacity);
      card.style.pointerEvents = visible ? '' : 'none';
      card.style.zIndex = String(8-Math.round(depth));
      card.tabIndex = visible && Math.abs(delta) < .5 ? 0 : -1;
      card.setAttribute('aria-hidden',String(!visible));
      card.setAttribute('aria-pressed',String(Math.abs(delta)<.5));
    });
    gallery.dataset.position = String(position);
  }
  function stop() { finishEntrance(); cancelAnimationFrame(frame); frame=0; clearTimeout(wheelTimer); cards.forEach(card => card.classList.remove('is-settled')); }
  function tick(time) {
    const dt = Math.min((time-previousTime)/1000 || 1/60,.032);
    previousTime=time;
    velocity += ((target-position)*100-velocity*20)*dt;
    position += velocity*dt;
    if (Math.abs(target-position)<.012 && Math.abs(velocity)<.12) {
      position=target; velocity=0; frame=0; render(); emphasizeCenter(); return;
    }
    render(); frame=requestAnimationFrame(tick);
  }
  function settle(next,speed=0) {
    stop(); target=next; velocity=speed;
    if(reduced.matches) { position=target; velocity=0; render(); emphasizeCenter(); return; }
    previousTime=performance.now(); frame=requestAnimationFrame(tick);
  }
  cards.forEach((card,index)=>card.addEventListener('click',()=>{
    if(performance.now() >= suppressClickUntil) settle(Math.round(position+distance(index)));
  }));
  gallery.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const base=Math.round(target);
    settle(event.key==='Home' ? base-wrap(base,count) : event.key==='End' ? base-wrap(base,count)+count-1 : base+(event.key==='ArrowLeft'?-1:1));
  });
  gallery.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    stop(); velocity=0;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,time:performance.now(),origin:position,dx:0,active:false};
  });
  gallery.addEventListener('pointermove',event=>{
    if(!drag || drag.id!==event.pointerId) return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.active && Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>8) { drag=null; settle(Math.round(position)); return; }
    if(!drag.active && Math.abs(dx)<8) return;
    const now=performance.now();
    const measured=-(event.clientX-drag.lastX)/step()/Math.max(.008,(now-drag.time)/1000);
    velocity=velocity*.35+Math.max(-18,Math.min(18,measured))*.65;
    drag.active=true; drag.dx=dx; drag.lastX=event.clientX; drag.time=now;
    gallery.setPointerCapture(event.pointerId); gallery.classList.add('is-dragging');
    position=drag.origin-dx/step(); render();
  });
  function finish(event) {
    if(!drag || drag.id!==event.pointerId) return;
    const last=drag; drag=null;
    gallery.classList.remove('is-dragging');
    if(last.active) suppressClickUntil=performance.now()+400;
    if(gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
    const speed=event.type!=='pointercancel' && performance.now()-last.time<100 ? velocity : 0;
    const next=Math.round(position+(reduced.matches?0:speed*.24));
    settle(next,speed);
  }
  gallery.addEventListener('pointerup',finish);
  gallery.addEventListener('pointercancel',finish);
  // A touch starts with implicit capture on a child card. Its release bubbles
  // when capture moves to the gallery, but must not end the active swipe.
  gallery.addEventListener('lostpointercapture',event=>{
    if(event.target===gallery) finish(event);
  });
  gallery.addEventListener('wheel',event=>{
    // Preserve vertical page scroll and pinch-to-zoom. Native momentum is not doubled.
    if(!desktop() || event.ctrlKey || (Math.abs(event.deltaX)<=Math.abs(event.deltaY) && !event.shiftKey)) return;
    event.preventDefault(); stop(); drag=null; gallery.classList.remove('is-dragging');
    const now=performance.now(),unit=event.deltaMode===1?16:event.deltaMode===2?gallery.clientWidth:1;
    const delta=(event.deltaX || event.deltaY)*unit/step();
    velocity=Math.max(-14,Math.min(14,delta/Math.max(.016,(now-lastWheel)/1000)));
    lastWheel=now; position+=delta; target=position; render();
    wheelTimer=setTimeout(()=>settle(Math.round(position+(reduced.matches?0:velocity*.08)),velocity),90);
  },{passive:false});
  function reset() { drag=null; gallery.classList.remove('is-dragging'); settle(Math.round(position)); }
  window.addEventListener('resize',reset);
  window.addEventListener('blur',reset);
  render();
  if (banners) {
    const observer = new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) { enter(); observer.disconnect(); }
    },{threshold:.15});
    observer.observe(gallery);
    // A single scroll-linked preview hints at the interaction without trapping
    // vertical scrolling. Any deliberate gallery input takes over immediately.
    let previewStart = null, previewBase = position, previewDone = false;
    function stopPreview() {
      previewDone = true;
      window.removeEventListener('scroll',previewScroll);
    }
    function previewScroll() {
      if(previewDone) return;
      if(reduced.matches) { stopPreview(); return; }
      const bounds = gallery.getBoundingClientRect();
      if(previewStart===null) {
        if(bounds.top>innerHeight*.85 || bounds.bottom<0) return;
        previewStart=scrollY; previewBase=position;
        enter();
        return;
      }
      const progress=Math.max(0,Math.min(1,(scrollY-previewStart)/(innerHeight*.6)));
      if(progress===0) return;
      finishEntrance();
      target=previewBase+progress*2;
      if(!frame) { previousTime=performance.now(); frame=requestAnimationFrame(tick); }
      if(progress===1) stopPreview();
    }
    gallery.addEventListener('pointerdown',stopPreview,{capture:true,once:true});
    gallery.addEventListener('keydown',stopPreview,{capture:true,once:true});
    gallery.addEventListener('click',stopPreview,{capture:true,once:true});
    gallery.addEventListener('wheel',event=>{
      if(!event.ctrlKey && (Math.abs(event.deltaX)>Math.abs(event.deltaY) || event.shiftKey)) stopPreview();
    },{capture:true,passive:true});
    window.addEventListener('scroll',previewScroll,{passive:true});
    previewScroll();
  } else {
    document.addEventListener('moex:preloader-complete',enter,{once:true});
    if (!document.body.classList.contains('is-preloader-active')) setTimeout(enter,0);
  }
  reduced.addEventListener('change',() => { if(reduced.matches) { finishEntrance(); hero.classList.remove('is-entering'); } });
  window.addEventListener('pageshow',event => { if(event.persisted) { finishEntrance(); hero.classList.remove('is-entering'); } });
  }
})();
