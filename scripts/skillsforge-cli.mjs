import { access, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
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
  const queryIndex = argv.indexOf('--query');
  const query = queryIndex >= 0 ? argv[queryIndex + 1] : argv.filter((item) => !item.startsWith('--')).join(' ');
  if (!query) {
    process.stderr.write('usage: skillsforge route --query <text>\n');
    return 2;
  }
  const skills = await loadAllSkills(await resolveRuntimeRoot(options));
  const result = routeQuery(query, skills);
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
  const path = args.find((item) => !item.startsWith('--'));
  if (!path) {
    process.stderr.write('usage: skillsforge verify-receipt <file> [--package <dir>] [--evaluation <routing-report.json>|--package-only]\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  const packageRoot = await resolvePackageRoot(root, packageOption);
  const skills = await loadAllSkills(packageRoot);
  const verifyOptions = {
    packageRoot,
    packageOnly,
    requireEvaluation: !packageOnly
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

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  process.exitCode = await main();
}
