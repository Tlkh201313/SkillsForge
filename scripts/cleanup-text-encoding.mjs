#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const TEXT_EXTENSIONS = new Set(['.md', '.mjs', '.js', '.json', '.yaml', '.yml', '.svg', '.txt']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.codegraph', '.worktrees', 'dist', 'artifacts']);
const cp = (...codes) => String.fromCodePoint(...codes);
const REPLACEMENTS = [
  [cp(0x2014), '-'],
  [cp(0x2013), '-'],
  [cp(0x2192), '->'],
  [cp(0x2026), '...'],
  [cp(0x2018), "'"],
  [cp(0x2019), "'"],
  [cp(0x201c), '"'],
  [cp(0x201d), '"'],
  [cp(0x00f7), '/'],
  [cp(0x2260), '!='],
  [cp(0x2264), '<='],
  [cp(0x2265), '>='],
  [cp(0x00e2, 0x2030, 0x00a4), '<='],
  [cp(0x00b7), '-'],
  [cp(0x00a9), '(c)']
];

let changed = 0;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      continue;
    }
    if (!TEXT_EXTENSIONS.has(extname(entry.name))) continue;
    const path = join(dir, entry.name);
    const source = readFileSync(path, 'utf8');
    let next = source;
    for (const [from, to] of REPLACEMENTS) next = next.split(from).join(to);
    if (next !== source) {
      writeFileSync(path, next);
      changed += 1;
    }
  }
}

walk('.');
console.log(JSON.stringify({ ok: true, changed }));
