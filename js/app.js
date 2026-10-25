// Vibe Finder: точка входа приложения. Связывает данные, локализацию,
// опрос, результат, публикацию и звук.

import { questions } from './data/questions.js';
import { vibeThemes, vibeShareSlugs, vibeKeysByShareSlug } from './data/themes.js';
import { rankVibes, selectNextQuestion, questionIndexById } from './data/scoring.js';
import { initI18n, translateText } from './i18n/index.js';
import { initCinematicIntro } from './intro.js';
// Версия в URL нужна из-за immutable-кэша статики: иначе браузер может
// оставить старую копию sky.js и «небо» не появится.
import { initSky, setSkyActive } from './sky.js?v=4';

// Кинематографический вход запускаем первым: он должен выставить состояние
// затемнения (data-intro на <html>) до того, как отрисуется первый экран.
initCinematicIntro();

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
const progressFill = document.getElementById('progress-fill');
const progressBar = document.querySelector('.progress-bar');
const backButton = document.getElementById('survey-back-btn');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers');
// Ссылки на узлы опроса кэшируем один раз: в горячем пути (смена вопроса) не
// делаем повторных DOM-запросов и не пересоздаём обработчики.
const surveyStage = document.querySelector('.survey-stage');
const optionButtons = [];
// Тайминги смены вопроса: уход 150 мс, вход 240 мс, каскад вариантов 35 мс.
const SURVEY_LEAVE_MS = 150;
const SURVEY_ENTER_MS = 240;
const SURVEY_STAGGER_MS = 35;
// Контроллер перехода: surveyLocked гасит повторные тапы, surveyToken отсекает
// устаревшие колбэки, таймеры — страховка от «зависшего» перехода.
let surveyLocked = false;
let surveyToken = 0;
let surveyLeaveTimer = null;
let surveyEnterTimer = null;
// Свайп-переход: двигаются ЭКРАНЫ целиком (весь лендинг с его свечением и
// оттенком), а общий канвас «живого неба» лежит ВНЕ экранов (.page-shell) и
// остаётся неподвижным. Ссылки кэшируем один раз.
const pageShell = document.querySelector('.page-shell');
const SWIPE_SCREENS = ['home', 'survey'];
// Длительность близка к 400 мс — «тактильное» ощущение свайпа между экранами.
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

