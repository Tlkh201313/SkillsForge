import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';
import { loadCatalog } from '../lib/capabilities/catalog.mjs';
import { buildLibraryIndex, writeLibraryArtifacts } from '../lib/capabilities/library.mjs';
import { lintSkill, scoreSkillQuality } from '../lib/capabilities/quality.mjs';
import { callTool, TOOLS } from '../scripts/skillsforge-mcp.mjs';
import { VIBE_CODER_PACKS, VIBE_CODER_PROFILE_PACKS, VIBE_CODER_SKILLS } from './vibe-skill-expansion-fixtures.mjs';

const root = process.cwd();
const cli = join(root, 'plugins', 'skillsforge', 'bin', 'skillsforge.mjs');

test('vibe-coder expansion ships exactly 100 planned skills and resolves new packs/profile', async () => {
  const { catalog } = await loadCatalog(root);
  assert.equal(new Set(VIBE_CODER_SKILLS).size, 100);
  assert.equal(VIBE_CODER_SKILLS.length, 100);
  assert.equal(catalog.packs.builder.skills.length, 18);
  assert.equal(catalog.packs.validation.skills.length, 18);
  assert.deepEqual(catalog.packs.builder.skills, VIBE_CODER_PACKS.builder);
  assert.deepEqual(catalog.packs.validation.skills, VIBE_CODER_PACKS.validation);
  assert.deepEqual(catalog.profiles.vibecoder.packs, VIBE_CODER_PROFILE_PACKS);
  assert.ok(catalog.profiles.full.packs.includes('builder'));
  assert.ok(catalog.profiles.full.packs.includes('validation'));

  const catalogIds = new Set(Object.values(catalog.packs).flatMap((pack) => pack.skills));
  const missing = VIBE_CODER_SKILLS.filter((id) => !catalogIds.has(id));
  assert.deepEqual(missing, []);
});

test('design pack has at least 60 real design skills with shipped files and design sidecars', async () => {
  const { catalog } = await loadCatalog(root);
  const designSkills = catalog.packs.design.skills;
  assert.ok(designSkills.length >= 60, `expected >=60 design skills, got ${designSkills.length}`);
  assert.equal(new Set(designSkills).size, designSkills.length);

  for (const id of designSkills) {
    const skillDir = join(root, 'plugins', 'skillsforge', 'skills', id);
    const source = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
    const sidecar = JSON.parse(await readFile(join(skillDir, 'skillsforge.json'), 'utf8'));
    assert.match(source, new RegExp(`name:\\s*${id}`));
    assert.equal(sidecar.routing.pack, 'design', id);
    assert.ok(sidecar.routing.triggers.length >= 4, id);
    assert.ok(sidecar.routing.antiTriggers.length >= 3, id);
  }
});

