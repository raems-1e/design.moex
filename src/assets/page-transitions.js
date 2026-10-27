(() => {
  'use strict';
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'moex:page-arrival:v1';
  const directory = new URL('.', window.location.href).pathname;
  let navigating = false;
  let arrivalTimer;

  const pageId = (url) => {
    if (url.origin !== window.location.origin || !url.pathname.startsWith(directory)) return null;
    const name = url.pathname.slice(directory.length);
    if (!name) return 'index';
    return /^(index|product|materials|communication)(?:\.html)?$/.exec(name)?.[1] || null;
  };
  const reset = () => {
    navigating = false;
    window.clearTimeout(arrivalTimer);
    body.classList.remove('is-page-leaving', 'is-page-entering');
  };

  try {
    const arrival = JSON.parse(window.sessionStorage.getItem(storageKey) || 'null');
    window.sessionStorage.removeItem(storageKey);
    const destination = arrival?.url ? new URL(arrival.url) : null;
    const current = new URL(window.location.href);
    if (destination && pageId(destination) && pageId(destination) === pageId(current) &&
        destination.search === current.search && destination.hash === current.hash && Date.now() - arrival.time < 15000 &&
        !reducedMotion.matches && !body.classList.contains('is-preloader-active')) {
      body.classList.add('is-page-entering');
      arrivalTimer = window.setTimeout(() => body.classList.remove('is-page-entering'), 320);
    }
  } catch { /* Navigation also works when browser storage is unavailable. */ }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.hasAttribute('download') || link.getAttribute('aria-disabled') === 'true' ||
        (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, window.location.href);
    const current = new URL(window.location.href);
    if (!pageId(destination) || pageId(destination) === pageId(current) || reducedMotion.matches ||
        body.classList.contains('is-preloader-active')) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    body.classList.remove('is-page-entering');
    body.classList.add('is-page-leaving');
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({url:destination.href, time:Date.now()}));
    } catch { /* The exit effect does not depend on storage. */ }
    window.setTimeout(() => window.location.assign(destination.href), 180);
    // Restore the current document if navigation is cancelled or fails.
    window.setTimeout(reset, 1800);
  });
  window.addEventListener('pageshow', (event) => { if (event.persisted) reset(); });
})();