const state = {
  // Порядок показа вопросов (стабильные id) и позиция в нём. Адаптивность
  // меняет ПОРЯДОК, а не количество вопросов, поэтому счётчик всегда точен.
  order: [],
  stepIndex: 0,
  // Ответы ключуются стабильным id вопроса: пересчёт весов не зависит от
  // позиции и устойчив к навигации назад/вперёд и смене ответа.
  answers: {},
  history: [],
  activeVibe: null,
  shareFeedbackTimer: null,
  shareVibeKey: null,
  quoteList: null,
};

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
// Переиспользуемый 3D-наклон (liquid glass, HIG).
// Модульная функция init3DTiltEffect(selector, maxTiltAngle) вешает на каждый
// элемент независимый набор обработчиков: позиция курсора нормализуется к
// центру ИМЕННО этого элемента, поворот ограничивается maxTiltAngle градусами.
// Координаты кэшируются на входе (getBoundingClientRect под трансформом давал
// дрожание), обновления — через requestAnimationFrame без layout-thrash.
// ---------------------------------------------------------------------------
function init3DTiltEffect(elementSelector, maxTiltAngle) {
  const element = typeof elementSelector === 'string'
    ? document.querySelector(elementSelector)
    : elementSelector;
  if (!element) return null;

  // Пользователи с prefers-reduced-motion не получают 3D-наклон: остаётся
  // спокойный отклик рамкой и тенью из CSS.
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
    // Пишем только CSS-переменные, а сам transform собирает CSS: так наклон
    // складывается с hover-подъёмом и нажатием и не перезаписывает их inline-стилем.
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

// Тонкая настройка: компактным кнопкам — 7°. Опросный холст сознательно без
// 3D-наклона: это крупная область, и наклон не сообщал пользователю ничего.
function initGlassTilt() {
  init3DTiltEffect('#start-btn', 7);
  init3DTiltEffect('#language-toggle', 7);
  init3DTiltEffect('#discord-support', 7);
  init3DTiltEffect('#vibe-menu-toggle', 7);
}

/* Лупа удалена целиком: её непрозрачный круг закрывал текст первого экрана,
   а не увеличивал его. Прежний код строил клон всей страницы и водил линзу
   по маршруту «заголовок → подзаголовок → Discord». */

// ---------------------------------------------------------------------------
// Витрина атмосфер на первом экране: акцентный цвет каждого вайба. Цвет играет
// свечение фона и ореол печатаемого названия в бесконечном цикле витрины.
// ---------------------------------------------------------------------------
const VIBE_CARD_ACCENTS = {
  cosmos: '#9d8bff',
  solar: '#fbbf24',
  neon: '#67e8f9',
  forest: '#8ec49a',
  night: '#70e7ff',
  melancholic: '#a8d8f0',
  zen: '#a7ead4',
  chaotic: '#ff5c74',
  happy: '#ffca48',
  mysterious: '#c49aff',
  creative: '#ff80bc',
  nature: '#a8d67b',
  retro: '#bdf35d',
  cozy: '#f3bd7d',
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

// ---------------------------------------------------------------------------
// Витрина атмосфер: бесконечный цикл. Каждый вайб держится на экране
// SHOWCASE_HOLD_MS, затем слои перекрещиваются кроссфейдом — имя и свечение
// перетекают в следующий вайб без пустой паузы и рывков.
//
// Цвет свечения идёт НЕ через одну анимируемую переменную (её интерполяция
// проходит через грязные промежуточные оттенки), а через два слоя с
// фиксированными цветами: входящий проявляется, уходящий гаснет — один цвет
// постепенно заменяет другой, как и задумано.
// ---------------------------------------------------------------------------
const VIBE_SHOWCASE_ORDER = Object.keys(vibeThemes);
const SHOWCASE_HOLD_MS = 3000; // сколько вайб держится целиком
const SHOWCASE_FADE_MS = 1400; // длительность кроссфейда (совпадает с CSS)
// Плотность свечения: должно читаться как мягкая палитра, а не пятно.
const SHOWCASE_GLOW_ALPHA = 0.4;
// Рукописное проявление имени: длительность штриха одной буквы и шаг каскада.
// Каскад укладывается в окно кроссфейда (SHOWCASE_FADE_MS), поэтому буквы
// «дописываются» ровно вовремя и не тянутся в удержание.
const SHOWCASE_INK_DURATION = 620;
const SHOWCASE_INK_STEP = 34;

const showcase = {
  order: [],
  index: 0,
  active: false,
  // Индексы текущих слоёв: имя и свечение идут на «другом» слое каждый шаг,
  // поэтому смена всегда кроссфейд, а не перезапуск одного элемента.
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

// Окрашивает ореол имени в акцент вайба. Значение ставится один раз на показ —
// имя проявляется целиком вместе с ореолом, поэтому интерполяция не нужна.
function setShowcaseAccent(key) {
  const accent = VIBE_CARD_ACCENTS[key] || '#ffffff';
  screens.home.style.setProperty('--preview-glow', hexToRgba(accent, SHOWCASE_GLOW_ALPHA));
}

// Кроссфейд свечения: входящий слой получает фиксированный цвет вайба и
// проявляется, уходящий гаснет — один цвет постепенно заменяет другой.
function crossfadeShowcaseGlow(key) {
  if (homeGlowLayers.length < 2) return;
  const accent = VIBE_CARD_ACCENTS[key] || '#ffffff';
  const previousLayer = showcase.glowLayer;
  const nextLayer = 1 - previousLayer;
  const incoming = homeGlowLayers[nextLayer];
  // Цвет фиксируем ДО проявления: слой не интерполирует оттенок через грязь.
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

// Записывает имя в указанный слой, разбивая его на слова и буквы: так каждая
// буква получает свою задержку рукописного каскада. Разметка пересоздаётся
// целиком, а имя приходит уже переведённым из showShowcaseVibe, поэтому смена
// языка просто перерисовывает витрину на новом языке.
function paintShowcaseLayer(layer, label) {
  layer.classList.remove('is-active');
  layer.textContent = '';
  const words = String(label).split(' ');
  let letterIndex = 0;
  words.forEach((word, wordIndex) => {
    // Пробел между словами оставляем обычным текстовым узлом: он даёт перенос
    // по словам, пока буквы внутри слова склеены inline-block.
    if (wordIndex > 0) layer.appendChild(document.createTextNode(' '));
    const wordNode = document.createElement('span');
    wordNode.className = 'vibe-word';
    // Array.from итерирует по код-поинтам: не разрывает суррогатные пары
    // (важно для CJK и любой не-латинской локали).
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

  // Наполняем скрытый слой и проявляем его, пока предыдущий гаснет своим
  // переходом — оба переплетаются кроссфейдом.
  paintShowcaseLayer(vibeShowcaseLayers[nextLayer], label);
  void vibeShowcaseLayers[nextLayer].offsetWidth; // перезапуск перехода
  vibeShowcaseLayers[nextLayer].classList.add('is-active');
  vibeShowcaseLayers[previousLayer].classList.remove('is-active');

  showcase.layer = nextLayer;
  // Полное время показа = проявление (кроссфейд) + удержание целиком.
  showcase.holdTimer = window.setTimeout(advanceShowcase, SHOWCASE_HOLD_MS + SHOWCASE_FADE_MS);
}

function advanceShowcase() {
  if (!showcase.active) return;
  showcase.holdTimer = null;
  showcase.index = (showcase.index + 1) % showcase.order.length;
  showShowcaseVibe();
}

// Витрина атмосфер временно отключена на первом экране. Код, данные и таймеры
// сохранены целиком — достаточно вернуть true, чтобы вернуть витрину.
const HOME_SHOWCASE_ENABLED = false;

function startVibeShowcase() {
  if (!HOME_SHOWCASE_ENABLED) return;
  if (!vibeShowcase || !vibeShowcaseLayers.length) return;
  showcase.order = VIBE_SHOWCASE_ORDER.filter((key) => vibeThemes[key]);
  if (!showcase.order.length) return;
  showcase.active = true;
  showcase.index = 0;
  // Стартуем «с другого» слоя, чтобы первый показ уже шёл кроссфейдом.
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

// Можно ли проигрывать свайп: не reduced-motion и есть поддержка Web Animations.
function canSwipeAnimate() {
  return !reducedMotionPref()
    && typeof Element.prototype.animate === 'function'
    && screens.home && screens.survey;
}

// Горизонтальный свайп между двумя экранами. Направление движения единое
// (экран уходит вправо, следующий въезжает слева) — как при листании кадров в
// TikTok. Общий канвас неба лежит вне экранов, поэтому остаётся неподвижным.
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
    // Фиксируем конечные положения инлайн-стилем ДО cancel(): иначе отмена
    // анимации мгновенно вернула бы экраны в исходную точку и дала бы вспышку.
    if (fromScreen) fromScreen.style.transform = `translateX(${distance}px)`;
    if (toScreen) toScreen.style.transform = 'translateX(0)';
    animations.forEach((animation) => { try { animation.cancel(); } catch (error) {} });
    // showScreen вызывается, пока на .page-shell стоит .is-swiping (transition: none):
    // active-классы переключаются мгновенно, уходящий экран тут же получает
    // opacity:0/visibility:hidden — без кроссфейда и без «остаточного» кадра.
    onDone();
    // Снимаем инлайн-трансформы СРАЗУ, ещё под transition: none. Класс .is-swiping
    // убираем только в следующем кадре. Так смена transform на CSS-значение
    // происходит без переходов, а повторное включение transition уже не меняет
    // никаких свойств — обратной анимации (мерцания лендинга) не возникает.
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
  // Страховка: даже если onfinish не придёт, экран не застрянет в переходе.
  swipeTimer = window.setTimeout(finish, SWIPE_DURATION + 150);
}

// Свайп-навигация к экрану с сохранением обычной логики showScreen в конце.
// Возвращает true, если переход уже обрабатывается (анимацией или идущим свайпом):
// тогда вызывающий НЕ должен делать мгновенный showScreen. false — нужен откат к
// обычному переключению (reduced-motion / нет WAAPI).
function swipeToScreen(targetName, forward) {
  if (swipeBusy) return true; // защита от двойных кликов и наложения анимаций
  if (!canSwipeAnimate()) return false;

  const fromScreen = forward ? screens.home : screens.survey;
  const toScreen = forward ? screens.survey : screens.home;
  const targetScreen = screens[targetName];
  if (!fromScreen || !toScreen || !targetScreen) return false;

  swipeBusy = true;
  if (pageShell) pageShell.classList.add('is-swiping');
  // Входящий экран делаем видимым, но клики он не перехватывает до финиша.
  targetScreen.classList.add('is-swipe-incoming');

  runScreenSwipe(fromScreen, toScreen, () => showScreen(targetName));
  return true;
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === name);
  });
  if (pageShell) pageShell.dataset.activeScreen = name;
  if (name !== 'vibe') screens.vibe.classList.remove('vibe-screen-reveal');
  if (name !== 'vibe') closeVibeMenu();
  // Вне экрана вайба тетрис и карусель цитат должны быть полностью остановлены.
  if (name !== 'vibe') stopVibeGame();
  // «Живое небо» — общий фоновый слой приложения. Держим его активным на первом
  // экране И в опросе, чтобы космос был непрерывным при входе в анкету и не
  // перезапускался при смене вопроса (модуль рисует один непрерывный цикл).
  // На остальных экранах слой останавливается и скрывается — ноль фоновой работы.
  if (name === 'home' || name === 'survey') {
    if (name === 'home') startVibeShowcase(); // no-op, пока HOME_SHOWCASE_ENABLED = false
    setSkyActive(true);
    if (name === 'survey') closeLanguageMenu();
  } else {
    stopVibeShowcase();
    setSkyActive(false);
    // Уходя с главной, закрываем список языков, чтобы он не остался «висеть».
    closeLanguageMenu();
  }
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

// Единая проверка «можно ли анимировать» с учётом override (?motion=on|off).
function prefersMotion() {
  return !reducedMotionPref();
}

// --- Прогресс и навигация --------------------------------------------------
// Видимый текстовый счётчик «Вопрос X из Y» удалён из интерфейса, но сама
// модель прогресса сохранена: индексация и порядок вопросов не меняются.
// Итог всегда равен числу вопросов (адаптивность меняет ПОРЯДОК, не количество),
// поэтому полоса прогресса остаётся корректной.
function updateProgress() {
  const step = state.stepIndex + 1;
  const total = questions.length;
  const ratio = total > 0 ? step / total : 0;
  // Заполняем полосу через scaleX (составной transform, без layout-триггера).
  progressFill.style.transform = `scaleX(${ratio})`;
  progressBar.setAttribute('aria-valuemax', String(total));
  progressBar.setAttribute('aria-valuenow', String(step));
  updateBackButton();
}

// Кнопка «Назад» показывается только начиная со второго шага,
// чтобы нельзя было выйти за пределы первого вопроса.
function updateBackButton() {
  if (!backButton) return;
  const canGoBack = state.stepIndex > 0;
  backButton.hidden = !canGoBack;
  backButton.setAttribute('aria-hidden', String(!canGoBack));
}

// Текущий объект вопроса по позиции в порядке показа.
function currentQuestion() {
  return questions[questionIndexById.get(state.order[state.stepIndex])];
}

// Направленный переход между вопросами. renderContent вызывается в момент,
// когда уходящий вопрос уже погашен: новый контент появляется невидимым и
// входит направленной анимацией — без пустых кадров, мерцаний и скачков.
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
    // Меняем контент, пока вопрос погашен, и сразу ставим входную анимацию:
    // первый её кадр (opacity: 0) совпадает с текущей невидимостью, поэтому
    // кадр с новым текстом не успевает проявиться — вспышки нет.
    surveyStage.classList.remove('is-leave');
    renderContent();
    surveyStage.style.setProperty('--enter-x', direction > 0 ? '16px' : '-16px');
    void surveyStage.offsetWidth; // фиксируем новую разметку и var до старта анимации
    surveyStage.classList.add('is-enter');
    surveyEnterTimer = window.setTimeout(() => {
      surveyEnterTimer = null;
      if (token !== surveyToken) return;
      surveyStage.classList.remove('is-enter');
      done();
    }, SURVEY_ENTER_MS + SURVEY_STAGGER_MS * 4 + 30);
  }, SURVEY_LEAVE_MS);
}

// Заполняет вопрос и варианты текущим шагом (без анимации). Вызывается при
// первом показе, «назад» и сбросе, а также из transitionStage при смене шага.
function renderQuestionContent() {
  const current = currentQuestion();
  questionText.textContent = current ? current.text : '';
  answersContainer.innerHTML = '';
  optionButtons.length = 0;

  if (current) {
    // Восстановление выбора при возврате назад: выбранный вариант снова тёплый.
    const chosen = state.answers[current.id];
    current.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.type = 'button';
      button.textContent = option.label;
      button.dataset.optionIndex = String(optionIndex);
      button.style.setProperty('--option-enter-delay', `${optionIndex * SURVEY_STAGGER_MS}ms`);
      if (chosen === optionIndex) button.classList.add('selected');
      answersContainer.appendChild(button);
      optionButtons.push(button);
    });
  }
  updateProgress();
}

