const tokenize = (text) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

const phraseHits = (queryTokens, phrase) => {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0) return 0;
  const hits = phraseTokens.filter((token) => queryTokens.includes(token)).length;
  return hits === phraseTokens.length ? phraseTokens.length : 0;
};

export function scoreSkill(query, skill) {
  const queryTokens = tokenize(query);
  const reasons = [];
  let score = 0;
  for (const trigger of skill.sidecar?.routing?.triggers ?? []) {
    const hits = phraseHits(queryTokens, trigger);
    if (hits > 0) {
      score += 2 * hits;
      reasons.push(`trigger "${trigger}" +${2 * hits}`);
    }
  }
  for (const anti of skill.sidecar?.routing?.antiTriggers ?? []) {
    const hits = phraseHits(queryTokens, anti);
    if (hits > 0) {
      score -= 3 * hits;
      reasons.push(`antiTrigger "${anti}" -${3 * hits}`);
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
  return { name: skill.name, score, reasons };
}

const THRESHOLD = 2;

export function routeQuery(query, skills, options = {}) {
  const threshold = options.threshold ?? THRESHOLD;
  const candidates = skills
    .map((skill) => scoreSkill(query, skill))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  const top = candidates[0];
  const selected = top && top.score >= threshold ? top.name : null;
  return {
    query,
    selected,
    threshold,
    fallback: selected ? null : 'no-skill-above-threshold',
    candidates
  };
}
