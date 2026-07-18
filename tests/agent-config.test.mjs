import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { parseFrontmatter } from '../scripts/validate-skill-lib.mjs';
import { parseDocument } from 'yaml';

const agentPath = join(process.cwd(), 'plugins', 'skillsforge', 'agents', 'validator.md');

test('validator agent frontmatter matches Claude agent contract', async () => {
  const source = await readFile(agentPath, 'utf8');
  const parsed = parseFrontmatter(source);
  assert.ok(parsed, 'validator.md must have YAML frontmatter');
  const document = parseDocument(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
  assert.equal(document.errors.length, 0, document.errors.map((error) => error.message).join('; '));
  const front = document.toJS();

  assert.equal(front.name, 'validator');
  assert.equal(
    front.description,
    'Explains SkillsForge deterministic validation, routing, policy, and receipt failures after authoritative checks run'
  );
  assert.equal(front.model, 'sonnet');
  assert.equal(front.effort, 'medium');
  assert.equal(front.maxTurns, 12);

  const tools = String(front.tools)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  assert.deepEqual(tools, ['Read', 'Grep', 'Glob', 'Bash']);

  const disallowed = String(front.disallowedTools)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  assert.ok(disallowed.includes('Write'), 'Write must be disallowed');
  assert.ok(disallowed.includes('Edit'), 'Edit must be disallowed');
  assert.equal(disallowed.length, 2);

  assert.match(parsed.body, /doctor|--json|authoritative/i);
  assert.match(parsed.body, /Never edit|never use Write/i);
});

test('verify-capability skill requires doctor/validate first and explain-only', async () => {
  const source = await readFile(
    join(process.cwd(), 'plugins', 'skillsforge', 'skills', 'verify-capability', 'SKILL.md'),
    'utf8'
  );
  assert.match(source, /doctor --json|validate --json/);
  assert.match(source, /authoritative/i);
  assert.match(source, /Never edit/i);
});

test('claude plugin validate --strict when available', async (context) => {
  const pluginRoot = join(process.cwd(), 'plugins', 'skillsforge');
  await access(join(pluginRoot, '.claude-plugin', 'plugin.json'));

  const result = await tryValidatePlugin(pluginRoot);
  if (result.status === 'skipped') {
    context.skip(result.reason);
    return;
  }
  assert.equal(result.code, 0, result.stderr || result.stdout || 'plugin validate failed');
});

async function tryValidatePlugin(pluginRoot) {
  const attempts = [
    ['claude', ['plugin', 'validate', pluginRoot, '--strict']],
    ['npx', ['--yes', '@anthropic-ai/claude-code', 'plugin', 'validate', pluginRoot, '--strict']]
  ];

  for (const [command, args] of attempts) {
    const result = await runCommand(command, args);
    if (result.spawnError) continue;
    if (/unknown command|not found|Cannot find module|ENOENT|is not recognized|not recognised/i.test(`${result.stdout}\n${result.stderr}`)) {
      continue;
    }
    return result;
  }

  return {
    status: 'skipped',
    reason: 'claude / npx @anthropic-ai/claude-code plugin validate unavailable; file contract tests still enforce agent frontmatter'
  };
}

function runCommand(command, args) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => resolvePromise({ spawnError: error, code: 1, stdout, stderr }));
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
  });
}
