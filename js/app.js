// Vibe Finder: точка входа приложения. Связывает данные, локализацию,
// опрос, результат, публикацию и звук.

import { questions } from './data/questions.js';
import { vibeThemes, vibeShareSlugs, vibeKeysByShareSlug } from './data/themes.js';
import { initI18n, translateText } from './i18n/index.js';

const screens = {
  home: document.getElementById('home-screen'),
  survey: document.getElementById('survey-screen'),
  creation: document.getElementById('creation-screen'),
  vibe: document.getElementById('vibe-screen'),
  share: document.getElementById('share-screen'),
};

const startButton = document.getElementById('start-btn');
const vibeMenuToggle = document.getElementById('vibe-menu-toggle');
const vibeMenu = document.getElementById('vibe-menu');
const vibeReturnAction = document.getElementById('vibe-return-action');
const vibeShareAction = document.getElementById('vibe-share-action');
const shareVibeName = document.getElementById('share-vibe-name');
const shareButton = document.getElementById('share-button');
const shareFeedback = document.getElementById('share-feedback');
const progressLabel = document.getElementById('progress-label');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.querySelector('.progress-bar');
const backButton = document.getElementById('survey-back-btn');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers');
const themeName = document.getElementById('theme-name');
const themeDescription = document.getElementById('theme-description');
const particlesWrap = document.getElementById('particles');
const vibeGame = document.getElementById('vibe-game');
const tetrisCanvas = document.getElementById('tetris-canvas');
const vibeQuoteText = document.getElementById('vibe-quote-text');
const tetrisGameOver = document.getElementById('tetris-game-over');
const tetrisRestartBtn = document.getElementById('tetris-restart-btn');
const magnifierLens = document.getElementById('vibe-magnifier');
const heroTitle = document.querySelector('.hero-wrap h1');
const heroSubtitle = document.querySelector('.subtitle');
const discordButton = document.getElementById('discord-support');

const state = {
  currentQuestion: 0,
  scores: { cosmos: 0, solar: 0, neon: 0, forest: 0 },
  answers: [],
  history: [],
  activeVibe: null,
  shareFeedbackTimer: null,
  shareVibeKey: null,
  quoteList: null,
};

let answerPending = false;
const vibeTransition = document.getElementById('vibe-transition');

const UI_CLICK_VOLUME = 0.22;
const TRANSITION_VOLUME = 0.20;

// Рукописный переход «VibeFinder»: буквы проявляются по одной за ровно 4 секунды.
const CREATION_TOTAL_DURATION = 4000; // Жёсткий лимит: ровно 4 секунды
const CREATION_LETTER_DURATION = 1200; // Быстрый премиальный штрих одной буквы
// Нелинейная кривая для премиального почерка (стандартная кривая проекта).
const CREATION_TIMING_CURVE = [0.16, 1, 0.3, 1];
const CREATION_SPRING_EASE = `cubic-bezier(${CREATION_TIMING_CURVE.join(',')})`;
// Максимальный сдвиг, чтобы раскрытие уложилось точно в 4-секундный таймлайн.
const CREATION_AVAILABLE_STAGGER = CREATION_TOTAL_DURATION - CREATION_LETTER_DURATION;
const CREATION_STAGGER_STEP = CREATION_AVAILABLE_STAGGER / ('VibeFinder'.length - 1);
const audioVolumeFades = new WeakMap();
const uiButtonAudio = new Audio('audio/ui/ui.mp3');
const transitionAudio = new Audio('audio/ui/transition.mp3');
let creationTimer = null;
let vibeRevealTimer = null;
let creationSequence = 0;

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

// Ленивая загрузка: ничего не качаем во время первичной сборки layout.
uiButtonAudio.preload = 'none';
uiButtonAudio.volume = UI_CLICK_VOLUME;
transitionAudio.preload = 'none';
transitionAudio.volume = TRANSITION_VOLUME;
let transitionFadeOutStarted = false;

