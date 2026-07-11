import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateWithSchema } from '../scripts/schema-lib.mjs';

const root = process.cwd();
const fixtures = (...parts) => join(root, 'tests', 'fixtures', 'mcp', ...parts);

test('MCP schema is strict and accepts every current transport', async () => {
  const schema = await loadMcpSchema();
  assert.match(schema.$comment, /https:\/\/code\.claude\.com\/docs\/en\/plugins-reference#mcp-servers/);
  assert.match(schema.$comment, /https:\/\/code\.claude\.com\/docs\/en\/mcp/);

  for (const type of ['http', 'streamable-http', 'sse', 'ws']) {
    const result = await validateWithSchema(schema, {
      mcpServers: { remote: { type, url: 'https://mcp.example.test' } }
    });
    assert.equal(result.valid, true, `${type}: ${result.errors.join('\n')}`);
  }

  const unknown = await validateWithSchema(schema, {
    mcpServers: { local: { command: 'node', extra: true } }
  });
  assert.equal(unknown.valid, false);
  assert.match(unknown.errors.join('\n'), /unsupported field extra/);
});

test('accepts portable stdio and HTTP fixture configurations', async () => {
  const { validateMcpPath } = await loadMcpLib();
  for (const name of ['good-stdio.json', 'good-http.json', 'good-slash-switches.json']) {
    const report = await validateMcpPath(fixtures(name));
    assert.equal(report.status, 'pass', `${name}: ${report.errors.join('\n')}`);
  }
});

test('accepts unambiguous slash switches in stdio arguments', async () => {
  const { validateMcpPath } = await loadMcpLib();
  const report = await validateMcpPath(fixtures('good-slash-switches.json'));
  assert.equal(report.status, 'pass', report.errors.join('\n'));
});

test('provides targeted diagnostics for missing stdio command and URL without type', async () => {
  const { validateMcpPath } = await loadMcpLib();
  const missingCommand = await validateMcpPath(fixtures('bad-missing-command.json'));
  const urlWithoutType = await validateMcpPath(fixtures('bad-url-without-type.json'));

  assert.equal(missingCommand.status, 'fail');
  assert.match(missingCommand.errors.join('\n'), /server broken-stdio.*missing required command/);
  assert.equal(urlWithoutType.status, 'fail');
  assert.match(urlWithoutType.errors.join('\n'), /server ambiguous-remote.*URL requires explicit type/);
});

test('rejects machine-absolute stdio paths and identifies server and field', async (context) => {
  const { validateMcpPath } = await loadMcpLib();
  const fixtureReport = await validateMcpPath(fixtures('bad-absolute-path.json'));
  assert.equal(fixtureReport.status, 'fail');
  assert.match(fixtureReport.errors.join('\n'), /server local-only.*field command.*machine-absolute path/);

  const directory = await mkdtemp(join(tmpdir(), 'skillsforge-mcp-test-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, '.mcp.json');
  await writeFile(path, JSON.stringify({
    mcpServers: {
      posix: { command: '/usr/local/bin/server' },
      argument: { command: 'node', args: ['C:\\workspace\\server.mjs'] },
      environment: { command: 'node', env: { SERVER_HOME: '\\\\host\\share\\server' } },
      working: { command: 'node', cwd: '/opt/server' }
    }
  }));

  const report = await validateMcpPath(path);
  assert.equal(report.status, 'fail');
  const diagnostics = report.errors.join('\n');
  assert.match(diagnostics, /server posix.*field command/);
  assert.match(diagnostics, /server argument.*field args\[0\]/);
  assert.match(diagnostics, /server environment.*field env\.SERVER_HOME/);
  assert.match(diagnostics, /server working.*field cwd/);
});

test('rejects Windows rooted and NT absolute paths in every portable stdio field', async () => {
  const { validateMcpPath } = await loadMcpLib();
  const report = await validateMcpPath(fixtures('bad-rooted-paths.json'));

  assert.equal(report.status, 'fail');
  const diagnostics = report.errors.join('\n');
  assert.match(diagnostics, /server rooted-command.*field command/);
  assert.match(diagnostics, /server rooted-argument.*field args\[0\]/);
  assert.match(diagnostics, /server posix-argument.*field args\[0\]/);
  assert.match(diagnostics, /server rooted-environment.*field env\.SERVER_HOME/);
  assert.match(diagnostics, /server rooted-working-directory.*field cwd/);
});

test('reports invalid JSON, validates globs deterministically, and emits stable text', async (context) => {
  const { expandMcpPathPatterns, validateMcpPath, validateMcpPaths } = await loadMcpLib();
  const directory = await mkdtemp(join(tmpdir(), 'skillsforge-mcp-json-test-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const invalid = join(directory, 'invalid.json');
  await writeFile(invalid, '{"mcpServers":');
  const invalidReport = await validateMcpPath(invalid);
  assert.equal(invalidReport.status, 'fail');
  assert.match(invalidReport.errors.join('\n'), /invalid JSON/);

  const pattern = 'tests/fixtures/mcp/good-*.json';
  const expanded = await expandMcpPathPatterns([pattern], root);
  assert.deepEqual(
    expanded.map((path) => path.replaceAll('\\', '/')),
    [
      'tests/fixtures/mcp/good-http.json',
      'tests/fixtures/mcp/good-slash-switches.json',
      'tests/fixtures/mcp/good-stdio.json'
    ]
  );
  const first = await validateMcpPaths([pattern], { root });
  const second = await validateMcpPaths([pattern], { root });
  assert.equal(first.ok, true, first.text);
  assert.equal(first.text, 'PASS good-http.json\nPASS good-slash-switches.json\nPASS good-stdio.json\n');
  assert.equal(first.text, second.text);
});

async function loadMcpSchema() {
  try {
    return JSON.parse(await readFile(join(root, 'schemas', 'mcp.schema.json'), 'utf8'));
  } catch (error) {
    assert.fail(`mcp.schema.json must exist and contain JSON (${error.code ?? error.message})`);
  }
}

async function loadMcpLib() {
  try {
    return await import('../scripts/validate-mcp-lib.mjs');
  } catch (error) {
    assert.fail(`validate-mcp-lib.mjs must exist (${error.code ?? error.message})`);
  }
}
