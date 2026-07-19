import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { buildLibraryIndex, recommendFromLibrary } from '../lib/capabilities/library.mjs';

const root = process.cwd();

test('README does not advertise dead npx skillsforge CTA', async () => {
  const readme = await readFile(join(root, 'README.md'), 'utf8');
  assert.match(readme, /Not on npm yet|do not use `npx skillsforge`/i);
  assert.match(readme, /node plugins\/skillsforge\/bin\/skillsforge\.mjs demo/);
  for (const match of readme.matchAll(/npx skillsforge/gi)) {
    const start = Math.max(0, match.index - 100);
    const ctx = readme.slice(start, match.index + match[0].length + 20);
    assert.match(
      ctx,
      /do not|Not on npm|not published/i,
      `npx skillsforge without warning context: ${ctx.replace(/\s+/g, ' ')}`
    );
  }
});

test('demo media assets exist for judge poster + mp4', async () => {
  await access(join(root, 'assets', 'skillsforge-demo-poster.png'));
  await access(join(root, 'assets', 'video', 'skillsforge-demo.mp4'));
  await access(join(root, 'assets', 'skillsforge-banner.svg'));
  await access(join(root, 'assets', 'skillsforge-star-map.svg'));
});

test('library recommend returns no confident match for empty/noise queries', async () => {
  const index = await buildLibraryIndex(root, { home: join(root, 'artifacts') });
  const empty = recommendFromLibrary(index, '   ', { limit: 3 });
  assert.equal(empty.confidence, 'none');
  assert.equal(empty.skills.length, 0);
  assert.equal(empty.workflows.length, 0);
  assert.match(empty.note ?? '', /no confident match/i);

  const noise = recommendFromLibrary(index, 'zzzzqx qqqqxyz', { limit: 3 });
  assert.equal(noise.confidence, 'none');
  assert.equal(noise.skills.length, 0);
});

test('library recommend stays non-hardcoded for a real query', async () => {
  const index = await buildLibraryIndex(root, { home: join(root, 'artifacts') });
  const a = recommendFromLibrary(index, 'safe refactor with tests', { limit: 3 });
  const b = recommendFromLibrary(index, 'security audit threat model', { limit: 3 });
  assert.notEqual(a.skills[0]?.id ?? a.workflows[0]?.id, b.skills[0]?.id ?? b.workflows[0]?.id);
  assert.ok(a.confidence === 'high' || a.confidence === 'low');
  assert.ok((a.skills.length + a.workflows.length) > 0);
});
