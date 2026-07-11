import { build } from 'esbuild';
import { chmod, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateSchemasModule } from './gen-schemas.mjs';

const check = process.argv.includes('--check');
const output = resolve('bin/skillsforge-validate');
const generatedSchemas = resolve('scripts/schemas.generated.mjs');
const temporaryDirectory = check ? await mkdtemp(join(tmpdir(), 'skillsforge-build-')) : null;
const bundleOutput = check ? join(temporaryDirectory, 'skillsforge-validate') : output;
const schemaOutput = check ? join(temporaryDirectory, 'schemas.generated.mjs') : generatedSchemas;

try {
  await generateSchemasModule(schemaOutput);
  await build({
    entryPoints: [resolve('scripts/validate-skill.mjs')],
    outfile: bundleOutput,
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
  await chmod(bundleOutput, 0o755);

  if (check) {
    const results = await Promise.all([
      compareFiles(output, bundleOutput, 'Bundled CLI', 'npm run build and commit bin/skillsforge-validate'),
      compareFiles(generatedSchemas, schemaOutput, 'Generated schema module', 'npm run build and commit scripts/schemas.generated.mjs')
    ]);
    if (results.every(Boolean)) console.log('PASS build artifacts are current');
    else process.exitCode = 1;
  } else {
    console.log(`Generated ${generatedSchemas}`);
    console.log(`Built ${output}`);
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