test('every shipped skill has deterministic output contract, verification, and failure modes', async () => {
  const skillRoot = join(root, 'plugins', 'skillsforge', 'skills');
  const dirs = (await readdir(skillRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  assert.ok(dirs.length >= 499);
  const missing = [];
  for (const dir of dirs) {
    const source = await readFile(join(skillRoot, dir.name, 'SKILL.md'), 'utf8');
    for (const section of ['## Output Contract', '## Verification', '## Failure Modes', '## OG Output Pressure Test']) {
      if (!source.includes(section)) missing.push(`${dir.name} missing ${section}`);
    }
    assert.doesNotMatch(source, /Lean SkillsForge scaffold|Add domain examples|Pressure stub/i, dir.name);
  }
  assert.deepEqual(missing, []);
});

test('all 100 vibe-coder skills have concrete pressure prompts and sidecar routing', async () => {
  const missing = [];
  const weak = [];
  for (const id of VIBE_CODER_SKILLS) {
    const skillDir = join(root, 'plugins', 'skillsforge', 'skills', id);
    const source = await readFile(join(skillDir, 'SKILL.md'), 'utf8').catch(() => null);
    const sidecar = await readFile(join(skillDir, 'skillsforge.json'), 'utf8')
      .then((text) => JSON.parse(text))
      .catch(() => null);
    if (!source || !sidecar) {
      missing.push(id);
      continue;
    }
    const label = id.replace(/-/g, ' ');
    assert.match(source, new RegExp(`name:\\s*${id}`));
    assert.match(source, /## Output Contract/);
    assert.match(source, /## Verification/);
    assert.match(source, /## Failure Modes/);
    assert.match(source, /## OG Output Pressure Test/);
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), id);
    assert.match(source, /skip validation|invent proof|fake claims|real repo/i, id);
    assert.ok(sidecar.routing.triggers.length >= 5, id);
    assert.ok(sidecar.routing.antiTriggers.length >= 4, id);
    if (/sample work|TBD|TODO|Add domain examples|Pressure stub/i.test(source)) weak.push(id);
  }
  assert.deepEqual(missing, []);
  assert.deepEqual(weak, []);
});

test('quality scoring rejects scaffold-like skills and reports output-contract checks', async (context) => {
  const base = await mkdtemp(join(tmpdir(), 'sf-bad-skill-'));
  const dir = join(base, 'bad-skill');
  context.after(() => rm(base, { recursive: true, force: true }));
  await mkdir(join(dir, 'agents'), { recursive: true });
  await writeFile(join(dir, 'SKILL.md'), `---
name: bad-skill
description: Use when doing sample work and you need bounded steps before shipping.
---

# Bad Skill

## Overview

Lean SkillsForge scaffold for sample work. Add domain examples and verification before calling it production-depth.

## Purpose

Deliver a trustworthy, repeatable outcome.

## Phases

1. Clarify.
2. Execute.

## Exit

- Done.

## Anti-patterns

- Skipping verification.

## Handoff

Recommend another skill.
`);
  await writeFile(join(dir, 'skillsforge.json'), JSON.stringify({
    schemaVersion: 1,
    maturity: 'experimental',
    requires: [],
    routing: {
      triggers: ['sample work', 'sample skill work', 'help sample work', 'run sample work'],
      antiTriggers: ['unrelated task'],
      mode: 'explicit',
      pack: 'testing'
    },
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: 'project' }
    },
    compatibility: { codex: 'full' },
    provenance: { source: 'original', license: 'MIT' }
  }, null, 2));
  await writeFile(join(dir, 'agents', 'openai.yaml'), 'name: bad-skill\n');
  const result = await scoreSkillQuality(dir, { root });
  assert.ok(result.checks.some((check) => check.id === 'output-contract'));
  assert.ok(result.checks.some((check) => check.id === 'scaffold-language'));
  assert.equal(result.checks.find((check) => check.id === 'scaffold-language').ok, false);
  assert.ok(result.score < 100, `scaffold-like score should not be perfect, got ${result.score}`);

  const linted = await lintSkill(dir, { root, threshold: 85, hero: true });
  assert.equal(linted.ok, false);
});

test('settings config supports defaults, validation, overrides, and CLI show', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-settings-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  const configPath = join(home, 'skillsforge.config.json');
  await writeFile(configPath, JSON.stringify({
    recommendThreshold: 4,
    defaultHost: 'codex',
    library: { theme: 'dark', outDir: 'artifacts/custom-library', cacheHostChecks: true },
    mutations: { allowByDefault: false }
  }, null, 2));

  const result = spawnSync(process.execPath, [cli, 'settings', 'show', '--json', '--config', configPath], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.settings.recommendThreshold, 4);
  assert.equal(payload.settings.defaultHost, 'codex');
  assert.equal(payload.settings.library.theme, 'dark');

  const badPath = join(home, 'bad.config.json');
  await writeFile(badPath, '{"recommendThreshold":0,"defaultHost":"unknown"}');
  const bad = spawnSync(process.execPath, [cli, 'settings', 'validate', '--json', '--config', badPath], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(bad.status, 1, bad.stderr || bad.stdout);
  assert.match(bad.stdout, /recommendThreshold|defaultHost/);
});

test('library index uses settings and stays fast enough for agent startup', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-library-fast-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  const probe = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { buildLibraryIndex } from './lib/capabilities/library.mjs';
    const started = performance.now();
    const index = await buildLibraryIndex(process.cwd(), { home: ${JSON.stringify(home)}, sessionHost: 'codex' });
    const elapsedMs = performance.now() - started;
    console.log(JSON.stringify({ ok: index.ok, elapsedMs, settings: index.settings, stats: index.stats }));
  `], { cwd: root, encoding: 'utf8' });
  assert.equal(probe.status, 0, probe.stderr || probe.stdout);
  const payload = JSON.parse(probe.stdout);
  assert.equal(payload.ok, true);
  assert.ok(payload.elapsedMs < 10_000, `buildLibraryIndex took ${Math.round(payload.elapsedMs)}ms`);
  assert.equal(payload.settings.defaultHost, 'codex');
});

test('library HTML exposes settings and local-only recommendation policy', async (context) => {
  const outDir = await mkdtemp(join(tmpdir(), 'sf-library-html-'));
  context.after(() => rm(outDir, { recursive: true, force: true }));
  const result = await writeLibraryArtifacts(root, { outDir, home: outDir, allowAbsolute: true, sessionHost: 'codex' });
  const html = await readFile(result.files.html, 'utf8');
  const ai = await readFile(result.files.ai, 'utf8');
  assert.match(html, /settingsPanel/);
  assert.match(html, /commandCenter/);
  assert.match(html, /vibeBuilderPanel/);
  assert.match(html, /quickFilters/);
  assert.match(html, /navFilters/);
  assert.match(html, /problemsPanel/);
  assert.match(html, /themeSelect/);
  assert.match(html, /refreshBtn/);
  assert.match(html, /windowedRender/);
  assert.match(html, /sourceDetails/);
  assert.match(html, /viewModeList/);
  assert.match(html, /viewModeTable/);
  assert.match(html, /Build \/ Validate \/ Research \/ Launch/);
  assert.match(html, /recommendThreshold/);
  assert.match(html, /data\.settings\?\.recommendThreshold/);
  assert.doesNotMatch(html, /const threshold=2/);
  assert.match(html, /No external assets/);
  assert.doesNotMatch(html, /"capabilities":/);
  assert.match(ai, /sourceDetails/);
  assert.match(ai, /selectionRules/);
  assert.match(ai, /smallest matching skill/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test('MCP exposes only read-only settings and skill quality tools', async () => {
  const names = TOOLS.map((tool) => tool.name).sort();
  for (const name of ['settings_show', 'quality_skill', 'skill_contract']) {
    assert.ok(names.includes(name), `missing MCP tool ${name}`);
  }
  assert.equal(names.some((name) => /(^|_)(set|reset|remove|install|write)($|_)/.test(name)), false);

  const settings = await callTool('settings_show', {});
  assert.equal(settings.ok, true);
  assert.ok(settings.settings);

  const quality = await callTool('quality_skill', { skill: 'plugins/skillsforge/skills/design-layout' });
  assert.equal(quality.name, 'design-layout');
  assert.ok(quality.checks.some((check) => check.id === 'output-contract'));

  const contract = await callTool('skill_contract', { skill: 'plugins/skillsforge/skills/design-layout' });
  assert.equal(contract.ok, true);
  assert.equal(contract.skill, 'design-layout');
  assert.ok(contract.contract.output.length > 0);
});

test('subcommand help and public docs contain no mojibake', () => {
  for (const args of [
    ['help'],
    ['lib', '--help'],
    ['workflows', '--help'],
    ['auto', '--help'],
    ['ps', '--help'],
    ['settings', '--help']
  ]) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr || result.stdout}`);
    const mojibakePattern = new RegExp([
      String.fromCodePoint(0x00e2),
      String.fromCodePoint(0x00c3),
      String.fromCodePoint(0xfffd)
    ].join('|'));
    assert.doesNotMatch(result.stdout, mojibakePattern);
  }
});
