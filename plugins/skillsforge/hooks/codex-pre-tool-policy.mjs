#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const FAIL_CLOSED_REASON = 'SkillsForge policy enforcement failed';

export function resolveProjectRoot(event = {}, env = process.env) {
  const candidate = event.cwd
    || event.cwd_path
    || env.CLAUDE_PROJECT_DIR
    || env.CLAUDE_CWD
    || env.PWD
    || process.cwd();
  return resolve(String(candidate));
}

export function resolvePluginRoot(env = process.env, hookFile = fileURLToPath(import.meta.url)) {
  const fromEnv = env.PLUGIN_ROOT || env.CLAUDE_PLUGIN_ROOT;
  if (fromEnv) return resolve(String(fromEnv));
  return resolve(dirname(hookFile), '..');
}

function failClosedDecision(reason = FAIL_CLOSED_REASON) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason.startsWith('SkillsForge policy:')
        ? reason
        : `SkillsForge policy: ${reason}`
    }
  };
}

function sanitizeErrorDetail(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'unknown error');
  return message.replace(/\s+/g, ' ').trim().slice(0, 200);
}

async function loadEnforceCodexPolicy(hookDir) {
  const candidates = [
    join(hookDir, 'codex-policy-compiler.mjs'),
    join(hookDir, '..', '..', '..', 'lib', 'capabilities', 'codex-policy-compiler.mjs'),
    join(hookDir, '..', '..', 'lib', 'capabilities', 'codex-policy-compiler.mjs')
  ];
  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href);
      if (typeof mod.enforceCodexPolicy === 'function') return mod.enforceCodexPolicy;
    } catch {
      // try next
    }
  }
  throw new Error('codex policy compiler module is unavailable');
}

function expandPolicyPath(configuredPath, pluginRoot) {
  return String(configuredPath)
    .replaceAll('${PLUGIN_ROOT}', pluginRoot)
    .replaceAll('${CLAUDE_PLUGIN_ROOT}', pluginRoot);
}

export async function runCodexPreToolPolicy(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const policyIndex = argv.indexOf('--policy');
  const configuredPath = policyIndex >= 0
    ? argv[policyIndex + 1]
    : process.env.SKILLSFORGE_POLICY ?? process.env.SKILLSFORGE_POLICY_PATH;
  if (!configuredPath) {
    throw new Error('policy path is required via --policy or SKILLSFORGE_POLICY');
  }

  const chunks = [];
  const input = options.input ?? process.stdin;
  for await (const chunk of input) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  let event;
  try {
    event = JSON.parse(raw || '{}');
  } catch {
    throw new Error('invalid PreToolUse stdin JSON');
  }
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error('invalid PreToolUse stdin JSON');
  }

  const hookFile = options.hookFile ?? fileURLToPath(import.meta.url);
  const hookDir = dirname(hookFile);
  const pluginRoot = resolvePluginRoot(options.env ?? process.env, hookFile);
  const policyPath = resolve(expandPolicyPath(configuredPath, pluginRoot));

  let policy;
  try {
    policy = JSON.parse(await readFile(policyPath, 'utf8'));
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      throw new Error('policy file is missing');
    }
    throw new Error('invalid policy sidecar JSON');
  }
  if (!policy || typeof policy !== 'object' || Array.isArray(policy) || !policy.capabilities) {
    throw new Error('policy capabilities are missing');
  }

  policy.__skillRoot = dirname(policyPath);
  // Prefer skill package root under skills/<name> when policy lives at policy/skillsforge.json
  if (basenameLooksLikePolicyDir(policyPath)) {
    const skillName = await inferSkillName(pluginRoot);
    if (!skillName) {
      throw new Error('skill package root cannot be uniquely inferred');
    }
    policy.__skillRoot = join(pluginRoot, 'skills', skillName);
  }
  policy.__projectRoot = resolveProjectRoot(event, options.env ?? process.env);

  const enforceCodexPolicy = options.enforceCodexPolicy
    ?? await loadEnforceCodexPolicy(hookDir);
  return enforceCodexPolicy(event, policy);
}

function basenameLooksLikePolicyDir(policyPath) {
  const normalized = String(policyPath).replaceAll('\\', '/');
  return /\/policy\/skillsforge\.json$/i.test(normalized);
}

async function inferSkillName(pluginRoot) {
  try {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(join(pluginRoot, 'skills'), { withFileTypes: true });
    const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    if (dirs.length === 1) return dirs[0];
  } catch {
    // fall through
  }
  return null;
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const decision = await runCodexPreToolPolicy();
    if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
  } catch (error) {
    process.stderr.write(`SkillsForge Codex policy hook failed: ${sanitizeErrorDetail(error)}\n`);
    process.stdout.write(`${JSON.stringify(failClosedDecision(sanitizeErrorDetail(error)))}\n`);
  }
}
