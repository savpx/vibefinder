
import { questions } from './data/questions.js?v=42';
import { vibeThemes, vibeShareSlugs, vibeKeysByShareSlug } from './data/themes.js?v=42';
import { rankVibes, selectNextQuestion, questionIndexById } from './data/scoring.js?v=43';
import { initI18n, translateText, closeLanguageOptions } from './i18n/index.js?v=44';
import { initCinematicIntro } from './intro.js?v=42';
import { initSky, setSkyActive } from './sky.js?v=43';

initCinematicIntro();

const screens = {
  home: document.getElementById('home-screen'),
  survey: document.getElementById('survey-screen'),
  creation: document.getElementById('creation-screen'),
  vibe: document.getElementById('vibe-screen'),
  share: document.getElementById('share-screen'),
};

const startButton = document.getElementById('start-btn');
const profileToggle = document.getElementById('profile-toggle');
const profileMenu = document.getElementById('profile-menu');
const vibeMenuToggle = document.getElementById('vibe-menu-toggle');
const vibeMenu = document.getElementById('vibe-menu');
const vibeReturnAction = document.getElementById('vibe-return-action');
const vibeShareAction = document.getElementById('vibe-share-action');
const shareVibeName = document.getElementById('share-vibe-name');
const shareButton = document.getElementById('share-button');
const shareFeedback = document.getElementById('share-feedback');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.querySelector('.progress-bar');
const backButton = document.getElementById('survey-back-btn');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers');
const surveyStage = document.querySelector('.survey-stage');
const optionButtons = [];
const SURVEY_LEAVE_MS = 150;
const SURVEY_ENTER_MS = 240;
const SURVEY_STAGGER_MS = 35;
let surveyLocked = false;
let surveyToken = 0;
let surveyLeaveTimer = null;
let surveyEnterTimer = null;
const pageShell = document.querySelector('.page-shell');
const SWIPE_SCREENS = ['home', 'survey'];
const SWIPE_DURATION = 400;
const SWIPE_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
let swipeBusy = false;
let swipeTimer = null;
const themeName = document.getElementById('theme-name');
const themeDescription = document.getElementById('theme-description');
const vibeGame = document.getElementById('vibe-game');
const vibeShowcase = document.getElementById('vibe-showcase');
const vibeShowcaseLayers = vibeShowcase
  ? Array.from(vibeShowcase.querySelectorAll('.vibe-showcase__name'))
  : [];
const homeGlowLayers = Array.from(
  document.querySelectorAll('#home-screen .home-glow__layer'),
);
const tetrisCanvas = document.getElementById('tetris-canvas');
const vibeQuoteText = document.getElementById('vibe-quote-text');
const tetrisGameOver = document.getElementById('tetris-game-over');
const tetrisRestartBtn = document.getElementById('tetris-restart-btn');
const vibeDevelopment = document.getElementById('vibe-development');

const READY_VIBES = new Set(['night']);

const state = {
  order: [],
  stepIndex: 0,
  answers: {},
  history: [],
  activeVibe: null,
  shareFeedbackTimer: null,
  shareVibeKey: null,
  quoteList: null,
};

const vibeTransition = document.getElementById('vibe-transition');

const UI_CLICK_VOLUME = 0.09;
const TRANSITION_VOLUME = 0.11;

const TRANSITION_FORM_MS = 3000;      
const TRANSITION_HOLD_MS = 3500;      
const TRANSITION_DISSOLVE_MS = 1500;  
const TRANSITION_TOTAL_MS = TRANSITION_FORM_MS + TRANSITION_HOLD_MS; 
const TRANSITION_REVEAL_MS = TRANSITION_DISSOLVE_MS - 80; 
const TRANSITION_REDUCED_FORM_MS = 900;
const TRANSITION_REDUCED_DISSOLVE_MS = 600;
const TRANSITION_LINE_BASE_DELAY_MS = 700;
const TRANSITION_LINE_STEP_MS = 110;

const TRANSITION_STAR_PATTERN = [
  [0.50, 0.12], 
  [0.47, 0.34], 
  [0.42, 0.56], 
  [0.37, 0.82], 
  [0.68, 0.66], 
  [0.14, 0.30], 
  [0.78, 0.24], 
];
const TRANSITION_LINKS = [
  [0, 1], [1, 2], [2, 3], [1, 5], [2, 4], [5, 6], [6, 4], [0, 5],
];

const AUDIO_VERSION = 36;
const UI_CLICK_SRC = 'audio/ui/ui%20click.mp3';
const TRANSITION_SRC = 'audio/ui/transition.mp3';
const audioVolumeFades = new WeakMap();
const uiButtonAudio = new Audio(`${UI_CLICK_SRC}?v=${AUDIO_VERSION}`);
const transitionAudio = new Audio(`${TRANSITION_SRC}?v=${AUDIO_VERSION}`);
const constellationEl = document.getElementById('constellation');
const constellationStarsEl = constellationEl
  ? constellationEl.querySelector('.constellation__stars')
  : null;
const constellationLinesEl = constellationEl
  ? constellationEl.querySelector('.constellation__lines')
  : null;
let creationTimer = null;
let vibeRevealTimer = null;
let creationSequence = 0;
let revealCleanupTimer = null;

function fadeAudioVolume(audio, targetVolume, duration) {
  const activeFade = audioVolumeFades.get(audio);
  if (activeFade !== undefined) window.clearInterval(activeFade);
  const startVolume = audio.volume;
  const startTime = performance.now();
  const fade = window.setInterval(() => {
    const progress = Math.min((performance.now() - startTime) / duration, 1);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress === 1) {
      window.clearInterval(fade);
      audioVolumeFades.delete(audio);
    }
  }, 32);
  audioVolumeFades.set(audio, fade);
}

uiButtonAudio.preload = 'auto';
uiButtonAudio.load();
uiButtonAudio.volume = UI_CLICK_VOLUME;
transitionAudio.preload = 'none';
transitionAudio.volume = TRANSITION_VOLUME;
transitionAudio.muted = false;
let transitionFadeOutStarted = false;
let transitionPlayToken = 0;

function stopTransitionAudio() {
  const fade = audioVolumeFades.get(transitionAudio);
  if (fade !== undefined) {
    window.clearInterval(fade);
    audioVolumeFades.delete(transitionAudio);
  }
  if (!transitionAudio.paused) transitionAudio.pause();
  try { transitionAudio.currentTime = 0; } catch (error) {}
  transitionAudio.muted = false;
  transitionAudio.volume = TRANSITION_VOLUME;
  transitionFadeOutStarted = false;
}

transitionAudio.addEventListener('timeupdate', () => {
  if (transitionAudio.muted) return;
  if (!Number.isFinite(transitionAudio.duration)) return;
  const remaining = transitionAudio.duration - transitionAudio.currentTime;
  if (!transitionFadeOutStarted && remaining <= 1.1) {
    transitionFadeOutStarted = true;
    fadeAudioVolume(transitionAudio, 0, Math.max(120, remaining * 1000));
  }
});