transitionAudio.addEventListener('timeupdate', () => {
  const remaining = transitionAudio.duration - transitionAudio.currentTime;
  if (!transitionFadeOutStarted && Number.isFinite(remaining) && remaining <= 0.45) {
    transitionFadeOutStarted = true;
    fadeAudioVolume(transitionAudio, 0, Math.max(100, remaining * 1000));
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

  uiButtonAudio.currentTime = 0;
  const playback = uiButtonAudio.play();
  if (playback) {
    playback.catch((error) => {
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        console.error('UI button sound failed: audio/ui/ui.mp3', error);
      }
    });
  }
}, true);

// ---------------------------------------------------------------------------
// Переиспользуемый 3D-наклон с динамическим спекуляром (liquid glass, HIG).
// Модульная функция init3DTiltEffect(selector, maxTiltAngle) вешает на каждый
// элемент независимый набор обработчиков: позиция курсора нормализуется к
// центру ИМЕННО этого элемента, поворот ограничивается maxTiltAngle градусами,
// а блик .glass-glare-effect следует за курсором. Координаты кэшируются на
// входе (getBoundingClientRect под трансформом давал дрожание), обновления —
// через requestAnimationFrame без layout-thrash.
// ---------------------------------------------------------------------------
function init3DTiltEffect(elementSelector, maxTiltAngle) {
  const element = typeof elementSelector === 'string'
    ? document.querySelector(elementSelector)
    : elementSelector;
  if (!element) return null;

  const glare = element.querySelector('.glass-glare-effect');
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
    element.style.transform =
      `perspective(1000px) rotateX(${-tiltY * state.max}deg) ` +
      `rotateY(${tiltX * state.max}deg) scale3d(1.02, 1.02, 1.02)`;
    if (glare) {
      glare.style.setProperty('--mouse-x', `${relativeX * 100}%`);
      glare.style.setProperty('--mouse-y', `${relativeY * 100}%`);
    }
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
    element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    if (glare) {
      glare.style.setProperty('--mouse-x', '50%');
      glare.style.setProperty('--mouse-y', '50%');
    }
  };

  // --- Touch-трекинг: палец ведёт наклон 1:1, как курсор на десктопе. ---
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
    // Блокируем прокрутку окна, пока пользователь ведёт палец по 3D-слою.
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

// Тонкая настройка: крупной карточке — 5°, компактным кнопкам — 7°.
function initGlassTilt() {
  init3DTiltEffect('.survey-card', 5);
  init3DTiltEffect('#start-btn', 7);
  init3DTiltEffect('#language-toggle', 7);
  init3DTiltEffect('#discord-support', 7);
  init3DTiltEffect('#vibe-menu-toggle', 7);
}

function initParticles() {
  particlesWrap.innerHTML = '';
  for (let index = 0; index < 48; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.opacity = (Math.random() * 0.8 + 0.2).toFixed(2);
    particle.style.setProperty('--speed', `${Math.random() * 12 + 12}s`);
    particle.style.animationDelay = `${Math.random() * 6}s`;
    particlesWrap.appendChild(particle);
  }
}

// ---------------------------------------------------------------------------
// Оптическая лупа на домашнем экране. Внутри маленькой линзы показывается
// увеличенный клон экрана (twin-copy), обрезанный круглой маской, поэтому
// текст «выпукло» растёт только в её 45px-периметре. Исходная вёрстка и её
// текстовые узлы НЕ меняются — никакие буквы не разбиваются на span'ы.
// Движение задаётся явной таймлайн-машиной состояний: медленное «чтение»
// заголовка по буквам → описание → пауза 2000мс у Discord → возврат.
// ---------------------------------------------------------------------------
const magnifier = {
  active: false,
  raf: 0,
  start: 0,
  holdTimer: 0,
  segments: [],
  total: 0,
  scale: 1.5,
  lensSize: 45,
  holdMs: 3000,
};

// Кривые движения: линейная для «чтения», сглаженная для переходов.
const magnifierLinear = (t) => t;
const magnifierSmooth = (t) => t * t * (3 - 2 * t);

