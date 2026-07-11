import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  expandAgentPathPatterns,
  validateAgentPath,
  validateAgentPaths
} from '../scripts/validate-agent-lib.mjs';

const fixtures = (...parts) => join(process.cwd(), 'tests', 'fixtures', 'agents', ...parts);

test('preserves the agent fixture status vector and stable report text', async () => {
  const names = [
    'good-minimal.md',
    'good-full.md',
    'bad-missing-desc.md',
    'bad-permissionMode.md',
    'bad-isolation-value.md'
  ];
  const result = await validateAgentPaths(names.map((name) => fixtures(name)), { root: process.cwd() });

  assert.equal(result.ok, false);
  assert.deepEqual(result.reports.map((report) => report.status), ['pass', 'pass', 'fail', 'fail', 'fail']);
  assert.match(result.text, /^PASS good-minimal\nPASS good-full\nFAIL bad-missing-desc/m);
});

test('expands wildcard agent file paths in deterministic order', async () => {
  const paths = await expandAgentPathPatterns(['tests/fixtures/agents/good-*.md'], process.cwd());
  assert.deepEqual(
    paths.map((path) => path.replaceAll('\\', '/')),
    [
      'tests/fixtures/agents/good-full.md',
      'tests/fixtures/agents/good-minimal.md'
    ]
  );
});

test('names the forbidden permissionMode field in its diagnostic', async () => {
  const report = await validateAgentPath(fixtures('bad-permissionMode.md'));
  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /unsupported field permissionMode/);
});

test('names worktree in the bad isolation diagnostic', async () => {
  const report = await validateAgentPath(fixtures('bad-isolation-value.md'));
  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /isolation.*worktree/);
});

test('rejects a non-mapping frontmatter, empty body, and filename mismatch', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'skillsforge-agent-test-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const cases = [
    ['not-a-map.md', '---\n- name\n- description\n---\n\nInstructions.\n', /frontmatter must be a YAML mapping/],
    ['empty-body.md', '---\nname: empty-body\ndescription: Require instructions.\n---\n', /body must contain agent instructions/],
    ['filename.md', '---\nname: another-name\ndescription: Match the file basename.\n---\n\nInstructions.\n', /name must equal file basename/]
  ];

  for (const [filename, source] of cases) await writeFile(join(root, filename), source);
  for (const [filename, , expected] of cases) {
    const report = await validateAgentPath(filename, { root });
    assert.equal(report.status, 'fail');
    assert.match(report.errors.join('\n'), expected);
  }
});
