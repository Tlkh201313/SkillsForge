import { build } from 'esbuild';
import { chmod, mkdtemp, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateSchemasModule } from './gen-schemas.mjs';

const check = process.argv.includes('--check');
const validateOutput = resolve('plugins/skillsforge/bin/skillsforge-validate');
const cliOutput = resolve('plugins/skillsforge/bin/skillsforge.mjs');
const generatedSchemas = resolve('scripts/schemas.generated.mjs');
const temporaryDirectory = check ? await mkdtemp(join(tmpdir(), 'skillsforge-build-')) : null;
const validateBundle = check ? join(temporaryDirectory, 'skillsforge-validate') : validateOutput;
const cliBundle = check ? join(temporaryDirectory, 'skillsforge.mjs') : cliOutput;
const schemaOutput = check ? join(temporaryDirectory, 'schemas.generated.mjs') : generatedSchemas;

try {
  await generateSchemasModule(schemaOutput);
  await build({
    entryPoints: [resolve('scripts/validate-skill.mjs')],
    outfile: validateBundle,
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
  await build({
    entryPoints: [resolve('scripts/skillsforge-cli.mjs')],
    outfile: cliBundle,
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
  await chmod(validateBundle, 0o755);
  await chmod(cliBundle, 0o755);

  if (!check) {
    await writeFile(resolve('plugins/skillsforge/bin/skillsforge-validate'), `#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const child = spawn(process.execPath, [join(root, 'skillsforge.mjs'), 'validate', ...process.argv.slice(2)], {
  stdio: 'inherit'
});
child.on('exit', (code) => process.exit(code ?? 1));
`);
    await chmod(resolve('plugins/skillsforge/bin/skillsforge-validate'), 0o755);
  }

  if (check) {
    const results = await Promise.all([
      compareFiles(cliOutput, cliBundle, 'Bundled runtime CLI', 'npm run build and commit plugins/skillsforge/bin/skillsforge.mjs'),
      compareFiles(generatedSchemas, schemaOutput, 'Generated schema module', 'npm run build and commit scripts/schemas.generated.mjs')
    ]);
    if (results.every(Boolean)) console.log('PASS build artifacts are current');
    else process.exitCode = 1;
  } else {
    console.log(`Generated ${generatedSchemas}`);
    console.log(`Built ${cliOutput}`);
    console.log(`Updated ${validateOutput} shim`);
  }
} finally {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
}

async function compareFiles(expectedPath, actualPath, label, correction) {
  let expected;
  try {
    expected = await readFile(expectedPath);
  } catch {
    console.error(`${label} is missing. Run ${correction}.`);
    return false;
  }
  const actual = await readFile(actualPath);
  if (expected.equals(actual)) return true;
  console.error(`${label} is stale. Run ${correction}.`);
  return false;
}
