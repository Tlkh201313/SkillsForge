import {
  formatDigestText,
  formatNextText,
  formatTokensText,
  runDigestCommand,
  runNextCommand,
  runTokensCommand
} from '../../../lib/capabilities/operator.mjs';
import {
  consumeFlag, consumeOption, resolveRuntimeRoot, usage, hasUnknownOption
} from '../shared.mjs';

export async function runTokensCli(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const catalog = consumeFlag(args, '--catalog');
  const installed = consumeFlag(args, '--installed');
  const track = consumeFlag(args, '--track');
  const session = consumeFlag(args, '--session');
  const sessionReset = consumeFlag(args, '--session-reset');
  const skill = consumeOption(args, '--skill');
  const pathOpt = consumeOption(args, '--path');
  const limitOpt = consumeOption(args, '--limit');
  const home = consumeOption(args, '--home');
  if (skill === null || pathOpt === null || limitOpt === null || home === null) {
    return usage('tokens options require values: --skill/--path/--limit/--home');
  }
  if (hasUnknownOption(args)) return usage(`unknown tokens option: ${hasUnknownOption(args)}`);
  const paths = [];
  if (pathOpt) paths.push(pathOpt);
  while (args.length > 0 && !String(args[0]).startsWith('--')) paths.push(args.shift());
  if (hasUnknownOption(args)) return usage(`unknown tokens option: ${hasUnknownOption(args)}`);

  const root = await resolveRuntimeRoot(options);
  let payload;
  try {
    payload = await runTokensCommand(root, {
      catalog,
      installed,
      track,
      session,
      sessionReset,
      skill: skill || undefined,
      paths,
      limit: limitOpt ? Number(limitOpt) : undefined,
      home: home || undefined
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(formatTokensText(payload));
  return payload.ok ? 0 : 1;
}

export async function runDigestCli(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const query = consumeOption(args, '--query') ?? (args.length ? args.join(' ') : null);
  const limitOpt = consumeOption(args, '--limit');
  const home = consumeOption(args, '--home');
  const sessionHost = consumeOption(args, '--session-host');
  if (limitOpt === null || home === null || sessionHost === null) {
    return usage('usage: skillsforge digest --query <text> [--limit n] [--json] [--home <dir>] [--session-host <id>]');
  }
  if (query == null || !String(query).trim()) {
    return usage('digest requires --query <text>');
  }
  if (hasUnknownOption(args)) return usage(`unknown digest option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  const payload = await runDigestCommand(root, {
    query: String(query).trim(),
    limit: limitOpt ? Number(limitOpt) : undefined,
    home: home || undefined,
    sessionHost: sessionHost || undefined
  });
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(formatDigestText(payload));
  return payload.ok ? 0 : 1;
}

export async function runNextCli(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const limitOpt = consumeOption(args, '--limit');
  if (limitOpt === null) return usage('--limit requires a value');
  if (hasUnknownOption(args)) return usage(`unknown next option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  const payload = await runNextCommand(root, { limit: limitOpt ? Number(limitOpt) : undefined });
  if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else process.stdout.write(formatNextText(payload));
  return payload.ok ? 0 : 1;
}
