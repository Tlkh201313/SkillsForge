import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseDocument } from 'yaml';
import { isPlainObject, parseFrontmatter } from './frontmatter-lib.mjs';

const triggerCuePattern = /use when|use this|when the user|triggers on|invoke when/i;
const ruleOrder = new Map([
  'trigger-cue',
  'description-shape',
  'listing-length',
  'body-budget',
  'deep-reference',
  'dynamic-context-safety',
  'name-collision',
  'agent-preload-exists',
  'hook-script-exists',
  'budget-total',
  'lint-input',
  'lint-config'
].map((rule, index) => [rule, index]));

export function estimateTokens(value) {
  return Math.ceil(String(value).length / 4);
}

export async function loadLintConfig(root = process.cwd()) {
  const source = await readFile(join(resolve(root), 'forgelint.json'), 'utf8');
  const config = JSON.parse(source);
  validateConfig(config);
  return config;
}

export async function lintSkillPath(skillPath, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const configured = await resolveConfig(root, options.config);
  if (configured.finding) return resultFrom([configured.finding]);

  const inspected = await inspectSkill(resolve(root, skillPath), root, configured.config);
  return resultFrom(inspected.findings);
}

export async function lintPluginPath(pluginPath, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const configured = await resolveConfig(root, options.config);
  if (configured.finding) return resultFrom([configured.finding]);

  const plugin = await inspectPlugin(resolve(root, pluginPath), root, configured.config);
  return resultFrom(plugin.findings);
}

export async function lintRepository(root = process.cwd(), options = {}) {
  const repositoryRoot = resolve(root);
  const configured = await resolveConfig(repositoryRoot, options.config);
  if (configured.finding) return resultFrom([configured.finding]);

  const marketplacePath = join(repositoryRoot, '.claude-plugin', 'marketplace.json');
  const marketplace = await readJson(marketplacePath);
  if (!marketplace.ok) {
    return resultFrom([
      finding('lint-input', 'error', displayPath(marketplacePath, repositoryRoot), marketplace.message)
    ]);
  }
  if (!isPlainObject(marketplace.value) || !Array.isArray(marketplace.value.plugins)) {
    // Marketplace structure is owned by the schema validator.
    return resultFrom([]);
  }

  const findings = [];
  const skills = [];
  const entries = marketplace.value.plugins
    .filter((entry) => isPlainObject(entry) && typeof entry.source === 'string')
    .sort((left, right) => left.source.localeCompare(right.source));

  for (const entry of entries) {
    const pluginRoot = resolve(repositoryRoot, entry.source);
    if (!isInside(repositoryRoot, pluginRoot)) continue;
    const plugin = await inspectPlugin(pluginRoot, repositoryRoot, configured.config, entry.name);
    findings.push(...plugin.findings);
    const canonicalPluginRoot = await canonicalPath(pluginRoot);
    skills.push(...plugin.skills.map((skill) => ({ ...skill, pluginRoot, canonicalPluginRoot })));
  }

  findings.push(...findNameCollisions(skills, displayPath(marketplacePath, repositoryRoot)));
  return resultFrom(findings);
}

export const lintSkill = lintSkillPath;
export const lintPlugin = lintPluginPath;

