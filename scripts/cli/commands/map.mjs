import { formatForgeMapText, runForgeMap } from '../../../lib/capabilities/forgemap.mjs';
import {
  consumeFlag, consumeOption, hasUnknownOption, resolveRuntimeRoot, usage
} from '../shared.mjs';

const TASKS = new Set(['status', 'index', 'files', 'symbol', 'callers', 'impact', 'explore']);

export async function runMapCli(argv, options) {
  const args = [...argv];
  const task = args.shift();
  if (!task || task === 'help' || task === '--help') {
    return usage(`usage: skillsforge map <status|index|files|symbol|callers|impact|explore> [options]
  status                 Index health + optional codegraph link
  index [--force]        Rebuild lightweight JS/TS index
  files [--limit n]      Indexed file list
  symbol <name>          Definitions + file:line
  callers <name>         Importers / approximate callers
  impact <name>          Dependent files (depth 1-2)
  explore --query <text> Compact pack of matching symbols + neighbors
  --json --limit n`);
  }
  if (!TASKS.has(task)) return usage(`unknown map task: ${task}`);

  const json = consumeFlag(args, '--json');
  const force = consumeFlag(args, '--force');
  const limitOpt = consumeOption(args, '--limit');
  const depthOpt = consumeOption(args, '--depth');
  const budgetOpt = consumeOption(args, '--budget');
  let query = consumeOption(args, '--query');
  if (limitOpt === null || depthOpt === null || budgetOpt === null || query === null) {
    return usage('map options require values: --limit/--depth/--budget/--query');
  }

  let name;
  if (['symbol', 'callers', 'impact'].includes(task)) {
    name = args.shift();
    if (!name) return usage(`map ${task} requires <name>`);
  }
  if (task === 'explore') {
    if (!query && args.length) query = args.splice(0).join(' ');
    if (!query?.trim()) return usage('map explore requires --query <text>');
  }
  if (hasUnknownOption(args)) return usage(`unknown map option: ${hasUnknownOption(args)}`);

  const root = await resolveRuntimeRoot(options);
  const payload = await runForgeMap(root, task, {
    json,
    force,
    name,
    query,
    limit: limitOpt ? Number(limitOpt) : undefined,
    depth: depthOpt ? Number(depthOpt) : undefined,
    budget: budgetOpt ? Number(budgetOpt) : undefined
  });
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(formatForgeMapText(payload));
  return payload.ok ? 0 : 1;
}
