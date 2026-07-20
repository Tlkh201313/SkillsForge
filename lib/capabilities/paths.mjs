import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export const SKILL_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSkillId(name) {
  if (typeof name !== 'string' || !SKILL_ID_RE.test(name)) {
    throw new Error(`invalid skill id "${name}": must match ${SKILL_ID_RE}`);
  }
  return name;
}

/** True when candidate is root or a path inside root (no escape). */
export function isInside(root, candidate) {
  const parent = resolve(root);
  const child = resolve(candidate);
  if (parent === child) return true;
  const rel = relative(parent, child);
  return rel !== '' && !rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel);
}

/**
 * Resolve a user path under root. Absolute paths outside root are rejected
 * unless allowAbsolute. Absolute paths that still resolve inside root are OK.
 */
export function resolveUnderRoot(root, userPath, options = {}) {
  if (userPath == null || userPath === '') {
    throw new Error('path is required');
  }
  const raw = String(userPath);
  if (raw.includes('\0')) {
    throw new Error('path contains NUL');
  }
  const base = resolve(root);
  const target = isAbsolute(raw) ? resolve(raw) : resolve(base, raw);
  const inside = isInside(base, target) || target === base;
  if (!inside) {
    if (isAbsolute(raw) && !options.allowAbsolute) {
      throw new Error(`absolute path rejected (pass --allow-absolute to override): ${raw}`);
    }
    if (!options.allowAbsolute) {
      throw new Error(`path escapes repository root: ${raw}`);
    }
  }
  return target;
}

/**
 * Write-path confinement: lexical check always; realpath when root/candidate exist.
 *
 * Residual: non-existent create paths cannot realpath yet - only the lexical
 * isInside check applies until the path (or a symlink parent) exists on disk.
 *
 * @returns {{ ok: true, mode: 'realpath'|'lexical'|'lexical-create' } | { ok: false, reason: string }}
 */
export function confineWriteCandidate(root, candidate) {
  if (root == null || root === '' || candidate == null || candidate === '') {
    return { ok: false, reason: 'write root or path unavailable' };
  }
  const absRoot = resolve(root);
  const absCandidate = resolve(candidate);
  if (!isInside(absRoot, absCandidate)) {
    return { ok: false, reason: 'write escapes scope' };
  }

  let realRoot;
  try {
    realRoot = realpathSync(absRoot);
  } catch {
    return { ok: true, mode: 'lexical' };
  }

  if (!existsSync(absCandidate)) {
    return { ok: true, mode: 'lexical-create' };
  }

  let realCandidate;
  try {
    realCandidate = realpathSync(absCandidate);
  } catch {
    return { ok: false, reason: 'write path realpath failed' };
  }
  if (!isInside(realRoot, realCandidate)) {
    return { ok: false, reason: 'write escapes scope after realpath' };
  }
  return { ok: true, mode: 'realpath' };
}
