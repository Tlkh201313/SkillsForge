import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { loadAllSkills } from './skill-loader.mjs';
import { buildLibraryIndex, recommendFromLibrary } from './library.mjs';
import { planAuto } from './workflows.mjs';
import { runWorkbench } from './workbench.mjs';

export const TOKEN_SESSION_REL = join('artifacts', 'skillsforge-token-session.json');

/** Rough context estimate - not provider billing, not tiktoken. */
export function estimateTokens(text) {
  const source = String(text ?? '');
  const chars = [...source].length;
  const lines = source.length === 0 ? 0 : source.split(/\r?\n/).length;
  const tokens = Math.ceil(chars / 4);
  return { chars, lines, tokens };
}

export async function runTokensCommand(root, options = {}) {
  const limit = clamp(options.limit, 15, 1, 200);
  const skillId = options.skill ?? null;
  const paths = options.paths ?? [];
  const includeInstalled = options.installed === true;
  const catalog = options.catalog === true || (!skillId && paths.length === 0 && !options.session && !options.sessionReset);
  const track = options.track === true;
  const showSession = options.session === true;
  const resetSession = options.sessionReset === true;

  if (resetSession) {
    const cleared = await writeTokenSession(root, emptySession());
    return {
      ok: true,
      mode: 'session-reset',
      session: cleared,
      method: 'approx-chars/4',
      warning: 'Not tiktoken and not API billing - local estimate only.'
    };
  }

  if (showSession && !skillId && paths.length === 0 && options.catalog !== true) {
    const session = await readTokenSession(root);
    return {
      ok: true,
      mode: 'session',
      method: 'approx-chars/4',
      note: 'Local estimated context loads tracked by skillsforge tokens --track. Not API billing.',
      warning: 'Not tiktoken and not API billing - local estimate only.',
      sessionPath: TOKEN_SESSION_REL.replaceAll('\\', '/'),
      session
    };
  }

  const loadOpts = {
    includeInstalled,
    home: options.home,
    collectErrors: true
  };

  const items = [];
  let skillsCache = null;
  const ensureSkills = async () => {
    if (!skillsCache) skillsCache = await loadAllSkills(root, loadOpts);
    return skillsCache;
  };

  if (skillId) {
    const skills = await ensureSkills();
    // Skill lookup: try repo first; if missing and not already including installed, retry with installed.
    let skill = skills.skills.find((entry) => entry.name === skillId);
    if (!skill && !includeInstalled) {
      const withInstalled = await loadAllSkills(root, { ...loadOpts, includeInstalled: true });
      skill = withInstalled.skills.find((entry) => entry.name === skillId);
    }
    if (!skill) {
      return {
        ok: false,
        error: `unknown skill: ${skillId}`,
        method: 'approx-chars/4',
        warning: 'Not tiktoken and not API billing - local estimate only.'
      };
    }
    items.push(summarizeSkillTokens(root, skill));
  }

  for (const path of paths) {
    items.push(await summarizePathTokens(root, path));
  }

  let catalogSummary = null;
  if (catalog && !skillId && paths.length === 0) {
    const skills = await ensureSkills();
    const ranked = skills.skills
      .map((skill) => summarizeSkillTokens(root, skill))
      .sort((left, right) => right.tokens - left.tokens || left.id.localeCompare(right.id));
    const totalTokens = ranked.reduce((sum, item) => sum + item.tokens, 0);
    const totalChars = ranked.reduce((sum, item) => sum + item.chars, 0);
    catalogSummary = {
      scope: includeInstalled ? 'repo+installed' : 'repo',
      skills: ranked.length,
      totalTokens,
      totalChars,
      heaviest: ranked.slice(0, limit),
      lightest: [...ranked].reverse().slice(0, Math.min(5, ranked.length))
    };
  }

  let session = await readTokenSession(root);
  if (track && items.length > 0) {
    const added = items.reduce((sum, item) => sum + (item.tokens ?? 0), 0);
    session = {
      ...session,
      updatedAt: new Date().toISOString(),
      estimatedTokensLoaded: (session.estimatedTokensLoaded ?? 0) + added,
      loads: [
        ...(session.loads ?? []),
        ...items.map((item) => ({
          at: new Date().toISOString(),
          id: item.id ?? item.path,
          tokens: item.tokens,
          kind: item.kind
        }))
      ].slice(-200)
    };
    await writeTokenSession(root, session);
  }

  return {
    ok: true,
    mode: catalogSummary ? 'catalog' : items.length ? 'targets' : 'session',
    method: 'approx-chars/4',
    note: 'Estimate for prompt/context budgeting (chars/4). Not provider usage billing.',
    warning: 'Not tiktoken and not API billing - local estimate only.',
    items,
    catalog: catalogSummary,
    session: track || showSession ? session : undefined
  };
}

