import { formatWorkbenchText, runWorkbench } from '../../../lib/capabilities/workbench.mjs';
import { exportPowerShellHelpers } from '../../../lib/capabilities/powershell.mjs';
import {
  consumeFlag, consumeOption, resolveRuntimeRoot, usage, hasUnknownOption
} from '../shared.mjs';

export async function runWorkbenchCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const full = consumeFlag(args, '--full');
  const limitOption = consumeOption(args, '--limit');
  const limitValue = limitOption ?? (full ? '5000' : '80');
  const queryOption = consumeOption(args, '--query');
  if (limitOption === null) return usage('--limit requires a value');
  if (queryOption === null) return usage('--query requires a value');
  const task = args.shift() ?? 'status';
  const query = queryOption ?? args.join(' ');
  if (hasUnknownOption(args)) return usage(`unknown wb option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  const payload = await runWorkbench(root, task, {
    query,
    limit: Number(limitValue) || (full ? 5000 : 80),
    full
  });
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(formatWorkbenchText(payload));
  return payload.ok ? 0 : 1;
}

export async function runPsCommand(argv, options) {
  const args = [...argv];
  const subcommand = args.shift();
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const out = consumeOption(args, '--out');
  if (out === null) return usage('--out requires a value');
  if (subcommand !== 'export') return usage('usage: skillsforge ps export [--out <dir>] [--json] [--allow-absolute]');
  if (hasUnknownOption(args)) return usage(`unknown ps option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  let result;
  try {
    result = await exportPowerShellHelpers(root, { outDir: out ?? undefined, allowAbsolute });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    for (const file of result.files) process.stdout.write(`${file.name}\t${file.path}\n`);
  }
  return result.ok ? 0 : 1;
}
