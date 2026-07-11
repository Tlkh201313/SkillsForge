import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const repositoryRoot = process.cwd();
const lintFixtures = (...parts) => join(repositoryRoot, 'tests', 'fixtures', 'lint', ...parts);
const pluginBudgets = {
  skillsforge: 350,
  'forge-flow': 1100,
  'forge-lean': 450,
  'forge-gauge': 600,
  'forge-web': 900,
  'forge-guard': 900,
  'forge-data': 900,
  'forge-scribe': 900,
  'forge-ops': 900
};
const baseConfig = {
  listingLengthLimit: 1536,
  bodyWarningBudget: 500,
  bodyErrorLimit: 2000,
  pluginBudgets
};

test('loads named limits and current plugin budgets from forgelint.json', async () => {
  const { estimateTokens, loadLintConfig } = await loadLintLib();
  const config = await loadLintConfig(repositoryRoot);

  assert.deepEqual(config, baseConfig);
  assert.equal(estimateTokens('12345'), 2);
});

test('enforces trigger-cue independently from otherwise valid listing text', async (context) => {
  const root = await temporaryRoot(context);
  const skill = await writeSkill(root, 'missing-trigger', {
    description: 'Review release evidence and return a concise readiness verdict for maintainers.'
  });
  const { lintSkillPath } = await loadLintLib();
  const result = await lintSkillPath(skill, { root, config: baseConfig });

  assert.deepEqual(result.findings.map(({ rule, severity }) => ({ rule, severity })), [
    { rule: 'trigger-cue', severity: 'error' }
  ]);
  assert.equal(result.ok, false);
});

test('rejects short, generic, and normalized bare-name description openings', async (context) => {
  const root = await temporaryRoot(context);
  const cases = [
    ['short-copy', 'Review. Use when asked.'],
    ['generic-this', 'This skill reviews deployment evidence. Use when a release needs a decision.'],
    ['generic-this-dot', 'This skill. Reviews deployment evidence. Use when a release needs a decision.'],
    ['generic-a', 'A skill for reviewing deployment evidence. Use when a release needs a decision.'],
    ['generic-a-comma', 'A skill, for reviewing deployment evidence. Use when a release needs a decision.'],
    ['release-check', 'Release_check, reviews deployment evidence. Use when a release needs a decision.']
  ];
  const { lintSkillPath } = await loadLintLib();

  for (const [name, description] of cases) {
    const skill = await writeSkill(root, name, { description });
    const result = await lintSkillPath(skill, { root, config: baseConfig });
    assert.equal(result.findings.filter((finding) => finding.rule === 'description-shape').length, 1, name);
  }
});

test('enforces the named combined listing length limit', async (context) => {
  const root = await temporaryRoot(context);
  const skill = await writeSkill(root, 'long-listing', {
    description: `Review changes and report risks. Use when maintainers request a release check. ${'x'.repeat(740)}`,
    whenToUse: `Invoke when additional listing context is required. ${'y'.repeat(760)}`
  });
  const { lintSkillPath } = await loadLintLib();
  const result = await lintSkillPath(skill, { root, config: baseConfig });

  assert.equal(result.findings.filter((finding) => finding.rule === 'listing-length').length, 1);
  assert.match(result.findings.find((finding) => finding.rule === 'listing-length').message, /1536/);
});

