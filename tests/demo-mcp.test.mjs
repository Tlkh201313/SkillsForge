import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { runJudgeDemo, compareSkillTrust } from '../lib/capabilities/demo.mjs';
import { TOOLS, callTool } from '../scripts/skillsforge-mcp.mjs';

const root = process.cwd();

test('judge demo denies unsafe, packages safe, emits receipt hash', async () => {
  const result = await runJudgeDemo(root, { color: false });
  assert.equal(result.ok, true, result.error ?? JSON.stringify(result.steps));
  assert.ok(result.receiptHash && result.receiptHash.length >= 32);
  assert.equal(result.falseAllow, 0);
  assert.ok(result.underBudget);
});

test('compare-skill shows sidecar vs policy delta on examples', async () => {
  const payload = await compareSkillTrust(
    root,
    join(root, 'examples', 'codex-unsafe-release'),
    join(root, 'examples', 'codex-safe-release')
  );
  assert.equal(payload.left.hasSidecar, true);
  assert.equal(payload.right.hasSidecar, true);
  assert.equal(payload.left.policyOk, false);
  assert.equal(payload.right.policyOk, true);
});

test('thin MCP exposes only validate/route/skillshield', () => {
  assert.deepEqual(TOOLS.map((t) => t.name).sort(), ['route', 'skillshield', 'validate']);
});

test('MCP route tool returns selected or fallback', async () => {
  const result = await callTool('route', { query: 'what is skillsforge' });
  assert.ok('selected' in result);
  assert.ok(Array.isArray(result.candidates));
});

test('MCP stdio tools/list responds', async () => {
  const child = spawn(process.execPath, [join(root, 'scripts', 'skillsforge-mcp.mjs')], {
    cwd: root,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, SKILLSFORGE_ROOT: root }
  });
  let stdout = '';
  child.stdout.on('data', (c) => { stdout += c; });
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })}\n`);
  child.stdin.end();
  const code = await new Promise((resolve) => child.on('exit', (c) => resolve(c ?? 1)));
  assert.equal(code, 0);
  const line = stdout.trim().split('\n').pop();
  const msg = JSON.parse(line);
  assert.equal(msg.result.tools.length, 3);
});