transitionAudio.addEventListener('ended', () => {
  transitionFadeOutStarted = false;
  transitionAudio.volume = TRANSITION_VOLUME;
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const clickedButton = event.target.closest('button');
  if (
    !clickedButton ||
    clickedButton.disabled ||
    clickedButton.getAttribute('aria-disabled') === 'true'
  ) return;

  try { uiButtonAudio.currentTime = 0; } catch (error) {}
  const playback = uiButtonAudio.play();
  if (playback) {
    playback.catch((error) => {
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        console.error(`UI button sound failed: ${UI_CLICK_SRC}`, error);
      }
    });
  }
}, true);

function init3DTiltEffect(elementSelector, maxTiltAngle) {
  const element = typeof elementSelector === 'string'
    ? document.querySelector(elementSelector)
    : elementSelector;
  if (!element) return null;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const state = { rect: null, pointer: null, frame: 0, max: maxTiltAngle };

  const apply = () => {
    state.frame = 0;
    if (!state.rect || !state.pointer) return;
    const { left, top, width, height } = state.rect;
    if (!width || !height) return;
    const relativeX = (state.pointer.x - left) / width;
    const relativeY = (state.pointer.y - top) / height;
    const tiltX = (relativeX - 0.5) * 2;
    const tiltY = (relativeY - 0.5) * 2;
    element.style.setProperty('--rotate-x', `${(-tiltY * state.max).toFixed(2)}deg`);
    element.style.setProperty('--rotate-y', `${(tiltX * state.max).toFixed(2)}deg`);
    element.style.setProperty('--scale', '1.018');
  };

  const scheduleUpdate = (clientX, clientY) => {
    if (!state.rect) state.rect = element.getBoundingClientRect();
    state.pointer = { x: clientX, y: clientY };
    if (state.frame) return;
    state.frame = window.requestAnimationFrame(apply);
  };

  const onEnter = () => {
    state.rect = element.getBoundingClientRect();
    element.classList.add('is-tilting');
  };

  const onMove = (event) => {
    scheduleUpdate(event.clientX, event.clientY);
  };

  const onLeave = () => {
    state.rect = null;
    state.pointer = null;
    if (state.frame) {
      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    }
    element.classList.remove('is-tilting');
    element.style.setProperty('--rotate-x', '0deg');
    element.style.setProperty('--rotate-y', '0deg');
    element.style.setProperty('--scale', '1');
  };

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    state.rect = element.getBoundingClientRect();
    element.classList.add('is-tilting');
    scheduleUpdate(touch.clientX, touch.clientY);
  };

  const onTouchMove = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    if (event.cancelable) event.preventDefault();
    scheduleUpdate(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => {
    onLeave();
  };

  element.addEventListener('mouseenter', onEnter);
  element.addEventListener('mousemove', onMove);
  element.addEventListener('mouseleave', onLeave);
  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: false });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('touchcancel', onTouchEnd, { passive: true });
  return element;
}

function initGlassTilt() {
  init3DTiltEffect('#start-btn', 7);
  init3DTiltEffect('#vibe-menu-toggle', 7);
}


const VIBE_CARD_ACCENTS = {
  cosmos: '#8a7cf0', 
  solar: '#e89a2a', 
  neon: '#3fe0d0', 
  forest: '#5f8f63', 
  night: '#6f9fd8', 
  melancholic: '#a49bc4', 
  zen: '#74c7b2', 
  chaotic: '#e54f6d', 
  happy: '#f2d861', 
  mysterious: '#6f4fb8', 
  creative: '#e07ab4', 
  nature: '#8fce5c', 
  retro: '#8f9440', 
  cozy: '#cf6b3f', 
};

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const full = value.length === 3
    ? value.split('').map((channel) => channel + channel).join('')
    : value;
  const numeric = Number.parseInt(full, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const VIBE_SHOWCASE_ORDER = Object.keys(vibeThemes);
const SHOWCASE_HOLD_MS = 3000; 
const SHOWCASE_FADE_MS = 1400; 
const SHOWCASE_GLOW_ALPHA = 0.4;
const SHOWCASE_INK_DURATION = 620;
const SHOWCASE_INK_STEP = 34;

const showcase = {
  order: [],
  index: 0,
  active: false,
  layer: 1,
  glowLayer: 1,
  holdTimer: null,
};

function stopShowcaseTimers() {
  if (showcase.holdTimer !== null) {
    window.clearTimeout(showcase.holdTimer);
    showcase.holdTimer = null;
  }
}

function setShowcaseAccent(key) {
  const accent = VIBE_CARD_ACCENTS[key] || '#ffffff';
  screens.home.style.setProperty('--preview-glow', hexToRgba(accent, SHOWCASE_GLOW_ALPHA));
}

function crossfadeShowcaseGlow(key) {
  if (homeGlowLayers.length < 2) return;
  const accent = VIBE_CARD_ACCENTS[key] || '#ffffff';
  const previousLayer = showcase.glowLayer;
  const nextLayer = 1 - previousLayer;
  const incoming = homeGlowLayers[nextLayer];
  incoming.style.setProperty('--glow-color', hexToRgba(accent, SHOWCASE_GLOW_ALPHA));
  incoming.classList.add('is-active');
  homeGlowLayers[previousLayer].classList.remove('is-active');
  showcase.glowLayer = nextLayer;
}

function clearShowcaseGlow() {
  screens.home.removeAttribute('data-vibe-glow');
  screens.home.style.removeProperty('--preview-glow');
  homeGlowLayers.forEach((layer) => {
    layer.classList.remove('is-active');
    layer.style.removeProperty('--glow-color');
  });
}

function paintShowcaseLayer(layer, label) {
  layer.classList.remove('is-active');
  layer.textContent = '';
  const words = String(label).split(' ');
  let letterIndex = 0;
  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) layer.appendChild(document.createTextNode(' '));
    const wordNode = document.createElement('span');
    wordNode.className = 'vibe-word';
    Array.from(word).forEach((char) => {
      const letterNode = document.createElement('span');
      letterNode.className = 'vibe-letter';
      letterNode.textContent = char;
      letterNode.style.setProperty('--ink-delay', `${letterIndex * SHOWCASE_INK_STEP}ms`);
      letterNode.style.setProperty('--ink-duration', `${SHOWCASE_INK_DURATION}ms`);
      wordNode.appendChild(letterNode);
      letterIndex += 1;
    });
    layer.appendChild(wordNode);
  });
}

function showShowcaseVibe() {
  if (!showcase.active || !vibeShowcaseLayers.length) return;
  const key = showcase.order[showcase.index];
  const vibe = vibeThemes[key];
  if (!vibe) return;

  setShowcaseAccent(key);
  crossfadeShowcaseGlow(key);
  screens.home.setAttribute('data-vibe-glow', '');

  const label = translateText(vibe.title);
  const previousLayer = showcase.layer;
  const nextLayer = 1 - previousLayer;

  paintShowcaseLayer(vibeShowcaseLayers[nextLayer], label);
  void vibeShowcaseLayers[nextLayer].offsetWidth; 
  vibeShowcaseLayers[nextLayer].classList.add('is-active');
  vibeShowcaseLayers[previousLayer].classList.remove('is-active');

  showcase.layer = nextLayer;
  showcase.holdTimer = window.setTimeout(advanceShowcase, SHOWCASE_HOLD_MS + SHOWCASE_FADE_MS);
}

