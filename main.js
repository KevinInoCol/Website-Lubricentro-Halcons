(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ——— Header sombra al hacer scroll ——— */
  var header = document.querySelector("[data-header]");
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("header--scrolled", window.scrollY > 28);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ——— Hero: entrada escalonada ——— */
  var hero = document.getElementById("hero");
  if (hero) {
    if (prefersReducedMotion) {
      hero.classList.add("hero--ready");
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          hero.classList.add("hero--ready");
        });
      });
    }
  }

  /* ——— Parallax suave en capas del hero ——— */
  var heroLayers = document.getElementById("hero-layers");
  var heroMouseX = 0;
  var heroMouseY = 0;
  if (hero && heroLayers && !prefersReducedMotion) {
    hero.addEventListener(
      "mousemove",
      function (e) {
        var r = hero.getBoundingClientRect();
        heroMouseX = (e.clientX - r.left) / r.width - 0.5;
        heroMouseY = (e.clientY - r.top) / r.height - 0.5;
        window.requestAnimationFrame(heroParallax);
      },
      { passive: true }
    );
    hero.addEventListener("mouseleave", function () {
      heroMouseX = 0;
      heroMouseY = 0;
      heroParallax();
    });

    function heroParallax() {
      var rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        heroLayers.style.transform = "";
        return;
      }
      var y = window.scrollY * 0.12;
      var tx = heroMouseX * 14;
      var ty = y + heroMouseY * 10;
      heroLayers.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
    }
    window.addEventListener(
      "scroll",
      function () {
        window.requestAnimationFrame(heroParallax);
      },
      { passive: true }
    );
    heroParallax();
  }

  /* ——— Canvas: partículas / polvo de luz en el banner ——— */
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  function initHeroCanvas() {
    var canvas = document.getElementById("hero-canvas");
    var heroEl = document.getElementById("hero");
    if (!canvas || !heroEl || prefersReducedMotion) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var particles = [];
    var W = 0;
    var H = 0;
    var running = false;
    var rafId = 0;

    function initParticles() {
      particles = [];
      var n = Math.min(72, Math.max(28, Math.floor((W * H) / 14000)));
      var i;
      for (i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.42,
          vy: (Math.random() - 0.5) * 0.42,
          r: Math.random() * 1.6 + 0.35,
          a: Math.random() * 0.28 + 0.06,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      W = heroEl.offsetWidth;
      H = heroEl.offsetHeight;
      if (W < 1 || H < 1) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var i;
      var p;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.ph += 0.025;
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;
        if (p.y < -8) p.y = H + 8;
        if (p.y > H + 8) p.y = -8;
        var tw = 0.88 + Math.sin(p.ph) * 0.12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * tw, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 240, 255, " + p.a * tw + ")";
        ctx.fill();
      }
      rafId = window.requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    var io = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(heroEl);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (heroEl.getBoundingClientRect().bottom > 0 && heroEl.getBoundingClientRect().top < window.innerHeight) {
        start();
      }
    });

    resize();
    window.addEventListener("resize", debounce(resize, 180));
    start();
  }

  initHeroCanvas();

  /* ——— Scroll reveal por sección ——— */
  var revealGroups = document.querySelectorAll("[data-reveal-group]");
  function revealAll() {
    revealGroups.forEach(function (el) {
      el.classList.add("is-revealed");
    });
  }

  function runStatCounters() {
    document.querySelectorAll(".about__stat-num[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (prefersReducedMotion || isNaN(target)) {
        el.textContent = String(target);
        return;
      }
      if (el.dataset.animated === "1") return;
      el.dataset.animated = "1";
      var start = performance.now();
      var dur = 1100;
      function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * p));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  if (prefersReducedMotion) {
    revealAll();
    runStatCounters();
  } else if (revealGroups.length) {
    var ioReveal = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var target = entry.target;
          target.classList.add("is-revealed");
          if (target.id === "nosotros") {
            window.setTimeout(runStatCounters, 380);
          }
          ioReveal.unobserve(target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealGroups.forEach(function (el) {
      ioReveal.observe(el);
    });
  }

  /* ——— Ripple en botones ——— */
  if (!prefersReducedMotion) {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".btn--ripple");
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var span = document.createElement("span");
      span.className = "btn-ripple__fx";
      span.style.left = x + "px";
      span.style.top = y + "px";
      btn.appendChild(span);
      window.setTimeout(function () {
        span.remove();
      }, 700);
    });
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      overlay.classList.toggle("is-visible", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    overlay.addEventListener("click", function () {
      setOpen(false);
    });

    nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 900px)").matches) setOpen(false);
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  function initCarousel(carouselRoot) {
    if (!carouselRoot) return;
    var viewport = carouselRoot.querySelector(".carousel__viewport");
    var track = carouselRoot.querySelector(".carousel__track");
    var slides = carouselRoot.querySelectorAll(".carousel__slide");
    var prevBtn = carouselRoot.querySelector(".carousel__arrow--prev");
    var nextBtn = carouselRoot.querySelector(".carousel__arrow--next");
    var dots = carouselRoot.querySelectorAll(".carousel__dot");
    var n = slides.length;
    var index = 0;
    var resizeTimer;

    function layoutSlides() {
      if (!viewport || !slides.length) return;
      var w = viewport.offsetWidth;
      slides.forEach(function (slide) {
        slide.style.flex = "0 0 " + w + "px";
        slide.style.width = w + "px";
      });
    }

    function slideWidth() {
      return viewport ? viewport.offsetWidth : 0;
    }

    function setTransform() {
      if (!track || !viewport) return;
      layoutSlides();
      var w = slideWidth();
      track.style.transform = "translate3d(" + -index * w + "px,0,0)";
    }

    function updateDots() {
      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    function goTo(i) {
      index = (i % n + n) % n;
      setTransform();
      updateDots();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        setTransform();
      }, 100);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var i = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(i)) goTo(i);
      });
    });

    window.addEventListener("resize", onResize);

    function firstLayout() {
      setTransform();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(firstLayout);
    } else {
      firstLayout();
    }
  }

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    initCarousel(root);
  });
})();
