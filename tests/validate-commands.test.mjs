import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateWithSchema } from '../scripts/schema-lib.mjs';

const root = process.cwd();
const fixtures = (...parts) => join(root, 'tests', 'fixtures', 'commands', ...parts);

test('command schema keeps all supported fields optional and rejects unknown fields', async () => {
  const schema = await loadCommandSchema();
  assert.match(schema.$comment, /https:\/\/code\.claude\.com\/docs\/en\/slash-commands/);
  assert.deepEqual(schema.required ?? [], []);
  assert.equal((await validateWithSchema(schema, {})).valid, true);
  assert.equal((await validateWithSchema(schema, { maturity: 'stable' })).valid, false);
});

test('accepts a fully-described command and a body-only command', async () => {
  const { validateCommandPath } = await loadCommandLib();
  const full = await validateCommandPath(fixtures('good-frontmatter.md'));
  const bodyOnly = await validateCommandPath(fixtures('body-only.md'));

  assert.equal(full.status, 'pass', full.errors.join('\n'));
  assert.equal(bodyOnly.status, 'pass', bodyOnly.errors.join('\n'));
});

test('rejects an invalid known-field type and names an unknown field', async () => {
  const { validateCommandPath } = await loadCommandLib();
  const badType = await validateCommandPath(fixtures('bad-known-field-type.md'));
  const unknown = await validateCommandPath(fixtures('bad-unknown-field.md'));

  assert.equal(badType.status, 'fail');
  assert.match(badType.errors.join('\n'), /disable-model-invocation.*boolean/);
  assert.equal(unknown.status, 'fail');
  assert.match(unknown.errors.join('\n'), /unsupported field maturity/);
});

test('requires strict mapping frontmatter when a frontmatter opener is present', async (context) => {
  const { validateCommandPath } = await loadCommandLib();
  const directory = await mkdtemp(join(tmpdir(), 'skillsforge-commands-test-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const cases = [
    ['list.md', '---\n- one\n- two\n---\n\nInstructions.\n', /frontmatter must be a YAML mapping/],
    ['duplicate.md', '---\nmodel: sonnet\nmodel: opus\n---\n\nInstructions.\n', /invalid YAML/],
    ['incomplete.md', '---\nmodel: sonnet\n\nInstructions.\n', /complete --- delimiter lines/],
    ['empty.md', '---\nmodel: sonnet\n---\n', /body must contain command instructions/]
  ];

  for (const [name, source] of cases) await writeFile(join(directory, name), source);
  for (const [name, , diagnostic] of cases) {
    const report = await validateCommandPath(join(directory, name));
    assert.equal(report.status, 'fail');
    assert.match(report.errors.join('\n'), diagnostic);
  }
});

test('expands command globs deterministically and emits stable reports', async () => {
  const { expandCommandPathPatterns, validateCommandPaths } = await loadCommandLib();
  const pattern = 'tests/fixtures/commands/*.md';
  const expanded = await expandCommandPathPatterns([pattern], root);
  assert.deepEqual(
    expanded.map((path) => path.replaceAll('\\', '/')),
    [
      'tests/fixtures/commands/bad-known-field-type.md',
      'tests/fixtures/commands/bad-unknown-field.md',
      'tests/fixtures/commands/body-only.md',
      'tests/fixtures/commands/good-frontmatter.md'
    ]
  );

  const first = await validateCommandPaths([pattern], { root });
  const second = await validateCommandPaths([pattern], { root });
  assert.equal(first.ok, false);
  assert.equal(first.text, second.text);
  assert.deepEqual(first.reports.map((report) => report.status), ['fail', 'fail', 'pass', 'pass']);
  assert.match(first.text, /^FAIL bad-known-field-type\n[\s\S]*FAIL bad-unknown-field\n[\s\S]*PASS body-only\nPASS good-frontmatter\n$/);
});

async function loadCommandSchema() {
  try {
    return JSON.parse(await readFile(join(root, 'schemas', 'command.frontmatter.schema.json'), 'utf8'));
  } catch (error) {
    assert.fail(`command.frontmatter.schema.json must exist and contain JSON (${error.code ?? error.message})`);
  }
}

async function loadCommandLib() {
  try {
    return await import('../scripts/validate-command-lib.mjs');
  } catch (error) {
    assert.fail(`validate-command-lib.mjs must exist (${error.code ?? error.message})`);
  }
}
