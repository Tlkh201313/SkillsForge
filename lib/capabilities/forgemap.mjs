import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

export const FORGEMAP_INDEX_REL = join('artifacts', 'forgemap', 'index.json');

const CODE_EXTS = ['.js', '.mjs', '.cjs', '.ts', '.tsx'];
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.codegraph',
  'coverage',
  'artifacts',
  '.next',
  'build',
  'vendor',
  '.cursor',
  '.claude',
  '.codex'
]);

export async function runForgeMap(root, task, options = {}) {
  switch (task) {
    case 'status':
      return mapStatus(root, options);
    case 'index':
      return mapIndex(root, options);
    case 'files':
      return mapFiles(root, options);
    case 'symbol':
      return mapSymbol(root, options);
    case 'callers':
      return mapCallers(root, options);
    case 'impact':
      return mapImpact(root, options);
    case 'explore':
      return mapExplore(root, options);
    default:
      return { ok: false, task, error: `unknown map task: ${task}` };
  }
}

export function formatForgeMapText(payload) {
  if (!payload.ok && payload.error) return `${payload.error}\n`;
  if (payload.lines) return `${payload.lines.join('\n')}${payload.lines.length ? '\n' : ''}`;
  return `${JSON.stringify(payload, null, 2)}\n`;
}

async function mapStatus(root) {
  const index = await loadOrBuildIndex(root, { force: false });
  const codegraph = await probeCodegraph(root);
  const lines = [
    `files\t${index.files?.length ?? 0}`,
    `symbols\t${index.symbols?.length ?? 0}`,
    `edges\t${index.edges?.length ?? 0}`,
    `builtAt\t${index.builtAt ?? ''}`,
    `codegraph\t${codegraph.linked ? 'linked' : 'absent'}`
  ];
  if (codegraph.path) lines.push(`codegraphPath\t${codegraph.path}`);
  return {
    ok: true,
    task: 'status',
    files: index.files?.length ?? 0,
    symbols: index.symbols?.length ?? 0,
    edges: index.edges?.length ?? 0,
    builtAt: index.builtAt,
    codegraph,
    lines
  };
}

async function mapIndex(root) {
  const index = await buildLightweightIndex(root);
  await persistIndex(root, index);
  return {
    ok: true,
    task: 'index',
    files: index.files.length,
    symbols: index.symbols.length,
    edges: index.edges.length,
    builtAt: index.builtAt,
    lines: [
      `indexed\t${index.files.length} files`,
      `symbols\t${index.symbols.length}`,
      `edges\t${index.edges.length}`,
      `path\t${FORGEMAP_INDEX_REL}`
    ]
  };
}

async function mapFiles(root, options = {}) {
  const index = await loadOrBuildIndex(root, options);
  const limit = clamp(options.limit, 100, 1, 5000);
  const files = (index.files ?? []).slice(0, limit);
  return {
    ok: true,
    task: 'files',
    count: index.files?.length ?? 0,
    files,
    lines: files.map((file) => `file\t${file.path}\t${file.symbolCount ?? 0}`)
  };
}

async function mapSymbol(root, options = {}) {
  const name = String(options.name ?? '').trim();
  if (!name) return { ok: false, task: 'symbol', error: 'map symbol requires <name>' };
  const index = await loadOrBuildIndex(root, options);
  const limit = clamp(options.limit, 40, 1, 200);
  const lower = name.toLowerCase();
  const hits = (index.symbols ?? []).filter((s) => s.name === name || s.name.toLowerCase() === lower);
  const chosen = hits.some((s) => s.name === name) ? hits.filter((s) => s.name === name) : hits;
  return {
    ok: true,
    task: 'symbol',
    name,
    count: chosen.length,
    symbols: chosen.slice(0, limit),
    lines: chosen.slice(0, limit).map((s) => `def\t${s.name}\t${s.kind}\t${s.file}:${s.line}`)
  };
}

async function mapCallers(root, options = {}) {
  const name = String(options.name ?? '').trim();
  if (!name) return { ok: false, task: 'callers', error: 'map callers requires <name>' };
  const index = await loadOrBuildIndex(root, options);
  const limit = clamp(options.limit, 40, 1, 200);
  const defs = (index.symbols ?? []).filter((s) => s.name === name);
  const defFiles = new Set(defs.map((d) => d.file));
  const importers = [];
  for (const edge of index.edges ?? []) {
    if (edge.kind === 'imports' && defFiles.has(edge.to)) importers.push(edge.from);
  }
  const uniqueImporters = [...new Set(importers)].slice(0, limit);
  const codegraph = await enrichCallersFromCodegraph(root, name);
  const lines = [
    ...uniqueImporters.map((file) => `importer\t${file}`),
    ...(codegraph.lines ?? [])
  ].slice(0, limit * 2);
  return {
    ok: true,
    task: 'callers',
    name,
    importers: uniqueImporters,
    codegraph: codegraph.linked ? codegraph : undefined,
    lines
  };
}

