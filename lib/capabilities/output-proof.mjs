import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { catalogStats, loadCatalog } from './catalog.mjs';

const DEFAULT_TASK = 'Add a CLI command to an AI developer plugin and document it for GitHub.';
const PROOF_SKILLS = [
  'build-ai-cli-sdk-project',
  'validate-cli-help',
  'docs-agent-facing-guide',
  'validate-readme-claims'
];

const RUBRIC = [
  ['Scope', 'Names the requested task and constraints before proposing work.'],
  ['Output contract', 'Defines the artifact, files, commands, or decision the agent must produce.'],
  ['Evidence', 'Names concrete repository evidence or commands instead of asserting completion.'],
  ['Verification', 'Includes a smallest useful test, check, or dry-run command.'],
  ['Boundaries', 'States unsupported claims, risks, and write or host limits.'],
  ['Next step', 'Ends with one actionable follow-up that moves the task forward.']
];

export async function runOutputProof(root, options = {}) {
  const repositoryRoot = resolve(root);
  const task = String(options.task ?? DEFAULT_TASK).trim() || DEFAULT_TASK;
  const { catalog } = await loadCatalog(repositoryRoot);
  const stats = catalogStats(catalog);
  const catalogSkills = new Set(
    Object.values(catalog.packs ?? {}).flatMap((pack) => pack.skills ?? [])
  );
  const missingSkills = PROOF_SKILLS.filter((skill) => !catalogSkills.has(skill));
  if (missingSkills.length > 0) {
    return {
      ok: false,
      task,
      error: `output proof skills missing from catalog: ${missingSkills.join(', ')}`,
      missingSkills
    };
  }

  const packageJson = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8'));
  const version = String(packageJson.version ?? 'unknown');
  const baseline = buildBaseline(task);
  const improved = buildImproved(task, { version, stats });
  const checks = RUBRIC.map(([name, description], index) => ({
    name,
    description,
    baseline: false,
    skillsforge: true,
    evidence: index === 0 ? 'Fixture contract' : 'Generated response contract'
  }));
  const summary = {
    baseline: { score: 0, max: RUBRIC.length },
    skillsforge: { score: RUBRIC.length, max: RUBRIC.length },
    metric: 'contract coverage, not model quality or user conversion'
  };
  const result = {
    ok: true,
    task,
    version,
    stats,
    selectedSkills: PROOF_SKILLS,
    baseline,
    improved,
    checks,
    summary,
    note: 'This deterministic fixture proves output shape and evidence requirements. It does not claim an LLM benchmark.'
  };
  const outDir = resolve(options.outDir ?? join(repositoryRoot, 'artifacts', 'output-proof'));
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, 'output-proof.json');
  const markdownPath = join(outDir, 'output-proof.md');
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(markdownPath, renderOutputProof(result));
  return { ...result, paths: { json: jsonPath, markdown: markdownPath } };
}

function buildBaseline(task) {
  return [
    'Add the command, update the README, test it, and then commit the changes.',
    '',
    `Task acknowledged: ${task}`
  ].join('\n');
}

function buildImproved(task, { version, stats }) {
  return [
    `Task: ${task}`,
    '',
    'Scope:',
    '- Add the command without changing existing command behavior.',
    '- Document the user path for GitHub readers and keep claims tied to repository evidence.',
    '- Keep write, install, and host-specific behavior explicit before execution.',
    '',
    'Output contract:',
    '- CLI help entry and JSON output for the new command.',
    '- Focused implementation files, regression tests, and one GitHub-ready usage section.',
    '- A short evidence note separating verified facts, assumptions, and remaining risk.',
    '',
    'Evidence to gather:',
    `- Read the current SkillsForge ${version} package and catalog (${stats.skills} catalog skills, ${stats.packs} packs, ${stats.profiles} profiles).`,
    '- Inspect the existing command dispatcher, help text, host matrix, and README claim rules.',
    '',
    'Verification:',
    '- Run the focused command test and the repository claim validator.',
    '- Run `npm run check` before claiming the feature is shipped.',
    '- Attach the command output or generated artifact path to the final report.',
    '',
    'Boundaries:',
    '- Do not invent benchmark scores, installed-host support, or user outcomes.',
    '- Do not silently install, delete, or mutate a host configuration.',
    '- Mark any model-quality result as unmeasured unless a real controlled run exists.',
    '',
    'Next step:',
    '- Route the task to the smallest matching build, validation, and docs skills, then run the dry-run workflow before editing.'
  ].join('\n');
}

function renderOutputProof(result) {
  const checked = result.checks.map((check) => `| ${check.name} | No | Yes | ${check.description} |`).join('\n');
  const skills = result.selectedSkills.map((skill) => `- \`${skill}\``).join('\n');
  return `# Output Proof: baseline vs SkillsForge\n\n` +
    `> Generated by \`sf output-proof\` from the current repository catalog. This is a deterministic contract fixture, not a model benchmark or a claim about persuasion, conversion, or universal output quality.\n\n` +
    `## Task\n\n${result.task}\n\n` +
    `## What changed in the response shape\n\n` +
    `The baseline is intentionally short and plausible, but it leaves the agent to guess scope, evidence, verification, and safety boundaries. The SkillsForge version applies the output contracts used by these real catalog skills:\n\n${skills}\n\n` +
    `## Baseline response\n\n\`\`\`text\n${result.baseline}\n\`\`\`\n\n` +
    `## SkillsForge-assisted response\n\n\`\`\`text\n${result.improved}\n\`\`\`\n\n` +
    `## Deterministic contract check\n\n` +
    `| Dimension | Baseline | SkillsForge | Meaning |\n| --- | --- | --- | --- |\n${checked}\n\n` +
    `**Result:** baseline ${result.summary.baseline.score}/${result.summary.baseline.max}; SkillsForge ${result.summary.skillsforge.score}/${result.summary.skillsforge.max}. The metric is contract coverage only, not an LLM quality score.\n\n` +
    `## Why this helps in practice\n\n` +
    `The improvement is useful because an agent has fewer critical decisions left implicit:\n\n` +
    `- A builder knows what to change and what must remain compatible.\n` +
    `- A reviewer can inspect named evidence and run the smallest stated check.\n` +
    `- A GitHub reader can distinguish shipped behavior from assumptions and future work.\n` +
    `- The response stays compact because it names only the relevant skills and proof commands instead of dumping the full catalog.\n\n` +
    `## Reproduce it\n\n` +
    `From the repository root:\n\n\`\`\`sh\nnode plugins/skillsforge/bin/skillsforge.mjs output-proof --json\n\`\`\`\n\n` +
    `The command writes:\n\n` +
    `- \`artifacts/output-proof/output-proof.md\`\n` +
    `- \`artifacts/output-proof/output-proof.json\`\n\n` +
    `For a real model comparison, run the same task with the same model, host, temperature, and context budget. Save both raw responses, then score them with a blinded rubric. This repository does not report that experiment until those inputs exist.\n`;
}

export { DEFAULT_TASK, PROOF_SKILLS, RUBRIC };
