import { access, readFile, readdir } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { loadAllSkills } from './skill-loader.mjs';
import { routeQuery } from './router.mjs';

export const WORKFLOW_ROOT_REL = join('plugins', 'skillsforge', 'workflows');

export const WORKFLOW_CATEGORIES = Object.freeze([
  'coding',
  'testing',
  'security',
  'docs',
  'design',
  'product',
  'ops',
  'data',
  'media',
  'agentic'
]);

const REQUIRED_FIELDS = Object.freeze([
  'id',
  'category',
  'goal',
  'inputs',
  'steps',
  'recommendedSkills',
  'recommendedAgents',
  'commands',
  'stopGates',
  'tokenBudget',
  'qualityGate',
  'risk'
]);

const tokenize = (text) => String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

export async function loadWorkflows(root, options = {}) {
  const workflowRoot = resolve(root, options.workflowRoot ?? WORKFLOW_ROOT_REL);
  const files = await listJsonFiles(workflowRoot);
  const workflows = [];
  const errors = [];
  for (const file of files) {
    try {
      const workflow = JSON.parse(await readFile(file, 'utf8'));
      const validation = validateWorkflow(workflow, { file, workflowRoot });
      if (!validation.ok) {
        errors.push(...validation.errors.map((error) => ({ file, error })));
      } else {
        workflows.push({
          ...workflow,
          file,
          relativePath: relative(workflowRoot, file).replaceAll('\\', '/')
        });
      }
    } catch (error) {
      errors.push({ file, error: error.message });
    }
  }
  workflows.sort((left, right) => left.id.localeCompare(right.id));
  return { ok: errors.length === 0, workflows, errors, root: workflowRoot };
}

export function validateWorkflow(workflow, options = {}) {
  const errors = [];
  if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
    return { ok: false, errors: ['workflow must be an object'] };
  }
  for (const field of REQUIRED_FIELDS) {
    if (!(field in workflow)) errors.push(`missing field: ${field}`);
  }
  if (typeof workflow.id !== 'string' || !/^[a-z]+[.][a-z0-9]+(?:-[a-z0-9]+)*$/.test(workflow.id)) {
    errors.push('id must look like category.slug-name');
  }
  if (!WORKFLOW_CATEGORIES.includes(workflow.category)) {
    errors.push(`category must be one of: ${WORKFLOW_CATEGORIES.join(', ')}`);
  }
  if (typeof workflow.id === 'string' && typeof workflow.category === 'string' && !workflow.id.startsWith(`${workflow.category}.`)) {
    errors.push('id prefix must match category');
  }
  if (typeof workflow.goal !== 'string' || workflow.goal.trim().length < 12) {
    errors.push('goal must be a useful string');
  }
  for (const field of ['inputs', 'steps', 'recommendedSkills', 'recommendedAgents', 'commands', 'stopGates']) {
    if (!Array.isArray(workflow[field])) errors.push(`${field} must be an array`);
  }
  if (Array.isArray(workflow.steps) && workflow.steps.length === 0) errors.push('steps must not be empty');
  if (!['low', 'medium', 'high'].includes(workflow.risk)) errors.push('risk must be low, medium, or high');
  if (options.file && options.workflowRoot && !isInside(options.workflowRoot, options.file)) {
    errors.push('workflow file must stay inside workflow root');
  }
  return { ok: errors.length === 0, errors };
}

export async function recommendWorkflows(root, query, options = {}) {
  const loaded = await loadWorkflows(root);
  const limit = clampLimit(options.limit, 5);
  const category = options.category ?? null;
  const scoped = loaded.workflows.filter((workflow) => !category || workflow.category === category);
  const candidates = scoped
    .map((workflow) => scoreWorkflow(query, workflow))
    .sort((left, right) => right.score - left.score || left.workflow.id.localeCompare(right.workflow.id))
    .slice(0, limit);
  return {
    ok: loaded.ok,
    query,
    category,
    candidates: candidates.map(({ workflow, score, reasons }) => summarizeWorkflow(workflow, { score, reasons })),
    errors: loaded.errors
  };
}

export async function showWorkflow(root, id) {
  const loaded = await loadWorkflows(root);
  const workflow = loaded.workflows.find((item) => item.id === id);
  if (!workflow) {
    return { ok: false, id, error: `unknown workflow: ${id}`, errors: loaded.errors };
  }
  return { ok: true, workflow };
}

