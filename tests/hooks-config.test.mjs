import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('hooks.json uses nested Claude Code event format', async () => {
  const config = JSON.parse(await readFile('hooks/hooks.json', 'utf8'));
  assert.ok(Array.isArray(config.hooks.SessionStart), 'SessionStart array required');
  const entry = config.hooks.SessionStart[0].hooks[0];
  assert.equal(entry.type, 'command');
  assert.match(entry.command, /\$\{CLAUDE_PLUGIN_ROOT\}/);
  assert.match(entry.command, /session-start\.mjs/);
});

test('session-start hook script exists and is a module', async () => {
  await access('hooks/session-start.mjs');
});
