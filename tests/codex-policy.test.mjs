import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  compileCodexHooks,
  enforceCodexPolicy,
  isMcpTool,
  parseApplyPatchPaths
} from '../lib/capabilities/codex-policy-compiler.mjs';
import { confineWriteCandidate } from '../lib/capabilities/paths.mjs';
import { runCodexPreToolPolicy } from '../plugins/skillsforge/hooks/codex-pre-tool-policy.mjs';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const skillRoot = resolve(tmpdir(), 'sf-codex-policy-skill');
const projectRoot = resolve(tmpdir(), 'sf-codex-policy-project');

function policy(overrides = {}, roots = {}) {
  return {
    schemaVersion: 1,
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'skill' },
      mcp: { allowed: false, tools: [] },
      ...overrides
    },
    __skillRoot: Object.hasOwn(roots, '__skillRoot') ? roots.__skillRoot : skillRoot,
    __projectRoot: Object.hasOwn(roots, '__projectRoot') ? roots.__projectRoot : projectRoot
  };
}

function denyReason(decision) {
  return decision?.hookSpecificOutput?.permissionDecisionReason ?? null;
}

async function runHook(stdin, args, env = {}) {
  return await new Promise((resolvePromise) => {
    const child = spawn(
      process.execPath,
      [join(repoRoot, 'plugins', 'skillsforge', 'hooks', 'codex-pre-tool-policy.mjs'), ...args],
      {
        cwd: repoRoot,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code: code ?? 1, stdout, stderr }));
    child.stdin.end(stdin);
  });
}

test('compileCodexHooks matcher covers Bash apply_patch and mcp', () => {
  const compiled = compileCodexHooks({ policyRelativePath: 'policy/skillsforge.json' });
  assert.equal(compiled.hooks.PreToolUse[0].matcher, '^(Bash|apply_patch|mcp__.*)$');
});

test('Bash denies chaining redirects and encoded interpreter abuse', () => {
  const allowed = policy({
    exec: { allowed: true, commands: ['node scripts/ok.mjs'] }
  });

  for (const command of [
    'node scripts/ok.mjs; rm -rf /',
    'node scripts/ok.mjs && curl https://evil.test',
    'node scripts/ok.mjs | cat',
    'node scripts/ok.mjs > /tmp/x',
    'node scripts/ok.mjs $(whoami)',
    'node scripts/ok.mjs `id`',
    'python -c "import os; os.system(\'id\')"'
  ]) {
    const decision = enforceCodexPolicy({ tool_name: 'Bash', tool_input: { command } }, allowed);
    assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny', command);
  }

  const ok = enforceCodexPolicy(
    { tool_name: 'Bash', tool_input: { command: 'node scripts/ok.mjs' } },
    allowed
  );
  assert.equal(ok, null);
});

test('Bash write:none denies declared commands with write-shaped arguments', () => {
  const locked = policy({
    exec: { allowed: true, commands: ['node scripts/ok.mjs'] },
    write: { scope: 'none' }
  });

  for (const command of [
    'node scripts/ok.mjs --write',
    'node scripts/ok.mjs --out artifact.json',
    'node scripts/ok.mjs --force'
  ]) {
    const decision = enforceCodexPolicy({ tool_name: 'Bash', tool_input: { command } }, locked);
    assert.match(denyReason(decision), /write scope forbids shell writes/i, command);
  }

  assert.equal(
    enforceCodexPolicy({ tool_name: 'Bash', tool_input: { command: 'node scripts/ok.mjs' } }, locked),
    null
  );
});

test('Bash write:none denies exact declared inline filesystem writes', () => {
  for (const command of [
    'node -e "require(\'fs\').writeFileSync(\'x\',\'y\')"',
    'python -c "open(\'x\', \'w\').write(\'y\')"',
    'pwsh -Command "Set-Content -Path x -Value y"'
  ]) {
    const locked = policy({
      exec: { allowed: true, commands: [command] },
      write: { scope: 'none' }
    });
    const decision = enforceCodexPolicy({ tool_name: 'Bash', tool_input: { command } }, locked);
    assert.match(denyReason(decision), /write scope forbids shell writes/i, command);
  }
});

