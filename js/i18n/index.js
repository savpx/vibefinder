
const localeCodes = ['ru', 'en'];
const localeMetadata = {
  ru: { htmlLang: 'ru' },
  en: { htmlLang: 'en' },
};

/*
 * Only strings that are actually present in the UI live here. Keys are the
 * exact Russian source text; translation is keyed by the trimmed value so
 * surrounding whitespace is preserved automatically.
 */
const translationCatalog = {
  "Vibe Finder": "Vibe Finder",
  "Найди свою": "Find your own",
  "атмосферу": "atmosphere",
  "14 вайбов. 14 разных миров.": "14 vibes. 14 different worlds.",
  "Каталог": "Catalog",
  "Поиск": "Search",
  "Каталог тем": "Theme catalog",

  "Профиль": "Profile",
  "Язык": "Language",
  "English": "English",
  "Russian": "Russian",

  "Вернуться к предыдущему вопросу": "Back to the previous question",
  "Прогресс опроса": "Quiz progress",
  "Какое у тебя настроение прямо сейчас?": "How are you feeling right now?",

  "Спокойно": "Calm",
  "Тревожно": "Anxious",
  "Энергично": "Energetic",
  "Хочу отдохнуть": "I need to rest",
  "Какая энергия ближе к тебе?": "Which kind of energy feels closest to you?",
  "Лёгкая и мягкая": "Light and gentle",
  "Жаркая и активная": "Warm and lively",
  "Ночные импульсы": "Late-night sparks",
  "Хочется перезагрузки": "Time to recharge",
  "Что хочется сделать прямо сейчас?": "What would you like to do right now?",
  "Побыть в тишине": "Spend some time in quiet",
  "Создать волну": "Make a ripple",
  "Погрузиться в ритм": "Sink into a rhythm",
  "Сделать паузу и восстановиться": "Pause and recharge",
  "Какой тип общения тебя сейчас тянет?": "What kind of company feels right right now?",
  "Тихий и уютный": "Quiet and cozy",
  "Весёлый и живой": "Lively and cheerful",
  "Креативный и яркий": "Creative and colorful",
  "В одиночестве": "On my own",
  "Что лучше всего подходит под твой ритм?": "What best matches your pace?",
  "Медленные мысли": "Slow, unhurried thoughts",
  "Движение и свет": "Movement and light",
  "Неоновая энергия": "Neon energy",
  "Тихая перезагрузка": "A quiet reset",
  "В каком месте мысли становятся твоими?": "Where do your thoughts feel most like your own?",
  "На пустой ночной улице": "On a quiet street at night",
  "У окна, пока идёт дождь": "By a window while it rains",
  "В мастерской с музыкой и красками": "In a studio with music and paint",
  "На солнечной тропе среди деревьев": "On a sunlit path among trees",
  "Какой темп сегодня ощущается правильным?": "What pace feels right today?",
  "Медленно, как ровное дыхание": "Slow, like an even breath",
  "Спокойно, но с искрой любопытства": "Easygoing, with a spark of curiosity",
  "Быстро и без плана": "Fast and spontaneous",
  "Игриво, чтобы хотелось улыбаться": "Playful enough to make me smile",
  "Кого бы ты позвал разделить этот момент?": "Who would you invite to share this moment?",
  "Никого — хочется личного пространства": "No one — I want some space",
  "Одного близкого человека": "Someone close to me",
  "Всех, кто готов на спонтанность": "Anyone up for something spontaneous",
  "Себя — на прогулку без маршрута": "Myself, for a walk with no destination",
  "Какой кадр хочется оставить перед глазами?": "What scene would you like to keep in mind?",
  "Неон в отражении мокрого асфальта": "Neon reflected on wet pavement",
  "Туманное утро и мягкие оттенки": "A misty morning in soft colors",
  "Пиксельный закат и яркие контуры": "A pixel sunset with bright outlines",
  "Тёплая комната в свете лампы": "A warm room lit by a lamp",
  "Что было бы приятнее сделать прямо сейчас?": "What would feel nicest to do right now?",
  "Исследовать тайное место": "Explore a hidden place",
  "Что-нибудь нарисовать или придумать": "Draw or imagine something",
  "Сыграть короткий аркадный раунд": "Play a quick arcade round",
  "Устроиться поудобнее и ничего не спешить": "Get comfortable and take your time",

  "Создание твоего вайба": "Creating your vibe",
  "Находим твой вайб...": "Finding your vibe…",
  "Меню результата": "Result menu",
  "Открыть меню": "Open menu",
  "Вернуться": "Return",
  "Поделиться моим вайбом": "Share my vibe",
  "Эта атмосфера находится в разработке": "This atmosphere is currently under development",

  "МОЙ ВАЙБ СЕГОДНЯ": "MY VIBE TODAY",
  "Узнай, какой вайб у тебя сегодня!": "Discover your vibe today!",
  "Поделиться": "Share",
  "Скопировано!": "Copied!",
  "Не удалось поделиться. Попробуй ещё раз.": "Unable to share right now. Please try again.",
  "Неизвестный вайб": "Unknown vibe",
  "ТВОЙ ВАЙБ": "YOUR VIBE",
  "Тетрис": "Tetris",
  "Заново": "Play again",

  "Затерянный в космосе": "Lost in Space",
  "Плавное тёмно-фиолетовое пространство, мягкие звёзды и медитативная глубина. Здесь можно замедлиться и собраться с мыслями.": "A deep, dusky space with gentle stars and room to slow down and gather your thoughts.",
  "Пространство тишины, мягкого свечения и вдохновляющего покоя.": "A space of quiet, soft glow, and inspiring calm.",
  "Заряженный": "Charged Up",
  "Тёплые жёлтые лучи, бодрящее сияние и очень приятная энергия. Это вайб для подъёма, мотивации и лёгкого драйва.": "Warm rays, uplifting light, and an easy boost of energy for a brighter, more motivated moment.",
  "Неоновый": "Neon",
  "Городские огни, чёрный фон и тикание ритма. Здесь можно включить характер и почувствовать ночную магию.": "City lights, a midnight rhythm, and a little nocturnal magic to bring out your bold side.",
  "Уединенный": "Secluded",
  "Тёплый зелёный воздух, мягкий свет и спокойные ритмы природы. Здесь можно переключиться на уют, тишину и восстановление.": "Soft light, fresh green air, and nature’s quiet rhythm — a gentle place to pause and recharge.",
  "Ночной": "Night",
  "Тихий город, свет в окнах и неоновые вывески. Иди в собственном ритме и замечай маленькие огни вокруг.": "A quiet city, glowing windows, and neon signs. Explore at your own pace and notice the little lights around you.",
  "Тихий город засыпает, оставляя тебя наедине с мыслями.": "The quiet city falls asleep, leaving you alone with your thoughts.",
  "Свет неоновых вывесок отражается в каплях на стекле.": "The light of neon signs reflects in the drops on the glass.",
  "В собственном ритме замечай маленькие огни вокруг.": "In your own rhythm, notice the small lights around you.",
  "Ночь смывает дневной шум, открывая бесконечность звезд.": "Night washes away the day's noise, revealing the infinity of stars.",
  "Меланхоличный": "Melancholic",
  "Спокойные капли на стекле, тихие мысли и простор для чувств без спешки и оценок.": "Raindrops on glass, quiet thoughts, and space to feel without rushing or judging yourself.",
  "Дзен": "Zen",
  "Чистые линии, водные переливы и медленный ритм, в котором можно просто присутствовать.": "Clean lines, flowing water, and a slow rhythm that lets you simply be here.",
  "Хаотичный": "Chaotic",
  "Яркие импульсы, неожиданные повороты и энергия, которой нужен простор для движения.": "Bright sparks, unexpected turns, and energy that needs room to move.",
  "Позитивный": "Positive",
  "Лёгкое настроение, яркие цвета и повод замечать хорошее в самых простых моментах.": "A light mood, bright colors, and a reminder to notice the good in everyday moments.",
  "Загадочный": "Mysterious",
  "Полутени, загадки и любопытство, которое ведёт к ответам шаг за шагом.": "Soft shadows, small mysteries, and curiosity that reveals the way one step at a time.",
  "Вдохновленный": "Inspired",
  "Цвета, формы и идеи встречаются в маленьких деталях — собери пейзаж под своё настроение.": "Colors, shapes, and ideas meet in the details. Paint a landscape that matches your mood.",
  "Природный": "Natural",
  "Зелёные тропы, движение листьев и живая тишина, в которой легко восстановиться.": "Green paths, drifting leaves, and a living quiet that makes it easy to recharge.",
  "Ностальгический": "Nostalgic",
  "Пиксельные огни, аркадные цвета и короткое путешествие в знакомый игровой ритм.": "Pixel lights, arcade colors, and a quick trip into a familiar game rhythm.",
  "Ламповый": "Cozy Vibes",
  "Тёплый свет, мягкие вещи и пространство, которое можно обустроить именно под себя.": "Warm light, soft textures, and a space you can make your own.",
};