function advanceShowcase() {
  if (!showcase.active) return;
  showcase.holdTimer = null;
  showcase.index = (showcase.index + 1) % showcase.order.length;
  showShowcaseVibe();
}

const HOME_SHOWCASE_ENABLED = false;

function startVibeShowcase() {
  if (!HOME_SHOWCASE_ENABLED) return;
  if (!vibeShowcase || !vibeShowcaseLayers.length) return;
  showcase.order = VIBE_SHOWCASE_ORDER.filter((key) => vibeThemes[key]);
  if (!showcase.order.length) return;
  showcase.active = true;
  showcase.index = 0;
  showcase.layer = 1;
  showcase.glowLayer = 0;
  stopShowcaseTimers();
  vibeShowcaseLayers.forEach((layer) => layer.classList.remove('is-active'));
  homeGlowLayers.forEach((layer) => {
    layer.classList.remove('is-active');
    layer.style.removeProperty('--glow-color');
  });
  showShowcaseVibe();
}

function stopVibeShowcase() {
  showcase.active = false;
  stopShowcaseTimers();
  vibeShowcaseLayers.forEach((layer) => {
    layer.classList.remove('is-active');
    layer.textContent = '';
  });
  clearShowcaseGlow();
}

function canSwipeAnimate() {
  return !reducedMotionPref()
    && typeof Element.prototype.animate === 'function'
    && screens.home && screens.survey;
}