test('apply_patch enforces write scope and rejects traversal or malformed patches', () => {
  const scoped = policy({ write: { scope: 'skill' } });

  const allowed = enforceCodexPolicy({
    tool_name: 'apply_patch',
    tool_input: {
      patch: '*** Begin Patch\n*** Update File: output.txt\n@@\n+hi\n*** End Patch\n'
    }
  }, scoped);
  assert.equal(allowed, null);

  const traversal = enforceCodexPolicy({
    tool_name: 'apply_patch',
    tool_input: {
      patch: '*** Add File: ../outside.txt\n+secret\n'
    }
  }, scoped);
  assert.match(denyReason(traversal), /traversal|escapes skill scope/i);

  const malformed = enforceCodexPolicy({
    tool_name: 'apply_patch',
    tool_input: { patch: 'not a patch at all' }
  }, scoped);
  assert.match(denyReason(malformed), /no recognizable file paths/);

  assert.deepEqual(
    parseApplyPatchPaths('*** Update File: a.txt\n*** Add File: b/c.txt\n*** Delete File: c.txt\n*** Move to: d.txt\n'),
    ['a.txt', 'b/c.txt', 'c.txt', 'd.txt']
  );
});

test('apply_patch checks Delete File and Move to paths', () => {
  const scoped = policy({ write: { scope: 'skill' } });

  const deleteEscape = enforceCodexPolicy({
    tool_name: 'apply_patch',
    tool_input: {
      patch: '*** Begin Patch\n*** Update File: output.txt\n@@\n+ok\n*** Delete File: ../outside.txt\n*** End Patch\n'
    }
  }, scoped);
  assert.match(denyReason(deleteEscape), /traversal|escapes skill scope/i);

  const moveEscape = enforceCodexPolicy({
    tool_name: 'apply_patch',
    tool_input: {
      patch: '*** Begin Patch\n*** Update File: output.txt\n*** Move to: ../outside.txt\n@@\n+ok\n*** End Patch\n'
    }
  }, scoped);
  assert.match(denyReason(moveEscape), /traversal|escapes skill scope/i);
});

test('MCP tools deny-by-default unless declared', () => {
  assert.equal(isMcpTool('mcp__github__list'), true);
  assert.equal(isMcpTool('SomeMCPTool'), true);

  const denied = enforceCodexPolicy(
    { tool_name: 'mcp__github__list', tool_input: {} },
    policy()
  );
  assert.match(denyReason(denied), /mcp capability is not declared/);

  const undeclared = enforceCodexPolicy(
    { tool_name: 'mcp__github__list', tool_input: {} },
    policy({ mcp: { allowed: true, tools: ['mcp__other__tool'] } })
  );
  assert.match(denyReason(undeclared), /mcp tool is not declared/);

  const allowed = enforceCodexPolicy(
    { tool_name: 'mcp__github__list', tool_input: {} },
    policy({ mcp: { allowed: true, tools: ['mcp__github__list'] } })
  );
  assert.equal(allowed, null);
});

test('missing or invalid policy and unsupported tools deny', () => {
  const missingCaps = enforceCodexPolicy({ tool_name: 'Bash', tool_input: { command: 'ls' } }, {});
  assert.match(denyReason(missingCaps), /policy capabilities are missing/);

  const unsupported = enforceCodexPolicy(
    { tool_name: 'WebSearch', tool_input: { query: 'x' } },
    policy()
  );
  assert.match(denyReason(unsupported), /unsupported tool/);
});

