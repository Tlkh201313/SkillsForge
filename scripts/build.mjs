import { build } from 'esbuild';
import { chmod, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const check = process.argv.includes('--check');
const output = resolve('bin/skillsforge-validate');
const temporaryDirectory = check ? await mkdtemp(join(tmpdir(), 'skillsforge-build-')) : null;
const outfile = check ? join(temporaryDirectory, 'skillsforge-validate') : output;

try {
  await build({
    entryPoints: [resolve('scripts/validate-skill.mjs')],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    banner: {
      js: "#!/usr/bin/env node\nimport { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);"
    },
    legalComments: 'none',
    logLevel: 'silent'
  });
  await chmod(outfile, 0o755);

  if (check) {
    const [expected, actual] = await Promise.all([readFile(output), readFile(outfile)]);
    if (!expected.equals(actual)) {
      console.error('Bundled CLI is stale. Run npm run build and commit bin/skillsforge-validate.');
      process.exitCode = 1;
    } else {
      console.log('PASS bundled CLI is current');
    }
  } else {
    console.log(`Built ${output}`);
  }
} finally {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
}
