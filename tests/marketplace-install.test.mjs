import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const localClaudeWin = join(root, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
const localClaudeUnix = join(root, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude');

async function loadJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'));
}

function runCommand(command, args) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === 'win32' && (command === 'npx' || command === 'claude'),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => resolvePromise({ spawnError: error, code: 1, stdout, stderr }));
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
  });
}

async function tryValidatePlugin(target) {
  const attempts = [];
  for (const candidate of [localClaudeWin, localClaudeUnix]) {
    try {
      await access(candidate);
      attempts.push([candidate, ['plugin', 'validate', target, '--strict']]);
    } catch {
      // optional local binary
    }
  }
  attempts.push(
    ['claude', ['plugin', 'validate', target, '--strict']],
    ['npx', ['--yes', '@anthropic-ai/claude-code', 'plugin', 'validate', target, '--strict']]
  );

  for (const [command, args] of attempts) {
    const result = await runCommand(command, args);
    if (result.spawnError) continue;
    if (/unknown command|not found|Cannot find module|ENOENT/i.test(`${result.stdout}\n${result.stderr}`)) {
      continue;
    }
    return result;
  }
  return {
    status: 'skipped',
    reason: 'claude / npx @anthropic-ai/claude-code plugin validate unavailable'
  };
}

test('marketplace pluginRoot resolves to plugins/skillsforge', async () => {
  const marketplace = await loadJson('.claude-plugin/marketplace.json');
  assert.equal(marketplace.metadata?.pluginRoot, './plugins');

  const entry = marketplace.plugins?.find((plugin) => plugin.name === 'skillsforge');
  assert.ok(entry, 'marketplace must list skillsforge');
  assert.equal(entry.source, './plugins/skillsforge');

  const pluginRoot = resolve(root, entry.source);
  await access(join(pluginRoot, '.claude-plugin', 'plugin.json'));
  const plugin = JSON.parse(await readFile(join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(plugin.name, 'skillsforge');
  assert.equal(plugin.version, entry.version);
});

test('claude plugin validate accepts marketplace root and plugin when available', async (context) => {
  const plugin = await tryValidatePlugin('plugins/skillsforge');
  if (plugin.status === 'skipped') {
    context.skip(plugin.reason);
    return;
  }
  assert.equal(plugin.code, 0, plugin.stderr || plugin.stdout);

  const marketplace = await tryValidatePlugin('.');
  if (marketplace.status === 'skipped') {
    context.skip(marketplace.reason);
    return;
  }
  assert.equal(marketplace.code, 0, marketplace.stderr || marketplace.stdout);
});
