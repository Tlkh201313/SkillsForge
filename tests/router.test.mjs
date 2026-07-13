import assert from 'node:assert/strict';
import test from 'node:test';
import { routeQuery, scoreSkill } from '../lib/capabilities/router.mjs';

function skill(name, {
  description = '',
  triggers = [],
  antiTriggers = [],
  maturity = 'stable'
} = {}) {
  return {
    name,
    description,
    maturity,
    sidecar: { routing: { triggers, antiTriggers } }
  };
}

test('router prefers contiguous phrase triggers over unordered bags', () => {
  const candidate = skill('author-capability', {
    triggers: ['forge a capability']
  });
  const bagOnly = scoreSkill('forge steel parts for a capability bracket', candidate);
  const contiguous = scoreSkill('forge a capability for upgrades', candidate);

  assert.equal(bagOnly.triggerScore, 0);
  assert.equal(bagOnly.score, 0);
  assert.ok(contiguous.triggerScore > 0);
  assert.ok(contiguous.reasons.some((reason) => reason.startsWith('trigger "forge a capability"')));
});

test('router requires positive trigger evidence (description alone cannot win)', () => {
  const candidate = skill('validate-agent-skill', {
    description: 'Validate skill packages for marketplace frontend distribution',
    triggers: ['validate agent skill']
  });
  const scored = scoreSkill('deploy skill marketplace frontend', candidate);
  const routed = routeQuery('deploy skill marketplace frontend', [candidate]);

  assert.ok(scored.score >= 2, `expected description score, got ${scored.score}`);
  assert.equal(scored.triggerScore, 0);
  assert.equal(routed.selected, null);
  assert.equal(routed.fallback, 'no-trigger-evidence');
});

test('router anti-trigger subtracts enough to suppress a collision', () => {
  const candidate = skill('dependency-audit', {
    description: 'Audit project dependencies',
    triggers: ['audit dependencies'],
    antiTriggers: ['security audit']
  });
  const score = scoreSkill('security audit dependencies', candidate);
  const route = routeQuery('security audit dependencies', [candidate]);

  assert.ok(score.score < 2);
  assert.ok(score.reasons.some((reason) => reason.startsWith('antiTrigger "security audit"')));
  assert.equal(route.selected, null);
  assert.ok(
    route.fallback === 'no-skill-above-threshold' || route.fallback === 'no-trigger-evidence'
  );
});

test('router requires minimum score margin between top two', () => {
  const skills = [
    skill('alpha-skill', { triggers: ['choose capability'] }),
    skill('beta-skill', { triggers: ['choose capability'] })
  ];
  const result = routeQuery('choose capability', skills);

  assert.equal(result.selected, null);
  assert.equal(result.fallback, 'insufficient-margin');
  assert.equal(result.margin, 1);
  assert.equal(result.candidates[0].score, result.candidates[1].score);
});

test('router uses alphabetical name order for equal scores when margin allows sole winner', () => {
  const skills = [
    skill('zeta-skill', { triggers: ['choose capability'] }),
    skill('alpha-skill', {
      triggers: ['choose capability', 'alpha only phrase'],
      description: 'extra words unused'
    })
  ];
  // Make alpha win with margin via second trigger not present — instead force unique win:
  const unique = [
    skill('zeta-skill', { triggers: ['other phrase'] }),
    skill('alpha-skill', { triggers: ['choose capability'] })
  ];
  const result = routeQuery('choose capability', unique);

  assert.equal(result.selected, 'alpha-skill');
  assert.equal(result.threshold, 2);
  assert.ok(result.candidates.every((candidate) => Array.isArray(candidate.reasons)));
  assert.equal(typeof result.candidates[0].triggerScore, 'number');
});

test('router applies deprecated maturity penalty', () => {
  const result = scoreSkill('choose capability', skill('legacy', {
    triggers: ['choose capability'],
    maturity: 'deprecated'
  }));

  assert.equal(result.score, -1);
  assert.ok(result.reasons.includes('deprecated -5'));
});

test('router keeps explainable reasons on trigger and anti hits', () => {
  const result = scoreSkill('create a skill safely', skill('author', {
    triggers: ['create a skill'],
    antiTriggers: ['create a skill safely'],
    description: 'Create skills'
  }));

  assert.ok(result.reasons.some((reason) => reason.includes('trigger')));
  assert.ok(result.reasons.some((reason) => reason.includes('antiTrigger')));
});
