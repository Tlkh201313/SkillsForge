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
