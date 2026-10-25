// Взвешенная модель подбора вайба и адаптивный выбор вопроса.
//
// Модуль намеренно НЕ знает ничего о DOM, рендере, локализации или звуке: это
// чистая логика над данными. Единственные зависимости — данные вопросов и
// список вайбов. Поэтому правила легко читать, менять и покрывать тестами, а
// рендер-компоненты просто вызывают rankVibes / selectNextQuestion.
//
// Все ключи вайбов — стабильные id из themes.js (cosmos, solar, ...), НЕ
// переведённый текст, поэтому локализация на подсчёт не влияет.

import { questions } from './questions.js';
import { vibeThemes } from './themes.js';

// Полный список вайбов. Порядок стабилен (Object.keys сохраняет порядок
// объявления) и используется только как детерминированный финальный tie-break.
export const VIBE_IDS = Object.keys(vibeThemes);

// Индекс вопроса по его стабильному id — нужен адаптивному выбору и состоянию.
export const questionIndexById = new Map(questions.map((question, index) => [question.id, index]));

// answers — объект вида { [questionId]: optionIndex }. Неотвеченные вопросы
// отсутствуют в объекте, поэтому не вносят ни положительный, ни отрицательный
// вклад. Повторный вызов с тем же объектом даёт тот же результат, а изменение
// ответа автоматически заменяет прежний вклад (мы просто читаем текущее
// значение, а не накапливаем сумму) — это снимает проблему двойного подсчёта.

// Сырые суммы весов по каждому вайбу.
function computeRawScores(answers) {
  const scores = new Map(VIBE_IDS.map((id) => [id, 0]));
  questions.forEach((question) => {
    const optionIndex = answers[question.id];
    if (optionIndex === undefined) return;
    const option = question.options[optionIndex];
    if (!option || !option.vibeWeights) return;
    Object.entries(option.vibeWeights).forEach(([vibeId, weight]) => {
      if (!scores.has(vibeId)) return;
      scores.set(vibeId, scores.get(vibeId) + weight);
    });
  });
  return scores;
}

// Максимально возможный вес вайба: для каждого вопроса берём лучший вариант
// именно для этого вайба и суммируем. Нужен для честной нормализации —
// иначе вайбы с большим числом «сильных» вариантов были бы несправедливо выше.
function computeMaxPossible() {
  const max = new Map(VIBE_IDS.map((id) => [id, 0]));
  questions.forEach((question) => {
    const perVibeMax = new Map();
    question.options.forEach((option) => {
      const weights = option.vibeWeights || {};
      Object.entries(weights).forEach(([vibeId, weight]) => {
        if (!perVibeMax.has(vibeId) || weight > perVibeMax.get(vibeId)) {
          perVibeMax.set(vibeId, weight);
        }
      });
    });
    perVibeMax.forEach((value, vibeId) => {
      if (max.has(vibeId)) max.set(vibeId, max.get(vibeId) + value);
    });
  });
  return max;
}

// Считаем один раз при загрузке модуля — данные статичны.
const VIBE_MAX_POSSIBLE = computeMaxPossible();

// Нормированная доля (0..1) — процент «уверенности» вайба, пригодный для
// сравнения между вайбами с разным потенциалом.
export function normalizedScore(vibeId, raw) {
  const max = VIBE_MAX_POSSIBLE.get(vibeId) || 0;
  return max > 0 ? raw / max : 0;
}

