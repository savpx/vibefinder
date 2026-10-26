
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
let lights = [];
let lightSprites = null;
const LIGHT_SPRITE_SIZE = 256;

let lastTime = 0;
let reduceQuery = null;
let reduce = false;

const MAX_STARS = 420;
const MIN_STARS = 120;
const MAX_PARTICLES = 42;
const MIN_PARTICLES = 12;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function prefersReduce() {
  const forced = document.documentElement.dataset.motion;
  if (forced === 'force') return false;
  if (forced === 'off') return true;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function starTint() {
  const roll = Math.random();
  if (roll < 0.9) return 'rgba(255, 255, 255, 1)'; 
  if (roll < 0.97) return 'rgba(200, 204, 212, 1)'; 
  return 'rgba(150, 155, 164, 1)'; 
}

function seed() {
  const area = Math.max(width * height, 1);

  const starCount = Math.round(
    Math.min(MAX_STARS, Math.max(MIN_STARS, area / 8200)),
  );
  stars = new Array(starCount);
  for (let i = 0; i < starCount; i += 1) {
    const depth = rand(0.32, 1); 
    const bright = Math.random() < 0.06; 
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
      tint: starTint(),
    };
  }

  const pCount = Math.round(
    Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, area / 62000)),
  );
  particles = new Array(pCount);
  for (let i = 0; i < pCount; i += 1) {
    const depth = rand(0.35, 1);
    particles[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: rand(0.7, 2) * (0.7 + depth * 0.6),
      alpha: rand(0.05, 0.18) * (0.6 + depth * 0.6),
      vx: rand(-5, 5) * (0.5 + depth * 0.6),
      vy: rand(-12, -2.5) * (0.5 + depth * 0.6),
      tint: Math.random() < 0.7 ? 'rgba(214, 216, 222, 1)' : 'rgba(168, 172, 180, 1)',
    };
  }

  const base = Math.max(width, height);
  lights = [
    { x: width * 0.24, y: height * 0.26, radius: base * 0.52, color: '255, 255, 255', speed: 0.045, phase: 0 },
    { x: width * 0.79, y: height * 0.16, radius: base * 0.44, color: '200, 204, 212', speed: 0.031, phase: 2.1 },
  ];
  buildLightSprites();
}

function buildLightSprites() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    lightSprites = null;
    return;
  }
  lightSprites = lights.map((L) => {
    const sprite = document.createElement('canvas');
    sprite.width = LIGHT_SPRITE_SIZE;
    sprite.height = LIGHT_SPRITE_SIZE;
    const sctx = sprite.getContext('2d');
    if (!sctx) return null;
    const center = LIGHT_SPRITE_SIZE / 2;
    const grad = sctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, `rgba(${L.color}, 1)`);
    grad.addColorStop(1, `rgba(${L.color}, 0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, LIGHT_SPRITE_SIZE, LIGHT_SPRITE_SIZE);
    return sprite;
  });
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

  for (let i = 0; i < lights.length; i += 1) {
    const sprite = lightSprites ? lightSprites[i] : null;
    if (!sprite) continue;
    const L = lights[i];
    const sway = Math.sin(time * L.speed + L.phase) * 0.5 + 0.5;
    const lx = L.x + Math.cos(time * L.speed * 0.7 + L.phase) * width * 0.05;
    const ly = L.y + Math.sin(time * L.speed * 0.9 + L.phase) * height * 0.04;
    const radius = L.radius * (0.92 + sway * 0.16);
    const alpha = 0.04 + sway * 0.045;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, lx - radius, ly - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    wrap(p);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.tint;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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

    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.tint;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
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
  seed();
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
  if (typeof window.matchMedia === 'function') {
    reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
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
