import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { initializeProject } from '../lib/capabilities/init.mjs';
import {
  ensureSessionMemory,
  exportSessionMemory,
  recallSessionMemory,
  rememberSessionEvent,
  resetSessionMemory,
  scoreSessionMemory
} from '../lib/capabilities/session.mjs';

test('init creates project config, library artifacts, and session memory idempotently', async (context) => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'sf-init-'));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));

  const first = await initializeProject(projectRoot, { profile: 'vibecoder', sessionHost: 'codex' });
  assert.equal(first.ok, true, JSON.stringify(first.errors));
  assert.equal(first.profile, 'vibecoder');
  assert.equal(first.sessionHost, 'codex');
  await access(first.config);
  await access(first.library.files.html);
  await access(first.library.files.ai);
  await access(first.library.files.json);
  await access(first.session.files.summary);
  assert.match(first.links.libraryHtml, /skillsforge-library\.html$/);
  assert.match(first.links.aiIndexHtml, /skillsforge-ai-index\.html$/);
  assert.match(first.links.serve, /skillsforge lib serve/);

  const second = await initializeProject(projectRoot, { profile: 'vibecoder', sessionHost: 'codex' });
  assert.equal(second.ok, true, JSON.stringify(second.errors));
  assert.equal(second.config, first.config);
});

test('session memory stores compact skill/workflow usage and recalls top-K only', async (context) => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'sf-session-'));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));

  const ensured = await ensureSessionMemory(projectRoot);
  assert.equal(ensured.ok, true);
  await access(ensured.files.jsonl);
  await access(ensured.files.summary);

  const longQuery = `build plugin ${'do not persist this long chat transcript '.repeat(40)}TAIL_SHOULD_NOT_EXIST`;
  const remembered = await rememberSessionEvent(projectRoot, {
    query: longQuery,
    selectedSkill: 'build-codex-plugin',
    selectedWorkflow: 'agentic.skill-routing-plan',
    agentRole: 'codex-specialist',
    score: 88,
    reasons: ['matched builder flow', 'needed compact AI index'],
    commandsSuggested: ['skillsforge lib update --json'],
    tokensEstimated: 340,
    outcome: 'project library refreshed',
    verification: 'node --test tests/session-os.test.mjs'
  }, { sessionHost: 'codex' });
  assert.equal(remembered.ok, true);
  assert.ok(remembered.event.query.length <= 240);

  const rawJsonl = await readFile(remembered.files.jsonl, 'utf8');
  assert.match(rawJsonl, /build-codex-plugin/);
  assert.doesNotMatch(rawJsonl, /TAIL_SHOULD_NOT_EXIST/);

  const recall = await recallSessionMemory(projectRoot, { query: 'plugin library', limit: 2, tokenBudget: 500 });
  assert.equal(recall.ok, true);
  assert.equal(recall.count, 1);
  assert.ok(recall.estimatedTokens <= 500);
  assert.equal(recall.entries[0].selectedSkill, 'build-codex-plugin');

  const scored = await scoreSessionMemory(projectRoot);
  assert.equal(scored.ok, true);
  assert.ok(scored.score > 0);
  assert.equal(scored.totals.events, 1);

  const exported = await exportSessionMemory(projectRoot, { out: 'docs/session.md', limit: 5 });
  assert.equal(exported.ok, true);
  const md = await readFile(exported.out, 'utf8');
  assert.match(md, /SkillsForge Session Memory/);
  assert.match(md, /not chat transcript memory/);

  const reset = await resetSessionMemory(projectRoot);
  assert.equal(reset.ok, true);
  assert.equal(reset.summary.totals.events, 0);
});
