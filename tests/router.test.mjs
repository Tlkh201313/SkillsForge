import test from 'node:test';
import assert from 'node:assert/strict';
import { routeQuery } from '../router/index.mjs';

const skills = [
  {
    name: 'upgrade-deps',
    description: 'Use when upgrading dependencies safely',
    maturity: 'stable',
    requires: [],
    sidecar: {
      routing: {
        triggers: ['upgrade dependencies', 'bump package versions'],
        antiTriggers: ['security audit']
      },
      capabilities: { exec: false, network: false, writesOutsideSkill: false }
    }
  },
  {
    name: 'audit-security',
    description: 'Use when auditing dependencies for vulnerabilities',
    maturity: 'stable',
    requires: [],
    sidecar: {
      routing: {
        triggers: ['security audit', 'find vulnerabilities'],
        antiTriggers: []
      },
      capabilities: { exec: false, network: false, writesOutsideSkill: false }
    }
  }
];

test('routes security query away from upgrade skill via antiTrigger', () => {
  const result = routeQuery('run a security audit of our dependencies', skills);
  assert.equal(result.selected, 'audit-security');
  const rejected = result.candidates.find((c) => c.name === 'upgrade-deps');
  assert.ok(rejected.reasons.some((r) => r.startsWith('antiTrigger')));
});

test('returns null selection with explanation when nothing matches', () => {
  const result = routeQuery('bake a cake', skills);
  assert.equal(result.selected, null);
  assert.equal(result.fallback, 'no-skill-above-threshold');
});

test('deterministic: same input, same output', () => {
  const a = JSON.stringify(routeQuery('upgrade dependencies', skills));
  const b = JSON.stringify(routeQuery('upgrade dependencies', skills));
  assert.equal(a, b);
});
