
const STORAGE_KEY = 'vibefinder:entrance:v1';

const FULL_HOLD_MS = 850; 
const FULL_FADE_MS = 1150; 
const SHORT_HOLD_MS = 40;
const SHORT_FADE_MS = 320;
const SETTLE_MARGIN_MS = 600;
const SKIP_FADE_MS = 240;

const root = document.documentElement;

function readVisited() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function markVisited() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch (error) {
  }
}

function prefersReducedMotion() {
  const forced = root.dataset.motion;
  if (forced === 'force') return false;
  if (forced === 'off') return true;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isHomeRoute() {
  return !/^#\/share\/[a-z0-9-]+\/?$/i.test(window.location.hash);
}

function forcedMode() {
  try {
    const value = new URLSearchParams(window.location.search).get('intro');
    if (value === 'full' || value === 'short' || value === 'none') return value;
  } catch (error) {
  }
  return null;
}

export function initCinematicIntro() {
  const veil = document.getElementById('cinematic-intro');
  if (!veil) return;

  if (root.dataset.intro === 'none') return;

  const forced = forcedMode();
  if (!forced && prefersReducedMotion()) {
    root.dataset.intro = 'none';
    return;
  }

  const mode = forced
    || (!isHomeRoute() ? 'none' : readVisited() ? 'short' : 'full');

  if (mode === 'none') {
    root.dataset.intro = 'none';
    return;
  }

  root.dataset.intro = mode;
  if (!forced) markVisited();

  let activeFade = mode === 'full' ? FULL_FADE_MS : SHORT_FADE_MS;
  let holdTimer = null;
  let settleTimer = null;
  let finished = false;
  const listeners = [];

  const removeListeners = () => {
    listeners.forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler, options);
    });
    listeners.length = 0;
  };

  const settle = () => {
    if (finished) return;
    finished = true;
    if (settleTimer !== null) {
      window.clearTimeout(settleTimer);
      settleTimer = null;
    }
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
    removeListeners();
    root.dataset.intro = 'done';
  };

  const reveal = () => {
    if (finished || veil.classList.contains('is-revealed')) return;
    veil.classList.add('is-revealed');
    settleTimer = window.setTimeout(settle, activeFade + SETTLE_MARGIN_MS);
  };

  function onVisibilityChange() {
    if (document.hidden) settle();
  }

  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push({ target, type, handler, options });
  };

  const skip = () => {
    if (!veil.classList.contains('is-revealed')) {
      activeFade = SKIP_FADE_MS;
      veil.style.transitionDuration = `${SKIP_FADE_MS}ms`;
    }
    reveal();
  };

  listen(window, 'pointerdown', skip, { passive: true });
  listen(window, 'keydown', skip, { passive: true });
  listen(window, 'touchstart', skip, { passive: true });
  listen(window, 'wheel', skip, { passive: true });
  listen(document, 'visibilitychange', onVisibilityChange);
  listen(window, 'pagehide', settle);

  const holdMs = mode === 'full' ? FULL_HOLD_MS : SHORT_HOLD_MS;
  if (holdMs > 0) {
    holdTimer = window.setTimeout(reveal, holdMs);
  } else {
    reveal();
  }
}
