// Вопросы опроса и варианты ответов.
//
// Русские text/label здесь используются и как ключи локализации
// (см. js/i18n/index.js), поэтому формулировки должны совпадать с ключами в
// переводческом словаре. Тексты и ярлыки НЕ меняются.
//
// МОДЕЛЬ ВЕСОВ (Phase 5). У каждого варианта есть vibeWeights — вклад этого
// ответа в каждый из 14 вайбов по шкале 0..3. Ключи — стабильные id вайбов
// (см. js/data/themes.js), а не переведённый текст, поэтому локализация весов
// не касается. Один ответ может поддерживать несколько вайбов с разной силой.
// Правила подсчёта вынесены в js/data/scoring.js и не зависят от рендера.
//
// Поле `id` вопроса — стабильный идентификатор: он служит ключом для карты
// ответов в состоянии приложения и для адаптивного выбора следующего вопроса.

export const questions = [
  {
    id: 'mood',
    text: 'Какое у тебя настроение прямо сейчас?',
    options: [
      { label: 'Спокойно', vibeWeights: { cosmos: 3, zen: 2, forest: 2, nature: 1, melancholic: 1, cozy: 1 } },
      { label: 'Тревожно', vibeWeights: { melancholic: 2, mysterious: 2, cosmos: 1, night: 1 } },
      { label: 'Энергично', vibeWeights: { solar: 3, chaotic: 2, neon: 2, happy: 1 } },
      { label: 'Хочу отдохнуть', vibeWeights: { forest: 3, cozy: 3, nature: 2, zen: 2, cosmos: 2 } },
    ],
  },
  {
    id: 'energy',
    text: 'Какая энергия ближе к тебе?',
    options: [
      { label: 'Лёгкая и мягкая', vibeWeights: { zen: 3, cosmos: 2, forest: 2, cozy: 2, nature: 1 } },
      { label: 'Жаркая и активная', vibeWeights: { solar: 3, chaotic: 2, happy: 1, neon: 1 } },
      { label: 'Ночные импульсы', vibeWeights: { neon: 3, night: 3, chaotic: 1, mysterious: 1, retro: 1 } },
      { label: 'Хочется перезагрузки', vibeWeights: { forest: 3, nature: 2, zen: 2, cosmos: 2, cozy: 1 } },
    ],
  },
  {
    id: 'action',
    text: 'Что хочется сделать прямо сейчас?',
    options: [
      { label: 'Побыть в тишине', vibeWeights: { cosmos: 3, zen: 3, forest: 2, nature: 1, melancholic: 1 } },
      { label: 'Создать волну', vibeWeights: { creative: 3, neon: 2, chaotic: 2, happy: 1 } },
      { label: 'Погрузиться в ритм', vibeWeights: { neon: 3, night: 2, retro: 1, chaotic: 1 } },
      { label: 'Сделать паузу и восстановиться', vibeWeights: { forest: 3, cozy: 3, nature: 2, zen: 2 } },
    ],
  },
  {
    id: 'social',
    text: 'Какой тип общения тебя сейчас тянет?',
    options: [
      { label: 'Тихий и уютный', vibeWeights: { cozy: 3, forest: 2, zen: 1, melancholic: 1, cosmos: 1 } },
      { label: 'Весёлый и живой', vibeWeights: { happy: 3, solar: 3, chaotic: 1 } },
      { label: 'Креативный и яркий', vibeWeights: { creative: 3, retro: 1, neon: 1, happy: 1 } },
      { label: 'В одиночестве', vibeWeights: { cosmos: 2, melancholic: 2, night: 2, mysterious: 1, forest: 1 } },
    ],
  },
  {
    id: 'rhythm',
    text: 'Что лучше всего подходит под твой ритм?',
    options: [
      { label: 'Медленные мысли', vibeWeights: { cosmos: 3, zen: 2, melancholic: 2, forest: 1 } },
      { label: 'Движение и свет', vibeWeights: { solar: 3, happy: 2, chaotic: 1, neon: 1 } },
      { label: 'Неоновая энергия', vibeWeights: { neon: 3, night: 2, retro: 2, chaotic: 1 } },
      { label: 'Тихая перезагрузка', vibeWeights: { forest: 3, cozy: 2, nature: 2, zen: 1 } },
    ],
  },
  {
    id: 'place',
    text: 'В каком месте мысли становятся твоими?',
    options: [
      { label: 'На пустой ночной улице', vibeWeights: { night: 3, neon: 2, melancholic: 1, mysterious: 1, cosmos: 1 } },
      { label: 'У окна, пока идёт дождь', vibeWeights: { melancholic: 3, cozy: 2, night: 1, zen: 1 } },
      { label: 'В мастерской с музыкой и красками', vibeWeights: { creative: 3, retro: 1, happy: 1, chaotic: 1 } },
      { label: 'На солнечной тропе среди деревьев', vibeWeights: { nature: 3, forest: 3, solar: 2 } },
    ],
  },
  {
    id: 'tempo',
    text: 'Какой темп сегодня ощущается правильным?',
    options: [
      { label: 'Медленно, как ровное дыхание', vibeWeights: { zen: 3, cosmos: 2, melancholic: 1, forest: 1 } },
      { label: 'Спокойно, но с искрой любопытства', vibeWeights: { mysterious: 2, creative: 2, cosmos: 1, zen: 1, happy: 1 } },
      { label: 'Быстро и без плана', vibeWeights: { chaotic: 3, neon: 2, solar: 2 } },
      { label: 'Игриво, чтобы хотелось улыбаться', vibeWeights: { happy: 3, retro: 2, solar: 1 } },
    ],
  },
  {
    id: 'company',
    text: 'Кого бы ты позвал разделить этот момент?',
    options: [
      { label: 'Никого — хочется личного пространства', vibeWeights: { cosmos: 3, night: 2, forest: 2, melancholic: 1, zen: 1 } },
      { label: 'Одного близкого человека', vibeWeights: { cozy: 3, forest: 2, melancholic: 1 } },
      { label: 'Всех, кто готов на спонтанность', vibeWeights: { chaotic: 3, happy: 3, solar: 2, neon: 1 } },
      { label: 'Себя — на прогулку без маршрута', vibeWeights: { nature: 3, mysterious: 2, night: 2, zen: 1 } },
    ],
  },
  {
    id: 'scene',
    text: 'Какой кадр хочется оставить перед глазами?',
    options: [
      { label: 'Неон в отражении мокрого асфальта', vibeWeights: { neon: 3, night: 3, melancholic: 2, retro: 1 } },
      { label: 'Туманное утро и мягкие оттенки', vibeWeights: { melancholic: 2, zen: 2, nature: 2, forest: 1, mysterious: 1 } },
      { label: 'Пиксельный закат и яркие контуры', vibeWeights: { retro: 3, solar: 2, neon: 1, happy: 1 } },
      { label: 'Тёплая комната в свете лампы', vibeWeights: { cozy: 3, forest: 2, melancholic: 1 } },
    ],
  },
  {
    id: 'activity',
    text: 'Что было бы приятнее сделать прямо сейчас?',
    options: [
      { label: 'Исследовать тайное место', vibeWeights: { mysterious: 3, night: 2, neon: 1, creative: 1 } },
      { label: 'Что-нибудь нарисовать или придумать', vibeWeights: { creative: 3, happy: 1, zen: 1, mysterious: 1 } },
      { label: 'Сыграть короткий аркадный раунд', vibeWeights: { retro: 3, neon: 2, chaotic: 2, happy: 1 } },
      { label: 'Устроиться поудобнее и ничего не спешить', vibeWeights: { cozy: 3, zen: 3, forest: 1, cosmos: 1 } },
    ],
  },
];
