import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { parseDocument } from 'yaml';
import { parseFrontmatter } from '../scripts/validate-skill-lib.mjs';

const repoRoot = process.cwd();
const commandsRoot = join(repoRoot, 'plugins', 'skillsforge', 'commands');
const expectedCommands = ['validate', 'route', 'forge', 'doctor', 'verify-receipt'];

test('plugin ships five slash commands with required frontmatter', async () => {
  const entries = await readdir(commandsRoot);
  const names = entries.filter((name) => name.endsWith('.md')).map((name) => name.replace(/\.md$/, '')).sort();
  assert.deepEqual(names, [...expectedCommands].sort());

  for (const name of expectedCommands) {
    const source = await readFile(join(commandsRoot, `${name}.md`), 'utf8');
    const parsed = parseFrontmatter(source);
    assert.ok(parsed, `${name}.md must have YAML frontmatter`);
    const document = parseDocument(parsed.yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
    assert.equal(document.errors.length, 0, document.errors.map((error) => error.message).join('; '));
    const front = document.toJS();

    assert.equal(typeof front.description, 'string');
    assert.ok(front.description.length > 10, `${name} description too short`);
    assert.equal(typeof front['argument-hint'], 'string');
    assert.ok(String(front['argument-hint']).length > 0, `${name} missing argument-hint`);
    assert.ok(front['allowed-tools'], `${name} missing allowed-tools`);

    assert.match(parsed.body, /\$\{CLAUDE_PLUGIN_ROOT\}\/bin\/skillsforge\.mjs/);
    assert.match(parsed.body, /\$ARGUMENTS/);
    assert.doesNotMatch(parsed.body, /scripts\/skillsforge-cli\.mjs/);
  }
});

test('slash commands only reference the bundled CLI binary that exists', async () => {
  const cliPath = join(repoRoot, 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');
  await access(cliPath);

  for (const name of expectedCommands) {
    const source = await readFile(join(commandsRoot, `${name}.md`), 'utf8');
    assert.match(source, /bin\/skillsforge\.mjs/);
  }
});