// Клонирует рабочую область внутрь stage-слоя линзы (один раз). Клонируем
// .page-shell целиком — так в линзе оказываются фон, свечение и частицы,
// а исходная вёрстка и её текстовые узлы остаются полностью нетронутыми.
function buildMagnifierClone() {
  const stage = document.getElementById('vibe-magnifier-stage');
  const source = document.querySelector('.page-shell');
  if (!stage || !source) return;
  if (stage.dataset.cloned === 'true') return;
  const clone = source.cloneNode(true);
  // Сама лупа теперь лежит внутри .page-shell — исключаем её из клона,
  // иначе получилась бы рекурсивная копия.
  clone.querySelectorAll('.vibe-magnifier-lens').forEach((node) => node.remove());
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  clone.setAttribute('aria-hidden', 'true');
  stage.replaceChildren(clone);
  stage.dataset.cloned = 'true';
}

// Строит явный таймлайн: старт НАД заголовком «Vibe Finder» (заголовок не
// сканируем), быстрый проход по ОБЕИМ строкам описания, переход к кнопке
// Discord (целиком внутри линзы), пауза 3000мс и возврат в исходную точку.
function buildMagnifierTimeline() {
  const segments = [];
  const lens = magnifier.lensSize;
  const half = lens / 2;
  const readSpeed = 70; // px/s — ускоренное, но плавное «чтение» строк
  // Мобильный брейкпоинт по фактической ширине вьюпорта (а не только media).
  const mobile = window.innerWidth < 768 || window.matchMedia('(max-width: 768px)').matches;
  // На мобильных сильнее сжимаем вектор и удерживаем линзу внутри экрана.
  const compress = mobile ? 0.7 : 1;

  // Все координаты переводим в document-space (rect + scroll offset): линза
  // абсолютна внутри #home-screen, поэтому при прокрутке она остаётся
  // привязанной к тексту и не «дрейфует» как привязка к static viewport.
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const documentRect = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
    };
  };

  const titleRect = documentRect(heroTitle);
  const descRect = documentRect(heroSubtitle);
  const discordRect = documentRect(discordButton);

  // Стартовая точка — прямо НАД заголовком «Vibe Finder» (по центру).
  const start = titleRect
    ? { x: titleRect.left + titleRect.width / 2, y: titleRect.top - half - 10 }
    : { x: half, y: half };

  // Диск: центр кнопки, чтобы весь модуль целиком попал в 45px-периметр линзы.
  // Небольшой сдвиг вправо/вниз (DISCORD_OFFSET_X/Y) компенсирует визуальный
  // сдвиг иконки внутри контейнера, чтобы линза встала ровно по центру кнопки.
  const DISCORD_OFFSET_X = 5;
  const DISCORD_OFFSET_Y = 4;
  const discord = discordRect
    ? {
        x: discordRect.left + discordRect.width / 2 + DISCORD_OFFSET_X,
        y: discordRect.top + discordRect.height / 2 + DISCORD_OFFSET_Y,
      }
    : start;

  // Фактическая высота строки берётся из computed style (line-height), а не
  // оценочно height/2 — так трекинг двух строк точен и на мобильных, где
  // переносы и межстрочный интервал отличаются от десктопа.
  const measuredLineHeight = (element) => {
    if (!element) return 0;
    const style = window.getComputedStyle(element);
    const lh = parseFloat(style.lineHeight);
    if (Number.isFinite(lh) && lh > 0) return lh;
    const fs = parseFloat(style.fontSize);
    return Number.isFinite(fs) && fs > 0 ? fs * 1.4 : 26;
  };

  // Нормируем ось Y строки так, чтобы она не выходила за блок описания.
  const clampToBlock = (value, top, height) =>
    Math.min(Math.max(value, top + half), top + height - half);

  const descLines = descRect
    ? (() => {
        const lineHeight = measuredLineHeight(heroSubtitle);
        const cx = descRect.left + descRect.width / 2;
        const y1 = clampToBlock(
          descRect.top + lineHeight / 2 + 2,
          descRect.top,
          descRect.height,
        );
        const y2 = clampToBlock(y1 + lineHeight, descRect.top, descRect.height);
        // Диапазон 1-й строки — почти вся ширина блока (с учётом сжатия).
        const shrink = Math.max(0, (descRect.width / 2 - half) * compress);
        // Границы ни при каком масштабе не выходят за документ (document-space).
        const docWidth = document.documentElement.clientWidth + scrollX;
        const left = Math.max(scrollX + half, cx - shrink);
        const right = Math.min(docWidth - half, cx + shrink);
        // Диапазон 2-й строки («под тебя.») — узкий, вокруг центра.
        const shortSpan = Math.max(half, descRect.width * 0.12);
        const shortLeft = Math.max(scrollX + half, cx - shortSpan);
        const shortRight = Math.min(docWidth - half, cx + shortSpan);
        return [
          { left, right: Math.max(left, right), y: y1 },
          { left: shortLeft, right: Math.max(shortLeft, shortRight), y: y2 },
        ];
      })()
    : [];

  const move = (from, to, duration) => ({
    fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
    duration, ease: magnifierSmooth,
  });
  const sweep = (line, duration) => ({
    fromX: line.left, fromY: line.y, toX: line.right, toY: line.y,
    duration, ease: magnifierLinear,
  });
  const hold = (point, duration) => ({
    fromX: point.x, fromY: point.y, toX: point.x, toY: point.y,
    duration, ease: magnifierLinear,
  });
  const sweepDuration = (line) =>
    Math.max(1500, ((line.right - line.left) / readSpeed) * 1000);

  // 1. Старт над заголовком → спуск к первой строке описания.
  const firstLine = descLines[0];
  if (firstLine) {
    segments.push(move(start, { x: firstLine.left, y: firstLine.y }, 1300));
    // 2. Проход по первой строке описания.
    segments.push(sweep(firstLine, sweepDuration(firstLine)));
  }
  // 3. Мягкий спуск ко второй строке («под тебя.») и её проход.
  const secondLine = descLines[1];
  if (firstLine && secondLine) {
    segments.push(move(
      { x: firstLine.right, y: firstLine.y },
      { x: secondLine.left, y: secondLine.y },
      1100,
    ));
    segments.push(sweep(secondLine, sweepDuration(secondLine)));
  }
  // 4. Переход к Discord (кнопка целиком внутри линзы) и пауза 3000мс.
  const fromDesc = secondLine
    ? { x: secondLine.right, y: secondLine.y }
    : (firstLine ? { x: firstLine.right, y: firstLine.y } : start);
  segments.push(move(fromDesc, discord, 1500));
  segments.push(hold(discord, magnifier.holdMs));
  // 5. Плавный возврат в исходную точку над заголовком — цикл замыкается.
  segments.push(move(discord, start, 1700));

  magnifier.segments = segments;
  magnifier.total = segments.reduce((sum, part) => sum + part.duration, 0) || 1;
}

