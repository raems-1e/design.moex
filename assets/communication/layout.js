(() => {
  const hero = document.querySelector('.communication-hero');
  if (!hero) return;
  const measure = () => hero.style.setProperty('--communication-hero-height', `${hero.offsetHeight}px`);
  new ResizeObserver(measure).observe(hero);
  measure();

  const builder = document.querySelector('.banner-builder');
  const results = document.querySelector('.communication-results');
  const footer = document.querySelector('body > .footer');
  if (!builder || !results || !footer) return;
  // Tall mobile sections scroll completely before their lower edge is held.
  const measurePanels = () => {
    builder.style.setProperty('--panel-height', `${builder.offsetHeight}px`);
    results.style.setProperty('--panel-height', `${results.offsetHeight}px`);
    document.body.style.setProperty('--footer-overlap-height', `${footer.offsetHeight}px`);
  };
  const panels = new ResizeObserver(measurePanels);
  panels.observe(builder);
  panels.observe(results);
  panels.observe(footer);
  measurePanels();
  document.body.classList.add('has-results-overlap');
})();
