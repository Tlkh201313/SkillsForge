import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { discoverTestFiles } from '../scripts/test-lib.mjs';

test('discovers .test.mjs files recursively in stable order', async (context) => {
  const root = join(context.mock.timers ? process.cwd() : process.cwd(), 'tests', '.tmp-runner');
  await mkdir(join(root, 'nested'), { recursive: true });
  await writeFile(join(root, 'b.test.mjs'), '');
  await writeFile(join(root, 'nested', 'a.test.mjs'), '');
  await writeFile(join(root, 'nested', 'helper.mjs'), '');

  assert.deepEqual(
    (await discoverTestFiles(root)).map((path) => path.replaceAll('\\\\', '/').replaceAll('\\', '/')).map((path) => path.slice(path.indexOf('tests/.tmp-runner'))),
    ['tests/.tmp-runner/b.test.mjs', 'tests/.tmp-runner/nested/a.test.mjs']
  );
});