async function inspectSkill(skillDirectory, root, config) {
  const file = join(skillDirectory, 'SKILL.md');
  const path = displayPath(file, root);
  let source;
  try {
    source = await readFile(file, 'utf8');
  } catch {
    return {
      findings: [finding('lint-input', 'error', path, 'SKILL.md must exist and be readable')],
      skill: null
    };
  }

  const parsed = parseFrontmatter(source);
  if (!parsed) return { findings: [], skill: null };
  const data = parseYamlMapping(parsed.yaml);
  if (!data) return { findings: [], skill: null };

  const name = typeof data.name === 'string' ? data.name : basename(skillDirectory);
  const description = typeof data.description === 'string' ? data.description : null;
  const whenToUse = typeof data.when_to_use === 'string' ? data.when_to_use : '';
  const findings = [];

  if (description !== null) {
    const listing = `${description} ${whenToUse}`.trim();
    if (!triggerCuePattern.test(listing)) {
      findings.push(finding(
        'trigger-cue',
        'error',
        path,
        'description and when_to_use must include a concrete trigger cue'
      ));
    }

    const forbiddenOpening = findForbiddenDescriptionOpening(description, name);
    if (description.length < 40 || forbiddenOpening) {
      const reasons = [];
      if (description.length < 40) reasons.push(`length ${description.length} is below 40`);
      if (forbiddenOpening) reasons.push(`must not start with ${forbiddenOpening}`);
      findings.push(finding('description-shape', 'error', path, `description ${reasons.join(' and ')}`));
    }

    const listingLength = description.length + whenToUse.length;
    if (listingLength > config.listingLengthLimit) {
      findings.push(finding(
        'listing-length',
        'error',
        path,
        `listing length ${listingLength} exceeds limit ${config.listingLengthLimit}`
      ));
    }
  }

  const bodyTokens = estimateTokens(parsed.body);
  const warningBudget = metadataWarningBudget(data.metadata, config.bodyWarningBudget);
  if (bodyTokens > config.bodyErrorLimit) {
    findings.push(finding(
      'body-budget',
      'error',
      path,
      `body estimate ${bodyTokens} tokens exceeds hard limit ${config.bodyErrorLimit}`
    ));
  } else if (bodyTokens > warningBudget) {
    findings.push(finding(
      'body-budget',
      'warn',
      path,
      `body estimate ${bodyTokens} tokens exceeds warning budget ${warningBudget}`
    ));
  }

  if (bodyTokens > warningBudget && !hasDeepReference(parsed.body)) {
    findings.push(finding(
      'deep-reference',
      'warn',
      path,
      `body exceeds warning budget ${warningBudget} without a Markdown link into references/`
    ));
  }

  const families = findDynamicCommandFamilies(parsed.body);
  if (families.length > 0) {
    if (data['disable-model-invocation'] !== true) {
      findings.push(finding(
        'dynamic-context-safety',
        'warn',
        path,
        `model-invocable skill uses dynamic shell command families: ${families.join(', ')}`
      ));
    }
    for (const family of families) {
      if (!allowsBashFamily(data['allowed-tools'], family)) {
        findings.push(finding(
          'dynamic-context-safety',
          'error',
          path,
          `dynamic command family "${family}" is not granted by allowed-tools`
        ));
      }
    }
  }

  return {
    findings,
    skill: {
      name,
      description,
      whenToUse,
      modelInvocable: data['disable-model-invocation'] !== true,
      path
    }
  };
}

async function inspectPlugin(pluginRoot, root, config, marketplaceName) {
  if (!await isDirectory(pluginRoot)) {
    return {
      name: typeof marketplaceName === 'string' ? marketplaceName : basename(pluginRoot),
      findings: [finding(
        'lint-input',
        'error',
        displayPath(pluginRoot, root),
        'plugin directory must exist and be readable'
      )],
      skills: []
    };
  }

  const manifestPath = join(pluginRoot, '.claude-plugin', 'plugin.json');
  const manifest = await readJson(manifestPath);
  const manifestData = manifest.ok && isPlainObject(manifest.value) ? manifest.value : null;
  const name = typeof marketplaceName === 'string'
    ? marketplaceName
    : typeof manifestData?.name === 'string'
      ? manifestData.name
      : basename(pluginRoot);
  const findings = [];
  const skills = [];

  for (const skillDirectory of await discoverSkillDirectories(join(pluginRoot, 'skills'))) {
    const inspected = await inspectSkill(skillDirectory, root, config);
    findings.push(...inspected.findings);
    if (inspected.skill) skills.push(inspected.skill);
  }

  findings.push(...await lintAgentPreloads(pluginRoot, root));
  findings.push(...await lintHookScripts(pluginRoot, root, manifestData));

  const budget = config.pluginBudgets[name];
  if (Number.isInteger(budget) && budget > 0) {
    const listingCharacters = skills
      .filter((skill) => skill.modelInvocable && skill.description !== null)
      .reduce((total, skill) => total + skill.name.length + skill.description.length + skill.whenToUse.length, 0);
    const actual = Math.ceil(listingCharacters / 4);
    if (actual > budget) {
      findings.push(finding(
        'budget-total',
        'error',
        displayPath(pluginRoot, root),
        `plugin ${name} always-on listing actual ${actual} tokens exceeds budget ${budget}`
      ));
    }
  }

  return { name, findings, skills };
}

