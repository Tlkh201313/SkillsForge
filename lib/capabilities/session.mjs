import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { loadSettings } from './settings.mjs';

export const SESSION_OUT_REL = join('artifacts', 'skillsforge-session');
export const SESSION_JSONL = 'session.jsonl';
export const SESSION_SUMMARY = 'summary.json';

export async function rememberSessionEvent(root, event = {}, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const settings = settingsLoaded.settings;
  if (settings.session.enabled === false) {
    return { ok: false, disabled: true, error: 'session memory is disabled by settings' };
  }
  const paths = resolveSessionPaths(root, settings, options);
  const entry = normalizeSessionEvent(root, event, {
    host: options.sessionHost ?? settings.defaultHost,
    projectRootHash: projectHash(root)
  });
  const existing = await readSessionEntries(root, options);
  const maxEntries = settings.session.maxEntries;
  const nextEntries = [...existing, entry].slice(-maxEntries);
  await mkdir(dirname(paths.jsonl), { recursive: true });
  await writeFile(paths.jsonl, `${nextEntries.map((item) => JSON.stringify(item)).join('\n')}\n`);
  const summary = summarizeSession(root, nextEntries, { settings });
  await writeFile(paths.summary, `${JSON.stringify(summary, null, 2)}\n`);
  return { ok: true, event: entry, summary, files: displaySessionFiles(paths) };
}

export async function recallSessionMemory(root, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const settings = settingsLoaded.settings;
  const tokenBudget = clampNumber(options.tokenBudget ?? settings.session.tokenBudget, 1200, 200, 10000);
  const limit = clampNumber(options.limit ?? 5, 5, 1, 50);
  const query = String(options.query ?? '').trim();
  const entries = await readSessionEntries(root, options);
  const ranked = entries
    .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((item) => !query || item.score > 0)
    .sort((left, right) => right.score - left.score || String(right.entry.timestamp).localeCompare(String(left.entry.timestamp)));
  const selected = [];
  let usedTokens = 0;
  for (const item of ranked.slice(0, limit * 4)) {
    const compact = compactEntry(item.entry);
    const tokens = estimateTokens(JSON.stringify(compact));
    if (selected.length >= limit || usedTokens + tokens > tokenBudget) break;
    selected.push({ ...compact, matchScore: item.score, estimatedTokens: tokens });
    usedTokens += tokens;
  }
  return {
    ok: true,
    query,
    tokenBudget,
    estimatedTokens: usedTokens,
    count: selected.length,
    entries: selected,
    policy: 'compact SkillsForge usage memory only; no chat transcript memory is returned'
  };
}

export async function readSessionSummary(root, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const paths = resolveSessionPaths(root, settingsLoaded.settings, options);
  try {
    return JSON.parse(await readFile(paths.summary, 'utf8'));
  } catch {
    const entries = await readSessionEntries(root, options);
    return summarizeSession(root, entries, { settings: settingsLoaded.settings });
  }
}

export async function scoreSessionMemory(root, options = {}) {
  const summary = await readSessionSummary(root, options);
  return {
    ok: true,
    score: summary.score,
    review: summary.review,
    totals: summary.totals,
    topSkills: summary.topSkills,
    topWorkflows: summary.topWorkflows,
    policy: 'local heuristic score for SkillsForge usage discipline, not model quality proof'
  };
}

export async function resetSessionMemory(root, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const paths = resolveSessionPaths(root, settingsLoaded.settings, options);
  await rm(paths.outDir, { recursive: true, force: true });
  const summary = summarizeSession(root, [], { settings: settingsLoaded.settings });
  await mkdir(paths.outDir, { recursive: true });
  await writeFile(paths.summary, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(paths.jsonl, '');
  return { ok: true, reset: true, files: displaySessionFiles(paths), summary };
}

export async function ensureSessionMemory(root, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const paths = resolveSessionPaths(root, settingsLoaded.settings, options);
  await mkdir(paths.outDir, { recursive: true });
  const entries = await readSessionEntries(root, options);
  const summary = summarizeSession(root, entries, { settings: settingsLoaded.settings });
  if (!await pathExists(paths.jsonl)) await writeFile(paths.jsonl, '');
  await writeFile(paths.summary, `${JSON.stringify(summary, null, 2)}\n`);
  return { ok: true, files: displaySessionFiles(paths), summary };
}

export async function exportSessionMemory(root, options = {}) {
  const out = options.out;
  if (!out) throw new Error('--out is required');
  const target = resolve(root, out);
  if (isAbsolute(out) || !isInside(root, target)) throw new Error('session export --out must stay inside the repository');
  const summary = await readSessionSummary(root, options);
  const recall = await recallSessionMemory(root, {
    ...options,
    query: options.query ?? '',
    limit: options.limit ?? 20,
    tokenBudget: options.tokenBudget ?? 3000
  });
  const text = renderSessionMarkdown(summary, recall);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, text);
  return { ok: true, out: target, summary, entries: recall.entries.length };
}

export async function readSessionEntries(root, options = {}) {
  const settingsLoaded = await loadSettings(root, { config: options.config });
  const paths = resolveSessionPaths(root, settingsLoaded.settings, options);
  try {
    const text = await readFile(paths.jsonl, 'utf8');
    return text.split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((entry) => entry && typeof entry === 'object');
  } catch {
    return [];
  }
}

export function resolveSessionPaths(root, settings, options = {}) {
  const outDir = resolve(root, options.outDir ?? settings.session?.outDir ?? SESSION_OUT_REL);
  if (!isInside(root, outDir)) throw new Error(`session outDir escapes repository: ${outDir}`);
  return {
    outDir,
    jsonl: join(outDir, SESSION_JSONL),
    summary: join(outDir, SESSION_SUMMARY)
  };
}