export async function runDigestCommand(root, options = {}) {
  const query = String(options.query ?? '').trim();
  if (!query) return { ok: false, error: 'digest requires --query <text>' };

  const limit = clamp(options.limit, 3, 1, 10);
  const [status, index, auto] = await Promise.all([
    runWorkbench(root, 'status'),
    buildLibraryIndex(root, { home: options.home, sessionHost: options.sessionHost }),
    planAuto(root, query, { home: options.home, limit, sessionHost: options.sessionHost })
  ]);
  const recommendation = recommendFromLibrary(index, query, {
    limit,
    sessionHost: options.sessionHost ?? index.session?.host
  });

  // Reuse index skills for token costs - avoid a third full skill scan when possible.
  // Index records lack full bodies; load only the recommended skill directories.
  const skillCosts = [];
  for (const hit of recommendation.skills.slice(0, limit)) {
    const record = index.skills.find((skill) => skill.id === hit.id || skill.key === hit.key);
    const dir = record?.sourcePath
      ? resolveHomePath(root, record.sourcePath, options.home)
      : join(root, 'plugins', 'skillsforge', 'skills', hit.id);
    try {
      const skill = await loadSkillLight(dir);
      if (skill) skillCosts.push(summarizeSkillTokens(root, skill));
    } catch {
      // skip missing
    }
  }

  const totalRecommendTokens = skillCosts.reduce((sum, item) => sum + item.tokens, 0);
  const looksLikeSymbol = /^[A-Za-z_$][\w.$/-]*$/.test(query) || query.includes('/') || query.includes('.');
  const nextCommands = [
    ...(auto.nextCommands ?? []).slice(0, 4),
    recommendation.confidence === 'none'
      ? 'skillsforge catalog --search <text>'
      : `skillsforge tokens --skill ${recommendation.skills[0]?.id ?? 'using-skillsforge'}`,
    'skillsforge tokens --catalog --limit 10',
    looksLikeSymbol ? `skillsforge map explore --query "${query}"` : 'skillsforge map status'
  ];

  return {
    ok: true,
    query,
    method: 'approx-chars/4',
    warning: 'Not tiktoken and not API billing - local estimate only.',
    status: {
      branch: status.branch,
      dirty: status.dirty,
      skills: status.skills,
      workflows: status.workflows
    },
    recommendation: {
      confidence: recommendation.confidence,
      fallback: recommendation.fallback,
      note: recommendation.note,
      skills: recommendation.skills,
      workflows: recommendation.workflows
    },
    auto: {
      selectedSkill: auto.skill?.selected ?? null,
      skillFallback: auto.skill?.fallback ?? null,
      workflows: (auto.workflows ?? []).slice(0, limit)
    },
    tokenCostIfLoaded: {
      skills: skillCosts,
      totalTokens: totalRecommendTokens,
      note: 'Load only the smallest matching skill body after routing - do not paste the whole catalog.'
    },
    nextCommands: [...new Set(nextCommands)].slice(0, 8),
    policy: 'read-only digest; install/remove/write still need explicit confirmation'
  };
}

