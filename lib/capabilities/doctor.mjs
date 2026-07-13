import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { verifyInstalledSkills } from './verify.mjs';

export async function runDoctor(root = process.cwd()) {
  const checks = [];
  const repositoryPluginRoot = join(root, 'plugins', 'skillsforge');
  const monorepo = await pathExists(join(repositoryPluginRoot, '.claude-plugin', 'plugin.json'));
  const installedPlugin = await pathExists(join(root, '.claude-plugin', 'plugin.json'))
    && await pathExists(join(root, 'skills'));
  const pluginRoot = monorepo || !installedPlugin ? repositoryPluginRoot : root;
  const manifest = join(pluginRoot, '.claude-plugin', 'plugin.json');
  const marketplace = join(root, '.claude-plugin', 'marketplace.json');
  const hooks = join(pluginRoot, 'hooks', 'hooks.json');
  const binary = join(pluginRoot, 'bin', 'skillsforge.mjs');

  checks.push(await fileCheck('plugin manifest', manifest));
  checks.push(monorepo
    ? await fileCheck('marketplace manifest', marketplace)
    : await optionalFileCheck('marketplace manifest', marketplace));
  checks.push(await optionalFileCheck('hooks config', hooks));
  checks.push(await optionalFileCheck('runtime CLI', binary));

  const validationRoot = monorepo ? root : pluginRoot;
  // Plugin skills ship Claude Code PreToolUse hooks in SKILL.md frontmatter.
  const verification = await verifyInstalledSkills(validationRoot, {
    allowEmpty: false,
    profile: 'claude-code'
  });

  checks.push({
    name: 'skill validation',
    ok: verification.structuralOk,
    detail: verification.structuralOk
      ? `passed ${verification.reports.length} skills`
      : verification.text.trim()
  });

  const policyFindings = verification.findings.filter((item) => isPolicyFinding(item));
  const blockingPolicy = policyFindings.filter((item) => item.blocking);
  checks.push({
    name: 'capability policy',
    ok: blockingPolicy.length === 0,
    detail: blockingPolicy.length === 0
      ? `scanned ${verification.policyScanned} sidecar skills`
      : summarizeFindings(blockingPolicy)
  });

  const graph = verification.graph;
  const graphOk = graph
    && graph.cycles.length === 0
    && graph.missing.length === 0
    && graph.duplicates.length === 0;
  checks.push({
    name: 'dependency graph',
    ok: Boolean(graphOk),
    detail: graphOk
      ? `order=${graph.order.join(',') || '(none)'}`
      : JSON.stringify({
        cycles: graph?.cycles ?? [],
        missing: graph?.missing ?? [],
        duplicates: graph?.duplicates ?? []
      })
  });

  return {
    ok: checks.every((check) => check.ok),
    checks,
    findings: verification.findings
  };
}

function isPolicyFinding(item) {
  return !['dependency-cycle', 'missing-dependency', 'duplicate-name', 'skill-load-failed'].includes(item.rule);
}

function summarizeFindings(findings) {
  return findings
    .map((item) => `${item.skill ?? '?'}:${item.rule}:${(item.evidence ?? []).join(',')}`)
    .join('; ');
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fileCheck(name, path) {
  try {
    await access(path);
    const raw = await readFile(path, 'utf8');
    JSON.parse(raw);
    return { name, ok: true, detail: path };
  } catch (error) {
    return { name, ok: false, detail: error.message };
  }
}

async function optionalFileCheck(name, path) {
  try {
    await access(path);
    return { name, ok: true, detail: path };
  } catch {
    return { name, ok: true, detail: `${path} not present` };
  }
}
