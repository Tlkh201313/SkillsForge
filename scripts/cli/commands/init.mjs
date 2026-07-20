import { initializeProject } from '../../../lib/capabilities/init.mjs';
import {
  consumeFlag, consumeOption, hasUnknownOption, platformOpenCommand, resolveRuntimeRoot, runProcess, usage
} from '../shared.mjs';

export async function runInitCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const open = consumeFlag(args, '--open');
  const profile = consumeOption(args, '--profile') ?? 'vibecoder';
  const sessionHost = consumeOption(args, '--session-host') ?? 'codex';
  const home = consumeOption(args, '--home');
  const config = consumeOption(args, '--config');
  if (profile === null || sessionHost === null || home === null || config === null) {
    return usage('init options require values: --profile/--session-host/--home/--config');
  }
  if (args.includes('help') || args.includes('--help')) {
    process.stdout.write(`usage: skillsforge init [--profile vibecoder] [--session-host codex] [--open] [--json]

Initialize project-local SkillsForge config, library HTML/AI index, and compact session memory.
`);
    return 0;
  }
  if (hasUnknownOption(args)) return usage(`unknown init option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  let result;
  try {
    result = await initializeProject(root, {
      profile,
      sessionHost,
      home: home || undefined,
      config: config || undefined
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  if (open && result.ok) {
    const command = platformOpenCommand(result.links.libraryHtml);
    const opened = await runProcess(command.command, command.args, { cwd: root, timeoutMs: 10000 });
    result.opened = opened.status === 0;
  }
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(formatInitText(result));
  return result.ok ? 0 : 1;
}

function formatInitText(result) {
  if (!result.ok) return `SkillsForge init failed: ${(result.errors ?? []).join('; ') || result.stage || 'unknown'}\n`;
  return [
    'SkillsForge project initialized',
    `config\t${result.config}`,
    `library\t${result.links.libraryHtml}`,
    `aiIndex\t${result.links.aiIndexHtml}`,
    `session\t${result.session.files.summary}`,
    `serve\t${result.links.serve}`,
    `mutate\t${result.links.serveMutations}`,
    ''
  ].join('\n');
}
