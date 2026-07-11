export function parseFrontmatter(source) {
  const normalized = source.startsWith('\uFEFF') ? source.slice(1) : source;
  const match = normalized.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return null;
  return {
    yaml: match[1],
    body: normalized.slice(match[0].length)
  };
}

export function firstLine(value) {
  return value.split('\n')[0];
}

export function isPlainObject(value) {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}
