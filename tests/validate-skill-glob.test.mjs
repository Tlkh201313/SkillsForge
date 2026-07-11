import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { expandSkillPathPatterns } from '../scripts/validate-skill-lib.mjs';

test('expands wildcard skill path patterns for shells that pass globs literally', async () => {
  const paths = await expandSkillPathPatterns(['tests/fixtures/skills/bad-*'], process.cwd());
  assert.deepEqual(
    paths.map((path) => path.replaceAll('\\\\', '/').replaceAll('\\', '/')).map((path) => path.slice(path.indexOf('tests/fixtures/skills/'))),
    [
      'tests/fixtures/skills/bad-description',
      'tests/fixtures/skills/bad-frontmatter-size',
      'tests/fixtures/skills/bad-link',
      'tests/fixtures/skills/bad-maturity',
      'tests/fixtures/skills/bad-name',
      'tests/fixtures/skills/bad-platform',
      'tests/fixtures/skills/bad-requires',
      'tests/fixtures/skills/bad-sections'
    ]
  );
});
