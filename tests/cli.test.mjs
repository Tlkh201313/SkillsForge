import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

const binary = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge-validate');
const npmCliCandidates = [
  process.env.npm_execpath,
  join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
].filter(Boolean);
const npmCli = npmCliCandidates.find((candidate) => existsSync(candidate));

function runNpm(args) {
  if (npmCli) {
    return spawnSync(process.execPath, [npmCli, ...args], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
  }
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

test('bundled CLI validates a portable skill without installed runtime dependencies', () => {
  const result = spawnSync(process.execPath, [binary, 'tests/fixtures/skills/good-basic'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS good-basic/);
});

test('bundled CLI emits machine-readable failures', () => {
  const result = spawnSync(process.execPath, [binary, '--json', 'tests/fixtures/skills/bad-link'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, false);
  assert.equal(output.reports[0].status, 'fail');
});

test('shipped shim accepts Claude Code profile for Claude-only skill', () => {
  const build = runNpm(['run', 'build']);
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const result = spawnSync(
    process.execPath,
    [binary, '--profile', 'claude-code', 'tests/fixtures/skills/good-claude-extension'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS/);
});

test('shipped shim rejects Claude-only skill under canonical profile', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--profile', 'canonical', 'tests/fixtures/skills/good-claude-extension'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stdout, /FAIL/);
});

test('shipped shim rejects unknown validation profile', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--profile', 'weird', 'tests/fixtures/skills/good-basic'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /Unknown profile/);
});

test('shipped shim rejects missing --profile value', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--profile'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /requires a value/);
});

test('bundled CLI validate fails undeclared-exec with policy JSON fields', () => {
  const result = spawnSync(
    process.execPath,
    [binary, '--json', 'tests/fixtures/policy/undeclared-exec'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, false);
  const finding = output.findings.find((item) => String(item.rule).startsWith('undeclared-exec'));
  assert.ok(finding, JSON.stringify(output.findings));
  assert.equal(finding.blocking, true);
  assert.ok(Array.isArray(finding.evidence));
  assert.ok(finding.fix);
});

test('bundled CLI help lists every subcommand', () => {
  const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  const build = runNpm(['run', 'build']);
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const result = spawnSync(process.execPath, [cli, 'help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const name of ['validate', 'doctor', 'route', 'forge', 'receipt', 'verify-receipt', 'enforce', 'eval', 'hosts', 'help', 'install', 'wb', 'lib', 'workflows', 'auto', 'ps']) {
    assert.match(result.stdout, new RegExp(`\\b${name}\\b`));
  }
});

test('bundled CLI exposes workbench, workflow, auto, library, and PowerShell commands', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const outDir = await mkdtemp(join(tmpdir(), 'sf-cli-new-'));
  try {
    const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
    const build = runNpm(['run', 'build']);
    assert.equal(build.status, 0, build.stderr || build.stdout);

    const status = spawnSync(process.execPath, [cli, 'wb', 'status', '--json'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    assert.equal(status.status, 0, status.stderr || status.stdout);
    assert.equal(JSON.parse(status.stdout).task, 'status');

    const workflows = spawnSync(process.execPath, [cli, 'workflows', 'list', '--json', '--limit', '3'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    assert.equal(workflows.status, 0, workflows.stderr || workflows.stdout);
    assert.equal(JSON.parse(workflows.stdout).count, 100);

    const auto = spawnSync(process.execPath, [cli, 'auto', 'run', '--read-only', '--json', '--query', 'safe refactor code'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    assert.equal(auto.status, 0, auto.stderr || auto.stdout);
    const autoPayload = JSON.parse(auto.stdout);
    assert.equal(autoPayload.dryRun, true);
    assert.equal(autoPayload.mode, 'read-only-run');

    const library = spawnSync(process.execPath, [cli, 'lib', 'build', '--json', '--allow-absolute', '--out', outDir, '--home', outDir], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    assert.equal(library.status, 0, library.stderr || library.stdout);
    assert.equal(JSON.parse(library.stdout).stats.workflows, 100);

    const ps = spawnSync(process.execPath, [cli, 'ps', 'export', '--json', '--allow-absolute', '--out', outDir], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    assert.equal(ps.status, 0, ps.stderr || ps.stdout);
    assert.ok(JSON.parse(ps.stdout).files.some((file) => file.name === 'sf-status'));
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test('bundled CLI hosts --json reports universal host boundaries', () => {
  const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  const build = runNpm(['run', 'build']);
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const result = spawnSync(process.execPath, [cli, 'hosts', '--json', '--home', process.cwd()], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.ok(payload.registry.some((host) => host.id === 'zcode'));
  assert.ok(payload.registry.some((host) => host.id === 'hermes'));
  assert.ok(payload.registry.every((host) => typeof host.installHint === 'string' && host.installHint.length > 0));
  assert.ok(payload.examples.some((example) => example.includes('--custom-host')));
});

test('bundled CLI install --list --json reports registry', () => {
  const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  const result = spawnSync(process.execPath, [cli, 'install', '--list', '--json', '--home', process.cwd()], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.ok(payload.registry.some((host) => host.id === 'cursor'));
  assert.ok(payload.registry.some((host) => host.id === 'hermes'));
  assert.ok(payload.hosts.some((host) => host.id === 'claude-code'));
});

test('bundled CLI install dry-run plans portable files under --home', async () => {
  const { mkdtemp, mkdir, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const home = await mkdtemp(join(tmpdir(), 'sf-cli-install-'));
  try {
    await mkdir(join(home, '.cursor'), { recursive: true });
    const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
    const result = spawnSync(
      process.execPath,
      [
        cli,
        'install',
        '--hosts',
        'cursor',
        '--yes',
        '--dry-run',
        '--json',
        '--home',
        home,
        'tests/fixtures/skills/good-basic'
      ],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.dryRun, true);
    assert.equal(payload.installs[0].status, 'planned');
    assert.equal(payload.installs[0].fidelity, 'package');
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('bundled CLI install expands all hosts and custom hosts in dry-run', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const home = await mkdtemp(join(tmpdir(), 'sf-cli-install-all-'));
  try {
    const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
    const result = spawnSync(
      process.execPath,
      [
        cli,
        'install',
        '--hosts',
        'all',
        '--custom-host',
        'lab-agent:.lab-agent/skills',
        '--yes',
        '--dry-run',
        '--json',
        '--home',
        home,
        'tests/fixtures/skills/good-basic'
      ],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.dryRun, true);
    const hosts = payload.installs.map((item) => item.host);
    for (const id of ['claude-code', 'cursor', 'codex', 'opencode', 'zcode', 'hermes', 'gemini', 'lab-agent']) {
      assert.ok(hosts.includes(id), `missing install host ${id}`);
    }
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('bundled CLI install expands detected hosts only', async () => {
  const { mkdtemp, mkdir, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const home = await mkdtemp(join(tmpdir(), 'sf-cli-install-detected-'));
  try {
    await mkdir(join(home, '.gemini'), { recursive: true });
    const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
    const result = spawnSync(
      process.execPath,
      [
        cli,
        'install',
        '--hosts',
        'detected',
        '--yes',
        '--dry-run',
        '--json',
        '--home',
        home,
        'tests/fixtures/skills/good-basic'
      ],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.deepEqual(payload.installs.map((item) => item.host), ['gemini']);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('bundled CLI install without hosts in non-TTY exits 2', () => {
  const cli = join(process.cwd(), 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  const result = spawnSync(process.execPath, [cli, 'install', '--yes'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /--hosts/);
});
