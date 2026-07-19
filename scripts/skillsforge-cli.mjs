import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enforcePolicy } from '../lib/capabilities/claude-policy-compiler.mjs';
import { exportPortableSkill } from '../lib/capabilities/export.mjs';
import {
  runValidate, runDoctorCommand, runRoute, runForge, runReceipt, runVerifyReceipt,
  runEnforce, runEvalCommand, runPackage, runEvidence, runSkillShieldCommand,
  runExportAgentsCommand, runCaptureCommand, runForgeFromCaptureCommand,
  runCompareCommand, runCompareSkillCommand, runDemoCommand, runWatchCommand
} from './cli/commands/trust.mjs';
import {
  runVibeCommand, runCatalogCommand, runQualityCommand, runLintSkillCommand,
  runScaffoldCommand, runBenchCommand, runScorecardCommand, runComposeCommand,
  runStocktakeCommand, runBatchCommand, runPressureCommand
} from './cli/commands/catalog.mjs';
import { runHostsCommand, runInstall } from './cli/commands/hosts.mjs';
import { runLibCommand, runWorkflowsCommand, runAutoCommand } from './cli/commands/library.mjs';
import {
  runOsEnvCommand, runOsFindCommand, runOsPortsCommand, runOsOpenCommand,
  runOsRunCommand, runOsCopyPathCommand, runOsCleanCommand
} from './cli/commands/os.mjs';
import { runWorkbenchCommand, runPsCommand } from './cli/commands/wb.mjs';

export { enforcePolicy, exportPortableSkill };

const modulePath = fileURLToPath(import.meta.url);

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
  hosts [--json] [--home <dir>]     List universal AI CLI host targets and trust boundaries
  install [skill-paths...]          Install skills into detected agent hosts
    --hosts <ids>                   Comma list or all|detected: claude-code,cursor,codex,opencode,zcode,hermes,gemini
    --custom-host <id>:<skills-dir> Add package-fidelity target under --home
    --yes                           Non-interactive (requires --hosts or --custom-host)
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
    --hero                          Require ΓëÑ85
  scaffold --name <id>              Scaffold original skill + sidecar + openai.yaml
    --pack <id>                     Pack id (default eng)
    --mode auto|explicit
    --write                         Persist (default dry-run)
    --force                         Overwrite
  bench                             Measure route/validate latency ΓåÆ artifacts/bench/latest.json
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
  demo                              Judge path: unsafe deny ΓåÆ safe package ΓåÆ receipt
  watch --skill <dir>               Re-quality on interval (single pass in CI)
  wb <task>                         Token-friendly workbench: status/tree/find/grep/diff/errors/bigfiles/recent/proof
    --json --limit <n> --full       Compact by default; --full raises safe output caps
  lib <build|update|serve|check|recommend|remove>
                                    Local skill library index, UI, recommendation, and removal preview
  workflows <list|show|recommend|run|export-html>
                                    Curated workflow catalog (dry-run execution only)
  auto <plan|run>                    Recommend skill + workflow; run requires --read-only
  ps export                         Export PowerShell sf-*.ps1 helper commands
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
    case 'validate': return runValidate(argv.slice(1), options);
    case 'doctor': return runDoctorCommand(argv.slice(1), options);
    case 'route': return runRoute(argv.slice(1), options);
    case 'forge': return runForge(argv.slice(1), options);
    case 'receipt': return runReceipt(argv.slice(1), options);
    case 'verify-receipt': return runVerifyReceipt(argv.slice(1), options);
    case 'enforce': return runEnforce(argv.slice(1), options);
    case 'eval': return runEvalCommand(argv.slice(1), options);
    case 'hosts': return runHostsCommand(argv.slice(1), options);
    case 'install': return runInstall(argv.slice(1), options);
    case 'package': return runPackage(argv.slice(1), options);
    case 'evidence': return runEvidence(argv.slice(1), options);
    case 'vibe': return runVibeCommand(argv.slice(1), options);
    case 'catalog': return runCatalogCommand(argv.slice(1), options);
    case 'quality': return runQualityCommand(argv.slice(1), options);
    case 'lint-skill': return runLintSkillCommand(argv.slice(1), options);
    case 'scaffold': return runScaffoldCommand(argv.slice(1), options);
    case 'bench': return runBenchCommand(argv.slice(1), options);
    case 'scorecard': return runScorecardCommand(argv.slice(1), options);
    case 'compose': return runComposeCommand(argv.slice(1), options);
    case 'stocktake': return runStocktakeCommand(argv.slice(1), options);
    case 'batch': return runBatchCommand(argv.slice(1), options);
    case 'pressure': return runPressureCommand(argv.slice(1), options);
    case 'skillshield': return runSkillShieldCommand(argv.slice(1), options);
    case 'export-agents': return runExportAgentsCommand(argv.slice(1), options);
    case 'capture': return runCaptureCommand(argv.slice(1), options);
    case 'forge-from-capture': return runForgeFromCaptureCommand(argv.slice(1), options);
    case 'compare': return runCompareCommand(argv.slice(1), options);
    case 'compare-skill': return runCompareSkillCommand(argv.slice(1), options);
    case 'demo': return runDemoCommand(argv.slice(1), options);
    case 'watch': return runWatchCommand(argv.slice(1), options);
    case 'wb': return runWorkbenchCommand(argv.slice(1), options);
    case 'lib': return runLibCommand(argv.slice(1), options);
    case 'workflows': return runWorkflowsCommand(argv.slice(1), options);
    case 'auto': return runAutoCommand(argv.slice(1), options);
    case 'ps': return runPsCommand(argv.slice(1), options);
    case 'os-env': return runOsEnvCommand(argv.slice(1), options);
    case 'os-find': return runOsFindCommand(argv.slice(1), options);
    case 'os-ports': return runOsPortsCommand(argv.slice(1), options);
    case 'os-open': return runOsOpenCommand(argv.slice(1), options);
    case 'os-run': return runOsRunCommand(argv.slice(1), options);
    case 'os-copy-path': return runOsCopyPathCommand(argv.slice(1), options);
    case 'os-clean': return runOsCleanCommand(argv.slice(1), options);
    default:
      process.stderr.write(`unknown command: ${command}\n`);
      return 2;
  }
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
