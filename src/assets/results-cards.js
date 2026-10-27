(() => {
  const section = document.querySelector('.results');
  if (!section) return;
  section.querySelectorAll('.results-card').forEach(card => { card.tabIndex = 0; });
  const counters = [['speed', 5, '×'], ['products', 30, '+']].flatMap(([name, count, suffix]) => {
    const card = section.querySelector(`.results-card--${name}`);
    const watermark = card?.querySelector('.results-card__watermark');
    if (!watermark) return [];
    const rows = Array.from({length:count}, (_, i) => `<span>${i + 1}</span>`).join('');
    watermark.innerHTML = `<span class="results-speed__digit"><span class="results-speed__reel">${rows}</span></span><span>${suffix}</span>`;
    return [{card, count, reel:watermark.querySelector('.results-speed__reel'), progress:0}];
  });
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let frame = 0;
  let previousTime = 0;
  function update(time) {
    frame = 0;
    const delta = previousTime ? Math.min(64, time - previousTime) : 16;
    previousTime = time;
    let moving = false;
    const grid = section.querySelector('.results__grid');
    counters.forEach(counter => {
      // Desktop metrics finish together as the grid reaches the viewport centre.
      // On stacked mobile cards, use each card so off-screen counters stay readable.
      const anchor = innerWidth > 800 && grid ? grid : counter.card;
      const rect = anchor.getBoundingClientRect();
      const target = reduced.matches ? 1 : Math.max(0, Math.min(1,
        (innerHeight * .95 - rect.top) / (innerHeight * .4 + rect.height / 2)));
      counter.progress += (target - counter.progress) * (1 - Math.exp(-delta / 150));
      if (reduced.matches || Math.abs(target - counter.progress) < .0001) counter.progress = target;
      else moving = true;
      counter.reel.style.transform = `translateY(${-counter.progress * (counter.count - 1) / counter.count * 100}%)`;
    });
    if (moving) schedule();
    else previousTime = 0;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  document.addEventListener('moex:preloader-complete', schedule);
  schedule();
})();
