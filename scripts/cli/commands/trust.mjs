import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { loadAllSkills, loadSkill } from '../../../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../../../lib/capabilities/router.mjs';
import { forgeSkill } from '../../../lib/capabilities/forge.mjs';
import { buildReceipt, normalizeEvaluation, verifyReceipt } from '../../../lib/capabilities/receipt.mjs';
import { runDoctor } from '../../../lib/capabilities/doctor.mjs';
import { enforcePolicy } from '../../../lib/capabilities/claude-policy-compiler.mjs';
import { analyzeDependencies } from '../../../lib/capabilities/dependency-graph.mjs';
import { verifySkillPaths } from '../../../lib/capabilities/verify.mjs';
import { packageCodexPlugin } from '../../../lib/capabilities/codex-package.mjs';
import { runSkillShield, runSkillShieldMany } from '../../../lib/capabilities/skillshield.mjs';
import { exportAgentsMd, captureLearning, forgeFromCapture } from '../../../lib/capabilities/export-agents.mjs';
import { resolveUnderRoot } from '../../../lib/capabilities/paths.mjs';
import { runJudgeDemo, compareSkillTrust } from '../../../lib/capabilities/demo.mjs';
import { scoreSkillQuality } from '../../../lib/capabilities/quality.mjs';
import {
  consumeFlag, consumeOption, resolveRuntimeRoot, resolveUserPath, resolvePackageRoot,
  usage, hasUnknownOption, runProcess, isPluginRoot, pathExists
} from '../shared.mjs';

export async function runValidate(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const all = consumeFlag(args, '--all');
  const allowEmpty = consumeFlag(args, '--allow-empty');
  const profile = consumeOption(args, '--profile');
  if (profile === null) {
    process.stderr.write('--profile requires a value\n');
    return 2;
  }
  const resolvedProfile = profile ?? 'canonical';
  if (!['canonical', 'claude-code'].includes(resolvedProfile)) {
    process.stderr.write(`Unknown profile: ${resolvedProfile}\n`);
    return 2;
  }
  const paths = args.filter((item) => !item.startsWith('--'));
  const root = await resolveRuntimeRoot(options, { explicitPaths: paths.length > 0 });
  const scanAll = paths.length === 0 || all;
  const result = await verifySkillPaths(paths, {
    root,
    all: scanAll,
    allowEmpty,
    profile: resolvedProfile,
    // Full install validate includes dependency graph; path-targeted validate stays local.
    dependencies: scanAll
  });
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(result.text);
  return result.ok ? 0 : 1;
}

export async function runDoctorCommand(argv, options) {
  const json = argv.includes('--json');
  const result = await runDoctor(await resolveRuntimeRoot(options));
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    for (const check of result.checks) {
      process.stdout.write(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}\n`);
    }
  }
  return result.ok ? 0 : 1;
}

export async function runRoute(argv, options) {
  const args = [...argv];
  const pack = consumeOption(args, '--pack');
  if (pack === null) {
    process.stderr.write('--pack requires a value\n');
    return 2;
  }
  const includeExplicit = consumeFlag(args, '--include-explicit');
  const queryIndex = args.indexOf('--query');
  const query = queryIndex >= 0 ? args[queryIndex + 1] : args.filter((item) => !item.startsWith('--')).join(' ');
  if (!query) {
    process.stderr.write('usage: skillsforge route --query <text> [--pack <id>] [--include-explicit]\n');
    return 2;
  }
  const skills = await loadAllSkills(await resolveRuntimeRoot(options));
  const result = routeQuery(query, skills, {
    pack: pack ?? undefined,
    includeExplicit: includeExplicit || Boolean(pack)
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

export async function runForge(argv, options) {
  const specIndex = argv.indexOf('--spec');
  if (specIndex < 0 || !argv[specIndex + 1]) {
    process.stderr.write('usage: skillsforge forge --spec <file> [--dry-run|--write] [--force] [--out <dir>]\n');
    return 2;
  }
  const outIndex = argv.indexOf('--out');
  const spec = JSON.parse(await readFile(argv[specIndex + 1], 'utf8'));
  const root = await resolveRuntimeRoot(options);
  const result = await forgeSkill(spec, {
    write: argv.includes('--write'),
    dryRun: !argv.includes('--write'),
    force: argv.includes('--force'),
    outRoot: outIndex >= 0
      ? argv[outIndex + 1]
      : join(root, ...(await isPluginRoot(root) ? ['skills'] : ['plugins', 'skillsforge', 'skills']))
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runReceipt(argv, options) {
  const args = [...argv];
  const out = consumeOption(args, '--out');
  if (out === null) {
    process.stderr.write('--out requires a value\n');
    return 2;
  }
  const packageOption = consumeOption(args, '--package');
  if (packageOption === null) {
    process.stderr.write('--package requires a value\n');
    return 2;
  }
  const evaluationOption = consumeOption(args, '--evaluation');
  if (evaluationOption === null) {
    process.stderr.write('--evaluation requires a value\n');
    return 2;
  }
  const requireEvaluation = consumeFlag(args, '--require-evaluation');
  const root = await resolveRuntimeRoot(options);
  const packageRoot = await resolvePackageRoot(root, packageOption);
  const receiptOut = out ?? join(root, 'dist', 'trust-receipt.json');
  const skills = await loadAllSkills(packageRoot);
  const graph = analyzeDependencies(skills);
  if (graph.cycles.length || graph.missing.length || graph.duplicates.length) {
    process.stderr.write(`${JSON.stringify(graph, null, 2)}\n`);
    return 1;
  }
  let evaluation = null;
  let reportBytes = null;
  const evaluationPath = evaluationOption ?? join(root, 'artifacts', 'evaluation', 'routing-report.json');
  try {
    reportBytes = await readFile(evaluationPath);
    evaluation = normalizeEvaluation(JSON.parse(reportBytes.toString('utf8')), { reportBytes });
  } catch {
    // optional unless release gate requires it
  }
  const result = await buildReceipt(skills, {
    evaluation,
    packageRoot,
    reportBytes,
    requireEvaluation
  });
  if (!result.ok) {
    process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
    return 1;
  }
  await mkdir(dirname(receiptOut), { recursive: true });
  await writeFile(receiptOut, result.text);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    out: receiptOut,
    receiptHash: result.receiptHash,
    packageHash: result.receipt.package?.packageHash ?? null
  }, null, 2)}\n`);
  return 0;
}

