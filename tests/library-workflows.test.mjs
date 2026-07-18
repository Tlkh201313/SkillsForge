import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildLibraryIndex, planSkillRemoval, writeLibraryArtifacts } from '../lib/capabilities/library.mjs';
import { exportPowerShellHelpers, POWERSHELL_HELPERS } from '../lib/capabilities/powershell.mjs';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { loadWorkflows, planAuto, recommendWorkflows, runAutoReadOnly, runWorkflowDryRun, showWorkflow } from '../lib/capabilities/workflows.mjs';

const root = process.cwd();

test('workflow catalog contains exactly 100 valid workflows in planned categories', async () => {
  const result = await loadWorkflows(root);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.workflows.length, 100);
  const counts = result.workflows.reduce((acc, workflow) => {
    acc[workflow.category] = (acc[workflow.category] ?? 0) + 1;
    assert.equal(workflow.id.startsWith(`${workflow.category}.`), true, workflow.id);
    assert.ok(Array.isArray(workflow.steps) && workflow.steps.length >= 3);
    assert.ok(Array.isArray(workflow.recommendedSkills) && workflow.recommendedSkills.length >= 1);
    assert.ok(Array.isArray(workflow.recommendedAgents) && workflow.recommendedAgents.length >= 1);
    return acc;
  }, {});
  assert.deepEqual(counts, {
    agentic: 6,
    coding: 16,
    data: 8,
    design: 10,
    docs: 10,
    media: 6,
    ops: 12,
    product: 8,
    security: 12,
    testing: 12
  });
});

test('workflow recommendation and dry-run expose compact actionable plans', async () => {
  const recommended = await recommendWorkflows(root, 'safe refactor code with tests', { limit: 3 });
  assert.equal(recommended.ok, true);
  assert.ok(recommended.candidates.some((workflow) => workflow.id === 'coding.safe-refactor'));

  const shown = await showWorkflow(root, 'coding.safe-refactor');
  assert.equal(shown.ok, true);
  assert.equal(shown.workflow.category, 'coding');

  const dryRun = await runWorkflowDryRun(root, 'coding.safe-refactor');
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.dryRun, true);
  assert.equal(dryRun.workflow, 'coding.safe-refactor');
  assert.ok(dryRun.steps.length >= 3);
});

test('workflow recommended skills and agents resolve to shipped files', async () => {
  const skills = new Set((await loadAllSkills(root)).map((skill) => skill.name));
  const agents = new Set((await readdir(join(root, 'plugins', 'skillsforge', 'agents')))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, '')));
  const result = await loadWorkflows(root);
  const missing = [];
  for (const workflow of result.workflows) {
    for (const skill of workflow.recommendedSkills) {
      if (!skills.has(skill)) missing.push(`${workflow.id} recommended skill ${skill}`);
    }
    for (const agent of workflow.recommendedAgents) {
      if (!agents.has(agent)) missing.push(`${workflow.id} recommended agent ${agent}`);
    }
    for (const step of workflow.steps) {
      if (step.skill && !skills.has(step.skill)) missing.push(`${workflow.id} step skill ${step.skill}`);
      if (step.agent && !agents.has(step.agent)) missing.push(`${workflow.id} step agent ${step.agent}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('auto plan and read-only run never execute writes', async () => {
  const plan = await planAuto(root, 'audit README claims and demo proof', { limit: 3 });
  assert.equal(plan.ok, true);
  assert.equal(plan.mode, 'plan');
  assert.ok(plan.nextCommands.some((command) => command.includes('workflows')));

  const run = await runAutoReadOnly(root, 'audit README claims and demo proof', { limit: 3 });
  assert.equal(run.ok, true);
  assert.equal(run.dryRun, true);
  assert.equal(run.mode, 'read-only-run');
  assert.ok(run.workflowDryRun);
});

test('library index and HTML artifacts include skills, workflows, hosts, and AI index', async (context) => {
  const outDir = await mkdtemp(join(tmpdir(), 'sf-library-'));
  context.after(() => rm(outDir, { recursive: true, force: true }));

  const index = await buildLibraryIndex(root, { home: outDir });
  assert.equal(index.stats.skills, 366);
  assert.equal(index.stats.workflows, 100);
  assert.ok(index.skills.some((skill) => skill.id === 'using-skillsforge'));
  assert.ok(index.workflows.some((workflow) => workflow.id === 'coding.safe-refactor'));
  assert.ok(index.hosts.some((host) => host.id === 'codex'));

  const result = await writeLibraryArtifacts(root, { outDir, home: outDir, allowAbsolute: true });
  assert.equal(result.ok, true);
  await access(result.files.json);
  await access(result.files.html);
  await access(result.files.ai);
  const html = await readFile(result.files.html, 'utf8');
  assert.match(html, /SkillsForge Library/);
  assert.match(html, /skillsforge-data/);
  assert.match(html, /removePreview/);
  assert.match(html, /removeConfirm/);
  assert.match(html, /allowMutations/);
  const ai = await readFile(result.files.ai, 'utf8');
  assert.match(ai, /skillsforge-ai-index/);
});

test('library removal is dry-run by default', async (context) => {
  const home = await mkdtemp(join(tmpdir(), 'sf-lib-remove-'));
  context.after(() => rm(home, { recursive: true, force: true }));
  const result = await planSkillRemoval(root, {
    home,
    host: 'codex',
    skill: 'using-skillsforge'
  });
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.match(result.command, /--dry-run/);
});

test('PowerShell export creates helper scripts and manifest', async (context) => {
  const outDir = await mkdtemp(join(tmpdir(), 'sf-ps-'));
  context.after(() => rm(outDir, { recursive: true, force: true }));
  const result = await exportPowerShellHelpers(root, { outDir });
  assert.equal(result.ok, true);
  assert.equal(result.files.length, POWERSHELL_HELPERS.length);
  await access(result.manifest);
  const grepHelper = result.files.find((file) => file.name === 'sf-grep');
  assert.ok(grepHelper);
  const source = await readFile(grepHelper.path, 'utf8');
  assert.match(source, /skillsforge\.mjs/);
  assert.match(source, /wb/);
});
