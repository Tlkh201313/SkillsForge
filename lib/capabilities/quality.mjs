import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadSkill } from './skill-loader.mjs';
import { scanSkill } from './policy.mjs';

const WORKFLOW_SUMMARY_RE = /\b(then|first|step\s+\d|dispatch|run the|follows? these steps)\b/i;

export async function scoreSkillQuality(skillDir, options = {}) {
  const loaded = await loadSkill(skillDir, options);
  const checks = [];
  let score = 0;

  const nameOk = loaded.name && loaded.directory.endsWith(loaded.name);
  score += nameOk ? 20 : 0;
  checks.push({ id: 'frontmatter', points: nameOk ? 20 : 0, max: 20, ok: nameOk });

  const sidecarOk = Boolean(loaded.sidecar);
  const caps = loaded.sidecar?.capabilities;
  const leastPrivilege = sidecarOk && caps
    && (caps.exec?.allowed !== true || Array.isArray(caps.exec?.commands))
    && caps.write?.scope != null;
  const sidecarPoints = sidecarOk && leastPrivilege ? 20 : sidecarOk ? 10 : 0;
  score += sidecarPoints;
  checks.push({ id: 'sidecar', points: sidecarPoints, max: 20, ok: sidecarPoints === 20 });

  const triggers = loaded.sidecar?.routing?.triggers ?? [];
  const anti = loaded.sidecar?.routing?.antiTriggers ?? [];
  const multiWord = triggers.filter((t) => t.trim().includes(' ')).length;
  const triggerOk = multiWord >= 4 && anti.length >= 1;
  const triggerPoints = triggerOk ? 15 : multiWord >= 2 ? 8 : 0;
  score += triggerPoints;
  checks.push({ id: 'triggers', points: triggerPoints, max: 15, ok: triggerOk });

  const body = loaded.body ?? '';
  const sections = ['## Purpose', '## Phases', '## Exit', '## Anti-patterns', '## Handoff'];
  const sectionHits = sections.filter((s) => body.includes(s) || body.toLowerCase().includes(s.toLowerCase())).length;
  // Also accept Overview / When to Use / Common Mistakes style
  const altHits = ['## Overview', '## When to Use', '## Common Mistakes', '## Quick Reference']
    .filter((s) => body.includes(s)).length;
  const bodyOk = sectionHits >= 4 || (altHits >= 3 && body.trim().length > 200);
  const bodyPoints = bodyOk ? 15 : sectionHits + altHits >= 2 ? 7 : 0;
  score += bodyPoints;
  checks.push({ id: 'body', points: bodyPoints, max: 15, ok: bodyOk });

  let openaiOk = false;
  try {
    await readFile(join(loaded.directory, 'agents', 'openai.yaml'), 'utf8');
    openaiOk = true;
  } catch {
    openaiOk = false;
  }
  score += openaiOk ? 10 : 0;
  checks.push({ id: 'openai.yaml', points: openaiOk ? 10 : 0, max: 10, ok: openaiOk });

  const lean = body.length < 12000;
  score += lean ? 10 : 0;
  checks.push({ id: 'token-budget', points: lean ? 10 : 0, max: 10, ok: lean });

  const findings = loaded.sidecar
    ? await scanSkill({
      ...loaded,
      files: loaded.files.filter((file) => file !== loaded.sidecarFile)
    })
    : [];
  const blocking = findings.filter((f) => f.blocking);
  const policyOk = blocking.length === 0;
  score += policyOk ? 10 : 0;
  checks.push({ id: 'policy', points: policyOk ? 10 : 0, max: 10, ok: policyOk });

  const description = loaded.description ?? '';
  const csoUseWhen = /^use when\b/i.test(description.trim());
  const csoNoWorkflow = !WORKFLOW_SUMMARY_RE.test(description);
  const csoOk = csoUseWhen && csoNoWorkflow && description.length <= 500;
  checks.push({
    id: 'cso',
    points: 0,
    max: 0,
    ok: csoOk,
    detail: csoOk ? 'ok' : 'description should start with Use when… and omit workflow summary'
  });

  return {
    name: loaded.name,
    score,
    max: 100,
    pass: score >= (options.threshold ?? 70),
    heroPass: score >= 85,
    csoOk,
    checks,
    blocking: blocking.map((f) => f.rule)
  };
}

export async function lintSkill(skillDir, options = {}) {
  const result = await scoreSkillQuality(skillDir, options);
  const threshold = options.threshold ?? 70;
  const requireHero = options.hero === true;
  const ok = requireHero ? result.heroPass : result.score >= threshold;
  return { ok, threshold: requireHero ? 85 : threshold, ...result };
}
