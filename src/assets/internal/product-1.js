
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));


      document.querySelectorAll('.footer__columns a').forEach((link) => {
        const label = link.textContent.trim();
        link.setAttribute('aria-label', label);
        link.textContent = '';
        const word = document.createElement('span');
        word.className = 'letter-swap';
        word.dataset.letter = label;
        word.setAttribute('aria-hidden', 'true');
        link.append(word);
      });


      const pageMain = document.querySelector('main');
      const stickyFooter = document.querySelector('.footer');
      const updateStickyFooter = () => {
        const footerHeight = stickyFooter.offsetHeight;
        const canStick = window.innerWidth > 800 && footerHeight < window.innerHeight * .94;
        document.documentElement.style.setProperty('--footer-space', `${footerHeight}px`);
        stickyFooter.classList.toggle('footer--sticky', canStick);
        pageMain.classList.toggle('footer-is-sticky', canStick);
      };

      updateStickyFooter();
      window.addEventListener('resize', updateStickyFooter);
    