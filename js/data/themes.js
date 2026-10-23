// Описания вайбов, CSS-палитры и сигнатуры для подбора вайба.
// Алгоритм подбора вайба опирается на поле signature, менять его нельзя.

export const vibeThemes = {
  cosmos: {
    title: 'Затерянный в космосе',
    description: 'Плавное тёмно-фиолетовое пространство, мягкие звёзды и медитативная глубина. Здесь можно замедлиться и собраться с мыслями.',
    palette: 'theme-cosmos',
    signature: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  solar: {
    title: 'Заряженный',
    description: 'Тёплые жёлтые лучи, бодрящее сияние и очень приятная энергия. Это вайб для подъёма, мотивации и лёгкого драйва.',
    palette: 'theme-solar',
    signature: [2, 1, 1, 1, 1, 2, 2, 2, 2, 2],
  },
  neon: {
    title: 'Неоновый',
    description: 'Городские огни, чёрный фон и тикание ритма. Здесь можно включить характер и почувствовать ночную магию.',
    palette: 'theme-neon',
    signature: [1, 2, 2, 2, 2, 0, 2, 2, 0, 2],
  },
  forest: {
    title: 'Уединенный',
    description: 'Тёплый зелёный воздух, мягкий свет и спокойные ритмы природы. Здесь можно переключиться на уют, тишину и восстановление.',
    palette: 'theme-forest',
    signature: [3, 0, 0, 0, 3, 3, 0, 3, 3, 3],
  },
  night: {
    title: 'Ночной',
    description: 'Тихий город, свет в окнах и неоновые вывески. Иди в собственном ритме и замечай маленькие огни вокруг.',
    palette: 'theme-night',
    signature: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
    signature: [1, 1, 0, 1, 3, 1, 1, 0, 1, 3],
  },
  zen: {
    title: 'Дзен',
    description: 'Чистые линии, водные переливы и медленный ритм, в котором можно просто присутствовать.',
    palette: 'theme-zen',
    signature: [3, 0, 3, 1, 3, 3, 0, 3, 1, 3],
  },
  chaotic: {
    title: 'Хаотичный',
    description: 'Яркие импульсы, неожиданные повороты и энергия, которой нужен простор для движения.',
    palette: 'theme-chaotic',
    signature: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  },
  happy: {
    title: 'Позитивный',
    description: 'Лёгкое настроение, яркие цвета и повод замечать хорошее в самых простых моментах.',
    palette: 'theme-happy',
    signature: [2, 1, 1, 1, 1, 3, 3, 2, 2, 2],
  },
  mysterious: {
    title: 'Загадочный',
    description: 'Полутени, загадки и любопытство, которое ведёт к ответам шаг за шагом.',
    palette: 'theme-mysterious',
    signature: [0, 2, 0, 3, 0, 0, 1, 0, 0, 0],
  },
  creative: {
    title: 'Вдохновленный',
    description: 'Цвета, формы и идеи встречаются в маленьких деталях — собери пейзаж под своё настроение.',
    palette: 'theme-creative',
    signature: [2, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  },
  nature: {
    title: 'Природный',
    description: 'Зелёные тропы, движение листьев и живая тишина, в которой легко восстановиться.',
    palette: 'theme-nature',
    signature: [3, 0, 3, 3, 3, 3, 0, 3, 3, 3],
  },
  retro: {
    title: 'Ностальгический',
    description: 'Пиксельные огни, аркадные цвета и короткое путешествие в знакомый игровой ритм.',
    palette: 'theme-retro',
    signature: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3],
  },
  cozy: {
    title: 'Ламповый',
    description: 'Тёплый свет, мягкие вещи и пространство, которое можно обустроить именно под себя.',
    palette: 'theme-cozy',
    signature: [3, 0, 1, 3, 3, 3, 3, 1, 3, 3],
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
