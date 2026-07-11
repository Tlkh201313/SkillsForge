import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { validateSkillPath, validateSkillPaths } from '../scripts/validate-skill-lib.mjs';

const fixtures = (...parts) => join(process.cwd(), 'tests', 'fixtures', 'skills', ...parts);

test('passes good fixtures with clear per-skill reports', async () => {
  const result = await validateSkillPaths([fixtures('good-basic'), fixtures('good-with-require')], { root: process.cwd() });
  assert.equal(result.ok, true);
  assert.deepEqual(result.reports.map((report) => report.status), ['pass', 'pass']);
  assert.match(result.text, /PASS good-basic/);
  assert.match(result.text, /PASS good-with-require/);
});

const badCases = [
  ['bad-name', /name must equal directory name/],
  ['bad-description', /description must start with "Use when"/],
  ['bad-frontmatter-size', /frontmatter block must be under 1024 characters/],
  ['bad-maturity', /maturity must be one of/],
  ['bad-platform', /platform must be one of/],
  ['bad-requires', /requires entry "missing-skill" must resolve/],
  ['bad-sections', /body must contain ## Overview|body must contain ## When to Use/],
  ['bad-link', /relative markdown link must resolve/]
];

for (const [name, expected] of badCases) {
  test(`fails ${name} with the specific rule`, async () => {
    const report = await validateSkillPath(fixtures(name), { root: process.cwd() });
    assert.equal(report.status, 'fail');
    assert.match(report.errors.join('\n'), expected);
  });
}

test('all mode ignores fixture directories and passes when no real skills exist', async () => {
  const result = await validateSkillPaths([], { root: process.cwd(), all: true });
  assert.equal(result.ok, true);
  assert.match(result.text, /No skills found/);
});
