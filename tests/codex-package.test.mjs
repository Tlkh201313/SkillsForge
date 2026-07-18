import assert from 'node:assert/strict';
import test from 'node:test';
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { packageCodexPlugin } from '../lib/capabilities/codex-package.mjs';
import { compileCodexHooks } from '../lib/capabilities/codex-policy-compiler.mjs';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function runCli(args, cwd = repoRoot) {
  return await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [join(repoRoot, 'scripts', 'skillsforge-cli.mjs'), ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
  });
}

test('compileCodexHooks emits Bash|apply_patch|mcp__* matcher with PLUGIN_ROOT', () => {
  const compiled = compileCodexHooks({ policyRelativePath: 'policy/skillsforge.json' });
  const entry = compiled.hooks.PreToolUse[0];
  assert.equal(entry.matcher, 'Bash|apply_patch|mcp__*');
  assert.match(entry.hooks[0].command, /\$\{PLUGIN_ROOT\}/);
  assert.match(entry.hooks[0].command, /codex-pre-tool-policy\.mjs/);
  assert.match(entry.hooks[0].command, /policy\/skillsforge\.json/);
  assert.doesNotMatch(entry.hooks[0].command, /CODEX_PLUGIN_ROOT/);
});

test('packageCodexPlugin dry-run plans a guarded plugin without writing', async (context) => {
  const out = await mkdtemp(join(tmpdir(), 'sf-codex-out-'));
  context.after(() => rm(out, { recursive: true, force: true }));
  const skillDir = join(repoRoot, 'tests', 'fixtures', 'skills', 'good-with-sidecar');

  const result = await packageCodexPlugin({
    skillDir,
    outDir: out,
    dryRun: true,
    write: false
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.dryRun, true);
  assert.equal(result.host, 'codex');
  assert.equal(result.skill, 'good-with-sidecar');
  assert.ok(result.files.some((file) => file.path.replaceAll('\\', '/').endsWith('.codex-plugin/plugin.json')));
  assert.ok(result.files.some((file) => file.path.replaceAll('\\', '/').includes('agents/openai.yaml')));
  assert.ok(result.files.some((file) => file.path.replaceAll('\\', '/').endsWith('hooks/hooks.json')));
  assert.ok(result.files.some((file) => file.path.replaceAll('\\', '/').endsWith('policy/skillsforge.json')));
  assert.equal(result.interop.usesSidecar, false);
  assert.equal(result.interop.runtimeEnforced, true);

  await assert.rejects(() => access(join(out, '.codex-plugin', 'plugin.json')));
});

test('packageCodexPlugin --write emits complete plugin and receipt', async (context) => {
  const out = await mkdtemp(join(tmpdir(), 'sf-codex-write-'));
  context.after(() => rm(out, { recursive: true, force: true }));
  const skillDir = join(repoRoot, 'plugins', 'skillsforge', 'skills', 'using-skillsforge');

  const result = await packageCodexPlugin({
    skillDir,
    outDir: out,
    write: true,
    force: true
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.dryRun, false);

  await access(join(out, '.codex-plugin', 'plugin.json'));
  await access(join(out, 'skills', 'using-skillsforge', 'SKILL.md'));
  await access(join(out, 'skills', 'using-skillsforge', 'skillsforge.json'));
  await access(join(out, 'skills', 'using-skillsforge', 'agents', 'openai.yaml'));
  await access(join(out, 'hooks', 'hooks.json'));
  await access(join(out, 'hooks', 'codex-pre-tool-policy.mjs'));
  await access(join(out, 'hooks', 'codex-policy-compiler.mjs'));
  await access(join(out, 'hooks', 'policy-shell.mjs'));
  await access(join(out, 'policy', 'skillsforge.json'));
  await access(join(out, 'package-receipt.json'));

  const policySource = await readFile(join(skillDir, 'skillsforge.json'));
  const policyCopy = await readFile(join(out, 'policy', 'skillsforge.json'));
  assert.ok(policySource.equals(policyCopy));

  const hooks = JSON.parse(await readFile(join(out, 'hooks', 'hooks.json'), 'utf8'));
  assert.equal(hooks.hooks.PreToolUse[0].matcher, 'Bash|apply_patch|mcp__*');
});

test('packageCodexPlugin rejects multi-skill packaging', async () => {
  const result = await packageCodexPlugin({
    skillDir: join(repoRoot, 'plugins', 'skillsforge'),
    outDir: join(tmpdir(), 'sf-codex-multi-should-not-exist'),
    dryRun: true
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /multi-skill/i);
});

test('packageCodexPlugin blocking policy findings create no output dir', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'sf-codex-block-'));
  const out = join(root, 'out');
  context.after(() => rm(root, { recursive: true, force: true }));

  const skillDir = join(root, 'bad-skill');
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), `---
name: bad-skill
description: Use when testing blocked Codex packaging for undeclared shell usage.
license: MIT
---

# Bad Skill

## Overview

Runs curl without declaring network.

## When to Use

Tests.

\`\`\`bash
curl https://evil.example.com
\`\`\`
`);
  await writeFile(join(skillDir, 'skillsforge.json'), `${JSON.stringify({
    schemaVersion: 1,
    routing: { triggers: ['blocked packaging'], antiTriggers: [] },
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'none' }
    }
  }, null, 2)}\n`);

  const result = await packageCodexPlugin({
    skillDir,
    outDir: out,
    write: true,
    force: true
  });
  assert.equal(result.ok, false);
  await assert.rejects(() => access(join(out, '.codex-plugin', 'plugin.json')));
});

test('CLI package --host codex help and dry-run', async () => {
  const help = await runCli(['help']);
  assert.equal(help.code, 0, help.stderr);
  assert.match(help.stdout, /package --host codex/);

  const out = join(tmpdir(), `sf-codex-cli-${process.pid}`);
  await rm(out, { recursive: true, force: true });
  const dry = await runCli([
    'package',
    '--host', 'codex',
    '--skill', join('tests', 'fixtures', 'skills', 'good-with-sidecar'),
    '--out', out,
    '--allow-absolute'
  ]);
  assert.equal(dry.code, 0, dry.stderr || dry.stdout);
  const json = JSON.parse(dry.stdout);
  assert.equal(json.ok, true);
  assert.equal(json.dryRun, true);
});

test('packageCodexPlugin generates openai.yaml when missing', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'sf-codex-gen-yaml-'));
  const out = join(root, 'out');
  context.after(() => rm(root, { recursive: true, force: true }));
  await cp(
    join(repoRoot, 'tests', 'fixtures', 'skills', 'good-with-sidecar'),
    join(root, 'good-with-sidecar'),
    { recursive: true }
  );

  const result = await packageCodexPlugin({
    skillDir: join(root, 'good-with-sidecar'),
    outDir: out,
    write: true,
    force: true
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const yaml = await readFile(join(out, 'skills', 'good-with-sidecar', 'agents', 'openai.yaml'), 'utf8');
  assert.match(yaml, /display_name:/);
  assert.match(yaml, /allow_implicit_invocation:\s*true/);
  assert.ok(result.interop.transformed.some((item) => item.includes('openai.yaml')));
});
