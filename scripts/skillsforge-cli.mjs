import { access, readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSkills } from '../lib/capabilities/skill-loader.mjs';
import { routeQuery } from '../lib/capabilities/router.mjs';
import { forgeSkill } from '../lib/capabilities/forge.mjs';
import { buildReceipt, normalizeEvaluation, verifyReceipt } from '../lib/capabilities/receipt.mjs';
import { runDoctor } from '../lib/capabilities/doctor.mjs';
import { enforcePolicy } from '../lib/capabilities/claude-policy-compiler.mjs';
import { analyzeDependencies } from '../lib/capabilities/dependency-graph.mjs';
import { verifySkillPaths } from '../lib/capabilities/verify.mjs';
import { detectHosts, installSkills, resolveHostSelection } from '../lib/capabilities/install.mjs';
import { pickHosts } from '../lib/capabilities/install-tui.mjs';
import { HOST_REGISTRY } from '../lib/capabilities/hosts.mjs';
import { exportPortableSkill } from '../lib/capabilities/export.mjs';
import { packageCodexPlugin } from '../lib/capabilities/codex-package.mjs';
import { loadCatalog, listPacks, listProfiles, searchCatalog, catalogStats, skillsForPack, skillsForProfile } from '../lib/capabilities/catalog.mjs';
import { runVibe } from '../lib/capabilities/vibe.mjs';
import { scoreSkillQuality, lintSkill } from '../lib/capabilities/quality.mjs';
import { scaffoldSkill } from '../lib/capabilities/scaffold.mjs';
import { runBench, runScorecard, runCompose, runStocktake, runPressure } from '../lib/capabilities/bench.mjs';
import { runSkillShield, runSkillShieldMany } from '../lib/capabilities/skillshield.mjs';
import { exportAgentsMd, captureLearning, forgeFromCapture } from '../lib/capabilities/export-agents.mjs';
import { loadSkill } from '../lib/capabilities/skill-loader.mjs';
import { resolveUnderRoot } from '../lib/capabilities/paths.mjs';
import { runJudgeDemo, compareSkillTrust, formatPackScorecard } from '../lib/capabilities/demo.mjs';

export { enforcePolicy, exportPortableSkill };

const modulePath = fileURLToPath(import.meta.url);
const modulePluginRoot = resolve(dirname(modulePath), '..');

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isPluginRoot(root) {
  return await pathExists(join(root, '.claude-plugin', 'plugin.json'))
    && await pathExists(join(root, 'skills'));
}

async function isRepositoryRoot(root) {
  return pathExists(join(root, 'plugins', 'skillsforge', '.claude-plugin', 'plugin.json'));
}

async function resolveRuntimeRoot(options, { explicitPaths = false } = {}) {
  if (options.root) return options.root;
  if (explicitPaths) return process.cwd();
  const cwd = process.cwd();
  if (await isRepositoryRoot(cwd)) return cwd;
  if (await isPluginRoot(modulePluginRoot)) return modulePluginRoot;
  if (await isPluginRoot(cwd)) return cwd;
  return cwd;
}