function measureMagnifier() {
  magnifier.lensSize = magnifierLens ? magnifierLens.offsetWidth || 45 : 45;
  magnifier.scale = window.matchMedia('(max-width: 768px)').matches ? 1.45 : 1.5;
  buildMagnifierTimeline();
}

// Находит точку на таймлайне по прошедшему времени.
function magnifierPointAt(time) {
  const segments = magnifier.segments;
  if (!segments.length) return { x: magnifier.lensSize / 2, y: magnifier.lensSize / 2 };
  let remaining = time % magnifier.total;
  for (const part of segments) {
    if (remaining <= part.duration) {
      const local = part.duration ? remaining / part.duration : 0;
      const eased = part.ease(local);
      return {
        x: part.fromX + (part.toX - part.fromX) * eased,
        y: part.fromY + (part.toY - part.fromY) * eased,
      };
    }
    remaining -= part.duration;
  }
  const last = segments[segments.length - 1];
  return { x: last.toX, y: last.toY };
}

// Двигает линзу в точку и синхронизирует увеличенный клон под её центром.
function placeMagnifier(point) {
  const half = magnifier.lensSize / 2;
  if (magnifierLens) {
    // Линза абсолютна внутри #home-screen: вычитаем origin содержащего блока,
    // чтобы document-координаты точки легли точно под линзу.
    const host = magnifierLens.offsetParent || screens.home || document.body;
    const hostRect = host.getBoundingClientRect();
    const originX = hostRect.left + (window.scrollX || window.pageXOffset || 0);
    const originY = hostRect.top + (window.scrollY || window.pageYOffset || 0);
    magnifierLens.style.transform =
      `translate3d(${point.x - half - originX}px, ${point.y - half - originY}px, 0)`;
  }
  const stage = document.getElementById('vibe-magnifier-stage');
  if (stage) {
    // Точка под линзой с учётом увеличения должна совпасть с её центром:
    // origin клона (0,0) смещаем так, чтобы (point * scale) попало в half.
    const scale = magnifier.scale;
    const tx = half - point.x * scale;
    const ty = half - point.y * scale;
    stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }
}