function normalizeSessionEvent(root, event, context) {
  return {
    timestamp: new Date().toISOString(),
    projectRootHash: context.projectRootHash,
    host: cleanText(event.host ?? context.host ?? null, 60),
    query: cleanText(event.query ?? '', 240),
    selectedSkill: cleanText(event.selectedSkill ?? event.skill ?? null, 120),
    selectedWorkflow: cleanText(event.selectedWorkflow ?? event.workflow ?? null, 160),
    agentRole: cleanText(event.agentRole ?? event.agent ?? null, 120),
    score: clampNumber(event.score ?? 0, 0, 0, 100),
    reasons: cleanList(event.reasons ?? event.reason, 8, 160),
    commandsSuggested: cleanList(event.commandsSuggested ?? event.command, 8, 220),
    tokensEstimated: clampNumber(event.tokensEstimated ?? event.tokens ?? 0, 0, 0, 1_000_000),
    outcome: cleanText(event.outcome ?? '', 240),
    verification: cleanText(event.verification ?? '', 240)
  };
}

function summarizeSession(root, entries, { settings }) {
  const topSkills = topCounts(entries.map((entry) => entry.selectedSkill).filter(Boolean));
  const topWorkflows = topCounts(entries.map((entry) => entry.selectedWorkflow).filter(Boolean));
  const topAgents = topCounts(entries.map((entry) => entry.agentRole).filter(Boolean));
  const verified = entries.filter((entry) => entry.verification).length;
  const withWorkflow = entries.filter((entry) => entry.selectedWorkflow).length;
  const score = Math.min(100, Math.round(
    (entries.length ? 30 : 0)
    + Math.min(20, topSkills.length * 5)
    + Math.min(20, withWorkflow * 2)
    + Math.min(20, verified * 4)
    + (entries.some((entry) => entry.tokensEstimated > 0) ? 10 : 0)
  ));
  return {
    generatedAt: new Date().toISOString(),
    projectRootHash: projectHash(root),
    files: {
      jsonl: SESSION_JSONL,
      summary: SESSION_SUMMARY
    },
    settings: {
      maxEntries: settings.session.maxEntries,
      tokenBudget: settings.session.tokenBudget
    },
    totals: {
      events: entries.length,
      verified,
      withSkill: entries.filter((entry) => entry.selectedSkill).length,
      withWorkflow,
      tokensEstimated: entries.reduce((sum, entry) => sum + (entry.tokensEstimated ?? 0), 0)
    },
    score,
    review: score >= 80 ? 'strong SkillsForge usage memory' : score >= 50 ? 'useful but needs more verified outcomes' : 'thin memory; record skill/workflow/outcome/verification after tasks',
    topSkills,
    topWorkflows,
    topAgents,
    recent: entries.slice(-8).map(compactEntry)
  };
}

function compactEntry(entry) {
  return {
    timestamp: entry.timestamp,
    host: entry.host,
    query: entry.query,
    selectedSkill: entry.selectedSkill,
    selectedWorkflow: entry.selectedWorkflow,
    agentRole: entry.agentRole,
    score: entry.score,
    reasons: entry.reasons,
    tokensEstimated: entry.tokensEstimated,
    outcome: entry.outcome,
    verification: entry.verification
  };
}

function renderSessionMarkdown(summary, recall) {
  const lines = [
    '# SkillsForge Session Memory',
    '',
    `Generated: ${summary.generatedAt}`,
    `Project hash: ${summary.projectRootHash}`,
    `Score: ${summary.score} - ${summary.review}`,
    '',
    '## Totals',
    '',
    `- Events: ${summary.totals.events}`,
    `- Verified events: ${summary.totals.verified}`,
    `- Skills used: ${summary.totals.withSkill}`,
    `- Workflows used: ${summary.totals.withWorkflow}`,
    `- Estimated tokens: ${summary.totals.tokensEstimated}`,
    '',
    '## Top Skills',
    '',
    ...(summary.topSkills.length ? summary.topSkills.map((item) => `- ${item.id}: ${item.count}`) : ['- None recorded']),
    '',
    '## Top Workflows',
    '',
    ...(summary.topWorkflows.length ? summary.topWorkflows.map((item) => `- ${item.id}: ${item.count}`) : ['- None recorded']),
    '',
    '## Recent Compact Entries',
    ''
  ];
  for (const entry of recall.entries) {
    lines.push(`- ${entry.timestamp}: skill=${entry.selectedSkill ?? 'none'} workflow=${entry.selectedWorkflow ?? 'none'} outcome=${entry.outcome || 'none'}`);
  }
  lines.push('', '> This export intentionally contains compact SkillsForge usage memory, not chat transcript memory.', '');
  return `${lines.join('\n')}\n`;
}

function topCounts(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id))
    .slice(0, 10);
}

function scoreEntry(query, entry) {
  if (!query) return 1;
  const q = new Set(tokens(query));
  const text = [
    entry.query,
    entry.selectedSkill,
    entry.selectedWorkflow,
    entry.agentRole,
    entry.outcome,
    entry.verification,
    ...(entry.reasons ?? [])
  ].join(' ');
  return tokens(text).filter((token) => q.has(token)).length;
}

function tokens(text) {
  return String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function cleanList(value, limit, maxLength) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, limit);
}

function cleanText(value, maxLength) {
  if (value == null) return null;
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function estimateTokens(text) {
  return Math.ceil([...String(text ?? '')].length / 4);
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function projectHash(root) {
  return createHash('sha256').update(resolve(root)).digest('hex').slice(0, 16);
}

function displaySessionFiles(paths) {
  return {
    outDir: paths.outDir,
    jsonl: paths.jsonl,
    summary: paths.summary
  };
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}
