import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  estimateTokens,
  runDigestCommand,
  runNextCommand,
  runTokensCommand
} from '../lib/capabilities/operator.mjs';

const root = process.cwd();

test('estimateTokens uses chars/4 heuristic', () => {
  const sample = 'abcd'; // 4 chars -> 1 token
  assert.deepEqual(estimateTokens(sample), { chars: 4, lines: 1, tokens: 1 });
});

test('tokens --catalog ranks heaviest skills', async () => {
  const result = await runTokensCommand(root, { catalog: true, limit: 5 });
  assert.equal(result.ok, true);
  assert.equal(result.method, 'approx-chars/4');
  assert.equal(result.catalog.scope, 'repo');
  assert.ok(result.catalog.skills >= 399);
  assert.ok(result.catalog.skills < 500, 'default catalog should not include all host-installed skills');
  assert.ok(result.catalog.totalTokens > 0);
  assert.equal(result.catalog.heaviest.length, 5);
  assert.ok(result.catalog.heaviest[0].tokens >= result.catalog.heaviest[4].tokens);
});

test('tokens --skill reports parts and can track session', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-tokens-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  // Session file is under repo artifacts - use track then session-reset cleanup via command
  const tracked = await runTokensCommand(root, { skill: 'eng-refactor-safe', track: true });
  assert.equal(tracked.ok, true);
  assert.equal(tracked.items[0].id, 'eng-refactor-safe');
  assert.ok(tracked.items[0].tokens > 0);
  assert.ok(tracked.session.estimatedTokensLoaded >= tracked.items[0].tokens);

  const session = await runTokensCommand(root, { session: true });
  assert.equal(session.ok, true);
  assert.ok(session.session.estimatedTokensLoaded > 0);

  const reset = await runTokensCommand(root, { sessionReset: true });
  assert.equal(reset.ok, true);
  assert.equal(reset.session.estimatedTokensLoaded, 0);
});

test('digest returns recommend + token cost + next commands', async () => {
  const result = await runDigestCommand(root, { query: 'safe refactor with tests', limit: 3 });
  assert.equal(result.ok, true);
  assert.ok(result.recommendation.confidence === 'high' || result.recommendation.confidence === 'low' || result.recommendation.confidence === 'none');
  assert.ok(Array.isArray(result.nextCommands) && result.nextCommands.length > 0);
  assert.equal(typeof result.tokenCostIfLoaded.totalTokens, 'number');
});

test('next suggests productive commands from repo state', async () => {
  const result = await runNextCommand(root);
  assert.equal(result.ok, true);
  assert.ok(result.suggestions.length >= 3);
  assert.ok(result.suggestions.every((item) => item.command && item.why));
});
