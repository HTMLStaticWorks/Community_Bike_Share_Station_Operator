document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     STATE & ELEMENTS
     ========================================================================== */
  const htmlEl = document.documentElement;
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.querySelector('.drawer');
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const drawerClose = document.querySelector('.drawer-close');
  
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const rtlToggles = document.querySelectorAll('.rtl-toggle');

  /* ==========================================================================
     ICONS INITIALIZATION (Lucide)
     ========================================================================== */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  /* ==========================================================================
     NAVBAR STICKY EFFECT
     ========================================================================== */
  window.addEventListener('scroll', () => {
    if (!navbar) return; // auth pages have no navbar
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  /* ==========================================================================
     HAMBURGER DRAWER
     ========================================================================== */
  function openDrawer() {
    drawer.classList.add('active');
    drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // Close drawer on link click
  const drawerLinks = document.querySelectorAll('.drawer-nav .nav-link');
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  /* ==========================================================================
     THEME TOGGLE (DARK/LIGHT)
     ========================================================================== */
  // Theme applies on every page, including login/register
  
  {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Initial setup
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      htmlEl.setAttribute('data-theme', 'dark');
      updateThemeIcons('dark');
    } else {
      htmlEl.removeAttribute('data-theme');
      updateThemeIcons('light');
    }

    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const isDark = htmlEl.hasAttribute('data-theme');
        if (isDark) {
          htmlEl.removeAttribute('data-theme');
          localStorage.setItem('theme', 'light');
          updateThemeIcons('light');
        } else {
          htmlEl.setAttribute('data-theme', 'dark');
          localStorage.setItem('theme', 'dark');
          updateThemeIcons('dark');
        }
      });
    });
  }

  function updateThemeIcons(theme) {
    themeToggles.forEach(toggle => {
      if (typeof lucide !== 'undefined') {
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        toggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
        lucide.createIcons(); // Re-render new icon
      } else {
        // Fallback text if icons not loaded
        toggle.textContent = theme === 'dark' ? '☀' : '🌙';
      }
    });
  }

  /* ==========================================================================
     RTL TOGGLE
     ========================================================================== */
  const savedRTL = localStorage.getItem('rtl');
  if (savedRTL === 'true') {
    htmlEl.setAttribute('dir', 'rtl');
  }

  rtlToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isRTL = htmlEl.getAttribute('dir') === 'rtl';
      if (isRTL) {
        htmlEl.removeAttribute('dir');
        localStorage.setItem('rtl', 'false');
      } else {
        htmlEl.setAttribute('dir', 'rtl');
        localStorage.setItem('rtl', 'true');
      }
    });
  });

  /* ==========================================================================
     INTERSECTION OBSERVER (Scroll Animations)
     ========================================================================== */
  const animateElements = document.querySelectorAll('.animate-fade-up');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animateElements.forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });

  /* ==========================================================================
     COUNT-UP NUMBERS
     Usage: <span data-count="15" data-suffix="k+" data-decimals="0"></span>
     ========================================================================== */
  const counters = document.querySelectorAll('[data-count]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatCount(el, value) {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    return prefix + value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + suffix;
  }

  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    if (reduceMotion) {
      el.textContent = formatCount(el, target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatCount(el, target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => {
    el.textContent = formatCount(el, 0);
    counterObserver.observe(el);
  });
});