export async function runNextCommand(root, options = {}) {
  const status = await runWorkbench(root, 'status');
  const suggestions = [];
  const mapIndexExists = await pathExists(join(root, 'artifacts', 'forgemap', 'index.json'));

  if (status.dirty) {
    suggestions.push({
      priority: 1,
      action: 'slim-status',
      command: 'skillsforge slim status --json',
      why: 'Working tree is dirty - compact status before more edits'
    });
    suggestions.push({
      priority: 1,
      action: 'review-diff',
      command: 'skillsforge slim diff --json',
      why: 'Compact diff for agent context'
    });
    suggestions.push({
      priority: 2,
      action: 'proof',
      command: 'skillsforge wb proof --json',
      why: 'Run trust/proof hints before shipping dirty work'
    });
  } else {
    suggestions.push({
      priority: 2,
      action: 'status-ok',
      command: 'skillsforge wb status --json',
      why: 'Tree clean - good baseline for a new task'
    });
  }

  if (!mapIndexExists) {
    suggestions.push({
      priority: 2,
      action: 'map-index',
      command: 'skillsforge map index',
      why: 'ForgeMap index missing - build once for symbol/impact lookups'
    });
  }

  const briefExists = await pathExists(join(root, 'docs', 'work', 'brief.md'));
  const planExists = await pathExists(join(root, 'docs', 'work', 'plan.md'));
  if (!briefExists) {
    suggestions.push({
      priority: 1,
      action: 'shape-intent',
      command: 'skillsforge route --query "shape intent" --include-explicit',
      why: 'docs/work/brief.md missing - shape the task first'
    });
  } else if (!planExists) {
    suggestions.push({
      priority: 1,
      action: 'write-plan',
      command: 'skillsforge route --query "write plan" --include-explicit',
      why: 'brief exists but plan is missing'
    });
  }

  suggestions.push({
    priority: 3,
    action: 'recommend',
    command: 'skillsforge lib recommend --query "<task>" --json',
    why: 'Pick the smallest skill/workflow for the next task'
  });
  suggestions.push({
    priority: 3,
    action: 'token-budget',
    command: 'skillsforge tokens --catalog --limit 10 --json',
    why: 'See which repo skills are expensive before loading bodies'
  });
  suggestions.push({
    priority: 4,
    action: 'digest',
    command: 'skillsforge digest --query "<task>" --json',
    why: 'One-shot: status + recommend + token cost + next commands'
  });

  suggestions.sort((left, right) => left.priority - right.priority || left.action.localeCompare(right.action));
  return {
    ok: true,
    branch: status.branch,
    dirty: status.dirty,
    skills: status.skills,
    workflows: status.workflows,
    suggestions: suggestions.slice(0, options.limit ? clamp(options.limit, 8, 1, 20) : 8)
  };
}

export function formatTokensText(payload) {
  if (!payload.ok) return `${payload.error ?? 'tokens failed'}\n`;
  const lines = [
    `method\t${payload.method}`,
    `note\t${payload.note ?? ''}`,
    payload.warning ? `warning\t${payload.warning}` : ''
  ];
  if (payload.catalog) {
    lines.push(`scope\t${payload.catalog.scope ?? 'repo'}`);
    lines.push(`skills\t${payload.catalog.skills}`);
    lines.push(`totalTokens\t${payload.catalog.totalTokens}`);
    lines.push('heaviest');
    for (const item of payload.catalog.heaviest) {
      lines.push(`${item.tokens}\t${item.chars}\t${item.id}`);
    }
  }
  for (const item of payload.items ?? []) {
    lines.push(`${item.tokens}\t${item.chars}\t${item.id ?? item.path}\t${item.kind}`);
  }
  if (payload.session) {
    lines.push(`sessionTokens\t${payload.session.estimatedTokensLoaded ?? 0}`);
    lines.push(`sessionLoads\t${(payload.session.loads ?? []).length}`);
  }
  return `${lines.filter(Boolean).join('\n')}\n`;
}

