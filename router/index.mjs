import { scoreSkill } from './score.mjs';

const THRESHOLD = 2;

export function routeQuery(query, skills) {
  const candidates = skills
    .map((skill) => scoreSkill(query, skill))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const top = candidates[0];
  const selected = top && top.score >= THRESHOLD ? top.name : null;
  return {
    query,
    selected,
    threshold: THRESHOLD,
    fallback: selected ? null : 'no-skill-above-threshold',
    candidates
  };
}