export async function main(argv = process.argv.slice(2), options = {}) {
  const command = argv[0];
  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(`usage: skillsforge <command> [options]

Commands:
  help                              Show this help
  validate [paths...]               Validate skills (structure + capability policy when sidecar present)
    --json                          Machine-readable diagnostics
    --all                           Scan every production skill under plugins/*/skills
    --allow-empty                   Allow empty production skill libraries
    --profile <canonical|claude-code>
                                    Validation profile (default: canonical)
  doctor                            Plugin and installed-skill health checks
    --json                          Machine-readable diagnostics
  route --query <text>              Explainable skill routing for a query
  forge --spec <file>               Deterministic skill generation from forge-spec
    --dry-run                       Plan only (default when --write omitted)
    --write                         Write SKILL.md + skillsforge.json
    --force                         Overwrite an existing skill directory
    --out <dir>                     Output skills root (default: plugin skills/)
  receipt                           Build a trust receipt for packaged bytes
    --out <file>                    Receipt path (default: dist/trust-receipt.json)
    --package <dir>                 Package root to hash
    --evaluation <file>             Routing evaluation report to embed
    --require-evaluation            Fail if evaluation evidence is missing
  verify-receipt <file>             Verify a trust receipt
    --package <dir>                 Package root to re-hash
    --evaluation <file>             External routing-report.json to check
    --package-only                  Skip evaluation authenticity checks
  enforce --policy <sidecar.json>   Decide PreToolUse allow/deny from stdin event JSON
  eval                              Run holdout routing evaluation (P/R gate)
  install [skill-paths...]          Install skills into detected agent hosts
    --hosts <ids>                   Comma list: claude-code,cursor,codex,opencode,gemini
    --yes                           Non-interactive (requires --hosts)
    --list                          Print detected hosts and exit
    --dry-run                       Plan installs without writing
    --force                         Overwrite existing skill directories
    --json                          Machine-readable output
    --home <dir>                    Override home directory (tests / custom roots)
  package --host codex              Package one skill as a guarded Codex plugin
    --skill <dir>                   Single skill directory (multi-skill inputs are rejected)
    --out <dir>                     Output plugin directory
    --dry-run                       Plan only (default when --write omitted)
    --write                         Write the Codex plugin tree
    --force                         Overwrite a non-empty --out directory
  evidence --out <dir>              Emit deterministic trust/eval evidence bundle
                                    (writes when --out is set; default CI path: artifacts/evidence)
  vibe                              Magical moment: work stubs + catalog summary + quality sample
    --json                          Machine-readable output
  catalog                           List packs/profiles/skills
    --pack <id>                     Filter by pack
    --profile <id>                  List skills for profile
    --search <text>                 Search skill ids
    --json                          Machine-readable output
  quality --skill <dir>             Score skill quality 0-100
    --json
  lint-skill --skill <dir>          Fail if quality below threshold
    --threshold <n>                 Default 70
    --hero                          Require ≥85
  scaffold --name <id>              Scaffold original skill + sidecar + openai.yaml
    --pack <id>                     Pack id (default eng)
    --mode auto|explicit
    --write                         Persist (default dry-run)
    --force                         Overwrite
  bench                             Measure route/validate latency → artifacts/bench/latest.json
  scorecard                         Pack coverage + last bench
  compose --workflow <file>         Run skill DAG from JSON workflow
  stocktake                         Diff installed skills vs catalog
  batch --pack <id> --action quality|validate|skillshield
  pressure --skill <dir>            Run skill pressure fixtures
  skillshield [--skill <dir>|--all] Scan skills for unsafe patterns
  export-agents [--out <file>]      Write AGENTS.md from catalog/agents
  capture --insight <text>          Append learning to artifacts/capture + docs/work/learning.md
  forge-from-capture                Propose skill candidates from repeated learnings
  compare --a <dir> --b <dir>       Diff two skill sidecars/descriptions
  compare-skill --a <dir> --b <dir> Side-by-side sidecar vs policy (trust delta)
  demo                              Judge path: unsafe deny → safe package → receipt
  watch --skill <dir>               Re-quality on interval (single pass in CI)
  os-env [--name <VAR>] [--json]     Inspect safe environment facts without dumping secrets
  os-find --name <glob> [--root <dir>] [--json]
                                    Cross-platform file finder with repo-safe defaults
  os-ports [--json]                 Best-effort listening port snapshot
  os-open <path-or-url> [--dry-run] [--json]
                                    Open target via platform launcher
  os-run [--yes|--dry-run] -- <cmd> [args...]
                                    Agent-safe command runner; dry-run unless --yes
  os-copy-path <path> [--json]      Resolve and print canonical path
  os-clean --root <dir> [--json]    Dry-run cleanup candidate inventory only

Exit codes: 0 success, 1 command failure, 2 invalid usage
`);
    return 0;
  }

  switch (command) {
    case 'validate':
      return runValidate(argv.slice(1), options);
    case 'doctor':
      return runDoctorCommand(argv.slice(1), options);
    case 'route':
      return runRoute(argv.slice(1), options);
    case 'forge':
      return runForge(argv.slice(1), options);
    case 'receipt':
      return runReceipt(argv.slice(1), options);
    case 'verify-receipt':
      return runVerifyReceipt(argv.slice(1), options);
    case 'enforce':
      return runEnforce(argv.slice(1), options);
    case 'eval':
      return runEvalCommand(argv.slice(1), options);
    case 'install':
      return runInstall(argv.slice(1), options);
    case 'package':
      return runPackage(argv.slice(1), options);
    case 'evidence':
      return runEvidence(argv.slice(1), options);
    case 'vibe':
      return runVibeCommand(argv.slice(1), options);
    case 'catalog':
      return runCatalogCommand(argv.slice(1), options);
    case 'quality':
      return runQualityCommand(argv.slice(1), options);
    case 'lint-skill':
      return runLintSkillCommand(argv.slice(1), options);
    case 'scaffold':
      return runScaffoldCommand(argv.slice(1), options);
    case 'bench':
      return runBenchCommand(argv.slice(1), options);
    case 'scorecard':
      return runScorecardCommand(argv.slice(1), options);
    case 'compose':
      return runComposeCommand(argv.slice(1), options);
    case 'stocktake':
      return runStocktakeCommand(argv.slice(1), options);
    case 'batch':
      return runBatchCommand(argv.slice(1), options);
    case 'pressure':
      return runPressureCommand(argv.slice(1), options);
    case 'skillshield':
      return runSkillShieldCommand(argv.slice(1), options);
    case 'export-agents':
      return runExportAgentsCommand(argv.slice(1), options);
    case 'capture':
      return runCaptureCommand(argv.slice(1), options);
    case 'forge-from-capture':
      return runForgeFromCaptureCommand(argv.slice(1), options);
    case 'compare':
      return runCompareCommand(argv.slice(1), options);
    case 'compare-skill':
      return runCompareSkillCommand(argv.slice(1), options);
    case 'demo':
      return runDemoCommand(argv.slice(1), options);
    case 'watch':
      return runWatchCommand(argv.slice(1), options);
    case 'os-env':
      return runOsEnvCommand(argv.slice(1), options);
    case 'os-find':
      return runOsFindCommand(argv.slice(1), options);
    case 'os-ports':
      return runOsPortsCommand(argv.slice(1), options);
    case 'os-open':
      return runOsOpenCommand(argv.slice(1), options);
    case 'os-run':
      return runOsRunCommand(argv.slice(1), options);
    case 'os-copy-path':
      return runOsCopyPathCommand(argv.slice(1), options);
    case 'os-clean':
      return runOsCleanCommand(argv.slice(1), options);
    default:
      process.stderr.write(`unknown command: ${command}\n`);
      return 2;
  }
}

