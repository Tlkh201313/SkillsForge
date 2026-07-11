import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function expandFilePathPatterns(patterns, root = process.cwd()) {
  const expanded = [];
  for (const pattern of [...new Set(patterns)]) {
    if (!pattern.includes('*')) {
      expanded.push(pattern);
      continue;
    }

    const normalized = pattern.replaceAll('\\', '/');
    const slash = normalized.lastIndexOf('/');
    const parent = slash === -1 ? '.' : normalized.slice(0, slash);
    const namePattern = slash === -1 ? normalized : normalized.slice(slash + 1);
    const regex = new RegExp(`^${namePattern.split('*').map(escapeRegex).join('.*')}$`);
    let entries;
    try {
      entries = await readdir(resolve(root, parent), { withFileTypes: true });
    } catch {
      expanded.push(pattern);
      continue;
    }

    const matches = entries
      .filter((entry) => entry.isFile() && regex.test(entry.name))
      .map((entry) => parent === '.' ? entry.name : `${parent}/${entry.name}`)
      .sort((left, right) => left.localeCompare(right));
    expanded.push(...(matches.length === 0 ? [pattern] : matches));
  }
  return expanded;
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}
