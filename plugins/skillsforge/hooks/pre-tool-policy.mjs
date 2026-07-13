#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enforcePolicy } from '../bin/skillsforge.mjs';

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

function failClosedDecision() {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: FAIL_CLOSED_REASON
    }
  };
}

function sanitizeErrorDetail(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'unknown error');
  return message.replace(/\s+/g, ' ').trim().slice(0, 200);
}

export async function runPreToolPolicy(options = {}) {
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

  const policyPath = resolve(configuredPath);
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
  policy.__projectRoot = resolveProjectRoot(event, process.env);
  return enforcePolicy(event, policy);
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const decision = await runPreToolPolicy();
    if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
  } catch (error) {
    process.stderr.write(`SkillsForge policy hook failed: ${sanitizeErrorDetail(error)}\n`);
    process.stdout.write(`${JSON.stringify(failClosedDecision())}\n`);
  }
}
