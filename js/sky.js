
let canvas = null;
let ctx = null;
let rafId = 0;
let running = false;
let active = false;

let dpr = 1;
let width = 0;
let height = 0;

let stars = [];
let particles = [];
let seededWidth = 0;
let seededHeight = 0;

let lastTime = 0;
const reduceQuery = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;
let reduce = false;

const MAX_STARS = 420;
const MIN_STARS = 120;
const MAX_PARTICLES = 42;
const MIN_PARTICLES = 12;
const TAU = Math.PI * 2;

/*
 * The sky borrows the crimson palette of the "Vibe Finder" wordmark and the
 * "Каталог тем" heading, so the background and the two gradient headings read
 * as one visual system. 20% of every seeded group takes a colour from that
 * palette; the remaining 80% stay white/grey exactly as before.
 *
 * The accent count is computed from the group size, so the ratio is exact
 * rather than merely expected — important because a phone seeds as few as 12
 * motes, where a random 20% could easily swing to 33%. Accents are spread
 * evenly through the array; since positions are random, the pattern is
 * invisible. All five palette stops are kept for fidelity, with the bright
 * crimson repeated so most accents stay clearly visible on black.
 */
const CRIMSON_RATIO = 0.2;
const CRIMSON_TINTS = [
  'rgba(255, 100, 124, 1)', // #ff647c soft pink-red
  'rgba(229, 46, 88, 1)',   // #e52e58 crimson
  'rgba(229, 46, 88, 1)',   // #e52e58 crimson (doubled: the signature hue)
  'rgba(165, 29, 80, 1)',   // #a51d50 rich raspberry
  'rgba(155, 18, 60, 1)',   // #9b123c dark wine red
  'rgba(74, 7, 27, 1)',     // #4a071b deep burgundy
];

/* Flags exactly `count * CRIMSON_RATIO` entries, spaced evenly through the
   group, so the crimson share never drifts with the viewport size. */
function crimsonFlags(count) {
  const flags = new Array(count).fill(false);
  const accent = Math.max(1, Math.round(count * CRIMSON_RATIO));
  for (let k = 0; k < accent; k += 1) {
    flags[Math.floor(((k + 0.5) * count) / accent)] = true;
  }
  return flags;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function prefersReduce() {
  const forced = document.documentElement.dataset.motion;
  if (forced === 'force') return false;
  if (forced === 'off') return true;
  return Boolean(reduceQuery && reduceQuery.matches);
}

function starTint() {
  const roll = Math.random();
  if (roll < 0.9) return 'rgba(255, 255, 255, 1)';
  if (roll < 0.97) return 'rgba(200, 204, 212, 1)';
  return 'rgba(150, 155, 164, 1)';
}

/*
 * Stars only use the brighter half of the palette: the deep burgundy and the
 * darkest wine red are too close to black to register as "a coloured star" at
 * one or two pixels, and they would read as missing lights instead. The soft
 * dust motes, which are dim by design, cycle through the full palette.
 */
const CRIMSON_STAR_STOPS = 4;

function crimsonTint(order, stops) {
  return CRIMSON_TINTS[order % (stops || CRIMSON_TINTS.length)];
}

function seed() {
  const area = Math.max(width * height, 1);

  const starCount = Math.round(
    Math.min(MAX_STARS, Math.max(MIN_STARS, area / 8200)),
  );
  stars = new Array(starCount);
  const starAccents = crimsonFlags(starCount);
  let starOrder = 0;
  for (let i = 0; i < starCount; i += 1) {
    const depth = rand(0.32, 1);
    const bright = Math.random() < 0.06;
    // One in five stars joins the crimson palette; the rest keep the original
    // white/grey tints, so the field stays mostly neutral.
    const crimson = starAccents[i];
    const order = crimson ? starOrder++ : 0;
    stars[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: (bright ? rand(1.8, 2.6) : rand(0.8, 1.7)) * (0.8 + depth * 0.5),
      baseAlpha: rand(0.6, 1) * (0.75 + depth * 0.35),
      vx: rand(-2.4, 2.4) * depth,
      vy: rand(-9, -2.4) * depth,
      swayX: rand(0.15, 0.75) * depth,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: rand(0.08, 0.22),
      twinkle: Math.random() < 0.45,
      twinkleSpeed: rand(0.35, 1.15),
      tint: crimson ? crimsonTint(order, CRIMSON_STAR_STOPS) : starTint(),
    };
  }

  const pCount = Math.round(
    Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, area / 62000)),
  );
  particles = new Array(pCount);
  const particleAccents = crimsonFlags(pCount);
  let particleOrder = 0;
  for (let i = 0; i < pCount; i += 1) {
    const depth = rand(0.35, 1);
    // Same one-in-five rule as the stars: 20% of the drifting motes take a
    // crimson tint, the rest stay in the original white/grey range.
    const crimson = particleAccents[i];
    const order = crimson ? particleOrder++ : 0;
    particles[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: rand(0.7, 2) * (0.7 + depth * 0.6),
      // Crimson sits far lower in luminance than white, so the accent motes get
      // a small alpha lift to stay perceptible at the same on-screen size.
      alpha: (crimson ? 1.55 : 1) * rand(0.05, 0.18) * (0.6 + depth * 0.6),
      vx: rand(-5, 5) * (0.5 + depth * 0.6),
      vy: rand(-12, -2.5) * (0.5 + depth * 0.6),
      tint: crimson
        ? crimsonTint(order)
        : (Math.random() < 0.7 ? 'rgba(214, 216, 222, 1)' : 'rgba(168, 172, 180, 1)'),
    };
  }
}

