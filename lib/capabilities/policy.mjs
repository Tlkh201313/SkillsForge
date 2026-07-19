import { readFile, readdir, realpath, lstat } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const EXEC_EXTENSIONS = new Set(['.sh', '.ps1', '.cmd', '.bat', '.exe', '.py', '.mjs', '.js', '.cjs']);
const TEXT_EXTENSIONS = new Set([
  '.md', '.json', '.txt', '.yml', '.yaml', '.sh', '.ps1', '.cmd', '.bat',
  '.py', '.mjs', '.js', '.cjs', '.ts', '.tsx', '.html', '.css', '.toml', '.ini'
]);
// Match process-execution APIs, not bare capability keys like "exec" in skillsforge.json.
const EXEC_CONTENT = /\b(?:child_process|exec(?:File|Sync)\b|exec\s*\(|\.exec\b|spawn(?:Sync)?\s*\(|spawn(?:Sync)?\b)/;
const NETWORK_CONTENT = /\b(?:fetch\s*\(|axios\b|curl\b|wget\b|WebFetch|WebSearch|https?:\/\/|wss?:\/\/)/i;
const HOST_PATTERN = /\b(?:https?|wss?):\/\/([^/\s"'`]+)/gi;
const PATH_ESCAPE = /(?:^|[\s"'`=(])((?:\.\.[\\/])+[^\s"'`)]+|\/(?:etc|tmp|var|home|Users)\/[^\s"'`)]+|[A-Za-z]:\\[^\s"'`)]+)/g;
const MAX_TEXT_BYTES = 256_000;

export const POLICY_RULES = Object.freeze([
  'undeclared-exec-file',
  'undeclared-exec-content',
  'undeclared-network',
  'undeclared-host',
  'write-scope-escape',
  'symlink-escape',
  'oversized-unscanned-file',
  'unverified-binary'
]);

export async function scanSkill(skill) {
  const findings = [];
  const caps = skill.sidecar?.capabilities ?? {
    exec: { allowed: false, commands: [] },
    network: { allowed: false, hosts: [] },
    write: { scope: 'skill' }
  };
  const files = skill.files ?? await collectFiles(skill.directory);
  const unscanned = [];

  for (const file of files) {
    const relativePath = relative(skill.directory, file).replaceAll('\\', '/');
    let stats;
    try {
      stats = await lstat(file);
    } catch {
      continue;
    }

    if (stats.isSymbolicLink()) {
      try {
        const real = await realpath(file);
        const realDir = await realpath(skill.directory);
        if (!isInside(realDir, real)) {
          findings.push(finding(
            'symlink-escape',
            true,
            [relativePath],
            'remove symlink or keep target inside skill root',
            { writeScope: caps.write?.scope ?? 'skill' },
            { symlinkTarget: real }
          ));
        }
      } catch {
        findings.push(finding(
          'symlink-escape',
          true,
          [relativePath],
          'remove broken symlink',
          { writeScope: caps.write?.scope ?? 'skill' },
          { symlinkTarget: 'unresolved' }
        ));
      }
    }

    const extension = extname(file).toLowerCase();
    if (EXEC_EXTENSIONS.has(extension) && caps.exec?.allowed !== true) {
      findings.push(finding(
        'undeclared-exec-file',
        true,
        [relativePath],
        'declare capabilities.exec.allowed: true or remove the script',
        { exec: false },
        { executableFile: relativePath }
      ));
    }

    const raw = await readFile(file);
    const looksText = TEXT_EXTENSIONS.has(extension) || isProbablyText(raw);
    if (!looksText) {
      if (stats.size > 0) unscanned.push(relativePath);
      continue;
    }

    if (raw.byteLength > MAX_TEXT_BYTES) {
      findings.push(finding(
        'oversized-unscanned-file',
        true,
        [relativePath],
        'reduce file size or declare capability and split content',
        { maxTextBytes: MAX_TEXT_BYTES },
        { sizeBytes: raw.byteLength }
      ));
      continue;
    }

    const text = raw.toString('utf8');
    // Frontmatter is declarative (incl. PreToolUse matchers); scan body only.
    const { body, lineOffset } = extension === '.md' ? markdownScanRegion(text) : { body: text, lineOffset: 0 };
    if (caps.exec?.allowed !== true) {
      for (const line of matchingLines(body, EXEC_CONTENT)) {
        const absoluteLine = line + lineOffset;
        findings.push(finding(
          'undeclared-exec-content',
          true,
          [`${relativePath}:${absoluteLine}`],
          'declare capabilities.exec.allowed: true or remove process execution',
          { exec: false },
          { processExecutionReference: true, line: absoluteLine }
        ));
      }
    }

    if (caps.network?.allowed !== true) {
      for (const line of matchingLines(body, NETWORK_CONTENT)) {
        const absoluteLine = line + lineOffset;
        findings.push(finding(
          'undeclared-network',
          true,
          [`${relativePath}:${absoluteLine}`],
          'declare capabilities.network.allowed: true or remove network references',
          { network: false },
          { networkReference: true, line: absoluteLine }
        ));
      }
    }

    if (caps.network?.allowed === true) {
      const allowedHosts = caps.network.hosts ?? [];
      for (const match of body.matchAll(HOST_PATTERN)) {
        const host = normalizeHost(match[1]);
        if (!host) continue;
        if (!hostAllowed(host, allowedHosts)) {
          const line = lineNumberAt(body, match.index ?? 0) + lineOffset;
          findings.push(finding(
            'undeclared-host',
            true,
            [`${relativePath}:${line}:${host}`],
            `add ${host} to capabilities.network.hosts or remove it`,
            { hosts: [...allowedHosts].sort() },
            { host, line }
          ));
        }
      }
    }

    if (caps.write?.scope === 'skill' || caps.write?.scope === 'none') {
      for (const match of body.matchAll(PATH_ESCAPE)) {
        const candidate = match[1];
        if (candidate.includes('..') || isAbsolute(candidate)) {
          const line = lineNumberAt(body, match.index ?? 0) + lineOffset;
          findings.push(finding(
            'write-scope-escape',
            true,
            [`${relativePath}:${line}:${candidate}`],
            'keep writes inside declared write.scope',
            { writeScope: caps.write?.scope ?? 'skill' },
            { path: candidate, line }
          ));
        }
      }
    }
  }

  if (unscanned.length > 0) {
    findings.push(finding(
      'unverified-binary',
      false,
      unscanned,
      'binary/non-text files were not content-scanned',
      { contentScan: true },
      { unscannedFiles: unscanned.length }
    ));
  }

  return dedupeFindings(findings);
}

function finding(rule, blocking, evidence, fix, declared = null, detected = null) {
  return {
    rule,
    blocking,
    blocked: blocking,
    unverified: !blocking,
    evidence,
    fix,
    declared,
    detected
  };
}

function dedupeFindings(findings) {
  const seen = new Set();
  const out = [];
  for (const item of findings) {
    const key = `${item.rule}|${item.evidence.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function collectFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFiles(path));
    else out.push(path);
  }
  return out;
}

function isInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

function isProbablyText(buffer) {
  if (buffer.byteLength === 0) return false;
  if (buffer.includes(0)) return false;
  const sample = buffer.subarray(0, Math.min(buffer.byteLength, 512));
  let printable = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte < 127)) printable += 1;
  }
  if (printable / sample.byteLength < 0.85) return false;
  return !/[\uFFFD]/.test(sample.toString('utf8'));
}

function markdownScanRegion(text) {
  const match = text.match(/^---[\t ]*\r?\n[\s\S]*?\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) return { body: text, lineOffset: 0 };
  const frontmatterLines = match[0].split(/\r?\n/).length - 1;
  return { body: text.slice(match[0].length), lineOffset: frontmatterLines };
}

function matchingLines(text, pattern) {
  const lines = [];
  const parts = text.split(/\r?\n/);
  for (let index = 0; index < parts.length; index += 1) {
    if (pattern.test(parts[index])) lines.push(index + 1);
    pattern.lastIndex = 0;
  }
  return lines;
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

function normalizeHost(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[),.;]+$/g, '')
    .trim();
}

function hostAllowed(host, declaredHosts = []) {
  const normalized = host.toLowerCase();
  return declaredHosts.some((declared) => {
    const allowed = String(declared).toLowerCase();
    return normalized === allowed
      || (allowed.startsWith('*.') && normalized.endsWith(allowed.slice(1)));
  });
}