function magnifierTick(time) {
  if (!magnifier.active) return;
  if (!magnifier.start) magnifier.start = time;
  placeMagnifier(magnifierPointAt(time - magnifier.start));
  if (magnifier.active) {
    magnifier.raf = window.requestAnimationFrame(magnifierTick);
  }
}

function startMagnifier() {
  if (!magnifierLens) return;
  // Строгий тирдаун перед ре-маунтом: гасим возможный предыдущий цикл и
  // таймеры паузы, чтобы не запустился дублирующий оверлей и координаты
  // не «рвались» при возврате на домашний экран.
  teardownMagnifier();
  buildMagnifierClone();
  measureMagnifier();
  magnifier.active = true;
  magnifier.start = 0;
  magnifierLens.classList.add('is-active');
  // Ставим линзу в абсолютную стартовую точку (над заголовком) сразу.
  placeMagnifier(magnifierPointAt(0));
  magnifier.raf = window.requestAnimationFrame(magnifierTick);
}

// Полный сброс состояния лупы: кадр, таймеры паузы и координаты трансформов.
function teardownMagnifier() {
  if (magnifier.raf) {
    window.cancelAnimationFrame(magnifier.raf);
    magnifier.raf = 0;
  }
  if (magnifier.holdTimer) {
    window.clearTimeout(magnifier.holdTimer);
    magnifier.holdTimer = 0;
  }
  magnifier.active = false;
  magnifier.start = 0;
}

function stopMagnifier() {
  teardownMagnifier();
  if (magnifierLens) {
    magnifierLens.classList.remove('is-active');
    // Сбрасываем базовые координаты в дефолтную позицию.
    magnifierLens.style.transform = 'translate3d(-200px, -200px, 0)';
  }
  const stage = document.getElementById('vibe-magnifier-stage');
  if (stage) stage.style.transform = '';
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === name);
  });
  document.querySelector('.page-shell').dataset.activeScreen = name;
  if (name !== 'vibe') screens.vibe.classList.remove('vibe-screen-reveal');
  if (name !== 'vibe') closeVibeMenu();
  // Вне экрана вайба тетрис и карусель цитат должны быть полностью остановлены.
  if (name !== 'vibe') stopVibeGame();
  // Лупа живёт только на домашнем экране — на других останавливается.
  if (name === 'home') startMagnifier();
  else stopMagnifier();
}

function closeVibeMenu(returnFocus = false) {
  vibeMenu.hidden = true;
  vibeMenuToggle.setAttribute('aria-expanded', 'false');
  if (returnFocus) vibeMenuToggle.focus();
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
  vibeTransition.classList.remove('is-visible');
}

