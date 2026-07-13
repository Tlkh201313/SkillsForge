import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const NETWORK_PATTERN = /\b(fetch\s*\(|curl\s+|https?:\/\/(?!github\.com|code\.claude\.com))/;
const EXEC_EXTENSIONS = ['.sh', '.ps1', '.cmd', '.bat', '.exe', '.py'];

export async function scanSkill(skill) {
  const findings = [];
  const caps = skill.sidecar?.capabilities ?? {
    exec: false,
    network: false,
    writesOutsideSkill: false
  };
  const files = await collectFiles(skill.dir);
  const executables = files.filter((f) => EXEC_EXTENSIONS.some((ext) => f.endsWith(ext)));
  if (!caps.exec && executables.length > 0) {
    findings.push({
      rule: 'undeclared-exec',
      blocking: true,
      evidence: executables.map((f) => relative(skill.dir, f)),
      fix: 'declare capabilities.exec: true or remove the scripts'
    });
  }
  const texts = await Promise.all(
    files.filter((f) => f.endsWith('.md')).map((f) => readFile(f, 'utf8'))
  );
  if (!caps.network && texts.some((t) => NETWORK_PATTERN.test(t))) {
    findings.push({
      rule: 'undeclared-network',
      blocking: true,
      evidence: ['network reference in skill body'],
      fix: 'declare capabilities.network: true or remove the reference'
    });
  }
  if (texts.some((t) => /\]\((\.\.\/)+/.test(t))) {
    findings.push({
      rule: 'path-escape',
      blocking: true,
      evidence: ['relative link leaves skill directory'],
      fix: 'keep links inside the skill directory'
    });
  }
  return findings;
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