function runScreenSwipe(fromScreen, toScreen, onDone) {
  const distance = window.innerWidth || 1;
  const options = { duration: SWIPE_DURATION, easing: SWIPE_EASING, fill: 'both' };
  const animations = [];
  if (fromScreen) {
    animations.push(fromScreen.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${distance}px)` }],
      options,
    ));
  }
  if (toScreen) {
    animations.push(toScreen.animate(
      [{ transform: `translateX(${-distance}px)` }, { transform: 'translateX(0)' }],
      options,
    ));
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    if (swipeTimer !== null) { window.clearTimeout(swipeTimer); swipeTimer = null; }
    if (fromScreen) fromScreen.style.transform = `translateX(${distance}px)`;
    if (toScreen) toScreen.style.transform = 'translateX(0)';
    animations.forEach((animation) => { try { animation.cancel(); } catch (error) {} });
    onDone();
    if (fromScreen) fromScreen.style.transform = '';
    if (toScreen) toScreen.style.transform = '';
    window.requestAnimationFrame(() => {
      if (pageShell) pageShell.classList.remove('is-swiping');
      SWIPE_SCREENS.forEach((key) => {
        if (screens[key]) screens[key].classList.remove('is-swipe-incoming');
      });
      swipeBusy = false;
    });
  };

  animations.forEach((animation) => { animation.onfinish = finish; });
  swipeTimer = window.setTimeout(finish, SWIPE_DURATION + 150);
}

function swipeToScreen(targetName, forward) {
  if (swipeBusy) return true; 
  if (!canSwipeAnimate()) return false;

  const fromScreen = forward ? screens.home : screens.survey;
  const toScreen = forward ? screens.survey : screens.home;
  const targetScreen = screens[targetName];
  if (!fromScreen || !toScreen || !targetScreen) return false;

  swipeBusy = true;
  if (pageShell) pageShell.classList.add('is-swiping');
  targetScreen.classList.add('is-swipe-incoming');

  runScreenSwipe(fromScreen, toScreen, () => showScreen(targetName));
  return true;
}

// Matches the .vibe-game entrance animation delay used in style.css.
const GAME_REVEAL_DELAY_MS = 2550;
const GAME_REVEAL_REDUCED_MS = 640;
let gameStartTimer = null;

function clearGameStartTimer() {
  if (gameStartTimer === null) return;
  window.clearTimeout(gameStartTimer);
  gameStartTimer = null;
}

function schedulePendingVibeGame() {
  clearGameStartTimer();
  if (!game.pendingStart) return;
  const delay = reducedMotionPref() ? GAME_REVEAL_REDUCED_MS : GAME_REVEAL_DELAY_MS;
  gameStartTimer = window.setTimeout(() => {
    gameStartTimer = null;
    startPendingVibeGame();
  }, delay);
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === name);
  });
  if (pageShell) pageShell.dataset.activeScreen = name;
  if (name !== 'vibe') screens.vibe.classList.remove('vibe-screen-reveal');
  if (name !== 'vibe') closeVibeMenu();
  closeProfileMenu();
  if (name !== 'vibe') {
    clearGameStartTimer();
    stopVibeGame();
  } else {
    screens.vibe.classList.remove('vibe-screen-reveal');
    void screens.vibe.offsetWidth;
    screens.vibe.classList.add('vibe-screen-reveal');
    schedulePendingVibeGame();
  }
  if (name === 'home' || name === 'survey' || name === 'creation') {
    if (name === 'home') startVibeShowcase();
    setSkyActive(true);
  } else {
    stopVibeShowcase();
    setSkyActive(false);
  }
}

function closeVibeMenu(returnFocus = false) {
  vibeMenu.hidden = true;
  vibeMenuToggle.setAttribute('aria-expanded', 'false');
  if (returnFocus) vibeMenuToggle.focus();
}

function closeProfileMenu(returnFocus = false) {
  if (!profileMenu || !profileToggle) return;
  profileMenu.hidden = true;
  profileToggle.setAttribute('aria-expanded', 'false');
  closeLanguageOptions();
  if (returnFocus) profileToggle.focus();
}

function setShareFeedback(message) {
  if (state.shareFeedbackTimer !== null) {
    window.clearTimeout(state.shareFeedbackTimer);
  }
  shareFeedback.textContent = translateText(message);
  state.shareFeedbackTimer = window.setTimeout(() => {
    shareFeedback.textContent = '';
    state.shareFeedbackTimer = null;
  }, 2400);
}

function renderSharePage(vibeKey) {
  const config = vibeThemes[vibeKey];
  state.shareVibeKey = config ? vibeKey : null;
  document.body.classList.remove(...Object.values(vibeThemes).map((vibe) => vibe.palette));
  delete screens.share.dataset.vibe;
  shareFeedback.textContent = '';
  if (state.shareFeedbackTimer !== null) {
    window.clearTimeout(state.shareFeedbackTimer);
    state.shareFeedbackTimer = null;
  }

  if (config) {
    document.body.classList.add(config.palette);
    screens.share.dataset.vibe = vibeKey;
    shareVibeName.textContent = translateText(config.title);
    shareButton.hidden = false;
  } else {
    shareVibeName.textContent = translateText('Неизвестный вайб');
    shareButton.hidden = true;
  }

  showScreen('share');
}

function handleHashRoute() {
  const match = window.location.hash.match(/^#\/share\/([a-z0-9-]+)\/?$/i);
  if (match) {
    renderSharePage(vibeKeysByShareSlug[match[1].toLowerCase()]);
    return;
  }

  if (window.location.hash === '#home') {
    showScreen('home');
    return;
  }

  if (!window.location.hash || window.location.hash === '#') {
    showScreen(state.activeVibe ? 'vibe' : 'home');
    return;
  }

  showScreen('home');
}

function sharePageUrl(vibeKey) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = `/share/${vibeShareSlugs[vibeKey]}`;
  return url.href;
}

async function copyShareText(text) {
  let clipboardError = null;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      clipboardError = error;
    }
  }

  const temporaryInput = document.createElement('textarea');
  temporaryInput.value = text;
  temporaryInput.setAttribute('readonly', '');
  temporaryInput.style.position = 'fixed';
  temporaryInput.style.opacity = '0';
  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  try {
    if (!document.execCommand('copy')) {
      throw clipboardError || new Error('Clipboard copy command was rejected.');
    }
  } finally {
    temporaryInput.remove();
  }
}

async function shareCurrentVibe() {
  const vibeKey = state.shareVibeKey;
  if (!vibeKey) return;

  const url = sharePageUrl(vibeKey);
  const message = translateText('Узнай, какой вайб у тебя сегодня!');
  shareButton.disabled = true;
  try {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareVibeName.textContent, text: message, url });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Native vibe sharing failed.', error);
      }
    }

    await copyShareText(`${message}\n${url}`);
    setShareFeedback('Скопировано!');
  } catch (error) {
    console.error('Vibe share clipboard fallback failed.', error);
    setShareFeedback('Не удалось поделиться. Попробуй ещё раз.');
  } finally {
    shareButton.disabled = false;
  }
}

function cancelVibeCreation() {
  creationSequence += 1;
  if (creationTimer !== null) {
    clearTimeout(creationTimer);
    creationTimer = null;
  }
  if (vibeRevealTimer !== null) {
    clearTimeout(vibeRevealTimer);
    vibeRevealTimer = null;
  }
  if (revealCleanupTimer !== null) {
    clearTimeout(revealCleanupTimer);
    revealCleanupTimer = null;
  }
  if (pageShell) pageShell.classList.remove('is-revealing', 'is-reveal-end');
  if (constellationEl) {
    constellationEl.classList.remove('is-forming', 'is-holding', 'is-dissolving');
  }
  vibeTransition.classList.remove('is-visible');
  stopTransitionAudio();
}

function buildConstellation() {
  if (!constellationEl || !constellationStarsEl || !constellationLinesEl) return;
  const svgNs = 'http://www.w3.org/2000/svg';
  const scene = constellationEl.querySelector('.constellation__scene');
  const size = scene && scene.clientWidth ? scene.clientWidth : 320;

  constellationStarsEl.textContent = '';
  constellationLinesEl.textContent = '';

  for (let index = 0; index < TRANSITION_STAR_PATTERN.length; index += 1) {
    const [nx, ny] = TRANSITION_STAR_PATTERN[index];
    const star = document.createElement('span');
    star.className = 'constellation__star';
    star.style.setProperty('--star-move-x', `${(nx - 0.5) * size}px`);
    star.style.setProperty('--star-move-y', `${(ny - 0.5) * size}px`);
    constellationStarsEl.appendChild(star);
  }

  for (let index = 0; index < TRANSITION_LINKS.length; index += 1) {
    const [from, to] = TRANSITION_LINKS[index];
    const line = document.createElementNS(svgNs, 'line');
    line.setAttribute('x1', String(TRANSITION_STAR_PATTERN[from][0] * 100));
    line.setAttribute('y1', String(TRANSITION_STAR_PATTERN[from][1] * 100));
    line.setAttribute('x2', String(TRANSITION_STAR_PATTERN[to][0] * 100));
    line.setAttribute('y2', String(TRANSITION_STAR_PATTERN[to][1] * 100));
    line.setAttribute('pathLength', '1');
    line.setAttribute('class', 'constellation__line');
    line.style.setProperty(
      '--line-delay',
      `${TRANSITION_LINE_BASE_DELAY_MS + index * TRANSITION_LINE_STEP_MS}ms`,
    );
    constellationLinesEl.appendChild(line);
  }
}

function startVibeCreation(vibeKey) {
  cancelVibeCreation();
  const sequence = creationSequence;
  const reducedMotion = reducedMotionPref();
  buildConstellation();
  showScreen('creation');

  // Invalidate in-flight unlock playback so it cannot affect this transition.
  transitionPlayToken += 1;
  transitionAudio.pause();
  transitionAudio.muted = false;
  const transitionFade = audioVolumeFades.get(transitionAudio);
  if (transitionFade !== undefined) {
    window.clearInterval(transitionFade);
    audioVolumeFades.delete(transitionAudio);
  }
  transitionAudio.currentTime = 0;
  transitionAudio.volume = 0;
  transitionFadeOutStarted = false;
  const playback = transitionAudio.play();
  if (playback) {
    playback.catch((error) => {
      if (error.name !== 'AbortError') {
        console.error(`Transition sound failed: ${TRANSITION_SRC}`, error);
      }
    });
  }
  fadeAudioVolume(transitionAudio, TRANSITION_VOLUME, 100);

  const revealVibe = () => {
    if (sequence !== creationSequence) return;
    vibeRevealTimer = null;
    renderVibe(vibeKey);
    showScreen('vibe');
    stopTransitionAudio();
    if (pageShell) pageShell.classList.add('is-revealing');
    revealCleanupTimer = window.setTimeout(() => {
      if (pageShell) pageShell.classList.add('is-reveal-end');
      revealCleanupTimer = window.setTimeout(() => {
        revealCleanupTimer = null;
        if (pageShell) pageShell.classList.remove('is-revealing', 'is-reveal-end');
      }, 620);
    }, 120);
    constellationEl.classList.remove('is-forming', 'is-holding', 'is-dissolving');
  };

  if (reducedMotion) {
    constellationEl.classList.add('is-forming');
    creationTimer = window.setTimeout(() => {
      creationTimer = null;
      if (sequence !== creationSequence) return;
      constellationEl.classList.add('is-dissolving');
      fadeAudioVolume(transitionAudio, 0, TRANSITION_REDUCED_DISSOLVE_MS);
      vibeRevealTimer = window.setTimeout(revealVibe, TRANSITION_REDUCED_DISSOLVE_MS);
    }, TRANSITION_REDUCED_FORM_MS);
    return;
  }

  constellationEl.classList.add('is-forming');
  creationTimer = window.setTimeout(() => {
    if (sequence !== creationSequence) return;
    creationTimer = null;
    void constellationEl.offsetWidth;
    constellationEl.classList.remove('is-forming');
    constellationEl.classList.add('is-holding');
  }, TRANSITION_FORM_MS);

  vibeRevealTimer = window.setTimeout(() => {
    if (sequence !== creationSequence) return;
    constellationEl.classList.remove('is-holding');
    constellationEl.classList.add('is-dissolving');
    fadeAudioVolume(transitionAudio, 0, TRANSITION_DISSOLVE_MS);
    vibeRevealTimer = window.setTimeout(revealVibe, TRANSITION_REVEAL_MS);
  }, TRANSITION_TOTAL_MS);
}

function prefersMotion() {
  return !reducedMotionPref();
}

function updateProgress() {
  const step = state.stepIndex + 1;
  const total = questions.length;
  const ratio = total > 0 ? step / total : 0;
  progressFill.style.transform = `scaleX(${ratio})`;
  progressBar.setAttribute('aria-valuemax', String(total));
  progressBar.setAttribute('aria-valuenow', String(step));
  updateBackButton();
}

function updateBackButton() {
  if (!backButton) return;
  const canGoBack = state.stepIndex > 0;
  backButton.hidden = !canGoBack;
  backButton.setAttribute('aria-hidden', String(!canGoBack));
}

function currentQuestion() {
  return questions[questionIndexById.get(state.order[state.stepIndex])];
}

function transitionStage(direction, renderContent, done) {
  if (surveyLeaveTimer !== null) { window.clearTimeout(surveyLeaveTimer); surveyLeaveTimer = null; }
  if (surveyEnterTimer !== null) { window.clearTimeout(surveyEnterTimer); surveyEnterTimer = null; }

  if (!surveyStage || !prefersMotion()) {
    if (surveyStage) surveyStage.classList.remove('is-leave', 'is-enter');
    renderContent();
    done();
    return;
  }

  const token = ++surveyToken;
  surveyStage.style.setProperty('--leave-x', direction > 0 ? '-16px' : '16px');
  surveyStage.classList.remove('is-enter');
  surveyStage.classList.add('is-leave');

  surveyLeaveTimer = window.setTimeout(() => {
    surveyLeaveTimer = null;
    if (token !== surveyToken) return;
    surveyStage.classList.remove('is-leave');
    renderContent();
    surveyStage.style.setProperty('--enter-x', direction > 0 ? '16px' : '-16px');
    void surveyStage.offsetWidth; 
    surveyStage.classList.add('is-enter');
    surveyEnterTimer = window.setTimeout(() => {
      surveyEnterTimer = null;
      if (token !== surveyToken) return;
      surveyStage.classList.remove('is-enter');
      done();
    }, SURVEY_ENTER_MS + SURVEY_STAGGER_MS * 4 + 30);
  }, SURVEY_LEAVE_MS);
}

function renderQuestionContent() {
  const current = currentQuestion();
  questionText.textContent = current ? current.text : '';
  answersContainer.innerHTML = '';
  optionButtons.length = 0;

  if (current) {
    const chosen = state.answers[current.id];
    const fragment = document.createDocumentFragment();
    current.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.type = 'button';
      button.textContent = option.label;
      button.dataset.optionIndex = String(optionIndex);
      button.style.setProperty('--option-enter-delay', `${optionIndex * SURVEY_STAGGER_MS}ms`);
      if (chosen === optionIndex) button.classList.add('selected');
      fragment.appendChild(button);
      optionButtons.push(button);
    });
    answersContainer.appendChild(fragment);
  }
  updateProgress();
}

function renderQuestion() {
  surveyLocked = false;
  if (!state.order.length) state.order.push(questions[0].id);
  if (surveyStage) surveyStage.classList.remove('is-leave', 'is-enter');
  renderQuestionContent();
}

function handleAnswersClick(event) {
  if (surveyLocked) return;
  const button = event.target.closest('.option-btn');
  if (!button || !answersContainer.contains(button)) return;
  const current = currentQuestion();
  if (!current) return;
  const optionIndex = Number(button.dataset.optionIndex);
  if (!current.options[optionIndex]) return;
  if (state.answers[current.id] === optionIndex) return;
  applyAnswer(optionIndex, button);
}

function applyAnswer(optionIndex, button) {
  if (surveyLocked) return;
  const current = currentQuestion();
  if (!current) return;
  surveyLocked = true;

  state.history.push({
    order: [...state.order],
    stepIndex: state.stepIndex,
    answers: { ...state.answers },
  });

  state.answers[current.id] = optionIndex;

  optionButtons.forEach((item) => {
    item.classList.toggle('selected', item === button);
    item.disabled = true;
  });
  answersContainer.classList.add('is-locked');

  const isLast = state.stepIndex >= questions.length - 1;

  if (isLast) {
    const finish = () => {
      surveyLocked = false;
      determineVibe();
    };
    if (!surveyStage || !prefersMotion()) { finish(); return; }
    const token = ++surveyToken;
    surveyStage.style.setProperty('--leave-x', '-16px');
    surveyStage.classList.remove('is-enter');
    surveyStage.classList.add('is-leave');
    surveyLeaveTimer = window.setTimeout(() => {
      surveyLeaveTimer = null;
      if (token !== surveyToken) return;
      finish();
    }, SURVEY_LEAVE_MS);
    return;
  }

  transitionStage(1, () => {
    if (state.stepIndex + 1 < state.order.length) {
      state.stepIndex += 1;
    } else {
      let nextIndex = selectNextQuestion(state.answers, new Set(state.order));
      if (nextIndex < 0) {
        nextIndex = questions.findIndex(
          (question) => question.id !== undefined
            && state.answers[question.id] === undefined
            && !state.order.includes(question.id),
        );
      }
      if (nextIndex < 0) { determineVibe(); return; }
      state.order.push(questions[nextIndex].id);
      state.stepIndex += 1;
    }
    renderQuestionContent();
  }, () => {
    answersContainer.classList.remove('is-locked');
    surveyLocked = false;
  });
}

function determineVibe() {
  const ranked = rankVibes(state.answers);
  const chosen = ranked.length ? ranked[0].id : Object.keys(vibeThemes)[0];
  state.activeVibe = chosen;
  startVibeCreation(chosen);
}

function renderVibe(vibeKey) {
  const config = vibeThemes[vibeKey];
  if (!config) return;

  screens.vibe.classList.remove('vibe-screen-reveal');
  document.body.classList.remove(...Object.values(vibeThemes).map((vibe) => vibe.palette));
  document.body.classList.add(config.palette);
  screens.vibe.dataset.vibe = vibeKey;

  const isReady = READY_VIBES.has(vibeKey);
  screens.vibe.classList.toggle('is-under-development', !isReady);
  if (vibeDevelopment) vibeDevelopment.hidden = isReady;

  themeName.textContent = config.title;
  themeDescription.textContent = config.description;

  initVibeGame(vibeKey);
}


const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const TETRIS_GRAVITY_MS = 800;
const QUOTE_ROTATE_MS = 10000;
const QUOTE_FADE_MS = 800;

const TETRIS_SHAPES = [
  { color: '#5be1ff', cells: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
  { color: '#7f9bff', cells: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
  { color: '#ffb45b', cells: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
  { color: '#ffd76a', cells: [[1, 1], [1, 1]] },
  { color: '#5bffb0', cells: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
  { color: '#b58cff', cells: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
  { color: '#ff6fa5', cells: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
];

const game = {
  active: false,
  over: false,
  raf: 0,
  lastTime: 0,
  dropTimer: 0,
  keyHandler: null,
  restartHandler: null,
  touchStart: null,
  touchHandlers: null,
  quoteTimer: 0,
  quoteFadeTimer: 0,
  quoteIndex: 0,
  field: [],
  piece: null,
  context: null,
  pendingStart: false,
};

function createField() {
  return Array.from({ length: TETRIS_ROWS }, () => new Array(TETRIS_COLS).fill(null));
}

function spawnPiece() {
  const shape = TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];
  const matrix = shape.cells.map((row) => [...row]);
  return {
    color: shape.color,
    matrix,
    x: Math.floor((TETRIS_COLS - matrix[0].length) / 2),
    y: 0,
  };
}

function collides(field, piece, offsetX, offsetY, matrix) {
  const shape = matrix || piece.matrix;
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;
      if (boardX < 0 || boardX >= TETRIS_COLS || boardY >= TETRIS_ROWS) return true;
      if (boardY >= 0 && field[boardY][boardX]) return true;
    }
  }
  return false;
}

function paintGame() {
  const ctx = game.context;
  if (!ctx) return;
  const cell = tetrisCanvas.width / TETRIS_COLS;
  ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 1; x < TETRIS_COLS; x += 1) {
    ctx.moveTo(x * cell, 0);
    ctx.lineTo(x * cell, tetrisCanvas.height);
  }
  for (let y = 1; y < TETRIS_ROWS; y += 1) {
    ctx.moveTo(0, y * cell);
    ctx.lineTo(tetrisCanvas.width, y * cell);
  }
  ctx.stroke();

  game.field.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      ctx.fillStyle = value;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = value;
      ctx.lineWidth = 1;
      ctx.strokeRect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3);
    });
  });

  if (!game.piece) return;
  game.piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      const boardX = game.piece.x + x;
      const boardY = game.piece.y + y;
      if (boardY < 0) return;
      ctx.fillStyle = game.piece.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(boardX * cell + 1, boardY * cell + 1, cell - 2, cell - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = game.piece.color;
      ctx.strokeRect(boardX * cell + 1.5, boardY * cell + 1.5, cell - 3, cell - 3);
    });
  });
}

function lockPiece() {
  let overflowed = false;
  game.piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      const boardY = game.piece.y + y;
      const boardX = game.piece.x + x;
      if (boardY < 0) {
        overflowed = true;
        return;
      }
      game.field[boardY][boardX] = game.piece.color;
    });
  });
  if (overflowed) {
    endVibeGame();
    return;
  }
  clearLines();
  game.piece = spawnPiece();
  if (collides(game.field, game.piece, 0, 0)) endVibeGame();
}

function clearLines() {
  for (let y = TETRIS_ROWS - 1; y >= 0; y -= 1) {
    if (game.field[y].every((value) => value)) {
      game.field.splice(y, 1);
      game.field.unshift(new Array(TETRIS_COLS).fill(null));
      y += 1;
    }
  }
}

function stepPiece() {
  if (!game.active || game.over) return;
  if (!collides(game.field, game.piece, 0, 1)) {
    game.piece.y += 1;
  } else {
    lockPiece();
  }
  paintGame();
}

function movePiece(direction) {
  if (!game.active || game.over) return;
  if (!collides(game.field, game.piece, direction, 0)) {
    game.piece.x += direction;
    paintGame();
  }
}

function rotatePiece() {
  if (!game.active || game.over) return;
  const rotated = game.piece.matrix[0].map((_, index) =>
    game.piece.matrix.map((row) => row[index]).reverse()
  );
  if (!collides(game.field, game.piece, 0, 0, rotated)) {
    game.piece.matrix = rotated;
  } else if (!collides(game.field, game.piece, 1, 0, rotated)) {
    game.piece.x += 1;
    game.piece.matrix = rotated;
  } else if (!collides(game.field, game.piece, -1, 0, rotated)) {
    game.piece.x -= 1;
    game.piece.matrix = rotated;
  }
  paintGame();
}

function tetrisLoop(time) {
  if (!game.active) return;
  if (!game.lastTime) game.lastTime = time;
  const delta = time - game.lastTime;
  game.lastTime = time;
  game.dropTimer += Math.min(delta, 100);
  if (game.dropTimer >= TETRIS_GRAVITY_MS) {
    game.dropTimer -= TETRIS_GRAVITY_MS;
    stepPiece();
  }
  if (game.active) {
    game.raf = window.requestAnimationFrame(tetrisLoop);
  }
}

function handleTetrisInput(event) {
  if (!game.active || game.over) return;
  if (!screens.vibe.classList.contains('active')) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  switch (event.code) {
    case 'KeyA':
      event.preventDefault();
      movePiece(-1);
      break;
    case 'KeyD':
      event.preventDefault();
      movePiece(1);
      break;
    case 'KeyS':
      event.preventDefault();
      stepPiece();
      break;
    case 'KeyW':
      event.preventDefault();
      rotatePiece();
      break;
    default:
      break;
  }
}

function showQuote(index) {
  if (!vibeQuoteText) return;
  const quotes = state.quoteList;
  if (!quotes || !quotes.length) return;
  const key = quotes[index % quotes.length];
  vibeQuoteText.textContent = '';
  vibeQuoteText.appendChild(document.createTextNode(key));
}

function rotateQuote() {
  const quotes = state.quoteList;
  if (!vibeQuoteText || !quotes || quotes.length < 2) return;
  vibeQuoteText.style.opacity = '0';
  game.quoteFadeTimer = window.setTimeout(() => {
    game.quoteFadeTimer = 0;
    game.quoteIndex = (game.quoteIndex + 1) % quotes.length;
    showQuote(game.quoteIndex);
    vibeQuoteText.style.opacity = '1';
  }, QUOTE_FADE_MS);
}

function stopVibeGame() {
  clearGameStartTimer();
  if (game.raf) {
    window.cancelAnimationFrame(game.raf);
    game.raf = 0;
  }
  if (game.quoteTimer) {
    window.clearInterval(game.quoteTimer);
    game.quoteTimer = 0;
  }
  if (game.quoteFadeTimer) {
    window.clearTimeout(game.quoteFadeTimer);
    game.quoteFadeTimer = 0;
  }
  if (game.keyHandler) {
    window.removeEventListener('keydown', game.keyHandler);
    game.keyHandler = null;
  }
  if (game.restartHandler && tetrisRestartBtn) {
    tetrisRestartBtn.removeEventListener('click', game.restartHandler);
    game.restartHandler = null;
  }
  if (game.touchHandlers && tetrisCanvas) {
    const { touchStart, touchMove, touchEnd } = game.touchHandlers;
    tetrisCanvas.removeEventListener('touchstart', touchStart);
    tetrisCanvas.removeEventListener('touchmove', touchMove);
    tetrisCanvas.removeEventListener('touchend', touchEnd);
    game.touchHandlers = null;
  }
  game.touchStart = null;
  game.active = false;
  game.over = false;
  game.piece = null;
  game.lastTime = 0;
  game.dropTimer = 0;
  game.pendingStart = false;
  hideGameOver();
}

function onTetrisTouchStart(event) {
  if (!game.active || game.over) return;
  const touch = event.changedTouches[0];
  if (!touch) return;
  game.touchStart = { x: touch.clientX, y: touch.clientY, moved: false };
}

function onTetrisTouchMove(event) {
  if (!game.active || game.over || !game.touchStart) return;
  const touch = event.changedTouches[0];
  if (!touch) return;
  if (event.cancelable) event.preventDefault();
  const cell = tetrisCanvas.width / TETRIS_COLS;
  const threshold = Math.max(18, cell);
  const deltaX = touch.clientX - game.touchStart.x;
  if (Math.abs(deltaX) >= threshold) {
    const steps = Math.trunc(deltaX / threshold);
    for (let index = 0; index < Math.abs(steps); index += 1) {
      movePiece(deltaX > 0 ? 1 : -1);
    }
    game.touchStart.x += steps * threshold;
    game.touchStart.moved = true;
  }
}

function onTetrisTouchEnd(event) {
  if (!game.active || game.over || !game.touchStart) return;
  const touch = event.changedTouches[0];
  if (!touch) {
    game.touchStart = null;
    return;
  }
  const deltaX = touch.clientX - game.touchStart.x;
  const deltaY = touch.clientY - game.touchStart.y;
  const isTap = !game.touchStart.moved && Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12;
  if (isTap) {
    if (event.cancelable) event.preventDefault();
    rotatePiece();
  } else if (!game.touchStart.moved && deltaY > 36) {
    if (event.cancelable) event.preventDefault();
    stepPiece();
  }
  game.touchStart = null;
}

function bindTetrisTouch() {
  if (!tetrisCanvas) return;
  const touchStart = onTetrisTouchStart;
  const touchMove = onTetrisTouchMove;
  const touchEnd = onTetrisTouchEnd;
  tetrisCanvas.addEventListener('touchstart', touchStart, { passive: true });
  tetrisCanvas.addEventListener('touchmove', touchMove, { passive: false });
  tetrisCanvas.addEventListener('touchend', touchEnd, { passive: false });
  game.touchHandlers = { touchStart, touchMove, touchEnd };
}

function hideGameOver() {
  if (tetrisGameOver) {
    tetrisGameOver.hidden = true;
    tetrisGameOver.classList.remove('is-visible');
  }
}

function showGameOver() {
  if (!tetrisGameOver) return;
  tetrisGameOver.hidden = false;
  void tetrisGameOver.offsetWidth;
  tetrisGameOver.classList.add('is-visible');
}

function startTetrisLoop() {
  if (!game.context) return;
  game.pendingStart = false;
  game.field = createField();
  game.piece = spawnPiece();
  game.active = true;
  game.over = false;
  game.lastTime = 0;
  game.dropTimer = 0;
  hideGameOver();
  paintGame();
  game.raf = window.requestAnimationFrame(tetrisLoop);
}

function focusTetrisCanvas() {
  if (!tetrisCanvas || !screens.vibe.classList.contains('active')) return;
  try { tetrisCanvas.focus({ preventScroll: true }); } catch (error) { tetrisCanvas.focus(); }
}

function startPendingVibeGame() {
  if (!game.pendingStart) return;
  focusTetrisCanvas();
  startTetrisLoop();
}

function initVibeGame(vibeKey) {
  stopVibeGame();
  const config = vibeThemes[vibeKey];
  const isNight = vibeKey === 'night' && vibeGame && tetrisCanvas;

  if (!isNight) {
    if (vibeGame) vibeGame.hidden = true;
    state.quoteList = null;
    return;
  }

  if (vibeGame) vibeGame.hidden = false;
  state.quoteList = Array.isArray(config.quotes) ? config.quotes : null;
  game.quoteIndex = 0;
  if (vibeQuoteText) vibeQuoteText.style.opacity = '1';
  showQuote(0);

  game.context = tetrisCanvas.getContext('2d');

  game.keyHandler = handleTetrisInput;
  window.addEventListener('keydown', game.keyHandler);

  game.restartHandler = restartVibeGame;
  if (tetrisRestartBtn) {
    tetrisRestartBtn.addEventListener('click', game.restartHandler);
  }

  bindTetrisTouch();

  if (screens.vibe.classList.contains('active')) {
    focusTetrisCanvas();
    startTetrisLoop();
  } else {
    game.pendingStart = true;
    game.field = createField();
    game.piece = spawnPiece();
    game.over = false;
    game.lastTime = 0;
    game.dropTimer = 0;
    hideGameOver();
    paintGame();
  }

  if (state.quoteList && state.quoteList.length > 1) {
    game.quoteTimer = window.setInterval(rotateQuote, QUOTE_ROTATE_MS);
  }
}

function restartVibeGame() {
  if (game.raf) {
    window.cancelAnimationFrame(game.raf);
    game.raf = 0;
  }
  startTetrisLoop();
}

function endVibeGame() {
  if (game.over) return;
  game.over = true;
  if (game.raf) {
    window.cancelAnimationFrame(game.raf);
    game.raf = 0;
  }
  showGameOver();
}

function resetSurvey() {
  cancelVibeCreation();
  state.order = [questions[0].id];
  state.stepIndex = 0;
  state.answers = {};
  state.history = [];
  state.activeVibe = null;
  renderQuestion();
  if (!swipeToScreen('survey', true)) showScreen('survey');
}

function handleBackRequest() {
  if (surveyLocked) return;
  if (state.history.length === 0) return;
  const snapshot = state.history.pop();
  state.order = snapshot.order;
  state.stepIndex = snapshot.stepIndex;
  state.answers = snapshot.answers;
  surveyLocked = true;
  transitionStage(-1, renderQuestionContent, () => {
    surveyLocked = false;
  });
}

if (backButton) {
  backButton.addEventListener('click', handleBackRequest);
}

if (answersContainer) {
  answersContainer.addEventListener('click', handleAnswersClick);
}

startButton.addEventListener('click', () => {
  resetSurvey();
});

function performReturn() {
  closeVibeMenu();
  cancelVibeCreation();
  stopVibeGame();
  state.order = [];
  state.stepIndex = 0;
  state.answers = {};
  state.history = [];
  state.activeVibe = null;
  state.shareVibeKey = null;
  document.body.classList.remove(...Object.values(vibeThemes).map((vibe) => vibe.palette));
  delete screens.vibe.dataset.vibe;
  delete screens.share.dataset.vibe;
  if (window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
  const leavingSurvey = pageShell && pageShell.dataset.activeScreen === 'survey';
  if (leavingSurvey && swipeToScreen('home', false)) return;
  showScreen('home');
}

vibeMenuToggle.addEventListener('click', () => {
  const isOpen = !vibeMenu.hidden;
  vibeMenu.hidden = isOpen;
  vibeMenuToggle.setAttribute('aria-expanded', String(!isOpen));
});

vibeReturnAction.addEventListener('click', performReturn);
vibeShareAction.addEventListener('click', () => {
  const vibeKey = state.activeVibe;
  closeVibeMenu();
  if (!vibeKey || !vibeShareSlugs[vibeKey]) return;
  window.location.hash = `/share/${vibeShareSlugs[vibeKey]}`;
});
shareButton.addEventListener('click', shareCurrentVibe);
window.addEventListener('hashchange', handleHashRoute);
window.addEventListener('vibe-language-change', () => {
  if (state.shareVibeKey) {
    shareVibeName.textContent = translateText(vibeThemes[state.shareVibeKey].title);
  } else if (screens.share.classList.contains('active')) {
    shareVibeName.textContent = translateText('Неизвестный вайб');
  }
  if (state.quoteList && state.quoteList.length) {
    showQuote(game.quoteIndex);
  }
  if (screens.home.classList.contains('active')) startVibeShowcase();
  shareFeedback.textContent = '';
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.vibe-navigation') && !vibeMenu.hidden) {
    closeVibeMenu();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !vibeMenu.hidden) {
    event.preventDefault();
    closeVibeMenu(true);
  }
});

if (profileToggle && profileMenu) {
  profileToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = profileMenu.hidden;
    profileMenu.hidden = !open;
    profileToggle.setAttribute('aria-expanded', String(open));
    if (!open) closeLanguageOptions();
  });

  profileMenu.addEventListener('click', (event) => {
    if (event.target.closest('.profile-menu__item--language')) return;
    if (event.target.closest('.profile-menu__item')) closeProfileMenu();
  });

  document.addEventListener('click', (event) => {
    if (!profileMenu.hidden && !event.target.closest('#profile-nav')) {
      closeProfileMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || profileMenu.hidden) return;
    if (event.defaultPrevented) return;
    const options = document.getElementById('language-options');
    if (options && !options.hidden) return;
    event.preventDefault();
    closeProfileMenu(true);
  });
}

const vibeList = document.getElementById('vibe-list');
const exploreVibesBtn = document.getElementById('explore-vibes-btn');

let catalogOpenTimer = null;

function buildVibeLink(vibeKey) {
  const vibe = vibeThemes[vibeKey];
  if (!vibe) return null;

  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'vibe-link';
  link.dataset.vibe = vibeKey;
  link.textContent = vibe.title;
  link.addEventListener('click', () => openVibeFromCatalog(vibeKey));
  return link;
}

function renderVibeCatalog() {
  if (!vibeList) return;

  const order = Object.keys(vibeThemes).filter((key) => vibeThemes[key]);
  if (!order.length) return;

  vibeList.textContent = '';
  order.forEach((key) => {
    const link = buildVibeLink(key);
    if (link) vibeList.appendChild(link);
  });
}

function scrollToCatalog() {
  const target = document.getElementById('vibe-catalog');
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

function openVibeFromCatalog(vibeKey) {
  if (!vibeThemes[vibeKey]) return;

  closeVibeMenu();
  cancelVibeCreation();
  renderVibe(vibeKey);
  state.activeVibe = vibeKey;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    showScreen('vibe');
    return;
  }

  if (catalogOpenTimer !== null) {
    window.clearTimeout(catalogOpenTimer);
    catalogOpenTimer = null;
  }
  vibeTransition.classList.add('is-quick', 'is-visible');
  catalogOpenTimer = window.setTimeout(() => {
    showScreen('vibe');
    catalogOpenTimer = window.setTimeout(() => {
      vibeTransition.classList.remove('is-visible', 'is-quick');
      catalogOpenTimer = null;
    }, 140);
  }, 280);
}

function reducedMotionPref() {
  const forced = document.documentElement.dataset.motion;
  if (forced === 'force') return false;
  if (forced === 'off') return true;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const homeTint = document.querySelector('.home-tint');

function applyVibeTint(key) {
  if (!homeTint || reducedMotionPref()) return;
  const accent = VIBE_CARD_ACCENTS[key];
  if (!accent) return;
  homeTint.style.setProperty('--vibe-tint', hexToRgba(accent, 0.16));
}

function clearVibeTint() {
  if (homeTint) homeTint.style.removeProperty('--vibe-tint');
}

const VIBE_HOLD_MS = 420;
const VIBE_HOLD_SLOP = 12;

function initVibeHover() {
  if (!vibeList) return;

  vibeList.addEventListener('pointerover', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const item = event.target.closest('.vibe-link');
    if (item) applyVibeTint(item.dataset.vibe);
  }, { passive: true });
  vibeList.addEventListener('pointerleave', clearVibeTint, { passive: true });

  let holdTimer = null;
  let holdStart = null; 
  let holdActive = false;

  const cancelHold = () => {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
    holdStart = null;
    holdActive = false;
  };

  const releaseHold = () => {
    cancelHold();
    clearVibeTint();
  };

  vibeList.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') return;
    const item = event.target.closest('.vibe-link');
    if (!item) return;
    holdStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      if (!holdStart) return;
      holdActive = true;
      applyVibeTint(item.dataset.vibe);
    }, VIBE_HOLD_MS);
  }, { passive: true });

  vibeList.addEventListener('pointermove', (event) => {
    if (!holdStart || event.pointerId !== holdStart.id) return;
    const dx = event.clientX - holdStart.x;
    const dy = event.clientY - holdStart.y;
    if (Math.hypot(dx, dy) > VIBE_HOLD_SLOP) releaseHold();
  }, { passive: true });

  vibeList.addEventListener('pointerup', (event) => {
    if (!holdStart || event.pointerId !== holdStart.id) return;
    releaseHold();
  }, { passive: true });

  vibeList.addEventListener('pointercancel', (event) => {
    if (!holdStart || event.pointerId !== holdStart.id) return;
    releaseHold();
  }, { passive: true });

  vibeList.addEventListener('contextmenu', (event) => {
    if (holdActive) event.preventDefault();
  });

  window.addEventListener('blur', clearVibeTint, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseHold();
  });
}

if (exploreVibesBtn) {
  exploreVibesBtn.addEventListener('click', scrollToCatalog);
}

initI18n('ru');
renderVibeCatalog();
initGlassTilt();
renderQuestion();
showScreen('home');
handleHashRoute();

document.documentElement.classList.add('vf-js');
initSky();
initVibeHover();

let audioUnlocked = false;
let transitionWarmStarted = false;

function warmTransitionAudio() {
  if (transitionWarmStarted) return;
  transitionWarmStarted = true;
  transitionAudio.preload = 'auto';
  transitionAudio.load();
  if (typeof transitionAudio.decode === 'function') {
    transitionAudio.decode().catch(() => {});
  }
  // `muted` is honoured everywhere; iOS Safari ignores `volume` on media.
  const unlockToken = ++transitionPlayToken;
  transitionAudio.muted = true;
  const unlock = transitionAudio.play();
  if (!unlock) {
    transitionAudio.muted = false;
    return;
  }
  unlock
    .then(() => {
      if (unlockToken !== transitionPlayToken) return;
      transitionAudio.pause();
      try { transitionAudio.currentTime = 0; } catch (error) {}
      transitionAudio.muted = false;
    })
    .catch(() => {
      if (unlockToken !== transitionPlayToken) return;
      transitionAudio.muted = false;
    });
}

function primeAudioUnlock() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  warmTransitionAudio();
}

document.addEventListener('pointerdown', primeAudioUnlock, { once: true });
document.addEventListener('keydown', primeAudioUnlock, { once: true });
document.addEventListener('touchstart', primeAudioUnlock, { once: true, passive: true });