async function lintAgentPreloads(pluginRoot, root) {
  const agentsRoot = join(pluginRoot, 'agents');
  const findings = [];
  const agents = await readDirectory(agentsRoot);
  for (const entry of agents.filter((item) => item.isFile() && item.name.endsWith('.md'))) {
    const agentPath = join(agentsRoot, entry.name);
    let source;
    try {
      source = await readFile(agentPath, 'utf8');
    } catch {
      continue;
    }
    const parsed = parseFrontmatter(source);
    if (!parsed) continue;
    const data = parseYamlMapping(parsed.yaml);
    if (!data || !Array.isArray(data.skills)) continue;

    const preloads = [...new Set(data.skills.filter((skill) => typeof skill === 'string'))].sort();
    for (const preload of preloads) {
      const skillsRoot = join(pluginRoot, 'skills');
      const skillDirectory = resolve(skillsRoot, preload);
      const skillFile = join(skillDirectory, 'SKILL.md');
      const exists = isInside(skillsRoot, skillDirectory)
        && await isDirectory(skillDirectory)
        && await isRegularFile(skillFile)
        && await realPathIsInside(skillsRoot, skillDirectory)
        && await realPathIsInside(skillsRoot, skillFile);
      if (!exists) {
        findings.push(finding(
          'agent-preload-exists',
          'error',
          displayPath(agentPath, root),
          `agent preload "${preload}" does not resolve to an existing skill in this plugin`
        ));
      }
    }
  }
  return findings;
}

async function lintHookScripts(pluginRoot, root, manifest) {
  const candidates = hookFiles(pluginRoot, manifest);
  const findings = [];
  for (const hooksPath of candidates) {
    const parsed = await readJson(hooksPath);
    if (!parsed.ok || !isPlainObject(parsed.value?.hooks)) continue;
    const references = [];
    for (const groups of Object.values(parsed.value.hooks)) {
      if (!Array.isArray(groups)) continue;
      for (const group of groups) {
        if (!Array.isArray(group?.hooks)) continue;
        for (const handler of group.hooks) {
          if (!isPlainObject(handler) || handler.type !== 'command') continue;
          references.push(...findHandlerPluginRootReferences(handler));
        }
      }
    }

    for (const localPath of [...new Set(references)].sort()) {
      const candidate = resolve(pluginRoot, localPath.replace(/^[\\/]+/, ''));
      const path = displayPath(hooksPath, root);
      if (!isInside(pluginRoot, candidate)) {
        findings.push(finding(
          'hook-script-exists',
          'error',
          path,
          `hook path \${CLAUDE_PLUGIN_ROOT}${localPath} resolves outside plugin root`
        ));
        continue;
      }
      if (!await pathExists(candidate)) {
        findings.push(finding(
          'hook-script-exists',
          'error',
          path,
          `hook path \${CLAUDE_PLUGIN_ROOT}${localPath} does not exist`
        ));
        continue;
      }
      if (!await realPathIsInside(pluginRoot, candidate)) {
        findings.push(finding(
          'hook-script-exists',
          'error',
          path,
          `hook path \${CLAUDE_PLUGIN_ROOT}${localPath} resolves outside plugin root`
        ));
      }
    }
  }
  return findings;
}

function findNameCollisions(skills, marketplacePath) {
  const byName = new Map();
  for (const skill of skills) {
    if (typeof skill.name !== 'string') continue;
    const occurrences = byName.get(skill.name) ?? [];
    occurrences.push(skill);
    byName.set(skill.name, occurrences);
  }

  const findings = [];
  for (const [name, occurrences] of [...byName.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const directories = new Map();
    for (const occurrence of occurrences) {
      if (!directories.has(occurrence.canonicalPluginRoot)) {
        directories.set(occurrence.canonicalPluginRoot, basename(occurrence.pluginRoot));
      }
    }
    const labels = [...directories.values()].sort();
    if (labels.length < 2) continue;
    findings.push(finding(
      'name-collision',
      'warn',
      marketplacePath,
      `skill name "${name}" is duplicated across plugin directories ${labels.join(', ')}`
    ));
  }
  return findings;
}

function findForbiddenDescriptionOpening(description, name) {
  const normalized = normalizeSeparators(description);
  if (startsWithBoundedPhrase(normalized, 'This skill')) return '"This skill"';
  if (startsWithBoundedPhrase(normalized, 'A skill')) return '"A skill"';
  const normalizedName = normalizeSeparators(name).toLowerCase();
  if (normalizedName !== '' && startsWithBoundedPhrase(normalized, normalizedName)) {
    return `bare skill name "${name}"`;
  }
  return null;
}

function startsWithBoundedPhrase(value, phrase) {
  if (value.slice(0, phrase.length).toLowerCase() !== phrase.toLowerCase()) return false;
  return value.length === phrase.length || /[^a-z0-9]/i.test(value[phrase.length]);
}

function normalizeSeparators(value) {
  return String(value).trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}

function metadataWarningBudget(metadata, fallback) {
  const value = isPlainObject(metadata) ? metadata['token-budget'] : undefined;
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : fallback;
}

function hasDeepReference(body) {
  return markdownLinkTargets(body).some(isLocalReferenceTarget);
}

function markdownLinkTargets(body) {
  const targets = [];
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) targets.push(match[1]);

  const definitions = new Map();
  for (const match of body.matchAll(/^[ \t]{0,3}\[([^\]]+)\]:[ \t]*(?:<([^>]+)>|(\S+))/gm)) {
    definitions.set(normalizeReferenceLabel(match[1]), match[2] ?? match[3]);
  }
  for (const match of body.matchAll(/\[([^\]]+)\]\[([^\]]*)\]/g)) {
    const label = normalizeReferenceLabel(match[2] || match[1]);
    if (definitions.has(label)) targets.push(definitions.get(label));
  }
  for (const match of body.matchAll(/(?<!!)\[([^\]]+)\](?![\[(]|[ \t]*:)/g)) {
    const label = normalizeReferenceLabel(match[1]);
    if (definitions.has(label)) targets.push(definitions.get(label));
  }
  return targets;
}