// Разбивает слово «VibeFinder» на отдельные <span> и задаёт каждой букве
// явные animation-delay / animation-duration / animation-timing-function,
// выстраивая раскрытие ровно за 8 секунд.
function buildCreationWord() {
  const container = document.getElementById('vibe-finder-animated-text');
  if (!container) return;

  // Убираем возможные остатки предыдущего запуска
  container.innerHTML = '';

  const textWord = 'VibeFinder';
  const lettersArray = textWord.split('');

  lettersArray.forEach((char, index) => {
    const spanNode = document.createElement('span');
    spanNode.textContent = char;
    spanNode.setAttribute('aria-hidden', 'true');

    // Явные вычисления, записанные прямо в живые CSS-биндинги
    const delayMiliseconds = index * CREATION_STAGGER_STEP;
    spanNode.style.animationDelay = `${delayMiliseconds}ms`;
    spanNode.style.animationDuration = `${CREATION_LETTER_DURATION}ms`;
    spanNode.style.animationTimingFunction = CREATION_SPRING_EASE;

    container.appendChild(spanNode);
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    container.querySelectorAll('span').forEach((span) => {
      span.style.animation = 'none';
      span.style.opacity = '1';
      span.style.filter = 'none';
      span.style.transform = 'none';
    });
  }
}

function startVibeCreation(vibeKey) {
  cancelVibeCreation();
  const sequence = creationSequence;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  buildCreationWord();
  showScreen('creation');

  transitionAudio.pause();
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
        console.error('Transition sound failed: audio/ui/transition.mp3', error);
      }
    });
  }
  fadeAudioVolume(transitionAudio, TRANSITION_VOLUME, 100);

  const revealVibe = () => {
    if (sequence !== creationSequence) return;
    renderVibe(vibeKey);
    screens.vibe.classList.add('vibe-screen-reveal');
    showScreen('vibe');
    if (reducedMotion) {
      vibeTransition.classList.remove('is-visible');
      return;
    }
    vibeRevealTimer = window.setTimeout(() => {
      if (sequence === creationSequence) {
        vibeTransition.classList.remove('is-visible');
      }
      vibeRevealTimer = null;
    }, 350);
  };

  // Полная длительность письма — ровно 4 секунды; при reduced-motion сокращаем паузу.
  const writingTime = reducedMotion ? 1400 : CREATION_TOTAL_DURATION;
  creationTimer = window.setTimeout(() => {
    if (sequence !== creationSequence) return;
    creationTimer = null;
    vibeTransition.classList.add('is-visible');
    vibeRevealTimer = window.setTimeout(() => {
      vibeRevealTimer = null;
      revealVibe();
    }, reducedMotion ? 250 : 1050);
  }, writingTime);
}

function updateProgress() {
  const percent = ((state.currentQuestion + 1) / questions.length) * 100;
  progressLabel.textContent = `Вопрос ${state.currentQuestion + 1} из ${questions.length}`;
  progressFill.style.width = `${percent}%`;
  progressBar.setAttribute('aria-valuenow', String(state.currentQuestion + 1));
  updateBackButton();
}

// Кнопка «Назад» показывается только начиная со второго вопроса,
// чтобы нельзя было выйти за пределы первого вопроса.
function updateBackButton() {
  if (!backButton) return;
  const canGoBack = state.currentQuestion > 0;
  backButton.hidden = !canGoBack;
  backButton.setAttribute('aria-hidden', String(!canGoBack));
}

function renderQuestion() {
  answerPending = false;
  const current = questions[state.currentQuestion];
  questionText.textContent = current.text;
  answersContainer.innerHTML = '';
  document.querySelector('.survey-card')?.classList.remove('is-switching');

  current.options.forEach((option, optionIndex) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.type = 'button';
    button.textContent = option.label;
    // Мягкий ступенчатый вход со лёгким горизонтальным смещением при смене вопроса.
    button.style.setProperty('--option-enter-delay', `${optionIndex * 55}ms`);
    button.addEventListener('click', () => {
      if (answerPending) return;
      answerPending = true;
      document.querySelectorAll('.option-btn').forEach((item) => {
        item.classList.remove('selected');
        item.disabled = true;
      });
      button.classList.add('selected');
      // Короткий «выход» текущих карточек вправо перед сменой вопроса.
      document.querySelector('.survey-card')?.classList.add('is-switching');
      setTimeout(() => {
        applyAnswer(option.value, optionIndex);
      }, 180);
    });
    answersContainer.appendChild(button);
  });

  updateProgress();
}

function applyAnswer(scoreMap, answerIndex) {
  // Снимок состояния ДО изменений — для кнопки «Назад».
  state.history.push({
    currentQuestion: state.currentQuestion,
    scores: { ...state.scores },
    answers: [...state.answers],
  });

  Object.entries(scoreMap).forEach(([key, value]) => {
    state.scores[key] += value;
  });
  state.answers.push(answerIndex);

  if (state.currentQuestion < questions.length - 1) {
    state.currentQuestion += 1;
    renderQuestion();
    return;
  }

  determineVibe();
}

