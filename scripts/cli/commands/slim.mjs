import { formatSlimText, runSlim } from '../../../lib/capabilities/slim.mjs';
import {
  consumeFlag, consumeOption, hasUnknownOption, resolveRuntimeRoot, usage
} from '../shared.mjs';

const TASKS = new Set(['status', 'diff', 'log', 'test', 'run', 'rg', 'gain']);

export async function runSlimCli(argv, options) {
  const args = [...argv];
  const task = args.shift();
  if (!task || task === 'help' || task === '--help') {
    return usage(`usage: skillsforge slim <status|diff|log|test|run|rg|gain> [options]
  status              Compact git status (branch + dirty names)
  diff [--stat]       Name-only + shortstat
  log [--limit n]     Oneline log
  test [--] <cmd...>    Run tests; keep fail summary, drop pass spam
  run -- <cmd...>       Generic runner with line caps
  rg -- <args...>       Cap/group ripgrep matches
  gain [--reset]      Show or clear estimated tokens saved (chars/4)
  --json --limit n`);
  }
  if (!TASKS.has(task)) return usage(`unknown slim task: ${task}`);

  const json = consumeFlag(args, '--json');
  const reset = consumeFlag(args, '--reset');
  const stat = consumeFlag(args, '--stat');
  const limitOpt = consumeOption(args, '--limit');
  if (limitOpt === null) return usage('--limit requires a value');

  let passthrough = [];
  const dd = args.indexOf('--');
  if (dd >= 0) {
    passthrough = args.splice(dd + 1);
    args.splice(dd, 1);
  } else if (task === 'test' || task === 'run' || task === 'rg') {
    passthrough = [...args];
    args.length = 0;
  }
  if (hasUnknownOption(args)) return usage(`unknown slim option: ${hasUnknownOption(args)}`);

  const root = await resolveRuntimeRoot(options);
  const payload = await runSlim(root, task, {
    json,
    reset,
    stat,
    limit: limitOpt ? Number(limitOpt) : undefined,
    argv: passthrough
  });
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(formatSlimText(payload));
  return payload.ok ? 0 : 1;
}
