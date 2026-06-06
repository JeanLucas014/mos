/* ============================================================
   JL OS — home interactions & animations
   ============================================================ */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Only run the entrance/scroll choreography when the page is actually
     focused AND motion is allowed. Unfocused contexts (screenshot capture,
     background tabs) freeze CSS transitions mid-flight, so there we keep the
     finished, fully-visible layout instead. */
  const animate = !reduce && document.hasFocus();
  const html = document.documentElement;

  /* ---------- NAV: scrolled state ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- COUNTERS ---------- */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function setFinal(el) {
    const t = parseFloat(el.dataset.target);
    const dec = parseInt(el.dataset.dec || '0', 10);
    el.textContent = t.toFixed(dec);
  }
  function animateCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseFloat(el.dataset.target);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const dur = parseInt(el.dataset.dur || '1500', 10);
    const start = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = (target * easeOut(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(dec);
    })(start);
  }

  /* ---------- STATIC FALLBACK (no animation) ---------- */
  if (!animate) {
    document.querySelectorAll('[data-target]').forEach(setFinal);
    return; // everything is visible by default — nothing else to do
  }

  /* ---------- ANIMATED PATH ---------- */
  html.classList.add('anim-on');

  /* reveal + stagger + counters on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      if (el.dataset.stagger !== undefined) {
        const step = parseInt(el.dataset.stagger || '85', 10);
        [...el.children].forEach((k, i) => {
          k.classList.add('reveal');
          // force reflow so the freshly-added hidden state is registered
          void k.offsetWidth;
          setTimeout(() => k.classList.add('in'), i * step);
        });
        return;
      }
      el.classList.add('in');
      el.querySelectorAll('[data-target]').forEach(animateCount);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal, .line-reveal, .clip-reveal, [data-stagger]').forEach((el) => io.observe(el));
  document.querySelectorAll('[data-target]').forEach((el) => {
    if (!el.closest('.reveal') && !el.closest('[data-stagger]') && !el.closest('.hero')) io.observe(el);
  });

  /* ---------- HERO ENTRANCE SEQUENCE ---------- */
  const words = document.querySelectorAll('.hero-title .word');
  const caret = document.querySelector('.hero-caret');
  const showBit = (sel, delay) => {
    const el = document.querySelector(sel);
    if (el) setTimeout(() => el.classList.add('in'), delay);
  };

  words.forEach((w, i) => {
    w.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1)';
    setTimeout(() => { w.style.opacity = '1'; w.style.transform = 'translateY(0)'; }, 320 + i * 95);
  });
  const titleDone = 320 + words.length * 95;
  if (caret) setTimeout(() => { caret.style.opacity = '1'; }, titleDone);
  showBit('[data-hero="label"]', 120);
  showBit('[data-hero="sub"]', titleDone + 120);
  showBit('[data-hero="cta"]', titleDone + 300);
  setTimeout(() => {
    document.querySelectorAll('.metric').forEach((m, i) => {
      m.classList.add('reveal');
      void m.offsetWidth;
      setTimeout(() => {
        m.classList.add('in');
        m.querySelectorAll('[data-target]').forEach(animateCount);
      }, i * 110);
    });
  }, titleDone + 480);

  /* ---------- HERO AMBIENT (mouse parallax + dot field), paused offscreen ---------- */
  const dotsWrap = document.querySelector('.hero-bg');
  const hero = document.querySelector('.hero');
  let heroVisible = true;
  if (hero) {
    const hio = new IntersectionObserver((ents) => {
      heroVisible = ents[0].isIntersecting;
      if (heroVisible) { startMouse(); startDraw(); }
    }, { threshold: 0 });
    hio.observe(hero);
  }

  // mouse parallax — settles to rest and stops until next move
  let mouseRaf = null, tx = 0, ty = 0, cx = 0, cy = 0;
  function mouseLoop() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    if (dotsWrap) dotsWrap.style.transform = `translate(${cx * -1.6}px, ${cy * -1.6}px)`;
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
      mouseRaf = requestAnimationFrame(mouseLoop);
    } else { mouseRaf = null; }
  }
  function startMouse() { if (!mouseRaf) mouseRaf = requestAnimationFrame(mouseLoop); }
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -12;
      ty = (e.clientY / window.innerHeight - 0.5) * -10;
      if (heroVisible) startMouse();
    });
  }

  /* ---------- SCROLL-LINKED PARALLAX ([data-speed]) ---------- */
  const speedEls = [...document.querySelectorAll('[data-speed]')];
  if (speedEls.length) {
    let ticking = false;
    function applyParallax() {
      const vh = window.innerHeight;
      for (const el of speedEls) {
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2) - vh / 2;
        const speed = parseFloat(el.dataset.speed) || 0;
        el.style.transform = `translate3d(0, ${(-offset * speed).toFixed(1)}px, 0)`;
      }
      ticking = false;
    }
    function requestParallax() { if (!ticking) { ticking = true; requestAnimationFrame(applyParallax); } }
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax, { passive: true });
    applyParallax();
  }

  /* ---------- HERO DOT FIELD (paused offscreen) ---------- */
  let drawRaf = null;
  const canvas = document.getElementById('dots-canvas');
  function startDraw() { if (canvas && !drawRaf) drawRaf = requestAnimationFrame(drawDots); }
  let _ctx, _w = 0, _h = 0, _dots = [];
  function drawDots() {
    if (!heroVisible) { drawRaf = null; return; }
    _ctx.clearRect(0, 0, _w, _h);
    for (const d of _dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > _w) d.vx *= -1;
      if (d.y < 0 || d.y > _h) d.vy *= -1;
      _ctx.beginPath();
      _ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      _ctx.fillStyle = 'rgba(255,255,255,0.28)';
      _ctx.fill();
    }
    drawRaf = requestAnimationFrame(drawDots);
  }
  if (canvas) {
    _ctx = canvas.getContext('2d');
    function resizeDots() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      _w = canvas.width = window.innerWidth * dpr;
      _h = canvas.height = Math.max(window.innerHeight, hero.offsetHeight) * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = (_h / dpr) + 'px';
      const count = Math.min(70, Math.floor(window.innerWidth / 22));
      _dots = Array.from({ length: count }, () => ({
        x: Math.random() * _w, y: Math.random() * _h,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.1 + 0.4
      }));
    }
    resizeDots();
    window.addEventListener('resize', resizeDots);
    startDraw();
  }
})();