function wrap(p) {
  const pad = 6;
  if (p.y < -pad) p.y = height + pad;
  else if (p.y > height + pad) p.y = -pad;
  if (p.x < -pad) p.x = width + pad;
  else if (p.x > width + pad) p.x = -pad;
}

function draw(dt, time) {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  // fillStyle assignments are the expensive part of a per-shape loop, so the
  // current tint is tracked and only written when it actually changes.
  let tint = '';

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    wrap(p);
    if (p.tint !== tint) {
      tint = p.tint;
      ctx.fillStyle = tint;
    }
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, TAU);
    ctx.fill();
  }

  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i];
    s.x += (s.vx + Math.sin(time * s.swaySpeed + s.phase) * s.swayX) * dt;
    s.y += s.vy * dt;
    wrap(s);

    let alpha = s.baseAlpha;
    if (s.twinkle) {
      alpha *= 0.6 + 0.4 * (Math.sin(time * s.twinkleSpeed + s.phase) * 0.5 + 0.5);
    }

    if (s.tint !== tint) {
      tint = s.tint;
      ctx.fillStyle = tint;
    }
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function frame(now) {
  if (!running) return;
  if (!lastTime) lastTime = now;
  const dt = Math.min((now - lastTime) / 1000, 0.05); 
  lastTime = now;
  draw(dt, now / 1000);
  rafId = window.requestAnimationFrame(frame);
}

function drawStatic() {
  draw(0, 0);
}

function start() {
  if (running) return;
  if (!ctx) return;
  if (reduce) {
    drawStatic();
    return;
  }
  running = true;
  lastTime = 0;
  rafId = window.requestAnimationFrame(frame);
}

function stop() {
  running = false;
  if (rafId) {
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function resize() {
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(window.innerWidth, 1);
  height = Math.max(window.innerHeight, 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Mobile browsers fire resize whenever the URL bar slides in or out, which
  // only changes the viewport height by a few percent. Reseeding on every one
  // of those events made the whole star field visibly jump, so the field is
  // rebuilt only on a meaningful size change.
  const sizeShift = seededWidth > 0
    ? Math.abs(width - seededWidth) / seededWidth
      + Math.abs(height - seededHeight) / seededHeight
    : 1;
  if (sizeShift > 0.15 || !stars.length) {
    seededWidth = width;
    seededHeight = height;
    seed();
  }

  if (reduce) drawStatic();
}

function onVisibility() {
  if (document.hidden) {
    stop();
  } else if (active && !reduce) {
    start();
  }
}

function onResize() {
  resize();
}

function onReduceChange() {
  reduce = prefersReduce();
  if (reduce) {
    stop();
    drawStatic();
  } else if (active && !document.hidden) {
    start();
  }
}

let resizeRaf = 0;
function onResizeThrottled() {
  if (resizeRaf) return;
  resizeRaf = window.requestAnimationFrame(() => {
    resizeRaf = 0;
    onResize();
  });
}

export function initSky() {
  canvas = document.getElementById('sky-canvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;

  ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  reduce = prefersReduce();
  if (reduceQuery) {
    if (typeof reduceQuery.addEventListener === 'function') {
      reduceQuery.addEventListener('change', onReduceChange);
    } else if (typeof reduceQuery.addListener === 'function') {
      reduceQuery.addListener(onReduceChange);
    }
  }

  window.addEventListener('resize', onResizeThrottled, { passive: true });
  window.addEventListener('orientationchange', onResizeThrottled, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  resize();

  if (active && !document.hidden && !reduce) start();
}

export function setSkyActive(isActive) {
  active = Boolean(isActive);
  if (active && !document.hidden) {
    start();
  } else {
    stop();
  }
}
