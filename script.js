/* ═══════════════════════════════════════════════════════════════
   SHRAVAN KAMATH — PORTFOLIO JAVASCRIPT
   Features:
   - Animated circuit-board canvas background
   - Custom cursor with hover detection
   - Typewriter effect (hero subtitle)
   - Terminal text animation (about section)
   - Scroll-reveal animations
   - Skill bar fill on scroll
   - Mobile hamburger menu
   - Contact form (simulated submit)
   - Smooth nav active state tracking
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════
   1. CIRCUIT BOARD BACKGROUND CANVAS
═══════════════════════════════════════════ */
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');
  const GREEN  = '#00ff64';

  // Grid settings
  const CELL   = 48;   // Grid cell size in px
  let W, H, cols, rows;

  // Node data
  let nodes = [];

  /**
   * Build a grid of nodes and randomly connect them
   * with circuit-style L-shaped traces.
   */
  function buildGrid() {
    W    = canvas.width  = window.innerWidth;
    H    = canvas.height = window.innerHeight;
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    nodes = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Only ~30% of grid intersections become active nodes
        if (Math.random() > 0.30) continue;
        nodes.push({
          x:   c * CELL,
          y:   r * CELL,
          row: r,
          col: c,
          // Pulse animation phase offset
          phase: Math.random() * Math.PI * 2,
          // Pulse speed
          speed: 0.005 + Math.random() * 0.01,
        });
      }
    }
  }

  // Precomputed trace paths between nearby nodes
  let traces = [];

  function buildTraces() {
    traces = [];
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[`${n.col},${n.row}`] = n; });

    nodes.forEach(n => {
      // Try to connect to right and down neighbors within 1-3 cells
      [1, 2, 3].forEach(dist => {
        const right = nodeMap[`${n.col + dist},${n.row}`];
        const down  = nodeMap[`${n.col},${n.row + dist}`];
        if (right && Math.random() > 0.5) {
          traces.push({ from: n, to: right });
        }
        if (down && Math.random() > 0.5) {
          traces.push({ from: n, to: down });
        }
      });
    });
  }

  // Data pulses travelling along traces
  let pulses = [];

  function spawnPulses() {
    pulses = [];
    // Spawn a pulse on ~20% of traces
    traces.forEach(t => {
      if (Math.random() > 0.80) return;
      pulses.push({
        trace:    t,
        progress: Math.random(), // 0–1 along the trace
        speed:    0.001 + Math.random() * 0.003,
      });
    });
  }

  let animFrame;
  let lastTime = 0;

  function draw(now) {
    animFrame = requestAnimationFrame(draw);
    const dt = now - lastTime;
    lastTime = now;
    if (dt > 100) return; // Skip big gaps (tab was hidden)

    ctx.clearRect(0, 0, W, H);

    // ── Draw traces ──────────────────────────────
    ctx.lineWidth = 0.8;
    traces.forEach(t => {
      ctx.strokeStyle = 'rgba(0,255,100,0.06)';
      ctx.beginPath();
      ctx.moveTo(t.from.x, t.from.y);
      // Draw an L-shape (horizontal then vertical)
      ctx.lineTo(t.to.x, t.from.y);
      ctx.lineTo(t.to.x, t.to.y);
      ctx.stroke();
    });

    // ── Draw nodes (pulsing dots) ─────────────────
    nodes.forEach(n => {
      n.phase += n.speed;
      const alpha = 0.08 + 0.12 * Math.abs(Math.sin(n.phase));
      ctx.fillStyle = `rgba(0,255,100,${alpha})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Animate data pulses ───────────────────────
    pulses.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;

      const t    = p.trace;
      const prog = p.progress;

      // L-path: first half goes horizontal, second half goes vertical
      let px, py;
      if (prog < 0.5) {
        // Horizontal segment: from.x → to.x at from.y
        const t2 = prog * 2;
        px = t.from.x + (t.to.x - t.from.x) * t2;
        py = t.from.y;
      } else {
        // Vertical segment: corner → to.y
        const t2 = (prog - 0.5) * 2;
        px = t.to.x;
        py = t.from.y + (t.to.y - t.from.y) * t2;
      }

      // Glowing dot
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
      grad.addColorStop(0, 'rgba(0,255,100,0.8)');
      grad.addColorStop(1, 'rgba(0,255,100,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Initialize
  buildGrid();
  buildTraces();
  spawnPulses();
  requestAnimationFrame(draw);

  // Rebuild on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animFrame);
      buildGrid();
      buildTraces();
      spawnPulses();
      requestAnimationFrame(draw);
    }, 200);
  });
})();


/* ═══════════════════════════════════════════
   2. CUSTOM CURSOR
═══════════════════════════════════════════ */
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0; // Mouse position
  let rx = 0, ry = 0; // Ring position (lagged)

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Smooth ring follow
  function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  // Expand ring on interactive elements
  const interactiveSelectors = 'a, button, input, textarea, .project-card, .skill-cluster';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveSelectors)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactiveSelectors)) {
      document.body.classList.remove('cursor-hover');
    }
  });
})();


/* ═══════════════════════════════════════════
   3. TYPEWRITER EFFECT (Hero subtitle)
═══════════════════════════════════════════ */
(function initTypewriter() {
  const el = document.getElementById('typewriterEl');
  if (!el) return;

  // Rotating phrases for the hero subtitle
  const phrases = [
    'Embedded Systems Engineer',
    'VLSI & Verilog HDL Designer',
    'Field Application Engineer',
    'Power Electronics Enthusiast',
    'ARM Cortex-M33 Developer',
    'PCB Designer — KiCad',
  ];

  let phraseIndex = 0;
  let charIndex   = 0;
  let deleting    = false;
  let paused      = false;

  const SPEED_TYPE   = 60;   // ms per char while typing
  const SPEED_DELETE = 35;   // ms per char while deleting
  const PAUSE_AFTER  = 2000; // ms to wait at full phrase

  function tick() {
    const current = phrases[phraseIndex];

    if (!deleting) {
      // Typing
      charIndex++;
      el.textContent = current.slice(0, charIndex);

      if (charIndex === current.length) {
        // Pause then start deleting
        paused = true;
        setTimeout(() => {
          paused   = false;
          deleting = true;
          tick();
        }, PAUSE_AFTER);
        return;
      }
    } else {
      // Deleting
      charIndex--;
      el.textContent = current.slice(0, charIndex);

      if (charIndex === 0) {
        deleting    = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }

    setTimeout(tick, deleting ? SPEED_DELETE : SPEED_TYPE);
  }

  // Small initial delay so it starts after name reveal
  setTimeout(tick, 1200);
})();


/* ═══════════════════════════════════════════
   4. TERMINAL TEXT ANIMATION (About section)
═══════════════════════════════════════════ */
(function initTerminal() {
  const body = document.getElementById('terminalBody');
  if (!body) return;

  // Lines to display in the terminal
  const lines = [
    { type: 'cmd',     text: '$ cat engineer.profile' },
    { type: 'comment', text: '# ── Identity ──────────────────────' },
    { type: 'val',     text: 'name:       "Shravan Kamath"' },
    { type: 'val',     text: 'degree:     "B.E. ECE — Final Year"' },
    { type: 'val',     text: 'cgpa:       8.6' },
    { type: 'val',     text: 'location:   "India"' },
    { type: 'comment', text: '# ── Core Domains ──────────────────' },
    { type: 'val',     text: 'domains:    ["Embedded", "VLSI", "FAE", "Power"]' },
    { type: 'val',     text: 'boards:     ["NXP FRDM-MCXA156", "STM32H750VB"]' },
    { type: 'val',     text: 'fav_lang:   "Verilog"' },
    { type: 'comment', text: '# ── Status ─────────────────────────' },
    { type: 'val',     text: 'status:     "Actively seeking core ECE roles"' },
    { type: 'cmd',     text: '$ █' },
  ];

  let lineIdx = 0;
  let charIdx = 0;
  let triggered = false; // Only animate once when in view

  function renderNextChar() {
    if (lineIdx >= lines.length) return;

    const line = lines[lineIdx];
    const full = line.text;

    // Append char by char to current line element
    charIdx++;

    // Get or create the current line element
    let lineEl = body.querySelector(`.t-active`);
    if (!lineEl) {
      lineEl = document.createElement('div');
      lineEl.className = `t-line t-${line.type} t-active`;
      body.appendChild(lineEl);
    }

    lineEl.textContent = full.slice(0, charIdx);

    if (charIdx < full.length) {
      // Continue current line
      setTimeout(renderNextChar, line.type === 'comment' ? 12 : 22);
    } else {
      // Line complete
      lineEl.classList.remove('t-active');
      charIdx = 0;
      lineIdx++;

      if (lineIdx < lines.length) {
        setTimeout(renderNextChar, 80);
      } else {
        // Add blinking cursor to last line
        lineEl.classList.add('t-cursor');
      }
    }
  }

  // Trigger when terminal scrolls into view
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        setTimeout(renderNextChar, 400);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(body);
})();


/* ═══════════════════════════════════════════
   5. SCROLL REVEAL ANIMATIONS
═══════════════════════════════════════════ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger reveals within the same parent
        const siblings = entry.target.parentElement.querySelectorAll('.reveal:not(.visible)');
        let delay = 0;
        siblings.forEach((sib, idx) => {
          if (sib === entry.target) delay = idx * 80;
        });
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();


/* ═══════════════════════════════════════════
   6. SKILL BAR FILL ON SCROLL
═══════════════════════════════════════════ */
(function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const targetW = fill.getAttribute('data-w') + '%';
        // Small delay to let the card reveal first
        setTimeout(() => {
          fill.style.width = targetW;
        }, 300);
        observer.unobserve(fill);
      }
    });
  }, { threshold: 0.3 });

  fills.forEach(f => observer.observe(f));
})();


/* ═══════════════════════════════════════════
   7. ACTIVE NAV LINK (based on scroll position)
═══════════════════════════════════════════ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const NAV_H    = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

  function updateActive() {
    let currentId = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= NAV_H + 80) currentId = sec.id;
    });

    navLinks.forEach(link => {
      link.style.color = '';
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.style.color = 'var(--accent)';
      }
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
})();


/* ═══════════════════════════════════════════
   8. MOBILE HAMBURGER MENU
═══════════════════════════════════════════ */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const mobLinks  = document.querySelectorAll('.mob-link');
  if (!hamburger || !mobileNav) return;

  let open = false;

  function toggle() {
    open = !open;
    mobileNav.classList.toggle('open', open);
    // Animate hamburger lines to X
    const spans = hamburger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  }

  hamburger.addEventListener('click', toggle);

  // Close on link click
  mobLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (open) toggle();
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (open && !mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
      toggle();
    }
  });
})();


/* ═══════════════════════════════════════════
   9. CONTACT FORM (Simulated submit)
═══════════════════════════════════════════ */
(function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'SENDING...';

    // Simulate network request
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.querySelector('span').textContent = 'SEND MESSAGE';
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 5000);
    }, 1200);
  });
})();


/* ═══════════════════════════════════════════
   10. NAVBAR SCROLL EFFECT
   (Add glass effect / border when scrolled)
═══════════════════════════════════════════ */
(function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.borderBottomColor = 'rgba(0,255,100,0.18)';
    } else {
      nav.style.borderBottomColor = '';
    }
  }, { passive: true });
})();


/* ═══════════════════════════════════════════
   11. STAGGERED PROJECT CARD REVEAL
   (Adds progressive transition delays)
═══════════════════════════════════════════ */
(function initProjectReveal() {
  const cards = document.querySelectorAll('.project-card.reveal');
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 60}ms`;
  });
})();


/* ═══════════════════════════════════════════
   12. SMOOTH SCROLL OFFSET FIX
   (Ensures nav height is accounted for on all
    anchor clicks, including mobile)
═══════════════════════════════════════════ */
(function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
      ) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ═══════════════════════════════════════════
   13. GLITCH HOVER ON HERO NAME (subtle)
   Adds a brief color-shift on hover
═══════════════════════════════════════════ */
(function initNameGlitch() {
  const heroName = document.querySelector('.hero-name');
  if (!heroName) return;

  heroName.addEventListener('mouseenter', () => {
    heroName.style.filter = 'drop-shadow(2px 0 0 rgba(0,255,100,0.6)) drop-shadow(-2px 0 0 rgba(255,50,50,0.3))';
    setTimeout(() => {
      heroName.style.filter = '';
    }, 200);
  });
})();
