import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function discoverTestFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) files.push(...await discoverTestFiles(path));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.test.mjs')) files.push(path);
  }

  return files;
}
