
      const header = document.querySelector('[data-site-header]');
      const hero = document.querySelector('.hero');
      const lightSections = document.querySelectorAll('.principles, .product-map');
      const logo = header.querySelector('.logo');

      const updateHeaderTheme = () => {
        const logoBounds = logo.getBoundingClientRect();
        const heroBounds = hero.getBoundingClientRect();
        const heroLightStart = heroBounds.top + (window.innerWidth <= 800 ? 96 : 87);
        const isOverHeroLightShape = logoBounds.bottom > heroLightStart && logoBounds.top < heroBounds.bottom;
        const isOverLightSection = [...lightSections].some((section) => {
          const sectionBounds = section.getBoundingClientRect();
          return sectionBounds.top < logoBounds.bottom && sectionBounds.bottom > logoBounds.top;
        });
        header.classList.toggle('is-light', isOverHeroLightShape || isOverLightSection);
      };

      updateHeaderTheme();
      window.addEventListener('scroll', updateHeaderTheme, { passive: true });
      window.addEventListener('resize', updateHeaderTheme);

      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));


      document.querySelectorAll('.nav a:not(.nav__cta)').forEach((link) => {
        const label = link.textContent.trim();
        link.setAttribute('aria-label', label);
        link.textContent = '';

        const word = document.createElement('span');
        word.className = 'letter-swap nav__word-swap';
        word.dataset.letter = label;
        word.setAttribute('aria-hidden', 'true');
        link.append(word);
      });

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


      const teamViewport = document.querySelector('[data-team-viewport]');
      const teamStep = 267;

      let teamDragStart = 0;
      let teamScrollStart = 0;
      teamViewport.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button, a, .person-preview__detail')) return;
        if (event.pointerType !== 'mouse') return;
        teamDragStart = event.clientX;
        teamScrollStart = teamViewport.scrollLeft;
        teamViewport.classList.add('is-dragging');
        teamViewport.setPointerCapture(event.pointerId);
      });
      teamViewport.addEventListener('pointermove', (event) => {
        if (!teamViewport.classList.contains('is-dragging')) return;
        teamViewport.scrollLeft = teamScrollStart - (event.clientX - teamDragStart);
      });
      const stopTeamDrag = (event) => {
        if (!teamViewport.classList.contains('is-dragging')) return;
        teamViewport.classList.remove('is-dragging');
        if (teamViewport.hasPointerCapture(event.pointerId)) teamViewport.releasePointerCapture(event.pointerId);
      };
      teamViewport.addEventListener('pointerup', stopTeamDrag);
      teamViewport.addEventListener('pointercancel', stopTeamDrag);
      teamViewport.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') teamViewport.scrollBy({ left: -teamStep, behavior: 'smooth' });
        if (event.key === 'ArrowRight') teamViewport.scrollBy({ left: teamStep, behavior: 'smooth' });
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


    