let currentLanguage = 'ru';
const textSources = new WeakMap();
const attributeSources = new WeakMap();
let languageToggle = null;
let languageOptions = null;

const LANGUAGE_STORAGE_KEY = 'vibefinder:lang';

function readStoredLanguage() {
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return localeCodes.includes(value) ? value : null;
  } catch (error) {
    return null;
  }
}

function storeLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) { }
}

export function translateText(source) {
  const text = String(source);
  if (currentLanguage === 'ru') return text;
  const key = text.trim();
  const exact = translationCatalog[key];
  if (exact === undefined) return text;
  return preserveWhitespace(text, exact);
}

function preserveWhitespace(source, translated) {
  const leading = source.match(/^\s*/)?.[0] || '';
  const trailing = source.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
}

function isExcluded(node) {
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  return !!(element && typeof element.closest === 'function' && element.closest('[data-no-i18n]'));
}

function localizeTextNode(node) {
  if (isExcluded(node)) return;
  if (!textSources.has(node)) textSources.set(node, node.nodeValue || '');
  const source = textSources.get(node);
  const translated = translateText(source);
  if (node.nodeValue !== translated) node.nodeValue = translated;
}

function localizeAttribute(element, name) {
  if (!attributeSources.has(element)) attributeSources.set(element, new Map());
  const sources = attributeSources.get(element);
  if (!sources.has(name)) sources.set(name, element.getAttribute(name) || '');
  const translated = translateText(sources.get(name));
  if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
}

