import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { writeLibraryArtifacts } from './library.mjs';
import { ensureSessionMemory } from './session.mjs';
import { loadSettings, saveSettings } from './settings.mjs';

export async function initializeProject(root, options = {}) {
  const absRoot = resolve(root);
  const profile = options.profile ?? 'vibecoder';
  const sessionHost = options.sessionHost ?? 'codex';
  const loaded = await loadSettings(absRoot, { config: options.config });
  const settings = {
    ...loaded.settings,
    defaultHost: sessionHost,
    project: {
      ...loaded.settings.project,
      selectedSkills: loaded.settings.project?.selectedSkills ?? [],
      defaultWorkflows: loaded.settings.project?.defaultWorkflows ?? []
    },
    session: {
      ...loaded.settings.session,
      enabled: true
    }
  };
  const saved = await saveSettings(absRoot, settings, { config: options.config });
  if (!saved.ok) return { ok: false, stage: 'settings', errors: saved.errors, path: saved.path };
  await mkdir(join(absRoot, 'artifacts'), { recursive: true });
  const library = await writeLibraryArtifacts(absRoot, {
    home: options.home,
    sessionHost,
    config: options.config,
    outDir: settings.library.outDir
  });
  const session = await ensureSessionMemory(absRoot, { config: options.config });
  return {
    ok: library.ok && session.ok,
    profile,
    sessionHost,
    config: saved.path,
    library,
    session,
    links: {
      libraryHtml: library.files.html,
      aiIndexHtml: library.files.ai,
      libraryJson: library.files.json,
      serve: `skillsforge lib serve --session-host ${sessionHost}`,
      serveMutations: `skillsforge lib serve --session-host ${sessionHost} --allow-mutations`
    },
    nextCommands: [
      `skillsforge lib open`,
      `skillsforge lib recommend --query "<task>" --json`,
      `skillsforge workflows recommend --query "<task>" --json`,
      `skillsforge session score --json`
    ],
    errors: library.errors ?? []
  };
}
