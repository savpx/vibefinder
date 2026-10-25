// Описания вайбов: заголовок, описание, CSS-палитра и (для «Ночного») цитаты.
// Русские title/description используются и как ключи локализации (см.
// js/i18n/index.js), поэтому формулировки должны совпадать со словарём.
// Подбор вайба идёт по взвешенной модели (js/data/scoring.js) на основе
// vibeWeights из js/data/questions.js — прежние поля signature удалены как
// мёртвые данные (их никто не читал).

export const vibeThemes = {
  cosmos: {
    title: 'Затерянный в космосе',
    description: 'Плавное тёмно-фиолетовое пространство, мягкие звёзды и медитативная глубина. Здесь можно замедлиться и собраться с мыслями.',
    palette: 'theme-cosmos',
  },
  solar: {
    title: 'Заряженный',
    description: 'Тёплые жёлтые лучи, бодрящее сияние и очень приятная энергия. Это вайб для подъёма, мотивации и лёгкого драйва.',
    palette: 'theme-solar',
  },
  neon: {
    title: 'Неоновый',
    description: 'Городские огни, чёрный фон и тикание ритма. Здесь можно включить характер и почувствовать ночную магию.',
    palette: 'theme-neon',
  },
  forest: {
    title: 'Уединенный',
    description: 'Тёплый зелёный воздух, мягкий свет и спокойные ритмы природы. Здесь можно переключиться на уют, тишину и восстановление.',
    palette: 'theme-forest',
  },
  night: {
    title: 'Ночной',
    description: 'Тихий город, свет в окнах и неоновые вывески. Иди в собственном ритме и замечай маленькие огни вокруг.',
    palette: 'theme-night',
    // Четыре однострочные цитаты, показываются только на экране вайба «Ночной».
    quotes: [
      'Тихий город засыпает, оставляя тебя наедине с мыслями.',
      'Свет неоновых вывесок отражается в каплях на стекле.',
      'В собственном ритме замечай маленькие огни вокруг.',
      'Ночь смывает дневной шум, открывая бесконечность звезд.',
    ],
  },
  melancholic: {
    title: 'Меланхоличный',
    description: 'Спокойные капли на стекле, тихие мысли и простор для чувств без спешки и оценок.',
    palette: 'theme-melancholic',
  },
  zen: {
    title: 'Дзен',
    description: 'Чистые линии, водные переливы и медленный ритм, в котором можно просто присутствовать.',
    palette: 'theme-zen',
  },
  chaotic: {
    title: 'Хаотичный',
    description: 'Яркие импульсы, неожиданные повороты и энергия, которой нужен простор для движения.',
    palette: 'theme-chaotic',
  },
  happy: {
    title: 'Позитивный',
    description: 'Лёгкое настроение, яркие цвета и повод замечать хорошее в самых простых моментах.',
    palette: 'theme-happy',
  },
  mysterious: {
    title: 'Загадочный',
    description: 'Полутени, загадки и любопытство, которое ведёт к ответам шаг за шагом.',
    palette: 'theme-mysterious',
  },
  creative: {
    title: 'Вдохновленный',
    description: 'Цвета, формы и идеи встречаются в маленьких деталях — собери пейзаж под своё настроение.',
    palette: 'theme-creative',
  },
  nature: {
    title: 'Природный',
    description: 'Зелёные тропы, движение листьев и живая тишина, в которой легко восстановиться.',
    palette: 'theme-nature',
  },
  retro: {
    title: 'Ностальгический',
    description: 'Пиксельные огни, аркадные цвета и короткое путешествие в знакомый игровой ритм.',
    palette: 'theme-retro',
  },
  cozy: {
    title: 'Ламповый',
    description: 'Тёплый свет, мягкие вещи и пространство, которое можно обустроить именно под себя.',
    palette: 'theme-cozy',
  },
};

// Слизги для ссылок публикации (#/share/<slug>). Используются при формировании
// и разборе hash-URL, поэтому менять существующие значения нельзя.
export const vibeShareSlugs = {
  cosmos: 'quiet-cosmos',
  solar: 'little-sunshine',
  neon: 'neon-after-dark',
  forest: 'forest-pause',
  night: 'night-walk',
  melancholic: 'rainy-reverie',
  zen: 'still-water',
  chaotic: 'bright-little-chaos',
  happy: 'sunny-joy',
  mysterious: 'secret-room',
  creative: 'creative-studio',
  nature: 'forest-wind',
  retro: 'retro-arcade',
  cozy: 'home-comfort',
};

export const vibeKeysByShareSlug = Object.fromEntries(
  Object.entries(vibeShareSlugs).map(([key, slug]) => [slug, key]),
);
