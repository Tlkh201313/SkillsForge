import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSkillPath, validateSkillPaths } from '../scripts/validate-skill-lib.mjs';

const fixtures = (...parts) => join(process.cwd(), 'tests', 'fixtures', 'skills', ...parts);

test('passes portable skills with standard metadata and local resources', async () => {
  const result = await validateSkillPaths(
    [fixtures('good-basic'), fixtures('good-with-metadata'), fixtures('good-with-sidecar')],
    { root: process.cwd() }
  );
  assert.equal(result.ok, true, result.text);
  assert.deepEqual(result.reports.map((report) => report.status), ['pass', 'pass', 'pass']);
  assert.match(result.text, /PASS good-basic \(canonical\)/);
});

const badCases = [
  ['bad-name', /name must equal directory name/],
  ['bad-description', /description.*must NOT have fewer than 1 characters/],
  ['bad-unknown-field', /unsupported field maturity/],
  ['bad-empty-body', /body must contain skill instructions/],
  ['bad-link', /relative markdown link must resolve/],
  ['bad-sidecar', /skillsforge\.json/]
];

for (const [name, expected] of badCases) {
  test(`fails ${name} with a specific diagnostic`, async () => {
    const report = await validateSkillPath(fixtures(name), { root: process.cwd() });
    assert.equal(report.status, 'fail');
    assert.match(report.errors.join('\n'), expected);
  });
}

test('accepts BOM, CRLF, multiline YAML, and descriptions that do not start with Use when', async (context) => {
  const root = await temporarySkillRoot(context);
  const directory = join(root, 'portable-skill');
  await mkdir(directory);
  await writeFile(join(directory, 'SKILL.md'), '\uFEFF---\r\nname: portable-skill\r\ndescription: >-\r\n  Review portable skills across\r\n  supported agent clients.\r\nmetadata:\r\n  version: "1.0"\r\n---\r\n\r\n# Portable skill\r\n\r\nReview the requested package.\r\n');

  const report = await validateSkillPath(directory, { root });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
});

test('rejects duplicate YAML keys', async (context) => {
  const root = await temporarySkillRoot(context);
  const directory = await writeSkill(root, 'duplicate-key', `---\nname: duplicate-key\nname: duplicate-key\ndescription: Duplicate key fixture.\n---\n\nInstructions.\n`);
  const report = await validateSkillPath(directory, { root });
  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /Map keys must be unique/);
});

test('supports Claude Code extensions only under the explicit profile', async (context) => {
  const root = await temporarySkillRoot(context);
  const directory = await writeSkill(root, 'claude-extension', `---\nname: claude-extension\ndescription: Run a controlled deployment. Use when the user explicitly requests deployment.\ndisable-model-invocation: true\nallowed-tools:\n  - Read\n  - Bash(git:*)\n---\n\nDeploy only after confirmation.\n`);

  const canonical = await validateSkillPath(directory, { root });
  const claude = await validateSkillPath(directory, { root, profile: 'claude-code' });
  assert.equal(canonical.status, 'fail');
  assert.equal(claude.status, 'pass', claude.errors.join('\n'));
});

test('rejects sibling-prefix path escapes', async (context) => {
  const root = await temporarySkillRoot(context);
  const skill = await writeSkill(root, 'foo', `---\nname: foo\ndescription: Validate a boundary check. Use when testing resource containment.\n---\n\nRead [outside](../foobar/note.md).\n`);
  await mkdir(join(root, 'foobar'));
  await writeFile(join(root, 'foobar', 'note.md'), '# Outside');

  const report = await validateSkillPath(skill, { root });
  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /must stay inside skill directory/);
});

test('rejects executable URI schemes in Markdown links', async (context) => {
  const root = await temporarySkillRoot(context);
  const skill = await writeSkill(root, 'unsafe-link', `---\nname: unsafe-link\ndescription: Validate unsafe links. Use when testing URI scheme restrictions.\n---\n\nOpen [unsafe](javascript:alert%281%29).\n`);

  const report = await validateSkillPath(skill, { root });
  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /unsupported URI scheme/);
});

test('all mode fails closed when no production skills exist', async (context) => {
  const root = await temporarySkillRoot(context);
  await mkdir(join(root, 'skills'));
  const result = await validateSkillPaths([], { root, all: true });
  assert.equal(result.ok, false);
  assert.match(result.text, /FAIL No skills found/);
});

test('all mode discovers skills across plugins', async (context) => {
  const root = await temporarySkillRoot(context);
  const skill = join(root, 'plugins', 'example-plugin', 'skills', 'market-skill');
  await mkdir(skill, { recursive: true });
  await writeFile(join(skill, 'SKILL.md'), `---\nname: market-skill\ndescription: Validate marketplace discovery. Use when testing skills nested under a plugin.\n---\n\n# Market Skill\n\nRun the requested check.\n`);

  const result = await validateSkillPaths([], { root, all: true });
  assert.equal(result.ok, true, result.text);
  assert.deepEqual(result.reports.map((report) => report.name), ['market-skill']);
});

async function temporarySkillRoot(context) {
  const root = await mkdtemp(join(tmpdir(), 'skillsforge-test-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function writeSkill(root, name, source) {
  const directory = join(root, name);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'SKILL.md'), source);
  return directory;
}
