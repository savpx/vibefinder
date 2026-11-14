
import { questions } from './questions.js?v=43';
import { vibeThemes } from './themes.js?v=43';

const VIBE_IDS = Object.keys(vibeThemes);

export const questionIndexById = new Map(questions.map((question, index) => [question.id, index]));


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

const VIBE_MAX_POSSIBLE = computeMaxPossible();

function normalizedScore(vibeId, raw) {
  const max = VIBE_MAX_POSSIBLE.get(vibeId) || 0;
  return max > 0 ? raw / max : 0;
}

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

const CANDIDATE_MARGIN = 0.18;

export function selectNextQuestion(answers, usedIds) {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds);

  const answeredCount = questions.reduce(
    (count, question) => count + (answers[question.id] !== undefined ? 1 : 0),
    0,
  );
  if (answeredCount === 0) return 0;

  const ranked = rankVibes(answers);
  const leaderNorm = ranked[0] ? ranked[0].norm : 0;
  const candidateIds = leaderNorm > 0
    ? ranked.filter((vibe) => leaderNorm - vibe.norm <= CANDIDATE_MARGIN).map((vibe) => vibe.id)
    : VIBE_IDS;
  const candidates = candidateIds.length >= 2 ? candidateIds : ranked.slice(0, 3).map((vibe) => vibe.id);

  const available = [];
  questions.forEach((question, index) => {
    if (!used.has(question.id)) available.push({ question, index });
  });
  if (!available.length) return -1;

  const sequentialIndex = available[0].index;

  let best = null;
  available.forEach(({ question, index }) => {
    let spread = 0;      
    let totalWeight = 0; 
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

    if (!best || score > best.score + 1e-9) best = { index, score };
  });

  return best ? best.index : -1;
}
