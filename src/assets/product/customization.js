(() => {
  const root = document.querySelector('.product-custom');
  if (!root) return;
  const preview = root.querySelector('.product-custom__preview');
  const cards = [...root.querySelectorAll('.custom-banner')];
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let animations = [];
  const stop = () => { animations.forEach(animation => animation.cancel()); animations = []; };
  root.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement)) return;
    stop();
    const before = cards.map(card => card.hidden ? null : card.getBoundingClientRect());
    const count = Number(root.querySelector('[name="custom-count"]:checked').value);
    preview.dataset.count = count;
    preview.dataset.color = root.querySelector('[name="custom-color"]:checked').value;
    const image = root.querySelector('[name="custom-image"]').checked;
    const button = root.querySelector('[name="custom-button"]').checked;
    preview.classList.toggle('no-image', !image);
    preview.classList.toggle('no-button', !button);
    cards.forEach((card, i) => { card.hidden = i >= count; });
    if (!reduced.matches && event.target.name === 'custom-count') {
      cards.forEach((card, i) => {
        if (card.hidden) return;
        const after = card.getBoundingClientRect(), old = before[i];
        const from = old ? {transform:`translate(${old.x-after.x}px,${old.y-after.y}px) scale(${old.width/after.width},${old.height/after.height})`,opacity:1} : {transform:'translateY(10px) scale(.94)',opacity:0};
        animations.push(card.animate([from,{transform:'none',opacity:1}],{duration:650,delay:old?0:i*40,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
      });
    }
    root.querySelector('.product-custom__status').textContent = `Баннеров: ${count}. Изображение ${image?'включено':'выключено'}, кнопка ${button?'включена':'выключена'}.`;
  });
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
})();
