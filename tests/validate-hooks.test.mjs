import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const fixtures = (...parts) => join(root, 'tests', 'fixtures', 'hooks', ...parts);
const officialEvents = [
  'SessionStart',
  'Setup',
  'UserPromptSubmit',
  'UserPromptExpansion',
  'PreToolUse',
  'PermissionRequest',
  'PermissionDenied',
  'PostToolUse',
  'PostToolUseFailure',
  'PostToolBatch',
  'Notification',
  'MessageDisplay',
  'SubagentStart',
  'SubagentStop',
  'TaskCreated',
  'TaskCompleted',
  'Stop',
  'StopFailure',
  'TeammateIdle',
  'InstructionsLoaded',
  'ConfigChange',
  'CwdChanged',
  'FileChanged',
  'WorktreeCreate',
  'WorktreeRemove',
  'PreCompact',
  'PostCompact',
  'Elicitation',
  'ElicitationResult',
  'SessionEnd'
];

test('protects the current official hook event enum contract', async () => {
  const schema = await loadHooksSchema();
  assert.deepEqual(schema.$defs.events.enum, officialEvents);
  assert.match(schema.$comment, /https:\/\/code\.claude\.com\/docs\/en\/hooks/);
  assert.match(schema.$comment, /update/i);
});

test('accepts matcher groups containing all five current handler types', async () => {
  const { validateHooksPath } = await loadHooksLib();
  const report = await validateHooksPath(fixtures('good-flow-hooks.json'));

  assert.deepEqual(report, {
    name: 'good-flow-hooks.json',
    path: fixtures('good-flow-hooks.json'),
    status: 'pass',
    errors: []
  });
});

test('names an unsupported event in the diagnostic', async () => {
  const { validateHooksPath } = await loadHooksLib();
  const report = await validateHooksPath(fixtures('bad-unknown-event.json'));

  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /unknown event ToolUse/);
});

test('names required command in the missing command diagnostic', async () => {
  const { validateHooksPath } = await loadHooksLib();
  const report = await validateHooksPath(fixtures('bad-missing-command.json'));

  assert.equal(report.status, 'fail');
  assert.match(report.errors.join('\n'), /required command/);
});

test('expands hook globs in deterministic order and produces stable report text', async () => {
  const { expandHooksPathPatterns, validateHooksPaths } = await loadHooksLib();
  const pattern = 'tests/fixtures/hooks/bad-*.json';
  const expanded = await expandHooksPathPatterns([pattern], root);

  assert.deepEqual(
    expanded.map((path) => path.replaceAll('\\', '/')),
    [
      'tests/fixtures/hooks/bad-missing-command.json',
      'tests/fixtures/hooks/bad-unknown-event.json'
    ]
  );

  const result = await validateHooksPaths([pattern], { root });
  assert.equal(result.ok, false);
  assert.deepEqual(result.reports.map((report) => report.status), ['fail', 'fail']);
  assert.match(result.text, /^FAIL bad-missing-command\.json\n  - .*required command\nFAIL bad-unknown-event\.json\n  - .*unknown event ToolUse\n$/);
});

test('reports invalid JSON and strict unknown fields without throwing', async (context) => {
  const { validateHooksPath } = await loadHooksLib();
  const directory = await mkdtemp(join(tmpdir(), 'skillsforge-hooks-test-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const cases = [
    ['invalid.json', '{"hooks":', /invalid JSON/],
    [
      'unknown-group-field.json',
      JSON.stringify({ hooks: { Stop: [{ label: 'nope', hooks: [{ type: 'command', command: 'echo ok' }] }] } }),
      /unsupported field label/
    ],
    [
      'unknown-handler-field.json',
      JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo ok', cwd: '.' }] }] } }),
      /unsupported field cwd/
    ]
  ];

  for (const [name, source] of cases) await writeFile(join(directory, name), source);
  for (const [name, , expected] of cases) {
    const report = await validateHooksPath(join(directory, name));
    assert.equal(report.status, 'fail');
    assert.match(report.errors.join('\n'), expected);
  }
});

async function loadHooksSchema() {
  try {
    return JSON.parse(await readFile(join(root, 'schemas', 'hooks.schema.json'), 'utf8'));
  } catch (error) {
    assert.fail(`hooks.schema.json must exist and contain JSON (${error.code ?? error.message})`);
  }
}

async function loadHooksLib() {
  try {
    return await import('../scripts/validate-hooks-lib.mjs');
  } catch (error) {
    assert.fail(`validate-hooks-lib.mjs must exist (${error.code ?? error.message})`);
  }
}