// Немедленная отрисовка шага без входа (первый показ и сброс опроса).
function renderQuestion() {
  surveyLocked = false;
  if (!state.order.length) state.order.push(questions[0].id);
  if (surveyStage) surveyStage.classList.remove('is-leave', 'is-enter');
  renderQuestionContent();
}

// Один делегированный обработчик вместо N замыканий на каждый вопрос:
// строки опроса перерисовываются, а слушатель остаётся один на контейнер.
function handleAnswersClick(event) {
  if (surveyLocked) return;
  const button = event.target.closest('.option-btn');
  if (!button || !answersContainer.contains(button)) return;
  const current = currentQuestion();
  if (!current) return;
  const optionIndex = Number(button.dataset.optionIndex);
  if (!current.options[optionIndex]) return;
  // Повторный тап по тому же варианту ничего не делает: один ответ — ровно
  // один показ следующего вопроса (защита от дублей и повторной обработки).
  if (state.answers[current.id] === optionIndex) return;
  applyAnswer(optionIndex, button);
}

function applyAnswer(optionIndex, button) {
  if (surveyLocked) return;
  const current = currentQuestion();
  if (!current) return;
  surveyLocked = true;

  // Снимок для «назад» ДО изменения (порядок, шаг и карта ответов).
  state.history.push({
    order: [...state.order],
    stepIndex: state.stepIndex,
    answers: { ...state.answers },
  });

  // Карта ответов перезаписывается по ключу: прежний вклад варианта полностью
  // заменяется новым — двойного счёта нет, смена ответа считается корректно.
  state.answers[current.id] = optionIndex;

  // Мгновенный отклик выбора: выбранная строка фиксируется, остальные тихо
  // отступают (CSS .answers.is-locked), синхронно с уходом вопроса.
  optionButtons.forEach((item) => {
    item.classList.toggle('selected', item === button);
  });
  answersContainer.classList.add('is-locked');
  optionButtons.forEach((item) => { item.disabled = true; });

  const isLast = state.stepIndex >= questions.length - 1;

  // Финальный шаг: показываем выбор, гасим вопрос уходной анимацией и уходим
  // в подбор вайба (без повторного «входа» того же контента).
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

  // Промежуточный шаг: уход → выбор следующего вопроса → вход нового кадра.
  transitionStage(1, () => {
    if (state.stepIndex + 1 < state.order.length) {
      // Порядок уже проложен (возврат вперёд) — переиспользуем его как есть.
      state.stepIndex += 1;
    } else {
      const nextIndex = selectNextQuestion(state.answers, new Set(state.order));
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

// Подбор вайба по взвешенной модели (см. js/data/scoring.js). Детерминирован
// для одинакового набора ответов; все 14 вайбов участвуют.
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
  state.order = [questions[0].id];
  state.stepIndex = 0;
  state.answers = {};
  state.history = [];
  state.activeVibe = null;
  renderQuestion();
  // Горизонтальный свайп лендинг → опрос; при reduced-motion или отсутствии
  // поддержки WAAPI — обычное мгновенное переключение экрана.
  if (!swipeToScreen('survey', true)) showScreen('survey');
}

// Возврат к предыдущему вопросу: восстанавливаем точный снимок (порядок, шаг,
// ответы) и въезжаем в кадр с противоположной стороны. Прежние ответы и выбор
// сохраняются — состояние не сбрасывается.
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
  // Обратный свайп (опрос → лендинг), если уходим именно из опроса; из остальных
  // экранов — обычное переключение, чтобы не навязывать движение не по контексту.
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
  // Мгновенно перерисовываем текущую строку цитат на новом языке.
  if (state.quoteList && state.quoteList.length) {
    showQuote(game.quoteIndex);
  }
  // Перезапускаем витрину, чтобы имя текущего вайба сразу встало на новом языке.
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

// ---------------------------------------------------------------------------
// Каталог атмосфер на домашнем экране. Список строится из ТЕХ ЖЕ данных, что
// и подбор вайба (vibeThemes), поэтому имена, id и порядок всегда совпадают с
// источником: никаких придуманных вайбов и жёстко прописанных названий.
// ---------------------------------------------------------------------------
const vibeList = document.getElementById('vibe-list');
const exploreVibesBtn = document.getElementById('explore-vibes-btn');
// Переключатель языка — элемент, общий для всего приложения, но видимый
// только на первом экране (управляется через существующий data-active-screen).
const languageSwitcher = document.querySelector('.language-switcher');
const languageOptions = document.getElementById('language-options');
const languageToggle = document.getElementById('language-toggle');

// Закрывает раскрытый список языков — вызывается при уходе с главной.
function closeLanguageMenu() {
  if (!languageOptions || !languageToggle) return;
  languageOptions.hidden = true;
  languageToggle.setAttribute('aria-expanded', 'false');
}

let catalogOpenTimer = null;

// Одна карточка вайба. Акцент берём из общей карты VIBE_CARD_ACCENTS, поэтому
// все 14 карточек окрашены так же, как свечение витрины на первом экране.
// Один пункт каталога — это почти чистая типографика: только название вайба,
// набранное прямо на фоне. Ни карточек, ни картинок, ни рамок, ни иконок.
// Русский заголовок из данных — источник локализации (см. js/i18n/index.js),
// поэтому перевод ставится наблюдателем i18n без дублирования словаря.
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

// Список каталога: все 14 вайбов ровно по одному разу, в исходном порядке
// данных. Раскладку (число колонок) задаёт CSS — один markup для мобильных и
// десктопа, без отдельных реализаций.
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

// Плавная прокрутка к каталогу. Прокручивается ближайший контейнер
// (#home-screen), сам #start-btn и опрос не трогаются; hash не меняется.
function scrollToCatalog() {
  const target = document.getElementById('vibe-catalog');
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

// Открытие вайба с карточки: используем существующую машинерию экранов
// (renderVibe + showScreen + #vibe-transition). Короткий кинематографический
// фейд, без 4-секундной последовательности «создания» и без новых маршрутов.
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

// Единая проверка reduced-motion (учитывает override ?motion=on|off).
function reducedMotionPref() {
  // Единая точка проверки с учётом явного override (?motion=on|off).
  const forced = document.documentElement.dataset.motion;
  if (forced === 'force') return false;
  if (forced === 'off') return true;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// Цветовой отклик космического фона на вайб. Имя вайба в каталоге плавно
// подкрашивает фон в его цвет (низкая luminансность, CSS-переход). Слой
// .home-tint лежит ПОД частицами (z-index:0 против z-index:1 у .sky-canvas),
// поэтому звёзды и частицы не перекрашиваются и их система не меняется.
//
// Делегирование: по одному слушателю на список вместо 14 обработчиков.
//   • Мышь/перо — как и прежде: наведение (pointerover) красит, уход (pointerleave)
//     и потеря фокуса окном снимают оттенок. Переход между именами НЕ отпускает
//     список, поэтому фон перетекает из цвета в цвет без вспышки чёрного.
//   • Тач (палец) — нажатие и УДЕРЖАНИЕ включает тот же оттенок: на телефонах
//     hover нет, поэтому единственный надёжный вход — долгое касание. Короткий
//     тап остаётся обычной навигацией по вайбу (цвет не меняется).
// Один набор Pointer Events обслуживает и мышь, и перо, и палец — без дублирующих
// touch-обработчиков. Слушатели пассивны: обычные тапы и прокрутка не блокируются.
// В reduced-motion отклик отключён (уважение системной настройки).
// ---------------------------------------------------------------------------
const homeTint = document.querySelector('.home-tint');

function applyVibeTint(key) {
  if (!homeTint || reducedMotionPref()) return;
  const accent = VIBE_CARD_ACCENTS[key];
  if (!accent) return;
  // Прозрачность держим низкой: это намёк на цвет, а не заливка.
  homeTint.style.setProperty('--vibe-tint', hexToRgba(accent, 0.16));
}

function clearVibeTint() {
  if (homeTint) homeTint.style.removeProperty('--vibe-tint');
}

// Сколько держать палец, прежде чем включится оттенок. Порог намеренно чуть
// выше мгновенного тапа: обычное касание не должно менять цвет фона.
const VIBE_HOLD_MS = 420;
// Допустимый сдвиг пальца: большее смещение — это уже прокрутка/жест, а не
// удержание, поэтому удержание отменяем (страница при этом скроллится штатно).
const VIBE_HOLD_SLOP = 12;

function initVibeHover() {
  if (!vibeList) return;

  // --- Мышь и перо: прежнее наведение, поведение не изменено. ---
  vibeList.addEventListener('pointerover', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const item = event.target.closest('.vibe-link');
    if (item) applyVibeTint(item.dataset.vibe);
  }, { passive: true });
  // Уход за пределы списка (или потеря фокуса окном) возвращает чёрный фон.
  vibeList.addEventListener('pointerleave', clearVibeTint, { passive: true });

  // --- Палец: нажатие и удержание. ---
  let holdTimer = null;
  let holdStart = null; // { id, x, y } — точка касания для контроля сдвига
  let holdActive = false;

  const cancelHold = () => {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
    holdStart = null;
    holdActive = false;
  };

  // Отпускание/отмена/уход: гарантированно снимаем таймер и гасим оттенок,
  // чтобы состояние не «залипло» ни при обычном тапе, ни при жесте, ни при уходе.
  const releaseHold = () => {
    cancelHold();
    clearVibeTint();
  };

  vibeList.addEventListener('pointerdown', (event) => {
    // Мышь и перо обрабатывает ветка наведения выше.
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') return;
    const item = event.target.closest('.vibe-link');
    if (!item) return;
    holdStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      // holdStart мог быть сброшен (сдвиг/отпускание) — тогда просто выходим.
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

  // Пока палец удерживается, подавляем системный контекстный тап (Android/Safari),
  // иначе длинный тап открывал бы меню вместо смены цвета. Вне удержания обычное
  // поведение (в т.ч. контекстное меню) сохраняется.
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

// Порядок важен: сначала локализация (переводит статические тексты и запускает
// наблюдатель за динамическими узлами), затем построение UI.
initI18n('ru');
// Каталог строим после i18n: наблюдатель перевода уже активен и переведёт
// названия карточек сразу при их добавлении в DOM.
renderVibeCatalog();
initGlassTilt();
renderQuestion();
showScreen('home');
handleHashRoute();

// Включаем JS-зависимые эффекты только теперь (после сборки UI и определения
// стартового экрана) — без мигания и лишней работы на загрузке.
document.documentElement.classList.add('vf-js');
initSky();
initVibeHover();

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
