import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { discoverTestFiles } from '../scripts/test-lib.mjs';

test('discovers .test.mjs files recursively in stable order', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'skillsforge-runner-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'nested'), { recursive: true });
  await writeFile(join(root, 'b.test.mjs'), '');
  await writeFile(join(root, 'nested', 'a.test.mjs'), '');
  await writeFile(join(root, 'nested', 'helper.mjs'), '');

  assert.deepEqual(
    (await discoverTestFiles(root)).map((path) => path.replaceAll('\\\\', '/').replaceAll('\\', '/')).map((path) => path.slice(path.indexOf(root.replaceAll('\\', '/')) + root.length + 1)),
    ['b.test.mjs', 'nested/a.test.mjs']
  );
});
