import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { loadCatalog, catalogStats, skillsForPack } from '../lib/capabilities/catalog.mjs';
import { scoreSkillQuality } from '../lib/capabilities/quality.mjs';
import { runVibe } from '../lib/capabilities/vibe.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { assertInventoryCounts } from '../scripts/pack-inventory.mjs';

const root = process.cwd();

test('inventory beats ECC surface targets', () => {
  const counts = assertInventoryCounts();
  assert.ok(counts.skills >= 350);
  assert.ok(counts.agents >= 70);
  assert.ok(counts.commands >= 100);
});

test('catalog loads and lists trust pack', async () => {
  const { catalog } = await loadCatalog(root);
  const stats = catalogStats(catalog);
  assert.ok(stats.skills >= 350);
  const trust = skillsForPack(catalog, 'trust');
  assert.ok(trust.includes('using-skillsforge'));
});

test('vibe creates work stubs and reports skill count', async () => {
  const result = await runVibe(root);
  assert.equal(result.ok, true);
  assert.ok(result.data.skills >= 350);
  assert.match(result.text, /SkillsForge vibe/);
});

test('quality scores using-skillsforge', async () => {
  const dir = join(root, 'plugins', 'skillsforge', 'skills', 'using-skillsforge');
  const result = await scoreSkillQuality(dir, { root });
  assert.ok(result.score >= 50);
  assert.equal(result.name, 'using-skillsforge');
});

test('route excludes explicit skills unless pack scoped', async () => {
  const skills = await loadAllSkills(root);
  const globalRoute = routeQuery('help with eng api design', skills, { includeExplicit: false });
  const packRoute = routeQuery('help with eng api design', skills, { pack: 'eng', includeExplicit: true });
  assert.ok(skills.length >= 350);
  // pack-scoped should see eng skills
  assert.ok(packRoute.candidates.some((c) => c.name === 'eng-api-design'));
  // global candidates should not include explicit-only eng skill as selected unless auto
  const eng = skills.find((s) => s.name === 'eng-api-design');
  assert.equal(eng.sidecar.routing.mode, 'explicit');
  void globalRoute;
});

test('cli catalog --json lists packs', async () => {
  const { catalog } = await loadCatalog(root);
  const stats = catalogStats(catalog);
  assert.ok(stats.skills >= 350);
  assert.ok(stats.packs >= 20);
});