export async function runWorkflowDryRun(root, id) {
  const shown = await showWorkflow(root, id);
  if (!shown.ok) return shown;
  const workflow = shown.workflow;
  return {
    ok: true,
    dryRun: true,
    workflow: workflow.id,
    category: workflow.category,
    goal: workflow.goal,
    steps: workflow.steps.map((step, index) => ({
      index: index + 1,
      id: step.id ?? `step-${index + 1}`,
      action: step.action ?? step.note ?? String(step),
      skill: step.skill ?? null,
      agent: step.agent ?? null,
      command: step.command ?? null
    })),
    commands: workflow.commands,
    stopGates: workflow.stopGates,
    note: 'dry-run only; no workflow command executed'
  };
}

export async function planAuto(root, query, options = {}) {
  const skills = await loadAllSkills(root);
  const skillRoute = routeQuery(query, skills, {
    includeExplicit: true,
    pack: options.pack ?? undefined
  });
  const workflowRoute = await recommendWorkflows(root, query, {
    limit: options.limit ?? 5,
    category: options.category
  });
  return {
    ok: workflowRoute.ok,
    mode: 'plan',
    query,
    skill: {
      selected: skillRoute.selected,
      fallback: skillRoute.fallback,
      candidates: skillRoute.candidates.slice(0, 5)
    },
    workflows: workflowRoute.candidates,
    nextCommands: buildNextCommands(query, skillRoute, workflowRoute.candidates),
    errors: workflowRoute.errors
  };
}

export async function runAutoReadOnly(root, query, options = {}) {
  const plan = await planAuto(root, query, options);
  const selected = plan.workflows[0]?.id ?? null;
  const dryRun = selected ? await runWorkflowDryRun(root, selected) : null;
  return {
    ...plan,
    mode: 'read-only-run',
    dryRun: true,
    selectedWorkflow: selected,
    workflowDryRun: dryRun,
    note: 'read-only mode produces routing and dry-run workflow steps only'
  };
}

export function summarizeWorkflow(workflow, extra = {}) {
  return {
    id: workflow.id,
    category: workflow.category,
    goal: workflow.goal,
    recommendedSkills: workflow.recommendedSkills,
    recommendedAgents: workflow.recommendedAgents,
    commands: workflow.commands,
    risk: workflow.risk,
    tokenBudget: workflow.tokenBudget,
    qualityGate: workflow.qualityGate,
    score: extra.score ?? undefined,
    reasons: extra.reasons ?? undefined
  };
}

function scoreWorkflow(query, workflow) {
  const queryTokens = new Set(tokenize(query));
  const haystack = [
    workflow.id,
    workflow.category,
    workflow.goal,
    ...(workflow.inputs ?? []),
    ...(workflow.recommendedSkills ?? []),
    ...(workflow.recommendedAgents ?? []),
    ...(workflow.stopGates ?? [])
  ].join(' ');
  const workflowTokens = tokenize(haystack);
  const hits = workflowTokens.filter((token) => queryTokens.has(token));
  const uniqueHits = [...new Set(hits)];
  const exactCategory = queryTokens.has(workflow.category) ? 3 : 0;
  const exactId = String(query ?? '').toLowerCase().includes(workflow.id) ? 8 : 0;
  const score = uniqueHits.length + exactCategory + exactId;
  const reasons = uniqueHits.slice(0, 8).map((token) => `token:${token}`);
  if (exactCategory) reasons.push('category-match');
  if (exactId) reasons.push('id-match');
  return { workflow, score, reasons };
}

function buildNextCommands(query, skillRoute, workflows) {
  const encodedQuery = String(query).replaceAll('"', '\\"');
  const commands = [
    `skillsforge auto plan --query "${encodedQuery}"`,
    `skillsforge workflows recommend --query "${encodedQuery}"`
  ];
  if (skillRoute.selected) commands.push(`skillsforge route --query "${encodedQuery}" --include-explicit`);
  if (workflows[0]?.id) commands.push(`skillsforge workflows run --id ${workflows[0].id} --dry-run`);
  return commands;
}

async function listJsonFiles(root) {
  try {
    await access(root);
  } catch {
    return [];
  }
  const out = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && entry.name.endsWith('.json')) out.push(path);
    }
  }
  await walk(root);
  return out;
}

function clampLimit(value, fallback) {
  return Math.max(1, Math.min(100, Number(value) || fallback));
}

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..');
}