test('warns on the deliberately bloated fixture and keeps warnings non-fatal', async () => {
  const { lintSkillPath } = await loadLintLib();
  const result = await lintSkillPath(lintFixtures('skills', 'bloated-body'), {
    root: repositoryRoot,
    config: baseConfig
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.findings.map(({ rule, severity }) => ({ rule, severity })), [
    { rule: 'body-budget', severity: 'warn' },
    { rule: 'deep-reference', severity: 'warn' }
  ]);
  assert.match(result.text, /^WARN body-budget /m);
});

test('makes the hard body ceiling fatal and never lets metadata override it', async (context) => {
  const root = await temporaryRoot(context);
  const skill = await writeSkill(root, 'hard-limit', {
    metadata: { 'token-budget': '9999' },
    body: 'x'.repeat(8001)
  });
  const { lintSkillPath } = await loadLintLib();
  const result = await lintSkillPath(skill, { root, config: baseConfig });
  const budgetFinding = result.findings.find((finding) => finding.rule === 'body-budget');

  assert.equal(result.ok, false);
  assert.equal(budgetFinding.severity, 'error');
  assert.match(budgetFinding.message, /2000/);
});

test('accepts only a positive integer-string metadata warning-budget override', async (context) => {
  const root = await temporaryRoot(context);
  const body = 'x'.repeat(2400);
  const stringOverride = await writeSkill(root, 'string-override', {
    metadata: { 'token-budget': '700' },
    body
  });
  const numericOverride = await writeSkill(root, 'numeric-override', {
    rawMetadata: '  token-budget: 700',
    body
  });
  const { lintSkillPath } = await loadLintLib();

  const accepted = await lintSkillPath(stringOverride, { root, config: baseConfig });
  const ignored = await lintSkillPath(numericOverride, { root, config: baseConfig });
  assert.equal(accepted.findings.some((finding) => finding.rule === 'body-budget'), false);
  assert.equal(ignored.findings.some((finding) => finding.rule === 'body-budget'), true);
});

test('requires a Markdown references link only when the warning budget is exceeded', async (context) => {
  const root = await temporaryRoot(context);
  const withoutReference = await writeSkill(root, 'no-reference', { body: 'x'.repeat(2400) });
  const withReference = await writeSkill(root, 'with-reference', {
    body: `[Detailed procedure](./references/details.md)\n\n${'x'.repeat(2400)}`
  });
  const withExternalReference = await writeSkill(root, 'external-reference', {
    body: `[External material](https://example.com/references/details.md)\n\n${'x'.repeat(2400)}`
  });
  const withReferenceStyleLink = await writeSkill(root, 'reference-style', {
    body: `[Detailed procedure][depth]\n\n${'x'.repeat(2400)}\n\n[depth]: <./references/details.md> "Details"`
  });
  const { lintSkillPath } = await loadLintLib();

  const absent = await lintSkillPath(withoutReference, { root, config: baseConfig });
  const present = await lintSkillPath(withReference, { root, config: baseConfig });
  const external = await lintSkillPath(withExternalReference, { root, config: baseConfig });
  const referenceStyle = await lintSkillPath(withReferenceStyleLink, { root, config: baseConfig });
  assert.equal(absent.findings.some((finding) => finding.rule === 'deep-reference'), true);
  assert.equal(present.findings.some((finding) => finding.rule === 'deep-reference'), false);
  assert.equal(present.findings.some((finding) => finding.rule === 'body-budget'), true);
  assert.equal(external.findings.some((finding) => finding.rule === 'deep-reference'), true);
  assert.equal(referenceStyle.findings.some((finding) => finding.rule === 'deep-reference'), false);
});

test('detects supported inline and fenced dynamic commands and validates every family', async (context) => {
  const root = await temporaryRoot(context);
  const safe = await writeSkill(root, 'safe-dynamic', {
    disableModelInvocation: true,
    allowedTools: ['Bash(gh *)', 'Bash(git:*)'],
    body: 'PR: !`gh pr view`\nKEY=!`node ignored`\n\n```!\ngh pr view \\\n  --json title\ngit status --short\n```\n\n```!bash\npython ignored.py\n```\n'
  });
  const unsafe = await writeSkill(root, 'unsafe-dynamic', {
    allowedTools: 'Read Bash(gh *)',
    body: '!`gh pr view`\n\n```!\nnpm test\ngit status --short\n```\n'
  });
  const generallyAllowed = await writeSkill(root, 'general-bash', {
    allowedTools: ['Read', 'Bash'],
    body: '!`node --version`\n'
  });
  const { lintSkillPath } = await loadLintLib();

  const safeResult = await lintSkillPath(safe, { root, config: baseConfig });
  const unsafeResult = await lintSkillPath(unsafe, { root, config: baseConfig });
  const generalResult = await lintSkillPath(generallyAllowed, { root, config: baseConfig });
  assert.equal(safeResult.findings.some((finding) => finding.rule === 'dynamic-context-safety'), false);
  assert.equal(unsafeResult.findings.filter((finding) => finding.rule === 'dynamic-context-safety' && finding.severity === 'warn').length, 1);
  assert.deepEqual(
    unsafeResult.findings
      .filter((finding) => finding.rule === 'dynamic-context-safety' && finding.severity === 'error')
      .map((finding) => finding.message.match(/family "([^"]+)"/)[1]),
    ['git', 'npm']
  );
  assert.deepEqual(generalResult.findings.map(({ rule, severity }) => ({ rule, severity })), [
    { rule: 'dynamic-context-safety', severity: 'warn' }
  ]);
});

test('checks same-plugin agent preloads while accepting existing skills', async (context) => {
  const root = await temporaryRoot(context);
  const plugin = await writePlugin(root, 'skillsforge', ['present-skill']);
  await mkdir(join(plugin, 'agents'), { recursive: true });
  await writeFile(join(plugin, 'agents', 'reviewer.md'), `---\nname: reviewer\ndescription: Review a change.\nskills:\n  - present-skill\n  - missing-skill\n---\n\nReview it.\n`);
  const { lintPluginPath } = await loadLintLib();
  const result = await lintPluginPath(plugin, { root, config: baseConfig });
  const findings = result.findings.filter((finding) => finding.rule === 'agent-preload-exists');

  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /missing-skill/);
  assert.doesNotMatch(findings[0].message, /present-skill/);
});