export async function runVerifyReceipt(argv, options) {
  const args = [...argv];
  const packageOnly = consumeFlag(args, '--package-only');
  const packageOption = consumeOption(args, '--package');
  if (packageOption === null) {
    process.stderr.write('--package requires a value\n');
    return 2;
  }
  const evaluationOption = consumeOption(args, '--evaluation');
  if (evaluationOption === null) {
    process.stderr.write('--evaluation requires a value\n');
    return 2;
  }
  const receiptSha256 = consumeOption(args, '--receipt-sha256');
  if (receiptSha256 === null) {
    process.stderr.write('--receipt-sha256 requires a value\n');
    return 2;
  }
  const path = args.find((item) => !item.startsWith('--'));
  if (!path) {
    process.stderr.write('usage: skillsforge verify-receipt <file> [--package <dir>] [--evaluation <routing-report.json>|--package-only] [--receipt-sha256 <hash>]\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const packageRoot = await resolvePackageRoot(root, packageOption);
  const skills = await loadAllSkills(packageRoot);
  const verifyOptions = {
    packageRoot,
    packageOnly,
    requireEvaluation: !packageOnly,
    expectedReceiptHash: receiptSha256 || undefined
  };
  if (!packageOnly && evaluationOption) {
    verifyOptions.evaluationPath = resolve(evaluationOption);
  } else if (!packageOnly) {
    const defaultEval = join(root, 'artifacts', 'evaluation', 'routing-report.json');
    if (await pathExists(defaultEval)) verifyOptions.evaluationPath = defaultEval;
  }
  const result = await verifyReceipt(path, skills, verifyOptions);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runEnforce(argv) {
  const policyIndex = argv.indexOf('--policy');
  if (policyIndex < 0 || !argv[policyIndex + 1]) {
    process.stderr.write('usage: skillsforge enforce --policy <sidecar.json>\n');
    return 2;
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const event = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  const policyPath = resolve(argv[policyIndex + 1]);
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  policy.__skillRoot = dirname(policyPath);
  policy.__projectRoot = event?.cwd
    || process.env.CLAUDE_PROJECT_DIR
    || process.env.CLAUDE_CWD
    || process.cwd();
  const decision = enforcePolicy(event, policy);
  if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
  return 0;
}

export async function runEvalCommand(argv, options) {
  const { runEvaluation, HOLDOUT_PRECISION_MIN, HOLDOUT_RECALL_MIN } = await import('../../eval.mjs');
  const report = await runEvaluation({ root: await resolveRuntimeRoot(options) });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.precision >= HOLDOUT_PRECISION_MIN && report.recall >= HOLDOUT_RECALL_MIN ? 0 : 1;
}

export async function runPackage(argv, options) {
  const args = [...argv];
  const host = consumeOption(args, '--host');
  if (host === null) {
    process.stderr.write('--host requires a value\n');
    return 2;
  }
  const skill = consumeOption(args, '--skill');
  if (skill === null) {
    process.stderr.write('--skill requires a value\n');
    return 2;
  }
  const out = consumeOption(args, '--out');
  if (out === null) {
    process.stderr.write('--out requires a value\n');
    return 2;
  }
  const write = consumeFlag(args, '--write');
  consumeFlag(args, '--dry-run');
  const force = consumeFlag(args, '--force');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');

  if (!host || !skill || !out) {
    process.stderr.write('usage: skillsforge package --host codex --skill <dir> --out <dir> [--force] [--dry-run|--write]\n');
    return 2;
  }
  if (host !== 'codex') {
    process.stderr.write(`unsupported package host: ${host} (supported: codex)\n`);
    return 2;
  }
  if (args.some((item) => item.startsWith('--'))) {
    process.stderr.write(`unknown package option: ${args.find((item) => item.startsWith('--'))}\n`);
    return 2;
  }

  const root = await resolveRuntimeRoot(options);
  let skillDir;
  let outDir;
  try {
    skillDir = resolveUnderRoot(root, skill, { allowAbsolute });
    outDir = resolveUnderRoot(root, out, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await packageCodexPlugin({
    skillDir,
    outDir,
    write,
    dryRun: !write,
    force
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runEvidence(argv, options) {
  const args = [...argv];
  const out = consumeOption(args, '--out');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (out === null) {
    process.stderr.write('--out requires a value\n');
    return 2;
  }
  if (!out) {
    process.stderr.write('usage: skillsforge evidence --out <dir>\n');
    return 2;
  }
  if (args.some((item) => item.startsWith('--'))) {
    process.stderr.write(`unknown evidence option: ${args.find((item) => item.startsWith('--'))}\n`);
    return 2;
  }

  const { buildEvidenceBundleWithPackageMeta } = await import('../../../lib/capabilities/evidence.mjs');
  const root = await resolveRuntimeRoot(options);
  let outDir;
  try {
    outDir = resolveUserPath(root, out, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await buildEvidenceBundleWithPackageMeta({
    root,
    outDir,
    write: true
  });
  process.stdout.write(`${JSON.stringify({
    ok: result.ok,
    outDir: result.outDir,
    bundleHash: result.bundleHash,
    files: result.files
  }, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runSkillShieldCommand(argv, options) {
  const args = [...argv];
  const all = consumeFlag(args, '--all');
  const skill = consumeOption(args, '--skill');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const root = await resolveRuntimeRoot(options);
  if (all) {
    const skills = await loadAllSkills(root);
    const result = await runSkillShieldMany(skills.map((s) => s.directory), { root });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  }
  if (!skill) {
    process.stderr.write('usage: skillsforge skillshield --skill <dir> | --all\n');
    return 2;
  }
  try {
    const result = await runSkillShield(resolveUserPath(root, skill, allowAbsolute), { root });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

export async function runExportAgentsCommand(argv, options) {
  const args = [...argv];
  const out = consumeOption(args, '--out');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const root = await resolveRuntimeRoot(options);
  const result = await exportAgentsMd(root, {
    out: out ?? undefined,
    allowAbsolute
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runCaptureCommand(argv, options) {
  const args = [...argv];
  const insight = consumeOption(args, '--insight');
  const key = consumeOption(args, '--key');
  if (!insight) {
    process.stderr.write('usage: skillsforge capture --insight <text> [--key <slug>]\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const result = await captureLearning(root, { insight, key: key ?? undefined });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runForgeFromCaptureCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await forgeFromCapture(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runCompareCommand(argv, options) {
  const args = [...argv];
  const a = consumeOption(args, '--a');
  const b = consumeOption(args, '--b');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!a || !b) {
    process.stderr.write('usage: skillsforge compare --a <dir> --b <dir>\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let leftDir;
  let rightDir;
  try {
    leftDir = resolveUnderRoot(root, a, { allowAbsolute });
    rightDir = resolveUnderRoot(root, b, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const left = await loadSkill(leftDir, { root });
  const right = await loadSkill(rightDir, { root });
  const payload = {
    a: { name: left.name, description: left.description, routing: left.sidecar?.routing },
    b: { name: right.name, description: right.description, routing: right.sidecar?.routing },
    sameDescription: left.description === right.description,
    sameTriggers: JSON.stringify(left.sidecar?.routing?.triggers) === JSON.stringify(right.sidecar?.routing?.triggers)
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  return 0;
}

export async function runCompareSkillCommand(argv, options) {
  const args = [...argv];
  const a = consumeOption(args, '--a');
  const b = consumeOption(args, '--b');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!a || !b) {
    process.stderr.write('usage: skillsforge compare-skill --a <dir> --b <dir>\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let leftDir;
  let rightDir;
  try {
    leftDir = resolveUnderRoot(root, a, { allowAbsolute });
    rightDir = resolveUnderRoot(root, b, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const payload = await compareSkillTrust(root, leftDir, rightDir);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  return 0;
}

export async function runDemoCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const root = await resolveRuntimeRoot(options);
  const result = await runJudgeDemo(root, { color: !json });
  if (result.scoreboard && !json) {
    process.stdout.write(`${result.scoreboard}\n\n`);
  }
  process.stdout.write(`${JSON.stringify({
    ok: result.ok,
    elapsedMs: result.elapsedMs,
    underBudget: result.underBudget,
    falseAllow: result.falseAllow,
    receiptHash: result.receiptHash,
    evidencePath: result.evidencePath,
    urls: result.urls,
    steps: result.steps,
    error: result.error
  }, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

export async function runWatchCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, '--skill');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge watch --skill <dir> (single quality pass)\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let skillDir;
  try {
    skillDir = resolveUserPath(root, skill, allowAbsolute);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await scoreSkillQuality(skillDir, { root });
  process.stdout.write(`${JSON.stringify({ watch: 'single-pass', ...result }, null, 2)}\n`);
  return result.pass ? 0 : 1;
}