async function mapImpact(root, options = {}) {
  const name = String(options.name ?? '').trim();
  if (!name) return { ok: false, task: 'impact', error: 'map impact requires <name>' };
  const index = await loadOrBuildIndex(root, options);
  const depth = clamp(options.depth, 2, 1, 3);
  const limit = clamp(options.limit, 80, 1, 500);
  const defs = (index.symbols ?? []).filter((s) => s.name === name);
  const seedFiles = new Set(defs.map((d) => d.file));
  if (!seedFiles.size) {
    const byPath = (index.files ?? []).find((f) =>
      f.path === name || f.path.endsWith(`/${name}`) || basename(f.path) === name
    );
    if (byPath) seedFiles.add(byPath.path);
  }
  const impacted = new Set();
  let frontier = new Set(seedFiles);
  for (let d = 0; d < depth; d += 1) {
    const next = new Set();
    for (const edge of index.edges ?? []) {
      if (edge.kind === 'imports' && frontier.has(edge.to) && !seedFiles.has(edge.from) && !impacted.has(edge.from)) {
        next.add(edge.from);
        impacted.add(edge.from);
      }
    }
    frontier = next;
  }
  const codegraph = await enrichImpactFromCodegraph(root, name);
  const files = [...impacted].slice(0, limit);
  return {
    ok: true,
    task: 'impact',
    name,
    depth,
    seeds: [...seedFiles],
    files,
    codegraph: codegraph.linked ? codegraph : undefined,
    lines: [
      `seed\t${[...seedFiles].join(',') || '(none)'}`,
      `depth\t${depth}`,
      ...files.map((file) => `impact\t${file}`),
      ...(codegraph.lines ?? [])
    ]
  };
}

async function mapExplore(root, options = {}) {
  const query = String(options.query ?? '').trim();
  if (!query) return { ok: false, task: 'explore', error: 'map explore requires --query <text>' };
  const index = await loadOrBuildIndex(root, options);
  const budget = clamp(options.budget, 2500, 500, 8000);
  const q = query.toLowerCase();
  const symbols = (index.symbols ?? [])
    .filter((s) => s.name.toLowerCase().includes(q) || s.file.toLowerCase().includes(q))
    .slice(0, 30);
  const files = (index.files ?? [])
    .filter((f) => f.path.toLowerCase().includes(q) || basename(f.path).toLowerCase().includes(q))
    .slice(0, 20);
  const neighborFiles = new Set();
  for (const sym of symbols) neighborFiles.add(sym.file);
  for (const file of files) neighborFiles.add(file.path);
  for (const edge of index.edges ?? []) {
    if (neighborFiles.has(edge.from) || neighborFiles.has(edge.to)) {
      neighborFiles.add(edge.from);
      neighborFiles.add(edge.to);
    }
  }
  const neighbors = [...neighborFiles].slice(0, 40);
  const codegraph = await enrichExploreFromCodegraph(root, query);
  let lines = [
    `query\t${query}`,
    ...symbols.slice(0, 20).map((s) => `symbol\t${s.name}\t${s.kind}\t${s.file}:${s.line}`),
    ...files.slice(0, 15).map((f) => `file\t${f.path}`),
    ...neighbors.slice(0, 20).map((n) => `neighbor\t${n}`),
    ...(codegraph.lines ?? [])
  ];
  let packed = lines.join('\n');
  while (packed.length > budget && lines.length > 8) {
    lines = lines.slice(0, -1);
    packed = lines.join('\n');
  }
  return {
    ok: true,
    task: 'explore',
    query,
    symbols: symbols.slice(0, 20),
    files: files.map((f) => f.path).slice(0, 15),
    neighbors: neighbors.slice(0, 20),
    budget,
    codegraph: codegraph.linked ? codegraph : undefined,
    lines,
    truncated: packed.length >= budget
  };
}

async function loadOrBuildIndex(root, options = {}) {
  if (options.force === true) {
    const index = await buildLightweightIndex(root);
    await persistIndex(root, index);
    return index;
  }
  try {
    const raw = JSON.parse(await readFile(join(root, FORGEMAP_INDEX_REL), 'utf8'));
    if (raw?.schemaVersion === 1 && Array.isArray(raw.files)) return raw;
  } catch {
    // rebuild below
  }
  const index = await buildLightweightIndex(root);
  await persistIndex(root, index);
  return index;
}

