import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadJson, validateWithSchema } from './schema-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const marketplacePath = join(root, '.claude-plugin', 'marketplace.json');
const marketplace = await loadJson(marketplacePath);
const targets = [
  ['marketplace manifest', marketplacePath, join(root, 'schemas', 'marketplace.schema.json')]
];

for (const entry of marketplace.plugins ?? []) {
  if (typeof entry.source !== 'string') continue;
  targets.push([
    `plugin manifest ${entry.name}`,
    join(root, entry.source, '.claude-plugin', 'plugin.json'),
    join(root, 'schemas', 'plugin.schema.json')
  ]);
}

let ok = true;
const pluginVersions = [];
for (const [label, valuePath, schemaPath] of targets) {
  let value;
  try {
    value = await loadJson(valuePath);
  } catch (error) {
    ok = false;
    console.error(`FAIL ${label}`);
    console.error(`  - ${error.message}`);
    continue;
  }

  const result = await validateWithSchema(schemaPath, value);
  if (result.valid) console.log(`PASS ${label}`);
  else {
    ok = false;
    console.error(`FAIL ${label}`);
    for (const error of result.errors) console.error(`  - ${error}`);
  }
  if (label.startsWith('plugin manifest ')) pluginVersions.push(value.version);
}

const packageJson = await loadJson(join(root, 'package.json'));
const versions = new Set([
  packageJson.version,
  ...pluginVersions,
  ...(marketplace.plugins ?? []).map((entry) => entry.version)
]);
if (versions.size !== 1) {
  ok = false;
  console.error('FAIL release versions must match across package, plugin, and marketplace manifests');
} else {
  console.log(`PASS release version ${packageJson.version}`);
}

process.exit(ok ? 0 : 1);
