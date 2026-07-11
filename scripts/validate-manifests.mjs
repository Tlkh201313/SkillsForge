import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadJson, validateWithSchema } from './schema-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const targets = [
  ['plugin manifest', '.claude-plugin/plugin.json', 'schemas/plugin.schema.json'],
  ['marketplace manifest', '.claude-plugin/marketplace.json', 'schemas/marketplace.schema.json']
];
let ok = true;

for (const [label, valuePath, schemaPath] of targets) {
  const value = await loadJson(join(root, valuePath));
  const result = await validateWithSchema(join(root, schemaPath), value);
  if (result.valid) {
    console.log(`PASS ${label}`);
    continue;
  }
  ok = false;
  console.error(`FAIL ${label}`);
  for (const error of result.errors) console.error(`  - ${error}`);
}

const plugin = await loadJson(join(root, '.claude-plugin/plugin.json'));
const marketplace = await loadJson(join(root, '.claude-plugin/marketplace.json'));
const packageJson = await loadJson(join(root, 'package.json'));
const versions = new Set([plugin.version, marketplace.plugins[0]?.version, packageJson.version]);
if (versions.size !== 1) {
  ok = false;
  console.error('FAIL release versions must match across package, plugin, and marketplace manifests');
} else {
  console.log(`PASS release version ${plugin.version}`);
}

process.exit(ok ? 0 : 1);
