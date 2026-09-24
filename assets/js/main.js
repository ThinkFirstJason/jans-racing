/* =========================================================
   Jan's Racing — interactions
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- green flag loader ---------- */
  var loader = document.getElementById('loader');

  function greenFlag() {
    body.classList.remove('is-loading');
    body.classList.add('go');
    loader.classList.add('done');
    setTimeout(function () { loader.remove(); }, 800);
  }

  var seen = false;
  try { seen = sessionStorage.getItem('jr-intro') === '1'; } catch (e) {}

  if (reduceMotion || seen) {
    greenFlag();
  } else {
    // build the flag from vertical slices so each one can ripple on its own delay
    var flag = document.getElementById('greenFlag');
    var slices = 24;
    for (var i = 0; i < slices; i++) {
      var sl = document.createElement('span');
      sl.style.setProperty('--i', i);
      flag.appendChild(sl);
    }
    loader.querySelectorAll('.bw').forEach(function (w, i) {
      setTimeout(function () { w.classList.add('on'); }, 350 + i * 380);
    });
    setTimeout(greenFlag, 3300);
    try { sessionStorage.setItem('jr-intro', '1'); } catch (e) {}
  }

  /* ---------- nav ---------- */
  var nav = document.getElementById('siteNav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    body.style.overflow = open ? 'hidden' : '';
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    });
  });

  var navAnchors = links.querySelectorAll('a[data-nav]');
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navAnchors.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navAnchors.forEach(function (a) {
    var s = document.querySelector(a.getAttribute('href'));
    if (s) sectionObserver.observe(s);
  });

  /* ---------- scroll: progress bar, nav state, velocity, timeline ---------- */
  var progressBar = document.getElementById('progressBar');
  var timeline = document.getElementById('timeline');
  var tlFill = document.getElementById('tlFill');
  var tlCar = document.getElementById('tlCar');
  var lastY = window.scrollY;
  var scrollBoost = 0; // extra speed fed to the hero streaks
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    nav.classList.toggle('scrolled', y > 40);

    scrollBoost = Math.min(scrollBoost + Math.abs(y - lastY) * 0.08, 30);
    lastY = y;

    var r = timeline.getBoundingClientRect();
    var p = (window.innerHeight * 0.6 - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    tlFill.style.transform = 'scaleY(' + p + ')';
    tlCar.style.top = (p * 100) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- reveals ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

  // stagger siblings so rows come in like a pack, not all at once
  document.querySelectorAll('.reveal, .reveal-slide').forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
      return c.classList.contains('reveal') || c.classList.contains('reveal-slide');
    });
    var i = siblings.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i * 0.08, 0.5) + 's';
    revealObserver.observe(el);
  });

  /* ---------- stat counters ---------- */
  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-count'), 10);
      countObserver.unobserve(el);
      if (reduceMotion) { el.textContent = target; return; }
      var start = performance.now();
      var dur = 1200;
      (function step(now) {
        var t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { countObserver.observe(el); });

  /* ---------- hero speed streaks + speedometer ---------- */
  var canvas = document.getElementById('speedCanvas');
  var gauge = document.getElementById('gaugeNum');
  var hero = document.getElementById('hero');

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var streaks = [];
    var heroVisible = true;
    var mouseBoost = 0;
    var speed = 0; // eases up from 0 after the green flag

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(W / 14);
      streaks = [];
      for (var i = 0; i < count; i++) streaks.push(makeStreak(true));
    }

    function makeStreak(anywhere) {
      return {
        x: anywhere ? Math.random() * W : -Math.random() * W * 0.3,
        y: Math.pow(Math.random(), 0.8) * H,
        len: 40 + Math.random() * 220,
        v: 0.6 + Math.random() * 1.4,
        w: Math.random() < 0.12 ? 2.5 : 1,
        yellow: Math.random() < 0.35
      };
    }

    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(hero);
    hero.addEventListener('pointermove', function () { mouseBoost = Math.min(mouseBoost + 0.6, 10); });
    window.addEventListener('resize', resize);
    resize();

    function frame() {
      requestAnimationFrame(frame);
      scrollBoost *= 0.92;
      mouseBoost *= 0.95;
      var target = body.classList.contains('go') ? 9 : 0;
      speed += (target - speed) * 0.02;
      var s = speed + scrollBoost + mouseBoost;

      if (gauge) {
        // map streak speed to a believable short-track number
        var mph = Math.round(s * 14.5 + (s > 1 ? Math.sin(performance.now() / 180) * 1.5 : 0));
        gauge.textContent = String(Math.max(0, mph)).padStart(3, '0');
      }
      if (!heroVisible) return;

      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < streaks.length; i++) {
        var st = streaks[i];
        st.x += st.v * s;
        var len = st.len * (0.6 + s / 12);
        if (st.x - len > W) { streaks[i] = makeStreak(false); continue; }
        var grad = ctx.createLinearGradient(st.x - len, 0, st.x, 0);
        var c = st.yellow ? '255,209,0' : '255,255,255';
        grad.addColorStop(0, 'rgba(' + c + ',0)');
        grad.addColorStop(1, 'rgba(' + c + ',' + (st.yellow ? 0.55 : 0.28) + ')');
        ctx.strokeStyle = grad;
        ctx.lineWidth = st.w;
        ctx.beginPath();
        ctx.moveTo(st.x - len, st.y);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  } else if (gauge) {
    gauge.textContent = '140';
  }

  /* ---------- gallery lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.g-item'));
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var current = 0;
  var lastFocus = null;

  function show(i) {
    current = (i + items.length) % items.length;
    var thumb = items[current].querySelector('img');
    lbImg.src = items[current].getAttribute('data-full');
    lbImg.alt = thumb.alt;
    // restart the entry animation on each photo change
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  }
  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  }
  function close() {
    lb.hidden = true;
    body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  items.forEach(function (btn, i) { btn.addEventListener('click', function () { open(i); }); });
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
