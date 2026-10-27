(() => {
  document.querySelectorAll('.projects-carousel').forEach(section => {
    const stage=section.querySelector('.projects-carousel__stage');
    const originals=[...section.querySelectorAll('.project-stack-card')];
    const projectCount=originals.length;
    // Repeated visual cards let three projects form a continuous five-card rail.
    for(let repeat=0;repeat<2;repeat++) originals.forEach(card=>{
      const clone=card.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      clone.inert=true;
      clone.setAttribute('aria-hidden','true');
      stage.append(clone);
    });
    const cards=[...stage.querySelectorAll('.project-stack-card')];
    const dots=[...section.querySelectorAll('[data-project-dot]')];
    const reduced=matchMedia('(prefers-reduced-motion:reduce)');
    cards.forEach(card=>{
      card.querySelectorAll('.project-stack-card__body h3,.project-stack-card__body > p').forEach(element=>{
        const text=element.textContent;
        const readable=document.createElement('span');
        readable.className='heading-reveal__readable';
        readable.textContent=text;
        const visual=document.createElement('span');
        visual.setAttribute('aria-hidden','true');
        let index=0;
        const description=element.matches('p');
        text.split(/([ \t\r\n]+)/).forEach(token=>{
          if(!token)return;
          if(/^[ \t\r\n]+$/.test(token)){visual.append(token);return;}
          const word=document.createElement('span');
          word.className='heading-reveal__word';
          word.style.setProperty('--word-delay',`${(description?180:0)+Math.min(index++*(description?30:50),450)}ms`);
          word.textContent=token;
          visual.append(word);
        });
        element.replaceChildren(readable,visual);
        element.classList.add('heading-reveal');
      });
    });
    let textEntered=false;
    function revealText(){
      cards.forEach((card,index)=>card.querySelectorAll('.heading-reveal').forEach(element=>{
        element.classList.toggle('heading-reveal--visible',textEntered && index===selected);
      }));
    }
    let selected=0,pointer=null,wheel=0,wheelTimer;
    function render(){
      cards.forEach((card,index)=>{
        const depth=((index-selected+cards.length+Math.floor(cards.length/2))%cards.length)-Math.floor(cards.length/2);
        const distance=Math.abs(depth);
        card.style.zIndex=String(cards.length-distance);
        card.style.transform=`translateX(calc(var(--project-step) * ${depth})) scale(${1-Math.min(distance,3)*.055})`;
        card.style.opacity=distance>2?'0':String(1-distance*.15);
        card.style.pointerEvents=depth===0?'auto':'none';
        card.classList.toggle('is-active',depth===0);
        card.inert=depth!==0;
        card.setAttribute('aria-hidden',String(depth!==0));
      });
      dots.forEach((dot,index)=>dot.setAttribute('aria-current',String(index===selected%projectCount)));
      revealText();
    }
    function go(index){
      index=(index+cards.length)%cards.length;
      if(index===selected)return;
      selected=index;render();
      section.querySelector('.projects-carousel__status').textContent='Проект '+(selected%projectCount+1)+' из '+projectCount;
    }
    dots.forEach((dot,index)=>dot.addEventListener('click',()=>{
      let delta=(index-selected%projectCount+projectCount)%projectCount;
      if(delta>projectCount/2)delta-=projectCount;
      go(selected+delta);
    }));
    const controls=section.querySelector('.projects-carousel__dots');
    [-1,1].forEach(direction=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='projects-carousel__arrow';
      button.setAttribute('aria-label',direction<0?'Предыдущий проект':'Следующий проект');
      button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction<0?'M15 6 9 12l6 6':'m9 6 6 6-6 6'}"/></svg>`;
      button.addEventListener('click',()=>go(selected+direction));
      if(direction<0)controls.prepend(button);else controls.append(button);
    });
    document.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.repeat)return;
      const target=event.target;
      if(target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="dialog"],[aria-modal="true"]'))return;
      if(target!==document.body && target!==document.documentElement && !section.contains(target))return;
      const rect=stage.getBoundingClientRect();
      const visibleHeight=Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0);
      if(visibleHeight<Math.min(rect.height,innerHeight)*.45)return;
      event.preventDefault();go(selected+(event.key==='ArrowRight'?1:-1));
    });
    stage.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('a,button'))return;
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    });
    window.addEventListener('pointerup',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))go(selected+(dx<0?1:-1));
    });
    window.addEventListener('pointercancel',()=>{pointer=null;});
    let wheelConsumed=false;
    section.addEventListener('wheel',event=>{
      if(event.ctrlKey||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
      event.preventDefault();
      clearTimeout(wheelTimer);
      // Consume one horizontal gesture, including its inertial tail.
      wheelTimer=setTimeout(()=>{wheel=0;wheelConsumed=false;},180);
      if(wheelConsumed)return;
      wheel+=event.deltaX*(event.deltaMode===1?16:event.deltaMode===2?stage.clientWidth:1);
      if(Math.abs(wheel)>=40){
        go(selected+Math.sign(wheel));
        wheelConsumed=true;wheel=0;
      }
    },{passive:false});
    new IntersectionObserver(entries=>section.classList.toggle('is-visible',entries[0].isIntersecting)).observe(section);
    const textObserver=new IntersectionObserver(entries=>{
      if(!entries[0].isIntersecting)return;
      textEntered=true;revealText();textObserver.disconnect();
    },{threshold:.15});
    textObserver.observe(stage);
    reduced.addEventListener('change',render);
    render();
  });
})();