function normalizeReferenceLabel(label) {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isLocalReferenceTarget(raw) {
  const target = raw.trim().replace(/^<|>$/g, '').split(/\s+["']/)[0].replaceAll('\\', '/');
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/') || target.startsWith('//')) return false;
  const segments = [];
  for (const segment of target.split('#')[0].split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) return false;
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return segments[0]?.toLowerCase() === 'references' && segments.length > 1;
}

function findDynamicCommandFamilies(body) {
  const commands = [];
  for (const match of body.matchAll(/(^|[ \t])!`([^`\r\n]+)`/gm)) commands.push(match[2]);
  for (const match of body.matchAll(/^ {0,3}```![ \t]*\r?\n([\s\S]*?)^ {0,3}```[ \t]*$/gm)) {
    commands.push(match[1]);
  }

  const families = new Set();
  for (const command of commands) {
    const normalized = command
      .replace(/\\\r?\n[ \t]*/g, ' ')
      .replace(/`\r?\n[ \t]*/g, ' ');
    for (const segment of normalized.split(/&&|\|\||[;|\r\n]+/)) {
      const family = commandFamily(segment);
      if (family) families.add(family);
    }
  }
  return [...families].sort();
}

function commandFamily(segment) {
  let command = segment.trim();
  if (command === '' || command.startsWith('#')) return null;
  command = command.replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+)+/, '');
  const match = command.match(/^(?:command\s+)?(?:sudo\s+)?([^\s]+)/);
  if (!match) return null;
  const token = match[1].replace(/^["']|["']$/g, '');
  const family = basename(token).replace(/\.exe$/i, '');
  return family || null;
}

function allowsBashFamily(allowedTools, family) {
  const values = Array.isArray(allowedTools)
    ? allowedTools.filter((value) => typeof value === 'string')
    : typeof allowedTools === 'string'
      ? [allowedTools]
      : [];
  const escaped = escapeRegex(family);
  for (const value of values) {
    for (const match of value.matchAll(/(?:^|[\s,])Bash(?:\(([^)]*)\))?(?=$|[\s,])/gi)) {
      if (match[1] === undefined) return true;
      const permission = match[1].trim();
      if (permission === '' || permission === '*') return true;
      if (new RegExp(`^${escaped}(?:$|[\\s:*])`, 'i').test(permission)) return true;
    }
  }
  return false;
}

