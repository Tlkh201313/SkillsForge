import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { exportPortableSkill } from '../lib/capabilities/export.mjs';
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

test('installSkills portable copy strips sidecar; full copy keeps it', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.claude'), { recursive: true });
  await mkdir(join(home, '.cursor'), { recursive: true });

  const fixture = join(process.cwd(), 'tests', 'fixtures', 'skills', 'good-with-sidecar');
  const skill = await loadSkill(fixture);

  const result = await installSkills({
    skills: [skill],
    hostIds: ['claude-code', 'cursor'],
    home,
    root: process.cwd(),
    force: true
  });
  assert.equal(result.ok, true, JSON.stringify(result));

  const claudeSkill = join(home, '.claude', 'skills', skill.name, 'SKILL.md');
  const claudeSidecar = join(home, '.claude', 'skills', skill.name, 'skillsforge.json');
  const cursorSkill = join(home, '.cursor', 'skills', skill.name, 'SKILL.md');
  await access(claudeSkill);
  await access(claudeSidecar);
  await access(cursorSkill);
  await assert.rejects(() => access(join(home, '.cursor', 'skills', skill.name, 'skillsforge.json')));

  const portable = await readFile(cursorSkill, 'utf8');
  assert.doesNotMatch(portable, /PreToolUse|hooks:/);
  assert.match(portable, /^---\nname: /);
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

test('installSkills aborts on invalid skill with no writes', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-install-bad-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(join(home, '.cursor'), { recursive: true });

  const badDir = join(home, 'bad-skill');
  await mkdir(badDir, { recursive: true });
  await writeFile(join(badDir, 'SKILL.md'), '---\nname: bad\n---\n\nbody\n');

  // loadSkill will work for minimal, but validate should fail (missing description)
  let skill;
  try {
    skill = await loadSkill(badDir);
  } catch {
    // If loadSkill itself fails, craft a minimal skill object pointing at the dir
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
