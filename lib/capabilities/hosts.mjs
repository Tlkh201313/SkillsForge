import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';

/** @typedef {'full' | 'portable'} HostFidelity */

/**
 * Known agent hosts SkillsForge can configure.
 * Detection is presence of the host config dir under home.
 */
export const HOST_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'claude-code',
    label: 'Claude Code',
    detectRel: '.claude',
    skillsRel: join('.claude', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('full')
  }),
  Object.freeze({
    id: 'cursor',
    label: 'Cursor',
    detectRel: '.cursor',
    skillsRel: join('.cursor', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('portable')
  }),
  Object.freeze({
    id: 'codex',
    label: 'Codex CLI',
    detectRel: '.codex',
    skillsRel: join('.codex', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('portable')
  }),
  Object.freeze({
    id: 'opencode',
    label: 'OpenCode',
    detectRel: '.agents',
    skillsRel: join('.agents', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('portable')
  }),
  Object.freeze({
    id: 'gemini',
    label: 'Gemini CLI',
    detectRel: '.gemini',
    skillsRel: join('.gemini', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('portable')
  })
]);

function isInsideHome(home, candidate) {
  const root = resolve(home);
  const path = resolve(candidate);
  return path === root || path.startsWith(root.endsWith(sep) ? root : `${root}${sep}`);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{ home?: string }} [options]
 * @returns {Promise<Array<{ id: string, label: string, detected: boolean, skillsDir: string, fidelity: HostFidelity, detectDir: string }>>}
 */
export async function detectHosts(options = {}) {
  const home = resolve(options.home ?? homedir());
  const results = [];
  for (const host of HOST_REGISTRY) {
    const detectDir = resolve(home, host.detectRel);
    const skillsDir = resolve(home, host.skillsRel);
    if (!isInsideHome(home, detectDir) || !isInsideHome(home, skillsDir)) {
      throw new Error(`host path escaped home: ${host.id}`);
    }
    results.push({
      id: host.id,
      label: host.label,
      detected: await pathExists(detectDir),
      detectDir,
      skillsDir,
      fidelity: host.fidelity
    });
  }
  return results;
}

/**
 * @param {string[]} ids
 * @param {{ home?: string }} [options]
 */
export async function resolveHostSelection(ids, options = {}) {
  const detected = await detectHosts(options);
  const byId = new Map(detected.map((host) => [host.id, host]));
  const selected = [];
  const unknown = [];
  for (const id of ids) {
    const host = byId.get(id);
    if (!host) unknown.push(id);
    else selected.push(host);
  }
  return { selected, unknown, all: detected };
}
