import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { exportHostPackage, exportPortableSkill } from '../lib/capabilities/export.mjs';
import { buildCustomHost } from '../lib/capabilities/hosts.mjs';
import { installSkills } from '../lib/capabilities/install.mjs';
import { loadSkill } from '../lib/capabilities/skill-loader.mjs';

test('exportPortableSkill keeps name/description/body and strips sidecar fields', () => {
  const exported = exportPortableSkill({
    name: 'demo',
    description: 'Demo skill',
    body: '\n\nDo the thing.\n',
    requires: ['other'],
    sidecar: { routing: { triggers: ['x'] } }
  });
  assert.equal(exported.files.length, 1);
  assert.equal(exported.files[0].path, 'SKILL.md');
  const content = exported.files[0].contents;
  assert.match(content, /^---\nname: demo\ndescription: Demo skill\n---\n/);
  assert.match(content, /Do the thing\./);
  assert.match(content, /## Requires\n- other/);
  assert.doesNotMatch(content, /routing|hooks|skillsforge|PreToolUse/);
});

test('exportPortableSkill matches previous build-dist cursor format without requires', () => {
  const skill = { name: 'x', description: 'y', body: '\nHello\n', requires: [] };
  const expected = `---\nname: x\ndescription: y\n---\nHello\n`;
  assert.equal(exportPortableSkill(skill).files[0].contents, expected);
});

test('exportHostPackage preserves resources and strips Claude hooks', async () => {
  const skill = await loadSkill(join(process.cwd(), 'plugins', 'skillsforge', 'skills', 'validate-agent-skill'));
  const exported = await exportHostPackage(skill, { runtimeEnforced: false, usesSidecar: false });
  assert.ok(exported.files.some((file) => file.path === 'SKILL.md'));
  assert.ok(exported.files.some((file) => file.path === 'skillsforge.json'));
  const skillMd = exported.files.find((file) => file.path === 'SKILL.md').contents.toString('utf8');
  assert.doesNotMatch(skillMd, /\bhooks:|\bPreToolUse\b/);
  assert.match(skillMd, /^---\n/);
  assert.ok(exported.interop.ignored.includes('hooks') || exported.interop.losses.includes('claude-extensions'));
});

test('installSkills package copy keeps sidecar+resources; Claude full keeps hooks', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.claude'), { recursive: true });
  await mkdir(join(home, '.cursor'), { recursive: true });
  await mkdir(join(home, '.agents'), { recursive: true });

  const fixtureRoot = await mkdtemp(join(tmpdir(), 'sf-skill-pkg-'));
  context.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  const skillDir = join(fixtureRoot, 'pkg-skill');
  await mkdir(join(skillDir, 'scripts'), { recursive: true });
  await mkdir(join(skillDir, 'references'), { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), `---
name: pkg-skill
description: Package fidelity fixture with resources.
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: echo nope
---

# Package skill

Body text.
`);
  await writeFile(join(skillDir, 'skillsforge.json'), JSON.stringify({
    schemaVersion: 1,
    routing: { triggers: ['package fidelity'], antiTriggers: [] },
    capabilities: {
      exec: { allowed: true, commands: ['node scripts/helper.mjs'] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'none' }
    }
  }));
  await writeFile(join(skillDir, 'scripts', 'helper.mjs'), 'console.log("ok");\n');
  await writeFile(join(skillDir, 'references', 'notes.md'), '# notes\n');

  const skill = await loadSkill(skillDir);
  const result = await installSkills({
    skills: [skill],
    hostIds: ['claude-code', 'cursor', 'codex'],
    home,
    root: fixtureRoot,
    force: true
  });
  assert.equal(result.ok, true, JSON.stringify(result));

  const claudeSkill = await readFile(join(home, '.claude', 'skills', 'pkg-skill', 'SKILL.md'), 'utf8');
  assert.match(claudeSkill, /PreToolUse/);
  await access(join(home, '.claude', 'skills', 'pkg-skill', 'skillsforge.json'));
  await access(join(home, '.claude', 'skills', 'pkg-skill', 'scripts', 'helper.mjs'));

  const cursorSkill = await readFile(join(home, '.cursor', 'skills', 'pkg-skill', 'SKILL.md'), 'utf8');
  assert.doesNotMatch(cursorSkill, /PreToolUse|hooks:/);
  await access(join(home, '.cursor', 'skills', 'pkg-skill', 'skillsforge.json'));
  await access(join(home, '.cursor', 'skills', 'pkg-skill', 'scripts', 'helper.mjs'));
  await access(join(home, '.cursor', 'skills', 'pkg-skill', 'references', 'notes.md'));

  await access(join(home, '.agents', 'skills', 'pkg-skill', 'SKILL.md'));
  await access(join(home, '.agents', 'skills', 'pkg-skill', 'scripts', 'helper.mjs'));

  const cursorInstall = result.installs.find((item) => item.host === 'cursor');
  assert.equal(cursorInstall.fidelity, 'package');
  assert.ok(cursorInstall.interop);
  assert.equal(cursorInstall.interop.runtimeEnforced, false);
});

