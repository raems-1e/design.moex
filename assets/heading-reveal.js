(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  // Section headings only: hero titles and interactive slide/card titles keep their own motion.
  const headings = [...document.querySelectorAll('main h2')].filter(h => !h.closest('.product-tech, .hero, .communication-hero, .product-hero'));
  const descriptions = headings.map(heading => heading.nextElementSibling)
    .filter(element => element?.matches('p, span') && !element.querySelector('a, button, input'));
  descriptions.forEach(element => element.classList.add('heading-reveal--description'));
  const targets = [...new Set([...headings, ...descriptions])];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('heading-reveal--visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -24px 0px' });
  targets.forEach(heading => {
    if (heading.querySelector('img') || heading.classList.contains('heading-reveal')) return;
    const readable = document.createElement('span');
    readable.className = 'heading-reveal__readable';
    readable.textContent = heading.textContent;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    while (heading.firstChild) visual.append(heading.firstChild);
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      // Keep non-breaking spaces and existing <br> / inline emphasis intact.
      node.textContent.split(/([ \t\r\n]+)/).forEach(token => {
        if (!token) return;
        if (/^[ \t\r\n]+$/.test(token)) { fragment.append(token); return; }
        const word = document.createElement('span');
        word.className = 'heading-reveal__word';
        const description = heading.classList.contains('heading-reveal--description');
        word.style.setProperty('--word-delay', `${(description ? 180 : 0) + Math.min(index++ * (description ? 30 : 50), 450)}ms`);
        word.textContent = token;
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    heading.append(readable, visual);
    heading.classList.add('heading-reveal');
  });
  const start = () => targets.forEach(h => observer.observe(h));
  if (document.body.classList.contains('is-preloader-active')) document.addEventListener('moex:preloader-complete', start, { once:true });
  else start();
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    observer.disconnect();
    targets.forEach(h => h.classList.add('heading-reveal--visible'));
  });
})();
