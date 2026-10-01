(() => {
  'use strict';

  const body = document.body;
  const loader = document.querySelector('.loader');
  const loaderCount = document.getElementById('loaderCount');
  const loaderLine = document.querySelector('.loader__line');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const smokeCanvas = document.getElementById('cursorSmoke');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  function finishLoading() {
    body.classList.add('loaded');
    let n = 0;
    if (reducedMotion) {
      loaderCount.textContent = '100';
      loaderLine.style.width = '100%';
      loader.classList.add('is-done');
      return;
    }
    const timer = setInterval(() => {
      n += Math.ceil((100 - n) * 0.18);
      if (n >= 100) {
        n = 100;
        clearInterval(timer);
        setTimeout(() => loader.classList.add('is-done'), 250);
      }
      loaderCount.textContent = String(n);
      loaderLine.style.width = `${n}%`;
    }, 24);
  }

  window.addEventListener('load', () => setTimeout(finishLoading, 200));

  // Menu
  function setCursorSuppressed(suppressed) {
    body.classList.toggle('cursor-suppressed', suppressed);
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const open = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });

    [menuToggle, siteNav].forEach((el) => {
      el.addEventListener('pointerenter', () => setCursorSuppressed(true));
      el.addEventListener('pointerleave', () => setCursorSuppressed(false));
    });

    siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      setCursorSuppressed(false);
    }));
  }

  // Lightweight liquid smoke cursor. The pointer itself is an organic smoke core;
  // no white dot/orb is drawn. The trail is emitted only while the mouse moves.
  const particles = [];
  if (smokeCanvas && finePointer && !reducedMotion) {
    const ctx = smokeCanvas.getContext('2d', { alpha: true, desynchronized: true });
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    let pointerX = -100;
    let pointerY = -100;
    let lastX = pointerX;
    let lastY = pointerY;
    let lastMove = 0;
    let lastSpawn = 0;
    let huePhase = 0;
    let frame = 0;
    let running = true;

    const palette = [
      [255, 112, 126], // coral
      [255, 191, 118], // warm amber
      [205, 145, 255], // violet
      [104, 213, 255], // cyan
      [116, 235, 194]  // mint
    ];

    const sprites = palette.map(([r, g, b]) => {
      const c = document.createElement('canvas');
      c.width = 72; c.height = 72;
      const g2 = c.getContext('2d');
      const grad = g2.createRadialGradient(36, 36, 0, 36, 36, 36);
      grad.addColorStop(0, `rgba(${r},${g},${b},.24)`);
      grad.addColorStop(.24, `rgba(${r},${g},${b},.15)`);
      grad.addColorStop(.58, `rgba(${r},${g},${b},.055)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      g2.fillStyle = grad;
      g2.fillRect(0, 0, 72, 72);
      return c;
    });

    function resizeSmoke() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      smokeCanvas.width = Math.floor(width * dpr);
      smokeCanvas.height = Math.floor(height * dpr);
      smokeCanvas.style.width = `${width}px`;
      smokeCanvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function colorIndex() {
      return Math.floor((((huePhase % palette.length) + palette.length) % palette.length));
    }

    function emit(x, y, dx, dy, now) {
      const speed = Math.hypot(dx, dy);
      if (speed < .35 || now - lastSpawn < 12) return;
      lastSpawn = now;
      huePhase += .018 + Math.min(speed, 24) * .0008;
      const idx = colorIndex();
      const angle = Math.atan2(dy, dx);
      const normal = angle + Math.PI / 2;
      const count = speed > 22 ? 3 : speed > 8 ? 2 : 1;

      for (let i = 0; i < count; i += 1) {
        const back = 7 + Math.random() * Math.min(22, speed * .7);
        const spread = (Math.random() - .5) * Math.min(26, 7 + speed);
        particles.push({
          x: x - Math.cos(angle) * back + Math.cos(normal) * spread,
          y: y - Math.sin(angle) * back + Math.sin(normal) * spread,
          vx: -Math.cos(angle) * (.08 + speed * .018) + (Math.random() - .5) * .16,
          vy: -Math.sin(angle) * (.08 + speed * .018) + (Math.random() - .5) * .16,
          size: 26 + Math.random() * 28 + Math.min(speed, 18),
          life: 1,
          decay: .018 + Math.random() * .009,
          alpha: .75 + Math.random() * .18,
          rotation: Math.random() * Math.PI * 2,
          color: idx,
          wobble: Math.random() * Math.PI * 2
        });
      }
      if (particles.length > 54) particles.splice(0, particles.length - 54);
    }

    function drawParticle(p) {
      const fade = p.life * p.life;
      const sprite = sprites[p.color];
      const s = p.size;
      ctx.globalAlpha = p.alpha * fade;
      ctx.drawImage(sprite, p.x - s * .5, p.y - s * .5, s, s);
    }

    function drawCursorCore(now) {
      if (pointerX < 0 || body.classList.contains('cursor-suppressed')) return;
      const idle = now - lastMove > 80;
      const pulse = idle ? 0 : 1 + Math.sin(now * .008) * .06;
      const idx = colorIndex();
      const sprite = sprites[idx];
      const s = 30 * pulse;
      ctx.globalAlpha = idle ? 0 : .72;
      ctx.drawImage(sprite, pointerX - s * .5, pointerY - s * .5, s, s);
      // Two offset wisps make the pointer read as smoke rather than a circle.
      ctx.globalAlpha = idle ? 0 : .28;
      ctx.drawImage(sprite, pointerX - s * .72, pointerY - s * .38, s * .9, s * .72);
      ctx.globalAlpha = idle ? 0 : .22;
      ctx.drawImage(sprite, pointerX + s * .08, pointerY - s * .55, s * .72, s * .9);
    }

    function animateSmoke(now = performance.now()) {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      const suppressed = body.classList.contains('cursor-suppressed');
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.wobble += .035;
        p.vx += Math.cos(p.wobble) * .004;
        p.vy += Math.sin(p.wobble) * .004;
        p.vx *= .982;
        p.vy *= .982;
        p.size *= 1.012;
        p.life -= p.decay * (suppressed ? 2.8 : 1);
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        drawParticle(p);
      }
      drawCursorCore(now);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      frame = requestAnimationFrame(animateSmoke);
    }

    resizeSmoke();
    window.addEventListener('resize', resizeSmoke, { passive: true });
    window.addEventListener('pointermove', (event) => {
      if (body.classList.contains('cursor-suppressed')) return;
      const now = performance.now();
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      lastMove = now;
      emit(pointerX, pointerY, dx, dy, now);
      lastX = pointerX;
      lastY = pointerY;
    }, { passive: true });
    window.addEventListener('blur', () => { particles.length = 0; lastMove = 0; }, { passive: true });
    window.addEventListener('beforeunload', () => { running = false; cancelAnimationFrame(frame); });
    animateSmoke();
  }

  // Hero name: proximity-based magnification. Instead of a hard hover jump,
  // each letter continuously follows the pointer with a soft spring-like scale.
  const heroTitle = document.querySelector('.hero__title');
  const heroLetters = [...document.querySelectorAll('.hero__letter')];
  if (heroTitle && heroLetters.length && finePointer && !reducedMotion) {
    const targets = heroLetters.map(() => 1);
    const current = heroLetters.map(() => 1);
    let mouseX = -1000;
    let mouseY = -1000;
    let raf = 0;

    heroTitle.addEventListener('pointermove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }, { passive: true });

    heroTitle.addEventListener('pointerleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    function animateHeroLetters() {
      heroLetters.forEach((letter, index) => {
        const rect = letter.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const distance = Math.hypot(mouseX - cx, mouseY - cy);
        const influenceRadius = Math.max(115, Math.min(190, rect.width * 2.6));
        const influence = Math.max(0, 1 - distance / influenceRadius);
        targets[index] = 1 + influence * 1.35;
        current[index] += (targets[index] - current[index]) * 0.105;
        letter.style.setProperty('--hero-scale', current[index].toFixed(3));
      });
      raf = requestAnimationFrame(animateHeroLetters);
    }
    animateHeroLetters();
    window.addEventListener('beforeunload', () => cancelAnimationFrame(raf));
  }

  // Premium scroll choreography: text and blocks ease in on entry and softly
  // dissolve upward/downward when leaving the viewport.
  const revealTargets = [
    ...document.querySelectorAll('.reveal, .reveal-media'),
    ...document.querySelectorAll('.statement__copy p, .section-head, .work__intro h2, .work__intro p, .project-card, .experience__head h2, .experience__head p, .timeline-item, .contact__title-wrap h2, .contact__intro, .detail-block, .contact-form, .site-footer')
  ];
  revealTargets.forEach((el) => {
    if (!el.classList.contains('reveal') && !el.classList.contains('reveal-media')) {
      if (el.matches('h2, .section-head')) el.classList.add('scroll-heading');
      else el.classList.add('scroll-text');
    }
  });

  let lastScrollY = window.scrollY;
  let scrollDirection = 'down';
  let scrollTicking = false;
  function updateScrollDirection() {
    const y = window.scrollY;
    if (Math.abs(y - lastScrollY) > 1) scrollDirection = y > lastScrollY ? 'down' : 'up';
    lastScrollY = y;
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateScrollDirection);
      scrollTicking = true;
    }
  }, { passive: true });

  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        const isHands = el.classList.contains('hands-reveal');
        if (entry.isIntersecting) {
          if (isHands) {
            el.classList.remove('is-exiting-up', 'is-exiting-down');
            void el.offsetWidth;
          } else {
            el.classList.remove('is-exiting-up', 'is-exiting-down');
          }
          el.classList.add('is-visible');
        } else if (el.classList.contains('is-visible')) {
          el.classList.remove('is-exiting-up', 'is-exiting-down');
          if (isHands) {
            el.classList.remove('is-visible');
            el.classList.add(scrollDirection === 'up' ? 'is-exiting-up' : 'is-exiting-down');
          } else {
            el.classList.add(scrollDirection === 'up' ? 'is-exiting-up' : 'is-exiting-down');
          }
        }
      });
    }, { threshold: 0.12, rootMargin: '-10% 0px -10% 0px' });
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  // Subtle image parallax without scroll-event jank.
  const philosophyImage = document.querySelector('.philosophy-image-wrap');
  if (philosophyImage && !reducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      const rect = philosophyImage.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = (viewport - rect.top) / (viewport + rect.height);
      const y = Math.max(-2, Math.min(2, (progress - 0.5) * 8));
      philosophyImage.style.setProperty('--parallax-y', `${y}%`);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  // Project card tilt
  document.querySelectorAll('.project-card').forEach((card) => {
    if (reducedMotion) return;
    card.addEventListener('pointermove', (event) => {
      if (window.innerWidth <= 900) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${(-y * 2.6).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Magnetic buttons
  document.querySelectorAll('.magnetic').forEach((el) => {
    if (reducedMotion || window.innerWidth <= 900) return;
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Contact form: compose a Gmail message with every submitted field already
  // populated. If Gmail is unavailable, the browser falls back to mailto.
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (!name || !email || !message) {
        formNote.textContent = 'Please complete all fields.';
        return;
      }

      const subject = `Portfolio enquiry from ${name}`;
      const bodyText = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('apatilatharva2005@gmail.com')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      const popup = window.open(gmailUrl, '_blank', 'noopener,noreferrer');

      if (popup) {
        formNote.textContent = 'Opening Gmail with your message ready to send…';
      } else {
        window.location.href = `mailto:apatilatharva2005@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        formNote.textContent = 'Opening your email app…';
      }
    });
  }
})();