test('installSkills skips existing targets without force', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-skip-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.cursor', 'skills', 'good-with-sidecar'), { recursive: true });
  await writeFile(join(home, '.cursor', 'skills', 'good-with-sidecar', 'SKILL.md'), 'old\n');

  const skill = await loadSkill(join(process.cwd(), 'tests', 'fixtures', 'skills', 'good-with-sidecar'));
  const result = await installSkills({
    skills: [skill],
    hostIds: ['cursor'],
    home,
    force: false
  });
  assert.equal(result.ok, true);
  assert.equal(result.installs[0].status, 'skipped');
  assert.equal(await readFile(join(home, '.cursor', 'skills', 'good-with-sidecar', 'SKILL.md'), 'utf8'), 'old\n');
});

test('installSkills dry-run writes nothing', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-dry-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.cursor'), { recursive: true });

  const skill = await loadSkill(join(process.cwd(), 'tests', 'fixtures', 'skills', 'good-basic'));
  const result = await installSkills({
    skills: [skill],
    hostIds: ['cursor'],
    home,
    dryRun: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.installs[0].status, 'planned');
  await assert.rejects(() => access(join(home, '.cursor', 'skills', skill.name, 'SKILL.md')));
});

test('installSkills accepts custom package-fidelity hosts', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-custom-'));
  context.after(() => rm(home, { recursive: true, force: true }));

  const skill = await loadSkill(join(process.cwd(), 'tests', 'fixtures', 'skills', 'good-basic'));
  const customHost = buildCustomHost('lab-agent:.lab-agent/skills', { home });
  const result = await installSkills({
    skills: [skill],
    hosts: [customHost],
    home,
    dryRun: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.installs[0].host, 'lab-agent');
  assert.equal(result.installs[0].fidelity, 'package');
  assert.equal(result.installs[0].dir, join(home, '.lab-agent', 'skills', 'good-basic'));
  assert.equal(result.installs[0].interop.runtimeEnforced, false);
  await assert.rejects(() => access(join(home, '.lab-agent', 'skills', 'good-basic', 'SKILL.md')));
});

test('installSkills aborts on invalid skill with no writes', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-bad-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.cursor'), { recursive: true });

  const badDir = join(home, 'bad-skill');
  await mkdir(badDir, { recursive: true });
  await writeFile(join(badDir, 'SKILL.md'), '---\nname: bad\n---\n\nbody\n');

  let skill;
  try {
    skill = await loadSkill(badDir);
  } catch {
    skill = {
      name: 'bad',
      description: '',
      body: 'body',
      directory: badDir,
      files: [join(badDir, 'SKILL.md')],
      requires: [],
      sidecar: null
    };
  }

  const result = await installSkills({
    skills: [skill],
    hostIds: ['cursor'],
    home,
    root: home
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'validation failed');
  await assert.rejects(() => access(join(home, '.cursor', 'skills', 'bad', 'SKILL.md')));
});