// Ранжирование вайбов по ответам пользователя.
//
// Порядок сортировки (все ключи детерминированы):
//   1. norm      — нормированная доля (основной критерий);
//   2. specificity — сумма квадратов вкладов: награждает «концентрированное»
//      свидетельство, а не размазанное по многим вайбам;
//   3. lastHit   — индекс последнего вопроса, подкрепившего вайб (свежесть);
//   4. id        — стабильный алфавитный tie-break.
// Такой набор НЕ всегда отдаёт победу вайбу, стоящему первым в массиве, но
// гарантирует одинаковый результат для одинакового набора ответов.
export function rankVibes(answers) {
  const scores = computeRawScores(answers);
  const specificity = new Map(VIBE_IDS.map((id) => [id, 0]));
  const lastHit = new Map(VIBE_IDS.map((id) => [id, -1]));

  questions.forEach((question, questionIndex) => {
    const optionIndex = answers[question.id];
    if (optionIndex === undefined) return;
    const option = question.options[optionIndex];
    if (!option || !option.vibeWeights) return;
    Object.entries(option.vibeWeights).forEach(([vibeId, weight]) => {
      if (!specificity.has(vibeId)) return;
      specificity.set(vibeId, specificity.get(vibeId) + weight * weight);
      if (weight > 0) lastHit.set(vibeId, questionIndex);
    });
  });

  return VIBE_IDS.map((id) => {
    const raw = scores.get(id) || 0;
    return {
      id,
      score: raw,
      norm: normalizedScore(id, raw),
      specificity: specificity.get(id) || 0,
      lastHit: lastHit.get(id) ?? -1,
    };
  }).sort((a, b) =>
    b.norm - a.norm ||
    b.specificity - a.specificity ||
    b.lastHit - a.lastHit ||
    a.id.localeCompare(b.id)
  );
}

// Насколько близкие к лидеру вайбы считаем «конкурирующими» при выборе вопроса.
const CANDIDATE_MARGIN = 0.18;

// Адаптивный выбор следующего вопроса.
//
// Идея: среди ещё не заданных вопросов предпочитаем тот, чьи варианты сильнее
// всего РАЗВОДЯТ текущих кандидатов-лидеров (высокий разброс весов между ними).
// Это уточняет результат вместо простого усиления уже лидирующего вайба.
// Чтобы сохранить связный поток, вопрос, идущий следующим по исходному порядку,
// получает поощрение (отсутствие штрафа), а прыжок далеко вперёд — штраф.
//
// Возвращает индекс вопроса в массиве questions или -1, если все уже заданы.
export function selectNextQuestion(answers, usedIds) {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds);

  // Ещё нет ответов — уважаем исходную последовательность (первый вопрос).
  const answeredCount = questions.reduce(
    (count, question) => count + (answers[question.id] !== undefined ? 1 : 0),
    0,
  );
  if (answeredCount === 0) return 0;

  const ranked = rankVibes(answers);
  const leaderNorm = ranked[0] ? ranked[0].norm : 0;
  // Конкурирующие кандидаты: близкие к лидеру. Если все по нулям — все вайбы.
  const candidateIds = leaderNorm > 0
    ? ranked.filter((vibe) => leaderNorm - vibe.norm <= CANDIDATE_MARGIN).map((vibe) => vibe.id)
    : VIBE_IDS;
  // Страховка: если «круг лидеров» схлопнулся в один вайб, берём тройку лучших.
  const candidates = candidateIds.length >= 2 ? candidateIds : ranked.slice(0, 3).map((vibe) => vibe.id);

  const available = [];
  questions.forEach((question, index) => {
    if (!used.has(question.id)) available.push({ question, index });
  });
  if (!available.length) return -1;

  // «Консервативный» ориентир — первый не заданный вопрос в исходном порядке.
  const sequentialIndex = available[0].index;

  let best = null;
  available.forEach(({ question, index }) => {
    let spread = 0;      // насколько сильно вопрос расходится по кандидатам
    let totalWeight = 0; // общая информативность вопроса
    question.options.forEach((option) => {
      const weights = option.vibeWeights || {};
      let max = 0;
      let min = Infinity;
      let sum = 0;
      candidates.forEach((vibeId) => {
        const weight = weights[vibeId] || 0;
        if (weight > max) max = weight;
        if (weight < min) min = weight;
        sum += weight;
      });
      spread += max - min;
      totalWeight += sum;
    });

    const orderGap = Math.abs(index - sequentialIndex);
    const score = spread * 3 + totalWeight * 0.25 - orderGap * 1.5;

    // Строгое «>»: при равенстве побеждает вопрос, рассмотренный раньше, то
    // есть стоящий выше в исходном порядке — детерминированно и предсказуемо.
    if (!best || score > best.score + 1e-9) best = { index, score };
  });

  return best ? best.index : -1;
}
