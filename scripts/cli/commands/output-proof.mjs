import { runOutputProof } from '../../../lib/capabilities/output-proof.mjs';
import { consumeFlag, consumeOption, resolveRuntimeRoot, resolveUserPath } from '../shared.mjs';

export async function runOutputProofCommand(argv, options) {
  const args = [...argv];
  const json = consumeFlag(args, '--json');
  const task = consumeOption(args, '--task');
  const out = consumeOption(args, '--out');
  const allowAbsolute = consumeFlag(args, '--allow-absolute');
  if (task === null || out === null) {
    process.stderr.write('option requires a value\n');
    return 2;
  }
  const root = await resolveRuntimeRoot(options);
  let outDir;
  try {
    outDir = out ? resolveUserPath(root, out, allowAbsolute) : undefined;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
  const result = await runOutputProof(root, { task: task ?? undefined, outDir });
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write(`Output proof: ${result.summary.baseline.score}/${result.summary.baseline.max} -> ${result.summary.skillsforge.score}/${result.summary.skillsforge.max} contract coverage\n`);
    process.stdout.write(`Markdown: ${result.paths.markdown}\nJSON: ${result.paths.json}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  return result.ok ? 0 : 1;
}