function determineVibe() {
  const ranked = Object.entries(vibeThemes).map(([id, vibe]) => {
    let exactMatches = 0;
    let lastMatch = -1;
    vibe.signature.forEach((answer, index) => {
      if (state.answers[index] === answer) {
        exactMatches += 1;
        lastMatch = index;
      }
    });
    const legacyBonus = (state.scores[id] || 0) * 0.02;
    return { id, exactMatches, lastMatch, score: exactMatches * 2 + legacyBonus };
  });
  ranked.sort((a, b) =>
    b.score - a.score ||
    b.exactMatches - a.exactMatches ||
    b.lastMatch - a.lastMatch ||
    a.id.localeCompare(b.id)
  );
  const chosen = ranked[0].id;
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

  themeName.textContent = config.title;
  themeDescription.textContent = config.description;

  initVibeGame(vibeKey);
}

// ---------------------------------------------------------------------------
// Вайб-игра (только для «Ночного»): минималистичный тетрис на canvas 10×20 и
// одна ротирующаяся строка вайб-цитаты под ним. Чистое затухание и корректная
// уборка ресурсов при выходе с экрана (без фоновых циклов и утечек).
// ---------------------------------------------------------------------------

const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
// Стандартная скорость гравитации: 1 клетка вниз ровно раз в 800 мс.
const TETRIS_GRAVITY_MS = 800;
const QUOTE_ROTATE_MS = 10000;
const QUOTE_FADE_MS = 800;

// Тетромино: глубокие неоновые оттенки ночного мегаполиса.
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

  // Минималистичная неоновая сетка 10×20 под блоками.
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
      // Блоки замерли выше нулевой строки — переполнение поля.
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

// Дельта-цикл: плавная гравитация независимо от частоты кадров.
function tetrisLoop(time) {
  if (!game.active) return;
  if (!game.lastTime) game.lastTime = time;
  const delta = time - game.lastTime;
  game.lastTime = time;
  // Ограничиваем дельту (защита от скачков при возврате на вкладку).
  game.dropTimer += Math.min(delta, 100);
  if (game.dropTimer >= TETRIS_GRAVITY_MS) {
    game.dropTimer -= TETRIS_GRAVITY_MS;
    stepPiece();
  }
  if (game.active) {
    game.raf = window.requestAnimationFrame(tetrisLoop);
  }
}

// Обработчик ввода с клавиатуры (WASD). Именованный — для точечного снятия.
// Используем event.code, чтобы управление работало в любой раскладке.
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
  // Ключи цитат хранятся на русском. Пересоздаём текстовый узел, чтобы
  // i18n-наблюдатель каждый раз брал свежий источник и переводил его по
  // активному языку (кэш источника привязан к конкретному узлу).
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
  // Снимаем все touch-биндинги канваса, чтобы не осталось утечек.
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
  hideGameOver();
}

// --- Мобильное управление свайпами ---------------------------------------
// Короткий тап — поворот; горизонтальный свайп — смещение по клеткам;
// свайп вниз — ускоренный мягкий сброс. Отслеживаем смещения от точки старта.
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
  // Блокируем прокрутку страницы, пока активны свайп-жесты.
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
    // Короткий тап — поворот по часовой (аналог клавиши W).
    if (event.cancelable) event.preventDefault();
    rotatePiece();
  } else if (!game.touchStart.moved && deltaY > 36) {
    // Свайп вниз — ускоренное падение на одну клетку.
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
  // Форсируем reflow, чтобы CSS-переход прозрачности сработал.
  void tetrisGameOver.offsetWidth;
  tetrisGameOver.classList.add('is-visible');
}

// Запускает цикл: чистое поле, новая фигура, свежий тик-рендер.
function startTetrisLoop() {
  if (!game.context) return;
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
  if (tetrisCanvas) {
    tetrisCanvas.focus();
  }

  game.keyHandler = handleTetrisInput;
  window.addEventListener('keydown', game.keyHandler);

  game.restartHandler = restartVibeGame;
  if (tetrisRestartBtn) {
    tetrisRestartBtn.addEventListener('click', game.restartHandler);
  }

  bindTetrisTouch();

  startTetrisLoop();

  if (state.quoteList && state.quoteList.length > 1) {
    game.quoteTimer = window.setInterval(rotateQuote, QUOTE_ROTATE_MS);
  }
}