function findPluginRootReferences(value, wholeArgument = false) {
  const marker = '${CLAUDE_PLUGIN_ROOT}';
  const trimmed = value.trim();
  if (wholeArgument && trimmed.startsWith(marker) && /^[\\/]/.test(trimmed.slice(marker.length))) {
    return [trimmed.slice(marker.length)];
  }

  const references = [];
  let offset = 0;
  while (offset < value.length) {
    const start = value.indexOf(marker, offset);
    if (start === -1) break;
    const pathStart = start + marker.length;
    if (!/^[\\/]/.test(value.slice(pathStart))) {
      offset = pathStart;
      continue;
    }

    const quote = start > 0 && (value[start - 1] === '"' || value[start - 1] === "'")
      ? value[start - 1]
      : null;
    let end;
    if (quote) {
      const closing = value.indexOf(quote, pathStart);
      end = closing === -1 ? value.length : closing;
    } else {
      const match = value.slice(pathStart).match(/[\s"'`|;&<>]/);
      end = match ? pathStart + match.index : value.length;
    }
    const localPath = value.slice(pathStart, end);
    if (localPath !== '/' && localPath !== '\\') references.push(localPath);
    offset = Math.max(end + 1, pathStart + 1);
  }
  return references;
}

function findHandlerPluginRootReferences(handler) {
  const references = [];
  if (typeof handler.command === 'string') {
    references.push(...findPluginRootReferences(handler.command));
  }
  for (const argument of Array.isArray(handler.args) ? handler.args : []) {
    if (typeof argument === 'string') references.push(...findPluginRootReferences(argument, true));
  }
  return references;
}

function hookFiles(pluginRoot, manifest) {
  const configured = manifest?.hooks;
  const values = Array.isArray(configured) ? configured : configured === undefined ? [] : [configured];
  const files = values
    .filter((value) => typeof value === 'string')
    .map((value) => resolve(pluginRoot, value))
    .filter((value) => isInside(pluginRoot, value));
  if (files.length > 0) return [...new Set(files)].sort();
  return [join(pluginRoot, 'hooks', 'hooks.json')];
}

async function discoverSkillDirectories(skillsRoot) {
  const entries = await readDirectory(skillsRoot);
  return entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => join(skillsRoot, entry.name));
}

async function resolveConfig(root, supplied) {
  if (supplied !== undefined) {
    try {
      validateConfig(supplied);
      return { config: supplied, finding: null };
    } catch (error) {
      return {
        config: null,
        finding: finding('lint-config', 'error', displayPath(join(root, 'forgelint.json'), root), error.message)
      };
    }
  }
  try {
    return { config: await loadLintConfig(root), finding: null };
  } catch (error) {
    return {
      config: null,
      finding: finding(
        'lint-config',
        'error',
        displayPath(join(root, 'forgelint.json'), root),
        `forgelint.json cannot be loaded: ${firstLine(error.message)}`
      )
    };
  }
}

function validateConfig(config) {
  if (!isPlainObject(config)) throw new Error('forgelint.json must contain an object');
  for (const key of ['listingLengthLimit', 'bodyWarningBudget', 'bodyErrorLimit']) {
    if (!Number.isInteger(config[key]) || config[key] <= 0) {
      throw new Error(`forgelint.json ${key} must be a positive integer`);
    }
  }
  if (!isPlainObject(config.pluginBudgets)) throw new Error('forgelint.json pluginBudgets must contain an object');
  for (const [name, budget] of Object.entries(config.pluginBudgets)) {
    if (!Number.isInteger(budget) || budget <= 0) {
      throw new Error(`forgelint.json plugin budget ${name} must be a positive integer`);
    }
  }
}

function parseYamlMapping(yaml) {
  try {
    const document = parseDocument(yaml, { prettyErrors: true, strict: true, uniqueKeys: true });
    if (document.errors.length > 0) return null;
    const value = document.toJS();
    return isPlainObject(value) ? value : null;
  } catch {
    return null;
  }
}

async function readJson(path) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch {
    return { ok: false, message: `${basename(path)} must exist and be readable` };
  }
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch {
    return { ok: false, message: `${basename(path)} contains invalid JSON` };
  }
}

async function readDirectory(path) {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function isRegularFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function realPathIsInside(parent, candidate) {
  try {
    return isInside(await realpath(parent), await realpath(candidate));
  } catch {
    return false;
  }
}

async function canonicalPath(path) {
  try {
    return await realpath(path);
  } catch {
    return resolve(path);
  }
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

function displayPath(path, root) {
  const absolute = resolve(path);
  if (!isInside(root, absolute)) return absolute.replaceAll('\\', '/');
  const local = relative(root, absolute).replaceAll('\\', '/');
  return local || '.';
}

function finding(rule, severity, path, message) {
  return { rule, severity, path, message };
}

function resultFrom(findings) {
  const ordered = [...findings].sort(compareFindings);
  const ok = !ordered.some((entry) => entry.severity === 'error');
  const text = ordered.length === 0
    ? 'PASS content lint\n'
    : `${ordered.map((entry) => `${entry.severity.toUpperCase()} ${entry.rule} ${entry.path}: ${entry.message}`).join('\n')}\n`;
  return { ok, findings: ordered, text };
}

function compareFindings(left, right) {
  return left.path.localeCompare(right.path)
    || (ruleOrder.get(left.rule) ?? Number.MAX_SAFE_INTEGER) - (ruleOrder.get(right.rule) ?? Number.MAX_SAFE_INTEGER)
    || severityRank(left.severity) - severityRank(right.severity)
    || left.message.localeCompare(right.message);
}

function severityRank(severity) {
  return severity === 'error' ? 0 : 1;
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
}

function firstLine(value) {
  return String(value).split(/\r?\n/)[0];
}
