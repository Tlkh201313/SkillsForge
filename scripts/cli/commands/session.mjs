import {
  exportSessionMemory,
  readSessionSummary,
  recallSessionMemory,
  rememberSessionEvent,
  resetSessionMemory,
  scoreSessionMemory
} from '../../../lib/capabilities/session.mjs';
import {
  consumeFlag, consumeOption, consumeOptions, hasUnknownOption, resolveRuntimeRoot, usage
} from '../shared.mjs';

export function sessionHelp() {
  return `usage: skillsforge session <remember|recall|score|summary|reset|export> [options]

Session memory:
  remember --query <text>       Record compact skill/workflow usage memory
  recall [--query <text>]       Return top-K compact session entries
  score                         Review skill/workflow usage discipline
  summary                       Print compact project session summary
  reset                         Clear local session memory artifacts
  export --out <file>           Write a shareable Markdown summary

Options:
  --json --config <file> --session-host <id> --limit <n> --token-budget <n>
  --skill <id> --workflow <id> --agent <role> --score <0-100>
  --reason <text> --command <cmd> --tokens <n> --outcome <text> --verification <text>
`;
}

export async function runSessionCommand(argv, options) {
  const args = [...argv];
  const subcommand = args.shift();
  const json = consumeFlag(args, '--json');
  const config = consumeOption(args, '--config');
  const sessionHost = consumeOption(args, '--session-host');
  const query = consumeOption(args, '--query');
  const skill = consumeOption(args, '--skill');
  const workflow = consumeOption(args, '--workflow');
  const agent = consumeOption(args, '--agent');
  const score = consumeOption(args, '--score');
  const reasons = consumeOptions(args, '--reason');
  const commands = consumeOptions(args, '--command');
  const tokens = consumeOption(args, '--tokens');
  const outcome = consumeOption(args, '--outcome');
  const verification = consumeOption(args, '--verification');
  const limit = consumeOption(args, '--limit');
  const tokenBudget = consumeOption(args, '--token-budget');
  const out = consumeOption(args, '--out');
  if ([config, sessionHost, query, skill, workflow, agent, score, reasons, commands, tokens, outcome, verification, limit, tokenBudget, out].some((value) => value === null)) {
    return usage('session option requires a value');
  }
  if (!subcommand || subcommand === 'help' || subcommand === '--help') {
    process.stdout.write(sessionHelp());
    return 0;
  }
  if (hasUnknownOption(args)) return usage(`unknown session option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  let result;
  try {
    if (subcommand === 'remember') {
      const text = query ?? args.join(' ');
      if (!text) return usage('usage: skillsforge session remember --query <text>');
      result = await rememberSessionEvent(root, {
        query: text,
        selectedSkill: skill,
        selectedWorkflow: workflow,
        agentRole: agent,
        score: score ? Number(score) : undefined,
        reasons,
        commandsSuggested: commands,
        tokensEstimated: tokens ? Number(tokens) : undefined,
        outcome,
        verification
      }, { config, sessionHost: sessionHost ?? undefined });
    } else if (subcommand === 'recall') {
      result = await recallSessionMemory(root, {
        config,
        query: query ?? args.join(' '),
        limit: limit ? Number(limit) : undefined,
        tokenBudget: tokenBudget ? Number(tokenBudget) : undefined
      });
    } else if (subcommand === 'score') {
      result = await scoreSessionMemory(root, { config });
    } else if (subcommand === 'summary') {
      result = { ok: true, summary: await readSessionSummary(root, { config }) };
    } else if (subcommand === 'reset') {
      result = await resetSessionMemory(root, { config });
    } else if (subcommand === 'export') {
      if (!out) return usage('usage: skillsforge session export --out <file>');
      result = await exportSessionMemory(root, {
        config,
        out,
        query: query ?? args.join(' '),
        limit: limit ? Number(limit) : undefined,
        tokenBudget: tokenBudget ? Number(tokenBudget) : undefined
      });
    } else {
      return usage(`unknown session command: ${subcommand}`);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  if (json || subcommand !== 'recall') process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(formatRecallText(result));
  return result.ok ? 0 : 1;
}

function formatRecallText(result) {
  if (!result.ok) return `${result.error ?? 'session recall failed'}\n`;
  if (!result.entries.length) return 'no session memory entries\n';
  return `${result.entries.map((entry) => [
    entry.timestamp,
    entry.selectedSkill ?? 'no-skill',
    entry.selectedWorkflow ?? 'no-workflow',
    entry.outcome ?? entry.query ?? ''
  ].join('\t')).join('\n')}\n`;
}
