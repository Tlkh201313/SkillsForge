import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { forgeSkill } from '../lib/capabilities/forge.mjs';
import { loadSkill } from '../lib/capabilities/skill-loader.mjs';
import { scanSkill } from '../lib/capabilities/policy.mjs';
import { validateSkillPath } from '../scripts/validate-skill-lib.mjs';

const fixtureUrl = new URL('./fixtures/forge/safe-upgrade.spec.json', import.meta.url);

async function readSpec() {
  return JSON.parse(await readFile(fixtureUrl, 'utf8'));
}

async function temporaryOutput(context) {
  const root = await mkdtemp(join(tmpdir(), 'skillsforge-forge-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('forge dry-run returns files without writing', async (context) => {
  const outRoot = await temporaryOutput(context);
  const result = await forgeSkill(await readSpec(), { outRoot, dryRun: true });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.deepEqual(result.files.map((file) => file.path), ['SKILL.md', 'skillsforge.json']);
  await assert.rejects(() => access(join(outRoot, 'safe-upgrade')));
});

test('forge write refuses any existing target without force', async (context) => {
  const outRoot = await temporaryOutput(context);
  await mkdir(join(outRoot, 'safe-upgrade'));

  const result = await forgeSkill(await readSpec(), { outRoot, write: true });

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /refusing to overwrite existing skill without --force/);
});

test('forge --force overwrites an existing target atomically', async (context) => {
  const outRoot = await temporaryOutput(context);
  const target = join(outRoot, 'safe-upgrade');
  await mkdir(target, { recursive: true });
  await writeFile(join(target, 'SKILL.md'), 'stale');

  const result = await forgeSkill(await readSpec(), { outRoot, write: true, force: true });

  assert.equal(result.ok, true, result.errors?.join('\n'));
  assert.equal(result.dryRun, false);
  const written = await readFile(join(target, 'SKILL.md'), 'utf8');
  assert.match(written, /name: safe-upgrade/);
  assert.ok(!(await readdir(outRoot)).some((name) => name.includes('.staging-')));
});

test('forge rejects an invalid spec without writing', async (context) => {
  const outRoot = await temporaryOutput(context);
  const spec = await readSpec();
  delete spec.routing.triggers;

  const result = await forgeSkill(spec, { outRoot, write: true });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('forge-spec')));
  await assert.rejects(() => access(join(outRoot, 'safe-upgrade')));
});

test('forge rejects policy-violating content and leaves no staging residue', async (context) => {
  const outRoot = await temporaryOutput(context);
  const spec = await readSpec();
  spec.overview = 'Never call child_process.exec from this skill.';

  const result = await forgeSkill(spec, { outRoot, write: true });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('undeclared-exec-content')));
  await assert.rejects(() => access(join(outRoot, 'safe-upgrade')));
  assert.ok(!(await readdir(outRoot)).some((name) => name.includes('.staging-')));
});

test('forge writes a generated skill that validates and passes policy scan', async (context) => {
  const outRoot = await temporaryOutput(context);
  const result = await forgeSkill(await readSpec(), { outRoot, write: true });

  assert.equal(result.ok, true, result.errors?.join('\n'));
  const validation = await validateSkillPath(result.target, { root: process.cwd() });
  assert.equal(validation.status, 'pass', validation.errors?.join('\n'));
  const loaded = await loadSkill(result.target);
  assert.equal(loaded.name, 'safe-upgrade');
  assert.equal(loaded.sidecar.routing.triggers[0], 'safe dependency upgrade');
  const findings = await scanSkill({
    ...loaded,
    files: loaded.files.filter((file) => file !== loaded.sidecarFile)
  });
  assert.equal(findings.filter((item) => item.blocking).length, 0);
});
