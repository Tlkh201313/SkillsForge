const tokenize = (text) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Contiguous phrase match — preferred over unordered token bag. */
const phraseHits = (queryTokens, phrase) => {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0) return 0;
  for (let index = 0; index <= queryTokens.length - phraseTokens.length; index += 1) {
    let matched = true;
    for (let offset = 0; offset < phraseTokens.length; offset += 1) {
      if (queryTokens[index + offset] !== phraseTokens[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return phraseTokens.length;
  }
  return 0;
};

export function scoreSkill(query, skill) {
  const queryTokens = tokenize(query);
  const reasons = [];
  let score = 0;
  let triggerScore = 0;
  for (const trigger of skill.sidecar?.routing?.triggers ?? []) {
    const hits = phraseHits(queryTokens, trigger);
    if (hits > 0) {
      const delta = 2 * hits;
      score += delta;
      triggerScore += delta;
      reasons.push(`trigger "${trigger}" +${delta}`);
    }
  }
  for (const anti of skill.sidecar?.routing?.antiTriggers ?? []) {
    const hits = phraseHits(queryTokens, anti);
    if (hits > 0) {
      const delta = 4 * hits;
      score -= delta;
      reasons.push(`antiTrigger "${anti}" -${delta}`);
    }
  }
  const descriptionOverlap = tokenize(skill.description)
    .filter((token) => token.length > 3 && queryTokens.includes(token)).length;
  if (descriptionOverlap > 0) {
    score += descriptionOverlap;
    reasons.push(`description overlap +${descriptionOverlap}`);
  }
  if (skill.maturity === 'deprecated') {
    score -= 5;
    reasons.push('deprecated -5');
  }
  return { name: skill.name, score, triggerScore, reasons };
}

const THRESHOLD = 2;
const MARGIN = 1;

export function routeQuery(query, skills, options = {}) {
  const threshold = options.threshold ?? THRESHOLD;
  const margin = options.margin ?? MARGIN;
  const candidates = skills
    .map((skill) => scoreSkill(query, skill))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  const top = candidates[0];
  const second = candidates[1];
  let selected = null;
  let fallback = null;
  if (!top || top.score < threshold) {
    fallback = 'no-skill-above-threshold';
  } else if (top.triggerScore <= 0) {
    fallback = 'no-trigger-evidence';
  } else if (second && top.score - second.score < margin) {
    fallback = 'insufficient-margin';
  } else {
    selected = top.name;
  }
  return {
    query,
    selected,
    threshold,
    margin,
    fallback: selected ? null : fallback,
    candidates
  };
}