export async function buildLightweightIndex(root) {
  const filePaths = [];
  await walkCodeFiles(root, root, filePaths);
  const fileSet = new Set(filePaths);
  const files = [];
  const symbols = [];
  const edges = [];

  for (const rel of filePaths) {
    const abs = join(root, rel);
    let text = '';
    try {
      text = await readFile(abs, 'utf8');
    } catch {
      continue;
    }
    if (text.length > 400000) continue;
    const lines = text.split(/\r?\n/);
    let symbolCount = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const lineNo = i + 1;
      let m;
      if ((m = line.match(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/))) {
        symbols.push({ name: m[1], kind: 'function', file: rel, line: lineNo });
        symbolCount += 1;
      } else if ((m = line.match(/^export\s+class\s+([A-Za-z_$][\w$]*)/))) {
        symbols.push({ name: m[1], kind: 'class', file: rel, line: lineNo });
        symbolCount += 1;
      } else if ((m = line.match(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/))) {
        symbols.push({ name: m[1], kind: 'binding', file: rel, line: lineNo });
        symbolCount += 1;
      } else if ((m = line.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/))) {
        symbols.push({ name: m[1], kind: 'function', file: rel, line: lineNo });
        symbolCount += 1;
      } else if ((m = line.match(/^class\s+([A-Za-z_$][\w$]*)\b/))) {
        symbols.push({ name: m[1], kind: 'class', file: rel, line: lineNo });
        symbolCount += 1;
      }
      if ((m = line.match(/\bfrom\s+['"]([^'"]+)['"]/)) || (m = line.match(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/))) {
        const resolved = resolveImport(root, rel, m[1], fileSet);
        if (resolved) edges.push({ kind: 'imports', from: rel, to: resolved });
      }
    }
    files.push({ path: rel, symbolCount });
  }

  const fingerprint = createHash('sha256')
    .update(filePaths.slice().sort().join('\n'))
    .digest('hex')
    .slice(0, 16);

  return {
    schemaVersion: 1,
    builtAt: new Date().toISOString(),
    fingerprint,
    files,
    symbols,
    edges
  };
}

async function walkCodeFiles(root, dir, out) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkCodeFiles(root, abs, out);
      continue;
    }
    if (!CODE_EXTS.includes(extname(entry.name))) continue;
    out.push(toPosix(relative(root, abs)));
  }
}

function resolveImport(root, fromFile, spec, fileSet) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(join(root, fromFile)), spec);
  const candidates = [];
  for (const ext of ['', ...CODE_EXTS]) {
    candidates.push(base + ext);
  }
  for (const ext of CODE_EXTS) {
    candidates.push(join(base, `index${ext}`));
  }
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const rel = toPosix(relative(root, candidate));
    if (fileSet.has(rel)) return rel;
  }
  // soft match: if indexed path equals without verifying (symlink edge)
  const soft = toPosix(relative(root, base));
  for (const ext of CODE_EXTS) {
    if (fileSet.has(soft + ext)) return soft + ext;
  }
  return null;
}

async function persistIndex(root, index) {
  await mkdir(join(root, 'artifacts', 'forgemap'), { recursive: true });
  await writeFile(join(root, FORGEMAP_INDEX_REL), `${JSON.stringify(index)}\n`);
}

function toPosix(p) {
  return String(p).replace(/\\/g, '/');
}

function clamp(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

async function probeCodegraph(root) {
  const path = join(root, '.codegraph', 'codegraph.db');
  try {
    await stat(path);
  } catch {
    return { linked: false, path: null };
  }
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path, { readOnly: true });
    db.close();
    return { linked: true, path: '.codegraph/codegraph.db' };
  } catch {
    return { linked: false, path: '.codegraph/codegraph.db', error: 'sqlite-open-failed' };
  }
}

async function withCodegraph(root, fn) {
  const path = join(root, '.codegraph', 'codegraph.db');
  try {
    await stat(path);
  } catch {
    return { linked: false, lines: [] };
  }
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path, { readOnly: true });
    try {
      const result = fn(db);
      return { linked: true, ...result };
    } finally {
      db.close();
    }
  } catch {
    return { linked: false, lines: [] };
  }
}

async function enrichCallersFromCodegraph(root, name) {
  return withCodegraph(root, (db) => {
    const lines = [];
    tryQuery(db, `SELECT DISTINCT file_path, line FROM symbols WHERE name = ? LIMIT 20`, [name], (row) => {
      lines.push(`cg-def\t${row.file_path}:${row.line}`);
    });
    tryQuery(db, `SELECT DISTINCT caller_file, caller_line FROM callers WHERE callee_name = ? LIMIT 40`, [name], (row) => {
      lines.push(`cg-caller\t${row.caller_file}:${row.caller_line}`);
    });
    if (!lines.length) {
      try {
        const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
        if (tables.length) lines.push(`cg-info\ttables:${tables.map((t) => t.name).slice(0, 8).join(',')}`);
      } catch {
        // ignore
      }
    }
    return { lines };
  });
}

async function enrichImpactFromCodegraph(root, name) {
  return withCodegraph(root, (db) => {
    const lines = [];
    tryQuery(db, `SELECT DISTINCT file_path FROM dependencies WHERE symbol_name = ? LIMIT 40`, [name], (row) => {
      lines.push(`cg-impact\t${row.file_path}`);
    });
    return { lines };
  });
}

async function enrichExploreFromCodegraph(root, query) {
  return withCodegraph(root, (db) => {
    const lines = [];
    tryQuery(db, `SELECT name, file_path, line FROM symbols WHERE name LIKE ? LIMIT 15`, [`%${query}%`], (row) => {
      lines.push(`cg-symbol\t${row.name}\t${row.file_path}:${row.line}`);
    });
    return { lines };
  });
}

function tryQuery(db, sql, params, onRow) {
  try {
    const rows = db.prepare(sql).all(...params);
    for (const row of rows) onRow(row);
  } catch {
    // schema may differ - fail open
  }
}
