#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enforcePolicy } from '../bin/skillsforge.mjs';

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
  const event = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  const policyPath = resolve(configuredPath);
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  policy.__skillRoot = dirname(policyPath);
  return enforcePolicy(event, policy);
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  try {
    const decision = await runPreToolPolicy();
    if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
  } catch (error) {
    process.stderr.write(`SkillsForge policy hook failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
