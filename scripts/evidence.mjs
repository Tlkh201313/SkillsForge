import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEvidenceBundleWithPackageMeta } from '../lib/capabilities/evidence.mjs';

const modulePath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(modulePath), '..');

function consumeOption(values, flag) {
  const index = values.indexOf(flag);
  if (index === -1) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    values.splice(index, 1);
    return null;
  }
  values.splice(index, 2);
  return value;
}

export async function main(argv = process.argv.slice(2), options = {}) {
  const args = [...argv];
  if (args.includes('--help') || args.includes('help')) {
    process.stdout.write(`usage: node scripts/evidence.mjs --out <dir>

Build a deterministic SkillsForge evidence bundle (validation, Codex interop,
policy adversarial denominators, routing eval, receipt + tamper proof).

  --out <dir>   Output directory (required; writes by default)
`);
    return 0;
  }

  const out = consumeOption(args, '--out');
  if (out === null) {
    process.stderr.write('--out requires a value\n');
    return 2;
  }
  if (!out) {
    process.stderr.write('usage: node scripts/evidence.mjs --out <dir>\n');
    return 2;
  }
  if (args.some((item) => item.startsWith('--'))) {
    process.stderr.write(`unknown option: ${args.find((item) => item.startsWith('--'))}\n`);
    return 2;
  }

  const root = options.root ?? repositoryRoot;
  const result = await buildEvidenceBundleWithPackageMeta({
    root,
    outDir: resolve(root, out),
    write: true
  });

  process.stdout.write(`${JSON.stringify({
    ok: result.ok,
    outDir: result.outDir,
    bundleHash: result.bundleHash,
    files: result.files
  }, null, 2)}\n`);
  return result.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  process.exitCode = await main();
}
