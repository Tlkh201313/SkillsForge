import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { runPreToolPolicy } from '../plugins/skillsforge/hooks/pre-tool-policy.mjs';

const hookPath = join(process.cwd(), 'plugins', 'skillsforge', 'hooks', 'pre-tool-policy.mjs');

function stdinOf(value) {
  return Readable.from([JSON.stringify(value)]);
}

async function tempPolicy(context, capabilities, raw = null) {
  const directory = await mkdtemp(join(tmpdir(), 'sf-pretool-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const policyPath = join(directory, 'skillsforge.json');
  if (raw != null) {
    await writeFile(policyPath, raw);
  } else {
    await writeFile(policyPath, JSON.stringify({
      schemaVersion: 1,
      routing: { triggers: ['pretool'], antiTriggers: [] },
      capabilities
    }));
  }
  return policyPath;
}

async function spawnHook(policyPath, event, { rawStdin } = {}) {
  return await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [hookPath, '--policy', policyPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code, stdout, stderr }));
    child.stdin.end(rawStdin ?? JSON.stringify(event));
  });
}

function assertFailClosed(result) {
  assert.equal(result.code, 0, result.stderr);
  const decision = JSON.parse(result.stdout.trim());
  assert.equal(decision.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(
    decision.hookSpecificOutput.permissionDecisionReason,
    'SkillsForge policy enforcement failed'
  );
  assert.match(result.stderr, /SkillsForge policy hook failed:/);
  assert.doesNotMatch(result.stderr, /hook_event_name|tool_input|password/i);
}

test('PreToolUse Bash stdin shape is denied without exec', async (context) => {
  const policyPath = await tempPolicy(context, {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' }
  });
  const decision = await runPreToolPolicy({
    argv: ['--policy', policyPath],
    input: stdinOf({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'node scripts/run.mjs' }
    })
  });
  assert.equal(decision.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(decision.hookSpecificOutput.permissionDecisionReason, /exec capability is not declared/);
});

test('PreToolUse Write and Edit stdin shapes enforce skill write scope', async (context) => {
  const policyPath = await tempPolicy(context, {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' }
  });

  const writeDecision = await runPreToolPolicy({
    argv: ['--policy', policyPath],
    input: stdinOf({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: join(tmpdir(), 'outside-write.txt'), content: 'nope' }
    })
  });
  assert.match(writeDecision.hookSpecificOutput.permissionDecisionReason, /write escapes skill scope/);

  const editDecision = await runPreToolPolicy({
    argv: ['--policy', policyPath],
    input: stdinOf({
      hook_event_name: 'PreToolUse',
      tool_name: 'Edit',
      tool_input: {
        file_path: join(tmpdir(), 'outside-edit.txt'),
        old_string: 'a',
        new_string: 'b'
      }
    })
  });
  assert.match(editDecision.hookSpecificOutput.permissionDecisionReason, /write escapes skill scope/);
});

test('PreToolUse WebFetch and WebSearch stdin shapes require network', async (context) => {
  const policyPath = await tempPolicy(context, {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'none' }
  });

  const fetchDecision = await runPreToolPolicy({
    argv: ['--policy', policyPath],
    input: stdinOf({
      hook_event_name: 'PreToolUse',
      tool_name: 'WebFetch',
      tool_input: { url: 'https://example.com' }
    })
  });
  assert.match(fetchDecision.hookSpecificOutput.permissionDecisionReason, /network capability is not declared/);

  const searchDecision = await runPreToolPolicy({
    argv: ['--policy', policyPath],
    input: stdinOf({
      hook_event_name: 'PreToolUse',
      tool_name: 'WebSearch',
      tool_input: { query: 'skillsforge policy' }
    })
  });
  assert.match(searchDecision.hookSpecificOutput.permissionDecisionReason, /network capability is not declared/);
});

test('hook CLI writes deny JSON and exits 0 with empty allow', async (context) => {
  const denyPolicy = await tempPolicy(context, {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'none' }
  });
  const denied = await spawnHook(denyPolicy, {
    hook_event_name: 'PreToolUse',
    tool_name: 'WebSearch',
    tool_input: { query: 'x' }
  });
  assert.equal(denied.code, 0, denied.stderr);
  assert.match(denied.stdout, /"permissionDecision"\s*:\s*"deny"/);

  const allowPolicy = await tempPolicy(context, {
    exec: { allowed: true, commands: ['node scripts/run.mjs'] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'project' }
  });
  const allowed = await spawnHook(allowPolicy, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'node scripts/run.mjs' }
  });
  assert.equal(allowed.code, 0, allowed.stderr);
  assert.equal(allowed.stdout.trim(), '');
});

test('hook fail-closed on missing policy file', async () => {
  const result = await spawnHook(join(tmpdir(), 'sf-missing-policy.json'), {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hi' }
  });
  assertFailClosed(result);
});

test('hook fail-closed on invalid sidecar JSON', async (context) => {
  const policyPath = await tempPolicy(context, null, '{not-json');
  const result = await spawnHook(policyPath, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hi' }
  });
  assertFailClosed(result);
});

test('hook fail-closed on invalid stdin JSON', async (context) => {
  const policyPath = await tempPolicy(context, {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'none' }
  });
  const result = await spawnHook(policyPath, null, { rawStdin: '{bad' });
  assertFailClosed(result);
  assert.doesNotMatch(result.stderr, /\{bad/);
});

test('hook fail-closed on missing capabilities', async (context) => {
  const policyPath = await tempPolicy(context, null, JSON.stringify({
    schemaVersion: 1,
    routing: { triggers: ['x'], antiTriggers: [] }
  }));
  const result = await spawnHook(policyPath, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'echo hi' }
  });
  assertFailClosed(result);
});

test('hook fail-closed when policy path omitted', async () => {
  const result = await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [hookPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, SKILLSFORGE_POLICY: '', SKILLSFORGE_POLICY_PATH: '' }
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('exit', (code) => resolvePromise({ code, stdout, stderr }));
    child.stdin.end(JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'echo hi' }
    }));
  });
  assertFailClosed(result);
});

test('hook sets project root and denies Write escape for project scope', async (context) => {
  const policyPath = await tempPolicy(context, {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'project' }
  });
  const projectRoot = await mkdtemp(join(tmpdir(), 'sf-project-'));
  context.after(() => rm(projectRoot, { recursive: true, force: true }));

  const denied = await spawnHook(policyPath, {
    hook_event_name: 'PreToolUse',
    cwd: projectRoot,
    tool_name: 'Write',
    tool_input: { file_path: join(tmpdir(), 'outside-project.txt'), content: 'x' }
  });
  assert.equal(denied.code, 0, denied.stderr);
  assert.match(denied.stdout, /write escapes project scope/);

  const allowed = await spawnHook(policyPath, {
    hook_event_name: 'PreToolUse',
    cwd: projectRoot,
    tool_name: 'Write',
    tool_input: { file_path: join(projectRoot, 'inside.txt'), content: 'ok' }
  });
  assert.equal(allowed.code, 0, allowed.stderr);
  assert.equal(allowed.stdout.trim(), '');
});