export function formatDigestText(payload) {
  if (!payload.ok) return `${payload.error ?? 'digest failed'}\n`;
  const lines = [
    `query\t${payload.query}`,
    `confidence\t${payload.recommendation.confidence}`,
    `branch\t${payload.status.branch}`,
    `dirty\t${payload.status.dirty}`,
    `recommendTokens\t${payload.tokenCostIfLoaded.totalTokens}`
  ];
  for (const skill of payload.recommendation.skills.slice(0, 5)) {
    lines.push(`skill\t${skill.score}\t${skill.id}`);
  }
  for (const workflow of payload.recommendation.workflows.slice(0, 3)) {
    lines.push(`workflow\t${workflow.score}\t${workflow.id}`);
  }
  for (const cost of payload.tokenCostIfLoaded.skills) {
    lines.push(`cost\t${cost.tokens}\t${cost.id}`);
  }
  for (const command of payload.nextCommands) {
    lines.push(`next\t${command}`);
  }
  return `${lines.join('\n')}\n`;
}

export function formatNextText(payload) {
  if (!payload.ok) return `${payload.error ?? 'next failed'}\n`;
  const lines = [
    `branch\t${payload.branch}`,
    `dirty\t${payload.dirty}`,
    `skills\t${payload.skills}`,
    `workflows\t${payload.workflows}`
  ];
  for (const item of payload.suggestions) {
    lines.push(`${item.priority}\t${item.action}\t${item.command}\t${item.why}`);
  }
  return `${lines.join('\n')}\n`;
}

function summarizeSkillTokens(root, skill) {
  const body = skill.body ?? '';
  const description = skill.description ?? '';
  const sidecar = skill.sidecar ? JSON.stringify(skill.sidecar) : '';
  const combined = `${description}\n${body}\n${sidecar}`;
  const estimate = estimateTokens(combined);
  return {
    kind: 'skill',
    id: skill.name,
    path: relative(root, skill.directory).replaceAll('\\', '/'),
    ...estimate,
    parts: {
      description: estimateTokens(description).tokens,
      body: estimateTokens(body).tokens,
      sidecar: estimateTokens(sidecar).tokens
    }
  };
}

async function summarizePathTokens(root, inputPath) {
  const abs = resolve(root, inputPath);
  const text = await readFile(abs, 'utf8');
  const estimate = estimateTokens(text);
  return {
    kind: 'path',
    path: relative(root, abs).replaceAll('\\', '/'),
    id: basename(abs),
    ...estimate
  };
}

async function loadSkillLight(dir) {
  const { loadSkill } = await import('./skill-loader.mjs');
  return loadSkill(dir);
}

function resolveHomePath(root, sourcePath, home) {
  if (sourcePath.startsWith('~/') || sourcePath.startsWith('~\\')) {
    const base = home ? resolve(home) : resolve(process.env.USERPROFILE || process.env.HOME || root);
    return resolve(base, sourcePath.slice(2));
  }
  if (sourcePath.startsWith('/') || /^[A-Za-z]:[\\/]/.test(sourcePath)) return resolve(sourcePath);
  return resolve(root, sourcePath);
}

function emptySession() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    estimatedTokensLoaded: 0,
    loads: [],
    note: 'Local estimate tracker only'
  };
}

async function readTokenSession(root) {
  const path = join(root, TOKEN_SESSION_REL);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return emptySession();
  }
}

async function writeTokenSession(root, session) {
  const path = join(root, TOKEN_SESSION_REL);
  await mkdir(join(root, 'artifacts'), { recursive: true });
  await writeFile(path, `${JSON.stringify(session, null, 2)}\n`);
  return session;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function clamp(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}