// Перезапуск после Game Over: сброс поля/очков, новая фигура, старт цикла.
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
  // Останавливаем физику, но не сносим обработчик рестарта/клавиш.
  if (game.raf) {
    window.cancelAnimationFrame(game.raf);
    game.raf = 0;
  }
  showGameOver();
}

function resetSurvey() {
  cancelVibeCreation();
  state.currentQuestion = 0;
  state.scores = { cosmos: 0, solar: 0, neon: 0, forest: 0 };
  state.answers = [];
  state.history = [];
  state.activeVibe = null;
  renderQuestion();
  showScreen('survey');
}

// Возврат к предыдущему вопросу: восстанавливаем точный снимок весов и ответов,
// чтобы алгоритм подбора вайба считался корректно.
function handleBackRequest() {
  if (answerPending) return;
  if (state.history.length === 0) return;
  const snapshot = state.history.pop();
  state.currentQuestion = snapshot.currentQuestion;
  state.scores = { ...snapshot.scores };
  state.answers = [...snapshot.answers];
  renderQuestion();
}

if (backButton) {
  backButton.addEventListener('click', handleBackRequest);
}

startButton.addEventListener('click', () => {
  resetSurvey();
});

function performReturn() {
  closeVibeMenu();
  cancelVibeCreation();
  stopVibeGame();
  // Полный тирдаун лупы до ре-маунта на домашнем экране.
  teardownMagnifier();
  state.currentQuestion = 0;
  state.scores = { cosmos: 0, solar: 0, neon: 0, forest: 0 };
  state.answers = [];
  state.history = [];
  state.activeVibe = null;
  state.shareVibeKey = null;
  document.body.classList.remove(...Object.values(vibeThemes).map((vibe) => vibe.palette));
  delete screens.vibe.dataset.vibe;
  delete screens.share.dataset.vibe;
  if (window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
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
  // Мгновенно перерисовываем текущую строку цитат на новом языке.
  if (state.quoteList && state.quoteList.length) {
    showQuote(game.quoteIndex);
  }
  // Перевод перерисовал тексты — пересобираем клон экрана для лупы.
  if (magnifier.active) {
    const stage = document.getElementById('vibe-magnifier-stage');
    if (stage) {
      stage.dataset.cloned = '';
      buildMagnifierClone();
    }
    measureMagnifier();
  }
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

// Пересчёт маршрута лупы при изменении размеров окна (координаты относительные).
let magnifierResizeRaf = 0;
function handleMagnifierResize() {
  if (magnifierResizeRaf) return;
  magnifierResizeRaf = window.requestAnimationFrame(() => {
    magnifierResizeRaf = 0;
    if (magnifier.active) measureMagnifier();
  });
}
window.addEventListener('resize', handleMagnifierResize);

// Порядок важен: сначала локализация (переводит статические тексты и запускает
// наблюдатель за динамическими узлами), затем построение UI.
initI18n('ru');
initGlassTilt();
initParticles();
renderQuestion();
showScreen('home');
handleHashRoute();

// Аудио стартует лениво — только после первого взаимодействия пользователя.
// Так аудио-буферы не конкурируют с рендером первого экрана, частицами
// и анимацией появления (layout уже собран к этому моменту).
let audioPipelineStarted = false;
function startAudioPipelineLazily() {
  if (audioPipelineStarted) return;
  audioPipelineStarted = true;
  document.removeEventListener('pointerdown', startAudioPipelineLazily);
  document.removeEventListener('keydown', startAudioPipelineLazily);

  // Прогреваем UI-звуки (клик/переход), чтобы первый клик не буферизовался.
  uiButtonAudio.preload = 'auto';
  uiButtonAudio.load();
  transitionAudio.preload = 'auto';
  transitionAudio.load();
}
document.addEventListener('pointerdown', startAudioPipelineLazily, { once: true });
document.addEventListener('keydown', startAudioPipelineLazily, { once: true });
