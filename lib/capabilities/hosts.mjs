import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';

/** @typedef {'full' | 'package'} HostFidelity */

/**
 * Known agent hosts SkillsForge can configure.
 *
 * `fidelity: 'full'` — Claude Code: keep Claude extensions + runtime policy.
 * `fidelity: 'package'` — other native Agent Skills hosts: copy complete skill
 * directories (scripts/references/assets); transform/strip only incompatible
 * Claude-only frontmatter. Runtime policy enforcement remains Claude/Codex-plugin specific.
 */
export const HOST_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'claude-code',
    label: 'Claude Code',
    detectRels: ['.claude'],
    skillsRel: join('.claude', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('full'),
    runtimeEnforced: true,
    usesSidecar: true,
    installHint: 'Full-fidelity install. Claude Code hooks and SkillsForge sidecar stay in place.'
  }),
  Object.freeze({
    id: 'cursor',
    label: 'Cursor',
    detectRels: ['.cursor'],
    skillsRel: join('.cursor', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Package-fidelity install. Runtime policy enforcement is not claimed.'
  }),
  Object.freeze({
    id: 'codex',
    label: 'Codex CLI',
    // Detect Codex client config and/or the shared agents skill root.
    detectRels: ['.codex', '.agents'],
    skillsRel: join('.agents', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Package-fidelity skill install; use package --host codex for a guarded Codex plugin bundle.'
  }),
  Object.freeze({
    id: 'opencode',
    label: 'OpenCode',
    detectRels: [join('.config', 'opencode'), '.agents'],
    skillsRel: join('.config', 'opencode', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Package-fidelity install. Verify the configured OpenCode skill directory for your local build.'
  }),
  Object.freeze({
    id: 'zcode',
    label: 'ZCode-compatible local agent',
    detectRels: ['.zcode', join('.config', 'zcode')],
    skillsRel: join('.zcode', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Package-fidelity install. Verify the configured ZCode skill directory for your local build.'
  }),
  Object.freeze({
    id: 'hermes',
    label: 'Hermes Agent',
    detectRels: ['.hermes', join('.config', 'hermes')],
    skillsRel: join('.hermes', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Package-fidelity install. Runtime policy enforcement is not claimed.'
  }),
  Object.freeze({
    id: 'gemini',
    label: 'Gemini CLI',
    detectRels: ['.gemini'],
    skillsRel: join('.gemini', 'skills'),
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Package-fidelity install. Runtime policy enforcement is not claimed.'
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
 * @returns {Promise<Array<{
 *   id: string,
 *   label: string,
 *   detected: boolean,
 *   skillsDir: string,
 *   fidelity: HostFidelity,
 *   detectDir: string,
 *   detectDirs: string[],
 *   runtimeEnforced: boolean,
 *   usesSidecar: boolean
 * }>>}
 */
export async function detectHosts(options = {}) {
  const home = resolve(options.home ?? homedir());
  const results = [];
  for (const host of HOST_REGISTRY) {
    const detectDirs = host.detectRels.map((rel) => resolve(home, rel));
    const skillsDir = resolve(home, host.skillsRel);
    for (const detectDir of detectDirs) {
      if (!isInsideHome(home, detectDir)) {
        throw new Error(`host path escaped home: ${host.id}`);
      }
    }
    if (!isInsideHome(home, skillsDir)) {
      throw new Error(`host path escaped home: ${host.id}`);
    }
    let detected = false;
    let primaryDetect = detectDirs[0];
    for (const detectDir of detectDirs) {
      if (await pathExists(detectDir)) {
        detected = true;
        primaryDetect = detectDir;
        break;
      }
    }
    results.push({
      id: host.id,
      label: host.label,
      detected,
      detectDir: primaryDetect,
      detectDirs,
      skillsDir,
      fidelity: host.fidelity,
      runtimeEnforced: host.runtimeEnforced,
      usesSidecar: host.usesSidecar,
      installHint: host.installHint
    });
  }
  return results;
}

/**
 * @param {string} spec
 * @param {{ home?: string }} [options]
 */
export function buildCustomHost(spec, options = {}) {
  const home = resolve(options.home ?? homedir());
  const source = String(spec ?? '');
  const separator = source.indexOf(':');
  const id = separator === -1 ? source : source.slice(0, separator);
  const dir = separator === -1 ? '' : source.slice(separator + 1);

  if (!id || !/^[a-z0-9][a-z0-9-]*$/i.test(id)) {
    throw new Error('custom host id must be kebab-case');
  }
  if (!dir) {
    throw new Error('custom host requires <id>:<skills-dir>');
  }

  const skillsDir = resolve(home, dir);
  if (!isInsideHome(home, skillsDir)) {
    throw new Error(`custom host path escaped home: ${id}`);
  }

  return {
    id,
    label: `Custom host: ${id}`,
    detected: true,
    detectDir: skillsDir,
    detectDirs: [skillsDir],
    skillsDir,
    fidelity: /** @type {HostFidelity} */ ('package'),
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Custom package-fidelity target. SkillsForge copies validated skill packages only.'
  };
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
