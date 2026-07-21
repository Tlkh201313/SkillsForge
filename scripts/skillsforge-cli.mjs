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
import { runTokensCli, runDigestCli, runNextCli } from './cli/commands/operator.mjs';
import { runMapCli } from './cli/commands/map.mjs';
import { runSlimCli } from './cli/commands/slim.mjs';
import { runSettingsCommand } from './cli/commands/settings.mjs';
import { runSessionCommand } from './cli/commands/session.mjs';
import { runInitCommand } from './cli/commands/init.mjs';
import { runOutputProofCommand } from './cli/commands/output-proof.mjs';

export { enforcePolicy, exportPortableSkill };

const modulePath = fileURLToPath(import.meta.url);
const CLI_VERSION = '0.4.3';

export async function main(argv = process.argv.slice(2), options = {}) {
  const command = argv[0];
  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(`usage: skillsforge <command> [options]

Work OS for productive Agent Skills. Trust validate/package/hooks/receipts = safety layer.
Default output is compact. Most commands accept --json. Operator cmds also accept --limit / --full.
Prefer --dry-run before writes. Install/remove/write require explicit confirmation.

  help                              Show this help
  version / --version               Print CLI version
  init                              Initialize project library HTML, config, and session memory

Catalog & authoring:
  vibe                              Magical moment: work stubs + catalog summary + quality sample
  catalog                           List packs/profiles/skills (--pack/--profile/--search/--json)
  route --query <text>              Explainable skill routing (--pack / --include-explicit)
  quality --skill <dir>             Score skill quality 0-100
  lint-skill --skill <dir>          Fail if quality below threshold (--threshold / --hero)
  scaffold --name <id>              Scaffold skill + sidecar (--pack/--mode/--write/--force)
  stocktake                         Diff installed skills vs catalog
  export-agents [--out <file>]      Write AGENTS.md from catalog/agents
  forge --spec <file>               Deterministic skill generation (--dry-run/--write)
  capture / forge-from-capture      Learning capture -> skill proposals
  compare / compare-skill            Sidecar / trust delta diffs
  output-proof                      Generate a baseline vs SkillsForge output contract proof
  bench / scorecard / compose / batch / watch / pressure / skillshield

Operator terminals:
  wb <task>                         Workbench: status/tree/find/grep/diff/errors/bigfiles/recent/proof
                                    (--json --limit <n> --full)
  lib <build|update|serve|check|recommend|select|unselect|selected|remove|open>
                                    Local library UI, AI index, project selection; remove dry-run default
  workflows <list|show|recommend|run|export-html>
                                    Workflow catalog (run = dry-run only)
  auto <plan|run>                   Skill + workflow recommend; run requires --read-only
  tokens [--catalog|--skill|--path] Estimate context tokens (chars/4); optional --track/--session
                                    Default catalog = repo skills; add --installed for host skills.
                                    Heuristic only - not tiktoken / API billing.
  digest --query <text>             One-shot: status + recommend + token cost + next commands
  next                              Suggest next productive SkillsForge commands from repo state
  map <status|index|symbol|...>     ForgeMap: lean JS/TS structural index (optional codegraph.db)
  slim <status|diff|log|test|...>   ForgeSlim: compress git/test/rg output + gain ledger
  settings <show|set|reset|validate>
                                    Local config for thresholds, library UI, and mutation defaults
  session <remember|recall|score|summary|reset|export>
                                    Compact skill/workflow usage memory, not chat transcript memory
  ps export                         Write PowerShell sf-*.ps1 helpers (token-friendly)

Hosts & install:
  hosts [--json] [--home <dir>]     AI CLI host targets and trust boundaries
  install [skill-paths...]          Multi-host install (--hosts/--custom-host/--yes/--dry-run/--force)
  package --host codex              One skill -> guarded Codex plugin (--skill/--out/--dry-run/--write)

Trust & ship:
  demo                              Trust-layer beat: unsafe deny -> safe package -> demo scoreboard
  validate [paths...]               Structure + capability policy (--all/--json/--profile/--allow-empty)
  doctor                            Plugin + installed-skill health (--json)
  receipt / verify-receipt         Tamper-evident package receipt (--package-only for verify)
  evidence --out <dir>              Deterministic trust/eval evidence bundle
  enforce --policy <sidecar.json>   PreToolUse allow/deny from stdin event JSON
  eval                              Holdout routing evaluation (P/R gate)
  skillshield / pressure            Body scan / fixture pressure gate
  compare-skill --a <dir> --b <dir> Side-by-side trust delta

Compat OS helpers (prefer wb/ps when possible):
  os-env / os-find / os-ports / os-open / os-run / os-copy-path / os-clean
  os-run is dry-run unless --yes

Exit codes: 0 success, 1 command failure, 2 invalid usage
`);
    return 0;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    process.stdout.write(`skillsforge ${CLI_VERSION}\n`);
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
    case 'output-proof': return runOutputProofCommand(argv.slice(1), options);
    case 'demo': return runDemoCommand(argv.slice(1), options);
    case 'watch': return runWatchCommand(argv.slice(1), options);
    case 'init': return runInitCommand(argv.slice(1), options);
    case 'wb': return runWorkbenchCommand(argv.slice(1), options);
    case 'lib': return runLibCommand(argv.slice(1), options);
    case 'workflows': return runWorkflowsCommand(argv.slice(1), options);
    case 'auto': return runAutoCommand(argv.slice(1), options);
    case 'tokens': return runTokensCli(argv.slice(1), options);
    case 'digest': return runDigestCli(argv.slice(1), options);
    case 'next': return runNextCli(argv.slice(1), options);
    case 'map': return runMapCli(argv.slice(1), options);
    case 'slim': return runSlimCli(argv.slice(1), options);
    case 'settings': return runSettingsCommand(argv.slice(1), options);
    case 'session': return runSessionCommand(argv.slice(1), options);
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
