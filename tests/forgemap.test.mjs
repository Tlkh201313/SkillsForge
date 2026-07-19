import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildLightweightIndex, runForgeMap } from '../lib/capabilities/forgemap.mjs';

async function fixtureRepo() {
  const root = await mkdtemp(join(tmpdir(), 'sf-map-'));
  await mkdir(join(root, 'lib'), { recursive: true });
  await writeFile(join(root, 'lib', 'alpha.mjs'), `export function alphaHelper() {\n  return 1;\n}\n`);
  await writeFile(
    join(root, 'lib', 'beta.mjs'),
    `import { alphaHelper } from './alpha.mjs';\nexport function betaCaller() {\n  return alphaHelper();\n}\n`
  );
  await writeFile(join(root, 'lib', 'gamma.mjs'), `import { betaCaller } from './beta.mjs';\nexport const g = betaCaller;\n`);
  return root;
}

test('buildLightweightIndex finds exports and import edges', async (context) => {
  const root = await fixtureRepo();
  context.after(() => rm(root, { recursive: true, force: true }));
  const index = await buildLightweightIndex(root);
  assert.ok(index.files.length >= 3);
  assert.ok(index.symbols.some((s) => s.name === 'alphaHelper'));
  assert.ok(index.edges.some((e) => e.from.includes('beta') && e.to.includes('alpha')));
});

test('map symbol / callers / impact / explore', async (context) => {
  const root = await fixtureRepo();
  context.after(() => rm(root, { recursive: true, force: true }));

  const indexed = await runForgeMap(root, 'index');
  assert.equal(indexed.ok, true);
  assert.ok(indexed.files >= 3);

  const symbol = await runForgeMap(root, 'symbol', { name: 'alphaHelper' });
  assert.equal(symbol.ok, true);
  assert.ok(symbol.count >= 1);
  assert.match(symbol.lines[0], /alphaHelper/);

  const callers = await runForgeMap(root, 'callers', { name: 'alphaHelper' });
  assert.equal(callers.ok, true);
  assert.ok(callers.importers.some((f) => f.includes('beta')));

  const impact = await runForgeMap(root, 'impact', { name: 'alphaHelper', depth: 2 });
  assert.equal(impact.ok, true);
  assert.ok(impact.files.some((f) => f.includes('beta')) || impact.seeds.some((f) => f.includes('alpha')));

  const explore = await runForgeMap(root, 'explore', { query: 'alphaHelper', budget: 2000 });
  assert.equal(explore.ok, true);
  assert.ok(explore.symbols.some((s) => s.name === 'alphaHelper'));

  const status = await runForgeMap(root, 'status');
  assert.equal(status.ok, true);
  assert.equal(status.codegraph.linked, false);
});

test('map explore requires query', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sf-map-empty-'));
  const result = await runForgeMap(root, 'explore', { query: '' });
  assert.equal(result.ok, false);
  await rm(root, { recursive: true, force: true });
});
