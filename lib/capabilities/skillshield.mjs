import { readFile } from 'node:fs/promises';
import { loadSkill } from './skill-loader.mjs';

const SECRET_RE = /(api[_-]?key|secret[_-]?key|password\s*=\s*['\"][^'\"]+|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36})/i;
const UNBOUNDED_SHELL_RE = /\b(rm\s+-rf\s+\/|curl\s+[^\n]*\|\s*(ba)?sh|eval\s*\(|sudo\s+rm)\b/i;
const INJECTION_RE = /\b(ignore previous instructions|disregard system prompt|jailbreak)\b/i;
const COPY_MARKERS = [
  'obra/superpowers',
  'everything-claude-code',
  'garrytan/gstack',
  'mattpocock/skills',
  'ruvnet/ruflo',
  'addyosmani/agent-skills'
];

export async function runSkillShield(skillDir, options = {}) {
  const loaded = await loadSkill(skillDir, options);
  const findings = [];
  const body = loaded.body ?? '';
  const sidecarRaw = loaded.sidecarFile ? await readFile(loaded.sidecarFile, 'utf8') : '';
  const blob = `${body}\n${sidecarRaw}\n${loaded.description ?? ''}`;

  if (SECRET_RE.test(blob)) {
    findings.push({ severity: 'high', rule: 'secret-pattern', message: 'Possible secret or credential pattern in skill files' });
  }
  if (UNBOUNDED_SHELL_RE.test(blob)) {
    findings.push({ severity: 'high', rule: 'unbounded-shell', message: 'Dangerous shell pattern detected' });
  }
  if (INJECTION_RE.test(blob)) {
    findings.push({ severity: 'medium', rule: 'prompt-injection', message: 'Prompt-injection style language detected' });
  }
  for (const marker of COPY_MARKERS) {
    if (blob.toLowerCase().includes(marker.toLowerCase()) && !blob.includes('inspiration') && !blob.includes('complement')) {
      findings.push({
        severity: 'medium',
        rule: 'third-party-marker',
        message: `References ${marker} outside an inspiration/complement context`
      });
    }
  }
  const caps = loaded.sidecar?.capabilities;
  if (caps?.exec?.allowed === true && (!caps.exec.commands || caps.exec.commands.length === 0)) {
    findings.push({ severity: 'high', rule: 'exec-without-allowlist', message: 'exec.allowed true without command allowlist' });
  }
  if (caps?.network?.allowed === true && (!caps.network.hosts || caps.network.hosts.length === 0) && !caps.network.searchAllowed) {
    findings.push({ severity: 'medium', rule: 'network-without-hosts', message: 'network.allowed true without hosts or searchAllowed' });
  }
  if (!loaded.sidecar?.routing?.pack) {
    findings.push({ severity: 'low', rule: 'missing-pack', message: 'routing.pack not set' });
  }

  const blocking = findings.filter((f) => f.severity === 'high');
  return {
    name: loaded.name,
    ok: blocking.length === 0,
    findings,
    note: 'SkillShield is a skill-body scanner (best-effort); not a full security audit.'
  };
}

export async function runSkillShieldMany(skillDirs, options = {}) {
  const reports = [];
  for (const dir of skillDirs) {
    reports.push(await runSkillShield(dir, options));
  }
  return {
    ok: reports.every((r) => r.ok),
    reports
  };
}
