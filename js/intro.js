// Vibe Finder: кинематографический вход (cinematic entrance).
//
// Полностью изолированный модуль: он ничего не знает о роутинге, экранах,
// данных, i18n и звуке приложения. Его единственная задача — выставить
// состояние в атрибут data-intro на <html> (самим видом управляют стили в
// css/style.css) и провести затемняющий слой #cinematic-intro к полному
// раскрытию. Взаимодействие никогда не блокируется: слой всегда
// pointer-events: none, а любое действие пользователя мгновенно завершает
// декоративное раскрытие.
//
// Состояния data-intro:
//   "full"  — полный кинематографический вход (первый визит, ~2 c);
//   "short" — укороченный вход (повторные визиты, ~0.4 c);
//   "none"  — вход выключен (reduced-motion, прямая ссылка на результат);
//   "done"  — финальное статичное состояние (без повторов при навигации).

// Версионированный ключ: при изменении формата входа старую запись игнорируем.
const STORAGE_KEY = 'vibefinder:entrance:v1';

// Тайминги обязаны совпадать с CSS-переменными --intro-* в css/style.css.
const FULL_HOLD_MS = 850; // сколько держим чистое затемнение в полном входе
const FULL_FADE_MS = 1150; // длительность снятия затемнения (переходом)
const SHORT_HOLD_MS = 40;
const SHORT_FADE_MS = 320;
// Запас, после которого состояние фиксируется, даже если не пришло событие
// перехода: страница гарантированно остаётся видимой и интерактивной.
const SETTLE_MARGIN_MS = 600;
// Ускоренное раскрытие, если пользователь взаимодействует во время затемнения.
const SKIP_FADE_MS = 240;

const root = document.documentElement;

function readVisited() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (error) {
    // Приватный режим или запрет storage: изящно играем полный вход.
    return false;
  }
}

function markVisited() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch (error) {
    // Storage недоступно — вход просто останется полным и при следующем визите.
  }
}

function prefersReducedMotion() {
  // Явный override (?motion=on → data-motion="force"): в этом режиме
  // анимации включены даже если ОС просит reduce. Обратный случай
  // (?motion=off → data-motion="off") тоже учитываем.
  const forced = root.dataset.motion;
  if (forced === 'force') return false;
  if (forced === 'off') return true;
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Вход уместен только на первом экране. Прямые ссылки на результат
// (#/share/<slug>) открываются сразу: пользователь пришёл за конкретным вайбом.
function isHomeRoute() {
  return !/^#\/share\/[a-z0-9-]+\/?$/i.test(window.location.hash);
}

// Ручной override через ?intro=full|short|none (без записи в storage) —
// удобно для проверки всех состояний без очистки localStorage.
function forcedMode() {
  try {
    const value = new URLSearchParams(window.location.search).get('intro');
    if (value === 'full' || value === 'short' || value === 'none') return value;
  } catch (error) {
    // URLSearchParams недоступен — override игнорируем.
  }
  return null;
}

export function initCinematicIntro() {
  const veil = document.getElementById('cinematic-intro');
  if (!veil) return;

  // Жёсткое выключение автором прямо в разметке: <html data-intro="none">.
  if (root.dataset.intro === 'none') return;

  // Явный ?intro=full|short|none — ручной override для проверки и демонстрации:
  // он перебивает и автоопределение, и reduced-motion.
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
  // Первый визит отмечаем сразу: если вкладку закроют посреди входа, следующий
  // визит всё равно будет укороченным.
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

  // Фиксируем финальное состояние: слой убираем из потока отрисовки, слушатели
  // снимаем, снимаем возможность повторного проигрывания при навигации.
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

  // Плавно снимаем затемнение (переходом, а не keyframe) и страхуем завершение
  // таймером: даже сбой события перехода оставит страницу полностью видимой.
  const reveal = () => {
    if (finished || veil.classList.contains('is-revealed')) return;
    veil.classList.add('is-revealed');
    settleTimer = window.setTimeout(settle, activeFade + SETTLE_MARGIN_MS);
  };

  function onVisibilityChange() {
    // Во фоне держать декоративную анимацию незачем — сразу фиксируем финал.
    if (document.hidden) settle();
  }

  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push({ target, type, handler, options });
  };

  // Любое взаимодействие завершает декоративный вход немедленно.
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
  // Уход в фон или в bfcache: декоративную анимацию не держим.
  listen(document, 'visibilitychange', onVisibilityChange);
  listen(window, 'pagehide', settle);

  const holdMs = mode === 'full' ? FULL_HOLD_MS : SHORT_HOLD_MS;
  if (holdMs > 0) {
    holdTimer = window.setTimeout(reveal, holdMs);
  } else {
    reveal();
  }
}
