import { resolve } from 'node:path';
import { buildLibraryIndex, planSkillRemoval, recommendFromLibrary, removeInstalledSkill, serveLibrary, writeLibraryArtifacts } from '../../../lib/capabilities/library.mjs';
import { loadWorkflows, planAuto, recommendWorkflows, runAutoReadOnly, runWorkflowDryRun, showWorkflow } from '../../../lib/capabilities/workflows.mjs';
import {
  consumeFlag, consumeOption, consumeOptions, resolveRuntimeRoot, usage, hasUnknownOption
} from '../shared.mjs';

export async function runLibCommand(argv, options) {
  const args = [...argv];
  const subcommand = args.shift();
  const json = consumeFlag(args, '--json');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  const out = consumeOption(args, '--out');
  const homeOption = consumeOption(args, '--home');
  const sessionHost = consumeOption(args, '--session-host');
  const config = consumeOption(args, '--config');
  const extraSkillRoots = consumeOptions(args, '--extra-skill-root');
  if (out === null) return usage('--out requires a value');
  if (homeOption === null) return usage('--home requires a value');
  if (sessionHost === null) return usage('--session-host requires a value');
  if (config === null) return usage('--config requires a value');
  if (extraSkillRoots === null) return usage('--extra-skill-root requires a value');
  if (!subcommand || subcommand === 'help' || subcommand === '--help') {
    process.stdout.write(`usage: skillsforge lib <build|update|serve|check|recommend|remove> [options]

Library:
  build/update                  Write skillsforge-library.json/html and skillsforge-ai-index.html
  serve                         Serve localhost read-only UI unless --allow-mutations
  check --skill <id>            Show one indexed skill
  recommend --query <text>      Read-only skill/workflow recommendation
  remove --host <id> --skill <id>
                                Dry-run by default; write requires --allow-mutations --yes

Options: --json --out <dir> --home <dir> --session-host <id> --config <file> --extra-skill-root <dir> --allow-absolute
`);
    return 0;
  }
  const root = await resolveRuntimeRoot(options);
  const home = homeOption ? resolve(homeOption) : options.home;

  if (subcommand === 'build' || subcommand === 'update') {
    if (hasUnknownOption(args)) return usage(`unknown lib ${subcommand} option: ${hasUnknownOption(args)}`);
    let result;
    try {
      result = await writeLibraryArtifacts(root, {
        outDir: out ?? undefined,
        home,
        allowAbsolute,
        sessionHost: sessionHost ?? undefined,
        config,
        extraSkillRoots,
        noCache: subcommand === 'update'
      });
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  }

  if (subcommand === 'check') {
    const skill = consumeOption(args, '--skill') ?? args.shift();
    if (skill === null) return usage('--skill requires a value');
    if (hasUnknownOption(args)) return usage(`unknown lib check option: ${hasUnknownOption(args)}`);
    const index = await buildLibraryIndex(root, { home, sessionHost: sessionHost ?? undefined, config, extraSkillRoots });
    const record = skill ? index.skills.find((item) => item.id === skill || item.key === skill) : null;
    const result = record ? { ok: true, skill: record } : { ok: false, error: `unknown skill: ${skill}` };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  }

  if (subcommand === 'recommend') {
    const queryOption = consumeOption(args, '--query');
    const limitValue = consumeOption(args, '--limit') ?? '5';
    if (queryOption === null) return usage('--query requires a value');
    if (limitValue === null) return usage('--limit requires a value');
    if (hasUnknownOption(args)) return usage(`unknown lib recommend option: ${hasUnknownOption(args)}`);
    const query = queryOption ?? args.join(' ');
    if (!query) return usage('usage: skillsforge lib recommend --query <text>');
    const index = await buildLibraryIndex(root, {
      home,
      sessionHost: sessionHost ?? undefined,
      config,
      extraSkillRoots
    });
    const result = recommendFromLibrary(index, query, {
      limit: Number(limitValue) || 5,
      sessionHost: sessionHost ?? undefined
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  }

  if (subcommand === 'remove') {
    const dryRun = consumeFlag(args, '--dry-run');
    const allowMutations = consumeFlag(args, '--allow-mutations');
    const yes = consumeFlag(args, '--yes');
    const host = consumeOption(args, '--host');
    const skill = consumeOption(args, '--skill');
    if (host === null) return usage('--host requires a value');
    if (skill === null) return usage('--skill requires a value');
    if (hasUnknownOption(args)) return usage(`unknown lib remove option: ${hasUnknownOption(args)}`);
    if (!host || !skill) return usage('usage: skillsforge lib remove --host <id> --skill <id> [--dry-run|--allow-mutations --yes]');
    const result = dryRun || !allowMutations || !yes
      ? await planSkillRemoval(root, { host, skill, home })
      : await removeInstalledSkill(root, { host, skill, home, allowMutations, yes });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 1;
  }

  if (subcommand === 'serve') {
    const allowMutations = consumeFlag(args, '--allow-mutations');
    const host = consumeOption(args, '--host') ?? '127.0.0.1';
    const portValue = consumeOption(args, '--port') ?? '4763';
    if (host === null) return usage('--host requires a value');
    if (portValue === null) return usage('--port requires a value');
    if (hasUnknownOption(args)) return usage(`unknown lib serve option: ${hasUnknownOption(args)}`);
    const result = await serveLibrary(root, {
      host,
      port: Number(portValue) || 4763,
      allowMutations,
      home,
      sessionHost: sessionHost ?? undefined,
      config,
      extraSkillRoots
    });
    process.stdout.write(`${JSON.stringify({ ok: result.ok, url: result.url, readOnly: result.readOnly }, null, 2)}\n`);
    return 0;
  }

  if (!subcommand) return usage('usage: skillsforge lib <build|update|serve|check|recommend|remove>');
  return usage(`unknown lib command: ${subcommand}`);
}

export async function runWorkflowsCommand(argv, options) {
  const args = [...argv];
  const subcommand = args.shift() ?? 'list';
  const json = consumeFlag(args, '--json');
  const limitValue = consumeOption(args, '--limit') ?? '20';
  const category = consumeOption(args, '--category');
  const queryOption = consumeOption(args, '--query');
  const idOption = consumeOption(args, '--id');
  const dryRun = consumeFlag(args, '--dry-run');
  if (limitValue === null) return usage('--limit requires a value');
  if (category === null) return usage('--category requires a value');
  if (queryOption === null) return usage('--query requires a value');
  if (idOption === null) return usage('--id requires a value');
  if (subcommand === 'help' || subcommand === '--help') {
    process.stdout.write(`usage: skillsforge workflows <list|show|recommend|run|export-html> [options]

Workflows:
  list [--category <id>]        List workflow catalog
  show --id <workflow-id>       Show workflow JSON
  recommend --query <text>      Read-only workflow recommendation
  run --id <workflow-id> --dry-run
                                Preview workflow steps only
  export-html [--out <dir>]     Build library HTML/AI index

Options: --json --limit <n> --category <id> --query <text> --id <id>
`);
    return 0;
  }
  const root = await resolveRuntimeRoot(options);

  let result;
  if (subcommand === 'list') {
    const loaded = await loadWorkflows(root);
    const workflows = loaded.workflows
      .filter((workflow) => !category || workflow.category === category)
      .slice(0, Math.max(1, Number(limitValue) || 20));
    result = { ok: loaded.ok, workflows, count: loaded.workflows.length, errors: loaded.errors };
  } else if (subcommand === 'show') {
    const id = idOption ?? args.shift();
    if (!id) return usage('usage: skillsforge workflows show --id <workflow-id>');
    result = await showWorkflow(root, id);
  } else if (subcommand === 'recommend') {
    const query = queryOption ?? args.join(' ');
    if (!query) return usage('usage: skillsforge workflows recommend --query <text>');
    result = await recommendWorkflows(root, query, {
      category: category ?? undefined,
      limit: Number(limitValue) || 20
    });
  } else if (subcommand === 'run') {
    const id = idOption ?? args.shift();
    if (!dryRun) return usage('skillsforge workflows run requires --dry-run');
    if (!id) return usage('usage: skillsforge workflows run --id <workflow-id> --dry-run');
    result = await runWorkflowDryRun(root, id);
  } else if (subcommand === 'export-html') {
    const out = consumeOption(args, '--out');
    if (out === null) return usage('--out requires a value');
    result = await writeLibraryArtifacts(root, { outDir: out ?? undefined });
  } else {
    return usage(`unknown workflows command: ${subcommand}`);
  }
  if (hasUnknownOption(args)) return usage(`unknown workflows option: ${hasUnknownOption(args)}`);
  if (json || subcommand !== 'list') process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    for (const workflow of result.workflows) process.stdout.write(`${workflow.id}\t${workflow.category}\t${workflow.goal}\n`);
  }
  return result.ok ? 0 : 1;
}

export async function runAutoCommand(argv, options) {
  const args = [...argv];
  const subcommand = args.shift();
  const json = consumeFlag(args, '--json');
  const readOnly = consumeFlag(args, '--read-only');
  const queryOption = consumeOption(args, '--query');
  const limitValue = consumeOption(args, '--limit') ?? '5';
  const homeOption = consumeOption(args, '--home');
  const sessionHost = consumeOption(args, '--session-host');
  if (queryOption === null) return usage('--query requires a value');
  if (limitValue === null) return usage('--limit requires a value');
  if (homeOption === null) return usage('--home requires a value');
  if (sessionHost === null) return usage('--session-host requires a value');
  if (!subcommand || subcommand === 'help' || subcommand === '--help') {
    process.stdout.write(`usage: skillsforge auto <plan|run> --query <text> [options]

Auto:
  plan --query <text>           Recommend skill + workflow, no writes
  run --read-only --query <text>
                                Dry-run selected workflow steps only

Options: --json --limit <n> --home <dir> --session-host <id> --read-only
`);
    return 0;
  }
  const query = queryOption ?? args.join(' ');
  if (!query) return usage('usage: skillsforge auto <plan|run> --query <text>');
  if (hasUnknownOption(args)) return usage(`unknown auto option: ${hasUnknownOption(args)}`);
  const root = await resolveRuntimeRoot(options);
  const home = homeOption ? resolve(homeOption) : options.home;
  let result;
  if (subcommand === 'plan') {
    result = await planAuto(root, query, {
      limit: Number(limitValue) || 5,
      home,
      sessionHost: sessionHost ?? undefined
    });
  } else if (subcommand === 'run') {
    if (!readOnly) return usage('skillsforge auto run requires --read-only');
    result = await runAutoReadOnly(root, query, {
      limit: Number(limitValue) || 5,
      home,
      sessionHost: sessionHost ?? undefined
    });
  } else {
    return usage('usage: skillsforge auto <plan|run> --query <text>');
  }
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.ok ? 0 : 1;
}
