import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const COPY_PATHS = [
  'skills',
  'commands',
  'hooks',
  'core',
  'router',
  'policy',
  'scripts/route.mjs',
  'scripts/validate-skill.mjs',
  'scripts/validate-skill-lib.mjs',
  'scripts/eval.mjs',
  'package.json',
  'VERSION'
];

export async function emitClaude(skills, outDir, options = {}) {
  const sourceRoot = options.root ?? root;
  await rm(outDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  await mkdir(join(outDir, '.claude-plugin'), { recursive: true });
  const manifest = JSON.parse(await readFile(join(sourceRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
  await writeFile(join(outDir, '.claude-plugin', 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const emitted = ['.claude-plugin/plugin.json'];
  for (const relative of COPY_PATHS) {
    const from = join(sourceRoot, relative);
    const to = join(outDir, relative);
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
    emitted.push(relative);
  }

  return {
    platform: 'claude-code',
    outDir,
    skillCount: skills.length,
    emitted: emitted.sort()
  };
}
