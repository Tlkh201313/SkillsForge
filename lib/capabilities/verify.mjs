import { validateSkillPaths } from '../../scripts/validate-skill-lib.mjs';
import { loadAllSkills, loadSkill } from './skill-loader.mjs';
import { scanSkill } from './policy.mjs';
import { analyzeDependencies } from './dependency-graph.mjs';

/**
 * Structural validate + optional capability policy scan + optional dependency graph.
 * Sidecar-free skills stay structural-only (no invented policy).
 */
export async function verifySkillPaths(paths, options = {}) {
  const validation = await validateSkillPaths(paths, options);
  const findings = [];
  const scannedSkills = [];
  const passedReports = validation.reports.filter((report) => report.status === 'pass');

  const scannedReports = await mapWithConcurrency(passedReports, options.concurrency ?? 16, async (report) => {
    let skill;
    try {
      skill = await loadSkill(report.path, { root: options.root });
    } catch (error) {
      return {
        skill: null,
        findings: [{
          skill: report.name,
          path: report.path,
          rule: 'skill-load-failed',
          blocking: true,
          evidence: [error.message],
          fix: 'fix structural/sidecar issues so the skill can be loaded'
        }]
      };
    }

    if (!skill.sidecar) return { skill, findings: [] };

    const scanned = await scanSkill(skill);
    return {
      skill,
      findings: scanned.map((item) => normalizeFinding(item, skill))
    };
  });

  for (const item of scannedReports) {
    if (item.skill) scannedSkills.push(item.skill);
    findings.push(...item.findings);
  }

  let graph = null;
  if (options.dependencies === true) {
    const root = options.root ?? process.cwd();
    let skillsForGraph = scannedSkills;
    try {
      // Full install graph needs every discoverable skill, not just the validated subset.
      skillsForGraph = await loadAllSkills(root);
    } catch (error) {
      findings.push({
        skill: null,
        path: root,
        rule: 'skill-load-failed',
        blocking: true,
        evidence: [error.message],
        fix: 'fix skill load errors before dependency analysis'
      });
      skillsForGraph = scannedSkills;
    }
    graph = analyzeDependencies(skillsForGraph);
    findings.push(...dependencyFindings(graph));
  }

  const merged = sortFindings(findings);
  const structuralOk = validation.ok;
  const ok = structuralOk && !merged.some((item) => item.blocking);
  const text = formatVerifyText(validation, merged);

  return {
    ok,
    structuralOk,
    text,
    reports: validation.reports,
    findings: merged,
    graph,
    policyScanned: scannedSkills.filter((skill) => skill.sidecar).length
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const limit = Math.max(1, Math.min(64, Number(concurrency) || 16));
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function verifyInstalledSkills(root, options = {}) {
  return verifySkillPaths([], {
    root,
    all: true,
    allowEmpty: options.allowEmpty ?? false,
    profile: options.profile ?? 'claude-code',
    dependencies: true,
    ...options
  });
}

function normalizeFinding(item, skill) {
  return {
    skill: skill.name,
    path: skill.directory,
    rule: item.rule,
    blocking: Boolean(item.blocking),
    evidence: [...(item.evidence ?? [])],
    fix: item.fix ?? '',
    declared: item.declared ?? null,
    detected: item.detected ?? null
  };
}

function dependencyFindings(graph) {
  const findings = [];
  for (const cycle of graph.cycles ?? []) {
    findings.push({
      skill: cycle[0] ?? null,
      path: null,
      rule: 'dependency-cycle',
      blocking: true,
      evidence: [cycle.join(' -> ')],
      fix: 'break the requires cycle between skills'
    });
  }
  for (const item of graph.missing ?? []) {
    findings.push({
      skill: item.skill,
      path: null,
      rule: 'missing-dependency',
      blocking: true,
      evidence: [`${item.skill} -> ${item.requires}`],
      fix: `add skill "${item.requires}" or remove the requires entry`
    });
  }
  for (const name of graph.duplicates ?? []) {
    findings.push({
      skill: name,
      path: null,
      rule: 'duplicate-name',
      blocking: true,
      evidence: [name],
      fix: 'ensure skill names are unique across discovered roots'
    });
  }
  return findings;
}

function sortFindings(findings) {
  return [...findings].sort((left, right) => {
    const skillCmp = String(left.skill ?? '').localeCompare(String(right.skill ?? ''));
    if (skillCmp !== 0) return skillCmp;
    const ruleCmp = String(left.rule).localeCompare(String(right.rule));
    if (ruleCmp !== 0) return ruleCmp;
    const leftEvidence = (left.evidence ?? []).join('\0');
    const rightEvidence = (right.evidence ?? []).join('\0');
    return leftEvidence.localeCompare(rightEvidence);
  });
}

function formatVerifyText(validation, findings) {
  const lines = [];
  if (validation.text) lines.push(validation.text.replace(/\n$/, ''));

  for (const item of findings) {
    const where = item.skill ? `${item.skill}: ` : '';
    const evidence = (item.evidence ?? []).join(', ');
    const prefix = item.blocking ? 'FAIL' : 'WARN';
    lines.push(`${prefix} ${where}${item.rule}${evidence ? ` ${evidence}` : ''}${item.fix ? ` - ${item.fix}` : ''}`);
  }

  if (findings.length === 0 && validation.reports.length > 0) {
    return `${lines.join('\n')}\n`;
  }
  return `${lines.filter(Boolean).join('\n')}\n`;
}