test('rejects an agent preload whose skill symlink resolves outside the plugin', async (context) => {
  const root = await temporaryRoot(context);
  const plugin = await writePlugin(root, 'skillsforge', ['present-skill']);
  const outside = await writeSkill(root, 'outside-skill');
  try {
    await symlink(outside, join(plugin, 'skills', 'linked-skill'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return context.skip('symlink creation is unavailable');
    throw error;
  }
  await mkdir(join(plugin, 'agents'), { recursive: true });
  await writeFile(join(plugin, 'agents', 'reviewer.md'), `---\nname: reviewer\ndescription: Review a change.\nskills:\n  - linked-skill\n---\n\nReview it.\n`);
  const { lintPluginPath } = await loadLintLib();
  const result = await lintPluginPath(plugin, { root, config: baseConfig });

  assert.equal(result.findings.filter((finding) => finding.rule === 'agent-preload-exists').length, 1);
});

test('checks existing, missing, and traversing plugin-root hook script references', async (context) => {
  const root = await temporaryRoot(context);
  const plugin = await writePlugin(root, 'skillsforge', ['present-skill']);
  await mkdir(join(plugin, 'hooks'), { recursive: true });
  await mkdir(join(plugin, 'bin'), { recursive: true });
  await mkdir(join(plugin, 'bin', 'directory.mjs'), { recursive: true });
  await mkdir(join(plugin, 'config'), { recursive: true });
  await mkdir(join(plugin, 'cache'), { recursive: true });
  await writeFile(join(plugin, 'bin', 'exists.mjs'), 'export {};\n');
  await writeFile(join(plugin, 'bin', 'exists too.mjs'), 'export {};\n');
  await writeFile(join(plugin, 'script.py'), 'print("ok")\n');
  await writeFile(join(plugin, 'hooks', 'hooks.json'), JSON.stringify({
    hooks: {
      Stop: [{
        hooks: [
          { type: 'command', command: 'node ${CLAUDE_PLUGIN_ROOT}/bin/exists.mjs', args: ['${CLAUDE_PLUGIN_ROOT}'] },
          { type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/bin/exists too.mjs"' },
          {
            type: 'command',
            command: 'node',
            args: ['${CLAUDE_PLUGIN_ROOT}/bin/exists.mjs', '--config-dir', '${CLAUDE_PLUGIN_ROOT}/config']
          },
          {
            type: 'command',
            command: 'python --pycache-prefix ${CLAUDE_PLUGIN_ROOT}/cache ${CLAUDE_PLUGIN_ROOT}/script.py'
          },
          { type: 'command', command: 'node ${CLAUDE_PLUGIN_ROOT}/bin/directory.mjs' },
          { type: 'command', command: 'node ${CLAUDE_PLUGIN_ROOT}/bin/missing.mjs' },
          { type: 'command', command: 'node ${CLAUDE_PLUGIN_ROOT}/../escape.mjs' }
        ]
      }]
    }
  }));
  const { lintPluginPath } = await loadLintLib();
  const result = await lintPluginPath(plugin, { root, config: baseConfig });
  const findings = result.findings.filter((finding) => finding.rule === 'hook-script-exists');

  assert.equal(findings.length, 2);
  assert.match(findings.map((finding) => finding.message).join('\n'), /missing\.mjs/);
  assert.match(findings.map((finding) => finding.message).join('\n'), /outside plugin root/);
  assert.doesNotMatch(findings.map((finding) => finding.message).join('\n'), /directory\.mjs/);
  assert.doesNotMatch(findings.map((finding) => finding.message).join('\n'), /exists\.mjs/);
  assert.doesNotMatch(findings.map((finding) => finding.message).join('\n'), /\/config/);
  assert.doesNotMatch(findings.map((finding) => finding.message).join('\n'), /\/(?:cache|script\.py)/);
});

test('enforces configured always-on plugin budgets and reports actual versus budget', async (context) => {
  const root = await temporaryRoot(context);
  const plugin = await writePlugin(root, 'skillsforge', ['one-skill']);
  const { lintPluginPath } = await loadLintLib();
  const under = await lintPluginPath(plugin, { root, config: { ...baseConfig, pluginBudgets: { skillsforge: 100 } } });
  const over = await lintPluginPath(plugin, { root, config: { ...baseConfig, pluginBudgets: { skillsforge: 1 } } });

  assert.equal(under.findings.some((finding) => finding.rule === 'budget-total'), false);
  const finding = over.findings.find((entry) => entry.rule === 'budget-total');
  assert.equal(finding.severity, 'error');
  assert.match(finding.message, /actual \d+.*budget 1/);
});

test('warns once for a duplicate skill name across marketplace plugin directories', async (context) => {
  const root = await temporaryRoot(context);
  await writePlugin(root, 'alpha-plugin', ['shared-name']);
  await writePlugin(root, 'bravo-plugin', ['shared-name']);
  await writeMarketplace(root, ['alpha-plugin', 'bravo-plugin']);
  const { lintRepository } = await loadLintLib();
  const result = await lintRepository(root, { config: { ...baseConfig, pluginBudgets: {} } });
  const collisions = result.findings.filter((finding) => finding.rule === 'name-collision');

  assert.equal(result.ok, true);
  assert.equal(collisions.length, 1);
  assert.match(collisions[0].message, /alpha-plugin.*bravo-plugin/);
});

test('detects collisions by canonical plugin directory rather than declared plugin name', async (context) => {
  const root = await temporaryRoot(context);
  await writePlugin(root, 'alpha-directory', ['shared-name'], 'same-plugin');
  await writePlugin(root, 'bravo-directory', ['shared-name'], 'same-plugin');
  await writeMarketplace(root, [
    { name: 'same-plugin', source: './plugins/alpha-directory' },
    { name: 'same-plugin', source: './plugins/bravo-directory' }
  ]);
  const { lintRepository } = await loadLintLib();
  const result = await lintRepository(root, { config: { ...baseConfig, pluginBudgets: {} } });

  assert.equal(result.findings.filter((finding) => finding.rule === 'name-collision').length, 1);
});

test('does not report aliases of the same canonical plugin directory as a collision', async (context) => {
  const root = await temporaryRoot(context);
  const plugin = await writePlugin(root, 'shared-directory', ['shared-name']);
  let aliasSource = './plugins/shared-directory';
  try {
    await symlink(plugin, join(root, 'plugins', 'shared-alias'), process.platform === 'win32' ? 'junction' : 'dir');
    aliasSource = './plugins/shared-alias';
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
  }
  await writeMarketplace(root, [
    { name: 'alias-one', source: './plugins/shared-directory' },
    { name: 'alias-two', source: aliasSource }
  ]);
  const { lintRepository } = await loadLintLib();
  const result = await lintRepository(root, { config: { ...baseConfig, pluginBudgets: {} } });

  assert.equal(result.findings.some((finding) => finding.rule === 'name-collision'), false);
});

test('aggregates repository and plugin findings in deterministic order', async (context) => {
  const root = await temporaryRoot(context);
  const alpha = await writePlugin(root, 'alpha-plugin', ['shared-name']);
  await writePlugin(root, 'bravo-plugin', ['shared-name']);
  await writeMarketplace(root, ['bravo-plugin', 'alpha-plugin']);
  await writeSkill(join(alpha, 'skills'), 'broken-copy', {
    description: 'Review release evidence and return a concise readiness verdict for maintainers.'
  });
  const { lintRepository } = await loadLintLib();
  const first = await lintRepository(root, { config: { ...baseConfig, pluginBudgets: {} } });
  const second = await lintRepository(root, { config: { ...baseConfig, pluginBudgets: {} } });

  assert.equal(first.ok, false);
  assert.deepEqual(first, second);
  assert.ok(first.findings.some((finding) => finding.rule === 'trigger-cue' && finding.severity === 'error'));
  assert.ok(first.findings.some((finding) => finding.rule === 'name-collision' && finding.severity === 'warn'));
});

test('returns deterministic input findings instead of throwing for missing content', async (context) => {
  const root = await temporaryRoot(context);
  const { lintSkillPath } = await loadLintLib();
  const result = await lintSkillPath(join(root, 'missing-skill'), { root, config: baseConfig });

  assert.equal(result.ok, false);
  assert.deepEqual(result.findings.map(({ rule, severity }) => ({ rule, severity })), [
    { rule: 'lint-input', severity: 'error' }
  ]);
});

test('returns a deterministic input finding for a missing plugin directory', async (context) => {
  const root = await temporaryRoot(context);
  const { lintPluginPath } = await loadLintLib();
  const result = await lintPluginPath(join(root, 'missing-plugin'), { root, config: baseConfig });

  assert.equal(result.ok, false);
  assert.deepEqual(result.findings.map(({ rule, severity }) => ({ rule, severity })), [
    { rule: 'lint-input', severity: 'error' }
  ]);
});

test('skips schema-owned YAML alias expansion failures without throwing', async (context) => {
  const root = await temporaryRoot(context);
  const directory = join(root, 'alias-expansion');
  await mkdir(directory);
  const aliases = Array.from({ length: 101 }, () => '*item').join(', ');
  await writeFile(join(directory, 'SKILL.md'), `---\nname: alias-expansion\ndescription: Review alias-heavy metadata safely. Use when the user supplies adversarial YAML.\nitem: &item [value]\naliases: [${aliases}]\n---\n\nInstructions.\n`);
  const { lintSkillPath } = await loadLintLib();
  const result = await lintSkillPath(directory, { root, config: baseConfig });

  assert.deepEqual(result, { ok: true, findings: [], text: 'PASS content lint\n' });
});

test('the current repository has no lint errors', async () => {
  const { lintRepository } = await loadLintLib();
  const result = await lintRepository(repositoryRoot);

  assert.equal(
    result.findings.filter((finding) => finding.severity === 'error').length,
    0,
    result.text
  );
});

async function loadLintLib() {
  try {
    return await import('../scripts/lint-lib.mjs');
  } catch (error) {
    assert.fail(`lint-lib.mjs must exist (${error.code ?? error.message})`);
  }
}

async function temporaryRoot(context) {
  const root = await mkdtemp(join(tmpdir(), 'skillsforge-lint-test-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function writeSkill(parent, name, options = {}) {
  const directory = join(parent, name);
  await mkdir(directory, { recursive: true });
  const description = options.description ?? 'Review a focused change and report concrete risks. Use when the user requests a quality check.';
  const frontmatter = [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    ...(options.whenToUse ? [`when_to_use: ${options.whenToUse}`] : []),
    ...(options.disableModelInvocation ? ['disable-model-invocation: true'] : []),
    ...formatAllowedTools(options.allowedTools),
    ...formatMetadata(options),
    '---',
    '',
    options.body ?? 'Inspect the relevant evidence and return a concise verdict.',
    ''
  ];
  await writeFile(join(directory, 'SKILL.md'), frontmatter.join('\n'));
  return directory;
}

function formatAllowedTools(value) {
  if (value === undefined) return [];
  if (Array.isArray(value)) return ['allowed-tools:', ...value.map((tool) => `  - ${tool}`)];
  return [`allowed-tools: ${value}`];
}

function formatMetadata(options) {
  if (options.rawMetadata) return ['metadata:', options.rawMetadata];
  if (!options.metadata) return [];
  return ['metadata:', ...Object.entries(options.metadata).map(([key, value]) => `  ${key}: "${value}"`)];
}

async function writePlugin(root, name, skillNames, declaredName = name) {
  const plugin = join(root, 'plugins', name);
  await mkdir(join(plugin, '.claude-plugin'), { recursive: true });
  await writeFile(join(plugin, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: declaredName }));
  for (const skillName of skillNames) await writeSkill(join(plugin, 'skills'), skillName);
  return plugin;
}

async function writeMarketplace(root, plugins) {
  await mkdir(join(root, '.claude-plugin'), { recursive: true });
  await writeFile(join(root, '.claude-plugin', 'marketplace.json'), JSON.stringify({
    name: 'fixture-marketplace',
    owner: { name: 'Fixture' },
    metadata: { pluginRoot: './plugins' },
    plugins: plugins.map((entry) => typeof entry === 'string'
      ? { name: entry, source: `./plugins/${entry}` }
      : entry)
  }));
}
