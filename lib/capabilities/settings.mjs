import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { HOST_REGISTRY } from './hosts.mjs';

export const CONFIG_FILE = 'skillsforge.config.json';

export const DEFAULT_SETTINGS = Object.freeze({
  recommendThreshold: 2,
  defaultHost: 'codex',
  library: Object.freeze({
    theme: 'system',
    outDir: 'artifacts/skillsforge-library',
    cacheHostChecks: true,
    extraSkillRoots: Object.freeze([])
  }),
  mutations: Object.freeze({
    allowByDefault: false
  })
});

const HOST_IDS = new Set(HOST_REGISTRY.map((host) => host.id));
const THEMES = new Set(['system', 'light', 'dark']);

export async function loadSettings(root, options = {}) {
  const path = resolveSettingsPath(root, options.config);
  const exists = await pathExists(path);
  if (!exists) {
    return {
      ok: true,
      path,
      exists: false,
      settings: materializeSettings({}),
      errors: []
    };
  }

  let raw;
  try {
    raw = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    return {
      ok: false,
      path,
      exists: true,
      settings: materializeSettings({}),
      errors: [`config JSON cannot be parsed: ${error.message}`]
    };
  }

  const settings = materializeSettings(raw);
  const errors = validateSettings(settings);
  return {
    ok: errors.length === 0,
    path,
    exists: true,
    settings,
    errors
  };
}

export async function validateSettingsFile(root, options = {}) {
  return loadSettings(root, options);
}

export async function writeSettings(root, updates = {}, options = {}) {
  const current = await loadSettings(root, options);
  const next = materializeSettings({ ...current.settings, ...updates });
  const errors = validateSettings(next);
  const path = current.path;
  if (errors.length) return { ok: false, path, settings: next, errors };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, path, settings: next, errors: [] };
}

export async function setSetting(root, key, value, options = {}) {
  const current = await loadSettings(root, options);
  if (!key) return { ok: false, path: current.path, settings: current.settings, errors: ['setting key is required'] };
  const next = structuredClone(current.settings);
  const parsed = parseSettingValue(key, value);
  setNested(next, key, parsed);
  const errors = validateSettings(next);
  if (errors.length) return { ok: false, path: current.path, settings: next, errors };
  await mkdir(dirname(current.path), { recursive: true });
  await writeFile(current.path, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, path: current.path, settings: next, errors: [] };
}

export async function resetSettings(root, options = {}) {
  const path = resolveSettingsPath(root, options.config);
  if (options.delete === true) {
    await rm(path, { force: true });
    return { ok: true, path, deleted: true, settings: materializeSettings({}), errors: [] };
  }
  await mkdir(dirname(path), { recursive: true });
  const settings = materializeSettings({});
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`);
  return { ok: true, path, deleted: false, settings, errors: [] };
}

export function materializeSettings(value = {}) {
  return {
    recommendThreshold: value.recommendThreshold ?? DEFAULT_SETTINGS.recommendThreshold,
    defaultHost: value.defaultHost ?? DEFAULT_SETTINGS.defaultHost,
    library: {
      theme: value.library?.theme ?? DEFAULT_SETTINGS.library.theme,
      outDir: value.library?.outDir ?? DEFAULT_SETTINGS.library.outDir,
      cacheHostChecks: value.library?.cacheHostChecks ?? DEFAULT_SETTINGS.library.cacheHostChecks,
      extraSkillRoots: value.library?.extraSkillRoots ?? DEFAULT_SETTINGS.library.extraSkillRoots
    },
    mutations: {
      allowByDefault: value.mutations?.allowByDefault ?? DEFAULT_SETTINGS.mutations.allowByDefault
    }
  };
}

export function validateSettings(settings) {
  const errors = [];
  if (!Number.isInteger(settings.recommendThreshold) || settings.recommendThreshold < 1 || settings.recommendThreshold > 20) {
    errors.push('recommendThreshold must be an integer from 1 to 20');
  }
  if (settings.defaultHost !== null && !HOST_IDS.has(settings.defaultHost)) {
    errors.push(`defaultHost must be one of: ${[...HOST_IDS].join(', ')}`);
  }
  if (!THEMES.has(settings.library.theme)) {
    errors.push('library.theme must be system, light, or dark');
  }
  if (typeof settings.library.outDir !== 'string' || settings.library.outDir.trim() === '') {
    errors.push('library.outDir must be a non-empty string');
  } else if (isAbsolute(settings.library.outDir)) {
    errors.push('library.outDir must be relative to the repository root');
  }
  if (typeof settings.library.cacheHostChecks !== 'boolean') {
    errors.push('library.cacheHostChecks must be boolean');
  }
  if (!Array.isArray(settings.library.extraSkillRoots)
    || settings.library.extraSkillRoots.some((item) => typeof item !== 'string' || item.trim() === '')) {
    errors.push('library.extraSkillRoots must be an array of non-empty strings');
  }
  if (typeof settings.mutations.allowByDefault !== 'boolean') {
    errors.push('mutations.allowByDefault must be boolean');
  }
  return errors;
}

export function resolveSettingsPath(root, config) {
  return resolve(root, config ?? CONFIG_FILE);
}

function parseSettingValue(key, value) {
  if (key === 'recommendThreshold') return Number(value);
  if (key === 'defaultHost') return value === 'null' ? null : String(value);
  if (key === 'library.cacheHostChecks' || key === 'mutations.allowByDefault') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }
  if (key === 'library.extraSkillRoots') {
    const text = String(value ?? '').trim();
    if (text.startsWith('[')) return JSON.parse(text);
    return text.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
  }
  return String(value);
}

function setNested(target, key, value) {
  const parts = String(key).split('.');
  if (![
    'recommendThreshold',
    'defaultHost',
    'library.theme',
    'library.outDir',
    'library.cacheHostChecks',
    'library.extraSkillRoots',
    'mutations.allowByDefault'
  ].includes(key)) {
    throw new Error(`unknown setting: ${key}`);
  }
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = value;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