const TRANSLATED_ATTRIBUTES = ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'];

function translateAttributes(element) {
  TRANSLATED_ATTRIBUTES.forEach((name) => {
    if (element.hasAttribute(name)) localizeAttribute(element, name);
  });
}

function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return;

  if (root instanceof Element) translateAttributes(root);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      localizeTextNode(node);
    } else {
      translateAttributes(node);
    }
    node = walker.nextNode();
  }
}

export function setLanguage(language) {
  if (!localeCodes.includes(language)) return;
  currentLanguage = language;
  document.documentElement.lang = localeMetadata[language].htmlLang;
  document.querySelectorAll('[data-language]').forEach((option) => {
    option.setAttribute('aria-pressed', String(option.dataset.language === language));
  });
  translateTree(document.body);
  document.title = translateText('Vibe Finder');
  storeLanguage(language);
  window.dispatchEvent(new CustomEvent('vibe-language-change', { detail: { language } }));
}

export function closeLanguageOptions(returnFocus = false) {
  if (!languageOptions || !languageToggle) return;
  languageOptions.hidden = true;
  languageToggle.setAttribute('aria-expanded', 'false');
  if (returnFocus) languageToggle.focus();
}

export function initI18n(defaultLanguage = 'ru') {
  languageToggle = document.getElementById('language-toggle');
  languageOptions = document.getElementById('language-options');

  if (!languageToggle || !languageOptions) {
    // setLanguage() already walks the whole document, so translating it here
    // as well would double the work on every page load.
    setLanguage(readStoredLanguage() || defaultLanguage);
    document.documentElement.classList.add('i18n-ready');
    return;
  }

  languageToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = languageOptions.hidden;
    languageOptions.hidden = !open;
    languageToggle.setAttribute('aria-expanded', String(open));
    if (open) languageOptions.querySelector('button[aria-pressed="true"]')?.focus();
  });

  languageOptions.addEventListener('click', (event) => {
    const option = event.target.closest('[data-language]');
    if (!option) return;
    event.stopPropagation();
    setLanguage(option.dataset.language);
    closeLanguageOptions(true);
  });

  document.addEventListener('click', (event) => {
    if (languageOptions.hidden) return;
    if (event.target.closest('#language-options') || event.target.closest('#language-toggle')) return;
    closeLanguageOptions();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || languageOptions.hidden) return;
    event.preventDefault();
    closeLanguageOptions(true);
  });

  languageOptions.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    closeLanguageOptions();
  });

  setLanguage(readStoredLanguage() || defaultLanguage);

  const translationObserver = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === 'characterData') {
        localizeTextNode(record.target);
        return;
      }
      if (record.type === 'attributes') {
        localizeAttribute(record.target, record.attributeName);
        return;
      }
      record.addedNodes.forEach((node) => translateTree(node));
    });
  });

  translationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: TRANSLATED_ATTRIBUTES,
    characterData: true,
    childList: true,
    subtree: true,
  });

  document.documentElement.classList.add('i18n-ready');
}