async function runValidate(argv, options) {
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

function consumeFlag(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return false;
  values.splice(index, 1);
  return true;
}

function consumeOption(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    values.splice(index, 1);
    return null;
  }
  values.splice(index, 2);
  return value;
}

function resolveUserPath(root, value, allowAbsolute = false) {
  return resolveUnderRoot(root, value, { allowAbsolute });
}

async function runDoctorCommand(argv, options) {
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

async function runRoute(argv, options) {
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

async function runForge(argv, options) {
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

async function resolvePackageRoot(root, packageOption) {
  if (packageOption) return resolve(packageOption);
  if (await isPluginRoot(root)) return root;
  const distPackage = join(root, 'dist', 'claude-code');
  if (await pathExists(join(distPackage, '.claude-plugin', 'plugin.json'))) return distPackage;
  if (await isRepositoryRoot(root)) return join(root, 'plugins', 'skillsforge');
  return root;
}

async function runReceipt(argv, options) {
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

async function runVerifyReceipt(argv, options) {
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

async function runEnforce(argv) {
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

async function runEvalCommand(argv, options) {
  const { runEvaluation, HOLDOUT_PRECISION_MIN, HOLDOUT_RECALL_MIN } = await import('./eval.mjs');
  const report = await runEvaluation({ root: await resolveRuntimeRoot(options) });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.precision >= HOLDOUT_PRECISION_MIN && report.recall >= HOLDOUT_RECALL_MIN ? 0 : 1;
}

async function runInstall(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const list = consumeFlag(args, '--list');
  const yes = consumeFlag(args, '--yes');
  const dryRun = consumeFlag(args, '--dry-run');
  const force = consumeFlag(args, '--force');
  const hostsOption = consumeOption(args, '--hosts');
  if (hostsOption === null) {
    process.stderr.write('--hosts requires a value\n');
    return 2;
  }
  const homeOption = consumeOption(args, '--home');
  if (homeOption === null) {
    process.stderr.write('--home requires a value\n');
    return 2;
  }
  const home = homeOption ? resolve(homeOption) : options.home;
  const skillPaths = args.filter((item) => !item.startsWith('--'));
  const root = await resolveRuntimeRoot(options, { explicitPaths: skillPaths.length > 0 });

  const detected = await detectHosts({ home });
  if (list) {
    const payload = {
      ok: true,
      registry: HOST_REGISTRY.map((host) => ({ id: host.id, label: host.label, fidelity: host.fidelity })),
      hosts: detected
    };
    if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    else {
      for (const host of detected) {
        const mark = host.detected ? 'detected' : 'missing';
        process.stdout.write(`${host.id}\t${mark}\t${host.fidelity}\t${host.skillsDir}\n`);
      }
    }
    return 0;
  }

  let hostIds = hostsOption
    ? hostsOption.split(',').map((item) => item.trim()).filter(Boolean)
    : null;

  if (!hostIds) {
    if (yes) {
      process.stderr.write('install --yes requires --hosts <ids>\n');
      return 2;
    }
    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    if (!interactive) {
      process.stderr.write('usage: skillsforge install --hosts <ids> --yes [skill-paths...]\n');
      process.stderr.write('       (interactive picker requires a TTY; use --list to see hosts)\n');
      return 2;
    }
    try {
      const picked = await pickHosts(detected);
      if (picked == null) {
        process.stderr.write('install aborted\n');
        return 1;
      }
      hostIds = picked;
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      return 2;
    }
  }

  if (!hostIds.length) {
    process.stderr.write('no hosts selected\n');
    return 1;
  }

  const selection = await resolveHostSelection(hostIds, { home });
  if (selection.unknown.length) {
    process.stderr.write(`unknown hosts: ${selection.unknown.join(', ')}\n`);
    process.stderr.write(`known: ${HOST_REGISTRY.map((host) => host.id).join(', ')}\n`);
    return 2;
  }

  const result = await installSkills({
    hostIds,
    home,
    root,
    skillPaths: skillPaths.length ? skillPaths : undefined,
    dryRun,
    force
  });

  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    if (!result.ok) {
      process.stdout.write(`FAIL install: ${result.error ?? 'unknown'}\n`);
      if (result.validation?.text) process.stdout.write(result.validation.text);
    } else {
      for (const item of result.installs) {
        process.stdout.write(`${item.status.toUpperCase()} ${item.host}/${item.skill} -> ${item.dir}\n`);
      }
      process.stdout.write(`OK install (${result.dryRun ? 'dry-run' : 'wrote'} ${result.installs.length} target(s))\n`);
    }
  }
  return result.ok ? 0 : 1;
}

async function runPackage(argv, options) {
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

async function runEvidence(argv, options) {
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

  const { buildEvidenceBundleWithPackageMeta } = await import('../lib/capabilities/evidence.mjs');
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

async function runVibeCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const root = await resolveRuntimeRoot(options);
  const result = await runVibe(root, { json });
  if (json) process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
  else process.stdout.write(result.text);
  return result.ok ? 0 : 1;
}

async function runCatalogCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const pack = consumeOption(args, '--pack');
  const profile = consumeOption(args, '--profile');
  const search = consumeOption(args, '--search');
  if (pack === null || profile === null || search === null) {
    process.stderr.write('option requires a value\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const { catalog } = await loadCatalog(root);
  let payload;
  if (search) payload = { search, hits: searchCatalog(catalog, search) };
  else if (pack) payload = { pack, skills: skillsForPack(catalog, pack) };
  else if (profile) payload = { profile, skills: skillsForProfile(catalog, profile) };
  else {
    payload = {
      stats: catalogStats(catalog),
      packs: listPacks(catalog),
      profiles: listProfiles(catalog)
    };
  }
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  }
  return 0;
}

async function runQualityCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const skill = consumeOption(args, '--skill');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge quality --skill <dir>\n');
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
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.pass ? 0 : 1;
}

async function runLintSkillCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, '--skill');
  const thresholdRaw = consumeOption(args, '--threshold');
  const hero = consumeFlag(args, '--hero');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge lint-skill --skill <dir> [--threshold n] [--hero]\n');
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
  const result = await lintSkill(skillDir, {
    root,
    threshold: thresholdRaw ? Number(thresholdRaw) : 70,
    hero
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

async function runScaffoldCommand(argv, options) {
  const args = [...argv];
  const name = consumeOption(args, '--name');
  const pack = consumeOption(args, '--pack') ?? 'eng';
  const mode = consumeOption(args, '--mode') ?? 'explicit';
  const write = consumeFlag(args, '--write');
  const force = consumeFlag(args, '--force');
  if (!name) {
    process.stderr.write('usage: skillsforge scaffold --name <id> [--pack <id>] [--mode auto|explicit] [--write] [--force]\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const result = await scaffoldSkill(root, { name, pack, mode }, { write, force, dryRun: !write });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

async function runBenchCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await runBench(root);
  process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

async function runScorecardCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const root = await resolveRuntimeRoot(options);
  const result = await runScorecard(root);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatPackScorecard(result, { color: true })}\n`);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  return 0;
}

async function runComposeCommand(argv, options) {
  const args = [...argv];
  const workflow = consumeOption(args, '--workflow');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!workflow) {
    process.stderr.write('usage: skillsforge compose --workflow <file>\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let workflowPath;
  try {
    workflowPath = resolveUnderRoot(root, workflow, { allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await runCompose(root, workflowPath);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

async function runStocktakeCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await runStocktake(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.missing.length === 0 ? 0 : 1;
}

async function runBatchCommand(argv, options) {
  const args = [...argv];
  const pack = consumeOption(args, '--pack');
  const action = consumeOption(args, '--action') ?? 'quality';
  if (!pack) {
    process.stderr.write('usage: skillsforge batch --pack <id> --action quality|validate|skillshield\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const { catalog } = await loadCatalog(root);
  const ids = skillsForPack(catalog, pack) ?? [];
  const reports = [];
  for (const id of ids) {
    const dir = join(root, 'plugins', 'skillsforge', 'skills', id);
    if (!(await pathExists(dir))) {
      reports.push({ id, ok: false, error: 'missing' });
      continue;
    }
    if (action === 'quality') reports.push({ id, ...(await scoreSkillQuality(dir, { root })) });
    else if (action === 'skillshield') reports.push({ id, ...(await runSkillShield(dir, { root })) });
    else {
      const { verifySkillPaths } = await import('../lib/capabilities/verify.mjs');
      const v = await verifySkillPaths([dir], { root, profile: 'claude-code' });
      reports.push({ id, ok: v.ok });
    }
  }
  const ok = reports.every((r) => r.ok || r.pass);
  process.stdout.write(`${JSON.stringify({ pack, action, ok, reports }, null, 2)}\n`);
  return ok ? 0 : 1;
}

async function runPressureCommand(argv, options) {
  const args = [...argv];
  const skill = consumeOption(args, '--skill');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (!skill) {
    process.stderr.write('usage: skillsforge pressure --skill <dir>\n');
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
  const result = await runPressure(skillDir);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

async function runSkillShieldCommand(argv, options) {
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

async function runExportAgentsCommand(argv, options) {
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

async function runCaptureCommand(argv, options) {
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

async function runForgeFromCaptureCommand(argv, options) {
  const root = await resolveRuntimeRoot(options);
  const result = await forgeFromCapture(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

async function runCompareCommand(argv, options) {
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

async function runCompareSkillCommand(argv, options) {
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

async function runDemoCommand(argv, options) {
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

async function runOsEnvCommand(argv) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const name = consumeOption(args, '--name');
  if (name === null) return usage('--name requires a value');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  if (name) {
    const exists = Object.hasOwn(process.env, name);
    return writeOsResult({
      ok: exists,
      command: 'os-env',
      name,
      exists,
      value: exists ? process.env[name] : null
    }, json, ({ value }) => `${value ?? ''}\n`, exists ? 0 : 1);
  }

  const pathEntries = String(process.env.PATH ?? process.env.Path ?? '')
    .split(process.platform === 'win32' ? ';' : ':')
    .filter(Boolean);
  return writeOsResult({
    ok: true,
    command: 'os-env',
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    shell: process.env.SHELL ?? process.env.ComSpec ?? null,
    home: process.env.HOME ?? process.env.USERPROFILE ?? null,
    pathEntries,
    envKeys: Object.keys(process.env).sort()
  }, json, (payload) => [
    `platform=${payload.platform}`,
    `arch=${payload.arch}`,
    `node=${payload.node}`,
    `cwd=${payload.cwd}`,
    `shell=${payload.shell ?? ''}`,
    `pathEntries=${payload.pathEntries.length}`,
    `envKeys=${payload.envKeys.length}`
  ].join('\n') + '\n');
}

async function runOsFindCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const name = consumeOption(args, '--name');
  const rootOption = consumeOption(args, '--root') ?? '.';
  const limitValue = consumeOption(args, '--limit') ?? '200';
  if (name === null) return usage('--name requires a value');
  if (rootOption === null) return usage('--root requires a value');
  if (limitValue === null) return usage('--limit requires a value');
  if (!name) return usage('usage: skillsforge os-find --name <glob> [--root <dir>] [--json]');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  const repoRoot = await resolveRuntimeRoot(options);
  let root;
  try {
    root = resolveUserPath(repoRoot, rootOption, allowAbsolute);
  } catch (error) {
    return failOsResult('os-find', error.message, json);
  }
  const limit = Math.max(1, Math.min(1000, Number(limitValue) || 200));
  const regex = globToRegExp(name);
  const matches = [];
  await walkFind(root, root, regex, matches, limit);
  return writeOsResult({
    ok: true,
    command: 'os-find',
    root,
    pattern: name,
    limit,
    truncated: matches.length >= limit,
    matches
  }, json, (payload) => payload.matches.map((item) => `${item.type}\t${item.path}`).join('\n') + (payload.matches.length ? '\n' : ''));
}

async function runOsPortsCommand(argv) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const attempts = process.platform === 'win32'
    ? [['netstat', ['-ano', '-p', 'tcp']]]
    : [['lsof', ['-nP', '-iTCP', '-sTCP:LISTEN']], ['netstat', ['-an']]];
  for (const [command, commandArgs] of attempts) {
    const result = await runProcess(command, commandArgs, { timeoutMs: 5000 });
    if (result.status === 0 && result.stdout.trim()) {
      const lines = result.stdout.split(/\r?\n/).filter(Boolean).slice(0, 200);
      return writeOsResult({
        ok: true,
        command: 'os-ports',
        probe: [command, ...commandArgs].join(' '),
        lines
      }, json, (payload) => payload.lines.join('\n') + '\n');
    }
  }
  return failOsResult('os-ports', 'no port probe command succeeded', json);
}

async function runOsOpenCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const dryRun = consumeFlag(args, '--dry-run');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const target = args.shift();
  if (!target) return usage('usage: skillsforge os-open <path-or-url> [--dry-run] [--json]');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  const repoRoot = await resolveRuntimeRoot(options);
  let resolved = target;
  if (!isUrlLike(target)) {
    try {
      resolved = resolveUserPath(repoRoot, target, allowAbsolute);
    } catch (error) {
      return failOsResult('os-open', error.message, json);
    }
  }
  const launcher = platformOpenCommand(resolved);
  const payload = {
    ok: true,
    command: 'os-open',
    dryRun,
    target: resolved,
    launcher: [launcher.command, ...launcher.args]
  };
  if (dryRun) {
    return writeOsResult(payload, json, (item) => `${item.launcher.join(' ')}\n`);
  }
  const result = await runProcess(launcher.command, launcher.args, { timeoutMs: 10000 });
  return writeOsResult({ ...payload, result }, json, () => result.stderr || result.stdout || '', result.status === 0 ? 0 : 1);
}

async function runOsRunCommand(argv, options) {
  const split = splitCommandArgs(argv);
  const args = [...split.options];
  const json = consumeFlag(args, '--json');
  const dryRunFlag = consumeFlag(args, '--dry-run');
  const yes = consumeFlag(args, '--yes');
  const cwdOption = consumeOption(args, '--cwd') ?? '.';
  const timeoutValue = consumeOption(args, '--timeout-ms') ?? '30000';
  if (cwdOption === null) return usage('--cwd requires a value');
  if (timeoutValue === null) return usage('--timeout-ms requires a value');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  if (split.command.length === 0) return usage('usage: skillsforge os-run [--yes|--dry-run] -- <cmd> [args...]');

  const root = await resolveRuntimeRoot(options);
  let cwd;
  try {
    cwd = resolveUserPath(root, cwdOption, true);
  } catch (error) {
    return failOsResult('os-run', error.message, json);
  }
  const [command, ...commandArgs] = split.command;
  const timeoutMs = Math.max(1000, Math.min(300000, Number(timeoutValue) || 30000));
  const dryRun = dryRunFlag || !yes;
  const payload = {
    ok: true,
    command: 'os-run',
    dryRun,
    cwd,
    timeoutMs,
    argv: [command, ...commandArgs]
  };
  if (dryRun) {
    return writeOsResult(payload, json, (item) => `${item.argv.join(' ')}\n`);
  }
  const result = await runProcess(command, commandArgs, { cwd, timeoutMs });
  return writeOsResult({ ...payload, result, ok: result.status === 0 }, json, () => result.stdout + result.stderr, result.status === 0 ? 0 : 1);
}

async function runOsCopyPathCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const target = args.shift();
  if (!target) return usage('usage: skillsforge os-copy-path <path> [--json]');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  try {
    const resolved = resolveUserPath(root, target, allowAbsolute);
    return writeOsResult({ ok: true, command: 'os-copy-path', path: resolved }, json, (payload) => `${payload.path}\n`);
  } catch (error) {
    return failOsResult('os-copy-path', error.message, json);
  }
}

async function runOsCleanCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const rootOption = consumeOption(args, '--root') ?? '.';
  if (rootOption === null) return usage('--root requires a value');
  if (hasUnknownOption(args)) return usage(`unknown option: ${hasUnknownOption(args)}`);

  const repoRoot = await resolveRuntimeRoot(options);
  let root;
  try {
    root = resolveUserPath(repoRoot, rootOption, allowAbsolute);
  } catch (error) {
    return failOsResult('os-clean', error.message, json);
  }
  const names = ['node_modules', 'dist', 'artifacts', 'coverage', '.next', '.turbo', 'tests/.tmp-runner'];
  const candidates = [];
  for (const name of names) {
    const path = resolve(root, name);
    if (await pathExists(path)) {
      candidates.push({
        path,
        relativePath: relative(root, path).replaceAll('\\', '/'),
        bytes: await directorySize(path)
      });
    }
  }
  return writeOsResult({
    ok: true,
    command: 'os-clean',
    dryRun: true,
    root,
    candidates,
    note: 'phase 1 inventory only; no files deleted'
  }, json, (payload) => payload.candidates.map((item) => `${item.bytes}\t${item.relativePath}`).join('\n') + (payload.candidates.length ? '\n' : ''));
}

async function runWatchCommand(argv, options) {
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

function usage(message) {
  process.stderr.write(`${message}\n`);
  return 2;
}

function hasUnknownOption(args) {
  return args.find((item) => item.startsWith('--'));
}

function writeOsResult(payload, json, textFormatter, status = 0) {
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(textFormatter(payload));
  return status;
}

function failOsResult(command, error, json) {
  return writeOsResult({ ok: false, command, error }, json, (payload) => `${payload.error}\n`, 1);
}

function splitCommandArgs(argv) {
  const marker = argv.indexOf('--');
  if (marker === -1) return { options: argv, command: [] };
  return {
    options: argv.slice(0, marker),
    command: argv.slice(marker + 1)
  };
}

function globToRegExp(glob) {
  const escaped = String(glob)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

async function walkFind(root, dir, regex, matches, limit) {
  if (matches.length >= limit) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (matches.length >= limit) return;
    if (shouldSkipFindEntry(entry.name)) continue;
    const full = join(dir, entry.name);
    const rel = relative(root, full).replaceAll('\\', '/');
    const type = entry.isDirectory() ? 'dir' : entry.isFile() ? 'file' : 'other';
    if (regex.test(entry.name) || regex.test(rel)) matches.push({ path: rel, type });
    if (entry.isDirectory()) await walkFind(root, full, regex, matches, limit);
  }
}

function shouldSkipFindEntry(name) {
  return new Set(['.git', '.codegraph', 'node_modules', '.worktrees', 'dist', 'artifacts']).has(name);
}

function isUrlLike(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^mailto:/i.test(value);
}

function platformOpenCommand(target) {
  if (process.platform === 'win32') {
    return { command: 'powershell.exe', args: ['-NoProfile', '-Command', 'Start-Process', '-FilePath', target] };
  }
  if (process.platform === 'darwin') return { command: 'open', args: [target] };
  return { command: 'xdg-open', args: [target] };
}

function runProcess(command, args, options = {}) {
  return new Promise((resolveProcess) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const limit = 200_000;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeoutMs ?? 30000);
    child.stdout?.on('data', (chunk) => {
      stdout = (stdout + chunk.toString()).slice(-limit);
    });
    child.stderr?.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-limit);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolveProcess({ status: 127, stdout, stderr: error.message, timedOut });
    });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolveProcess({ status: status ?? 1, signal, stdout, stderr, timedOut });
    });
  });
}

async function directorySize(path) {
  let info;
  try {
    info = await stat(path);
  } catch {
    return 0;
  }
  if (!info.isDirectory()) return info.size;
  let total = 0;
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    total += await directorySize(join(path, entry.name));
  }
  return total;
}

if (process.argv[1]) {
  let sameEntry = false;
  try {
    sameEntry = realpathSync(process.argv[1]) === realpathSync(modulePath);
  } catch {
    sameEntry = resolve(process.argv[1]) === modulePath;
  }
  if (sameEntry) {
    process.exitCode = await main();
  }
}