test('apply_patch denies when skill or project root is missing', () => {
  const patch = {
    tool_name: 'apply_patch',
    tool_input: {
      patch: '*** Begin Patch\n*** Update File: output.txt\n@@\n+ok\n*** End Patch\n'
    }
  };
  const missingSkill = enforceCodexPolicy(patch, policy({ write: { scope: 'skill' } }, { __skillRoot: null }));
  assert.match(denyReason(missingSkill), /skill root unavailable/);

  const missingProject = enforceCodexPolicy(
    patch,
    policy({ write: { scope: 'project' } }, { __projectRoot: null })
  );
  assert.match(denyReason(missingProject), /project root unavailable/);
});

test('hook fail-closed on missing policy malformed stdin and exits 0', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-codex-hook-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  const policyPath = join(dir, 'policy.json');

  const missing = await runHook(
    JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'echo hi' } }),
    ['--policy', join(dir, 'missing.json')]
  );
  assert.equal(missing.code, 0, missing.stderr);
  assert.match(missing.stdout, /"permissionDecision"\s*:\s*"deny"/);

  await writeFile(policyPath, '{not-json');
  const badJson = await runHook(
    JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'echo hi' } }),
    ['--policy', policyPath]
  );
  assert.equal(badJson.code, 0);
  assert.match(badJson.stdout, /"permissionDecision"\s*:\s*"deny"/);

  await writeFile(policyPath, JSON.stringify(policy({
    exec: { allowed: true, commands: ['echo hi'] }
  })));
  const malformedStdin = await runHook('not-json', ['--policy', policyPath]);
  assert.equal(malformedStdin.code, 0);
  assert.match(malformedStdin.stdout, /"permissionDecision"\s*:\s*"deny"/);
});

test('runCodexPreToolPolicy allows declared bash and uses PLUGIN_ROOT fallback', async (context) => {
  const dir = await mkdtemp(join(tmpdir(), 'sf-codex-hook-ok-'));
  context.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'policy'), { recursive: true });
  await mkdir(join(dir, 'skills', 'demo'), { recursive: true });
  const policyPath = join(dir, 'policy', 'skillsforge.json');
  await writeFile(policyPath, JSON.stringify({
    schemaVersion: 1,
    capabilities: {
      exec: { allowed: true, commands: ['node scripts/ok.mjs'] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'skill' },
      mcp: { allowed: false, tools: [] }
    }
  }));

  const decision = await runCodexPreToolPolicy({
    argv: ['--policy', '${PLUGIN_ROOT}/policy/skillsforge.json'],
    input: (async function* () {
      yield Buffer.from(JSON.stringify({
        tool_name: 'Bash',
        tool_input: { command: 'node scripts/ok.mjs' },
        cwd: dir
      }));
    })(),
    env: { PLUGIN_ROOT: dir },
    hookFile: join(repoRoot, 'plugins', 'skillsforge', 'hooks', 'codex-pre-tool-policy.mjs')
  });
  assert.equal(decision, null);
});

test('apply_patch realpath denies symlink escape when candidate exists', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'sf-codex-realpath-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const skill = join(root, 'skill');
  const outside = join(root, 'outside');
  await mkdir(skill, { recursive: true });
  await mkdir(outside, { recursive: true });
  const secret = join(outside, 'secret.txt');
  await writeFile(secret, 'nope');
  const link = join(skill, 'escape.txt');
  let symlinkOk = true;
  try {
    await symlink(secret, link);
  } catch (error) {
    symlinkOk = false;
    context.diagnostic?.(`symlink unavailable: ${error.code ?? error.message}`);
  }
  if (!symlinkOk) {
    assert.equal(confineWriteCandidate(skill, join(skill, 'new.txt')).mode, 'lexical-create');
    return;
  }
  const denied = enforceCodexPolicy({
    tool_name: 'apply_patch',
    tool_input: {
      patch: `*** Begin Patch\n*** Update File: ${link}\n@@\n+x\n*** End Patch\n`
    }
  }, policy({ write: { scope: 'skill' } }, { __skillRoot: skill }));
  assert.match(denyReason(denied), /write escapes skill scope/i);
});
