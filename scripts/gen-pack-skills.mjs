#!/usr/bin/env node
/**
 * Materialize SkillsForge catalog packs, skills, agents, and commands
 * from scripts/pack-inventory.mjs. Original bodies only — no third-party copies.
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKS, PROFILES, AGENTS, COMMANDS, allSkills, assertInventoryCounts } from './pack-inventory.mjs';
import { buildScaffoldFiles } from '../lib/capabilities/scaffold.mjs';
import { assertSkillId } from '../lib/capabilities/paths.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(root, 'plugins', 'skillsforge', 'skills');
const agentsRoot = join(root, 'plugins', 'skillsforge', 'agents');
const commandsRoot = join(root, 'plugins', 'skillsforge', 'commands');
const rulesRoot = join(root, 'plugins', 'skillsforge', 'rules');

const TRUST_EXISTING = new Set([
  'using-skillsforge',
  'author-capability',
  'route-capability',
  'validate-agent-skill',
  'verify-capability'
]);

function humanize(id) {
  return id.replace(/-/g, ' ');
}

function descriptionFor(skill) {
  const topic = humanize(skill.id);
  return `Use when doing ${topic} work and you need bounded ${skill.pack}-pack steps, stop conditions, and a verification check before shipping.`;
}

function triggersFor(skill) {
  const h = humanize(skill.id);
  return [
    h,
    `run ${h}`,
    `${h} skill`,
    `help with ${h}`,
    `${skill.pack} ${h}`
  ];
}

function antiFor(skill) {
  return ['install skillsforge plugin', 'unrelated coding task', 'write application code only'];
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

function isGeneratedScaffold(source) {
  return Boolean(source)
    && source.includes('## Pressure stub')
    && (source.includes('Deliver a trustworthy, repeatable outcome for')
      || source.includes('Lean SkillsForge scaffold for')
      || source.includes('Original SkillsForge skill for'));
}

function shouldSyncThinAgent(source) {
  return !source || source.includes('Thin SkillsForge role agent.');
}

function shouldSyncGeneratedCommand(source) {
  return !source || (source.includes('Run the SkillsForge')
    && (source.includes('skillsforge.mjs') || source.includes('route --query')));
}

const NATIVE_COMMANDS = new Set([
  'vibe', 'catalog', 'quality', 'lint-skill', 'bench', 'compose', 'watch', 'scorecard',
  'scaffold', 'stocktake', 'batch', 'compare', 'pressure', 'skillshield', 'export-agents',
  'capture', 'forge-from-capture', 'doctor', 'validate', 'route', 'forge', 'receipt',
  'verify-receipt', 'enforce', 'eval', 'install', 'package', 'evidence', 'demo',
  'compare-skill', 'os-run', 'os-open', 'os-find', 'os-ports', 'os-env', 'os-copy-path',
  'os-clean', 'wb', 'lib', 'workflows', 'auto', 'ps'
]);

function commandInvocation(name) {
  if (name === 'prove' || name === 'work-proof') return 'evidence --out artifacts/evidence';
  if (NATIVE_COMMANDS.has(name)) return `${name} $ARGUMENTS`;
  return `route --query "${name} $ARGUMENTS"`;
}

async function writeCatalogYaml() {
  const packsYaml = Object.entries(PACKS).map(([id, pack]) => {
    const skills = pack.skills.map((s) => `    - ${s.id}`).join('\n');
    return `  ${id}:\n    description: ${JSON.stringify(pack.description)}\n    skills:\n${skills}`;
  }).join('\n');
  const profilesYaml = Object.entries(PROFILES).map(([id, profile]) => {
    const packs = profile.packs.map((p) => `    - ${p}`).join('\n');
    return `  ${id}:\n    description: ${JSON.stringify(profile.description)}\n    packs:\n${packs}`;
  }).join('\n');
  const yaml = `schemaVersion: 1\npacks:\n${packsYaml}\nprofiles:\n${profilesYaml}\n`;
  await mkdir(join(root, 'catalog'), { recursive: true });
  await writeFile(join(root, 'catalog', 'skillsforge.catalog.yaml'), yaml);
}

async function patchExistingTrustSidecar(skill) {
  const path = join(skillsRoot, skill.id, 'skillsforge.json');
  const sidecar = JSON.parse(await readFile(path, 'utf8'));
  sidecar.routing = {
    ...sidecar.routing,
    mode: skill.mode ?? 'auto',
    pack: skill.pack
  };
  await writeFile(path, `${JSON.stringify(sidecar, null, 2)}\n`);
}

async function writeSkill(skill) {
  assertSkillId(skill.id);
  const target = join(skillsRoot, skill.id);
  const sidecarPath = join(target, 'skillsforge.json');
  const skillPath = join(target, 'SKILL.md');
  const existingSkill = await readTextIfExists(skillPath);
  if (await pathExists(sidecarPath)) {
    if (!isGeneratedScaffold(existingSkill)) {
      // Never overwrite hero/custom bodies -- only sync routing.mode + pack.
      await patchExistingTrustSidecar(skill);
      return { id: skill.id, action: 'patched' };
    }
  }
  if (TRUST_EXISTING.has(skill.id)) {
    await patchExistingTrustSidecar(skill);
    return { id: skill.id, action: 'patched' };
  }
  const files = buildScaffoldFiles({
    name: skill.id,
    pack: skill.pack,
    mode: skill.mode,
    write: skill.write,
    description: descriptionFor(skill),
    triggers: triggersFor(skill),
    antiTriggers: antiFor(skill),
    overview: `Lean SkillsForge scaffold for ${humanize(skill.id)} (${skill.pack} pack). Add domain examples and verification before calling it production-depth.`,
    whenToUse: [`Need ${humanize(skill.id)} with trusted SkillsForge artifacts`]
  });
  await mkdir(join(target, 'agents'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    await writeFile(join(target, rel), content);
  }
  if (skill.pack === 'methodology' || skill.mode === 'auto') {
    await mkdir(join(target, 'pressure'), { recursive: true });
    await writeFile(join(target, 'pressure', 'baseline.json'), `${JSON.stringify({
      name: 'baseline-skip',
      baselineViolations: ['skipped-verification', 'rationalized-shortcut'],
      expectedCompliance: ['follow-phases', 'write-exit-criteria', 'no-rationalize']
    }, null, 2)}\n`);
  }
  return { id: skill.id, action: existingSkill ? 'synced' : 'created' };
}

async function writeAgents() {
  await mkdir(agentsRoot, { recursive: true });
  for (const name of AGENTS) {
    const path = join(agentsRoot, `${name}.md`);
    const existing = await readTextIfExists(path);
    if (!shouldSyncThinAgent(existing)) continue; // preserve playbook upgrades
    const content = `---
name: ${name}
description: Use when you need a ${humanize(name)} agent that invokes SkillsForge skills and CLI.
maturity: experimental
---

# ${humanize(name)}

Thin SkillsForge role agent. Load only the matched skill and CLI output needed for the task.

## Instructions

1. Clarify the goal.
2. \`skillsforge route --query "<goal>"\` or \`skillsforge catalog --pack <pack>\`.
3. Invoke the matched skill; write artifacts under \`docs/work/\`.
4. Finish with \`skillsforge evidence --out artifacts/evidence\` or \`skillsforge verify-receipt\` when shipping.

## Tools

- skillsforge vibe|catalog|quality|route|validate|pressure|skillshield|capture|evidence|verify-receipt
`;
    await writeFile(path, content);
  }
}

async function writeCommands() {
  await mkdir(commandsRoot, { recursive: true });
  for (const name of COMMANDS) {
    const path = join(commandsRoot, `${name}.md`);
    const existing = await readTextIfExists(path);
    if (!shouldSyncGeneratedCommand(existing)) continue; // preserve upgraded slash contracts
    const content = `---
name: ${name}
description: Use when invoking SkillsForge ${name} from a slash command or host shim.
argument-hint: "[args]"
allowed-tools: "Bash(node *),Read"
---

# /${name}

<!-- generated thin command: prefer upgraded entry commands for trust-critical flows -->

Run the SkillsForge \`${name}\` workflow.

\`\`\`bash
node "\${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" ${commandInvocation(name)}
\`\`\`
`;
    await writeFile(path, content);
  }
}

async function writeRules() {
  await mkdir(rulesRoot, { recursive: true });
  await writeFile(join(rulesRoot, 'skillsforge-trust.mdc'), `---
description: Prefer SkillsForge validate/route/policy for Agent Skills trust.
globs:
alwaysApply: false
---

# SkillsForge trust

- Validate skills with \`skillsforge validate\` before packaging.
- Prefer pack-scoped routing for domain skills.
- Never invent Session IDs or credentials.
- Do not copy third-party SKILL.md bodies.
`);
  await writeFile(join(rulesRoot, 'skillsforge-vibe.mdc'), `---
description: Vibecoder quickstart via skillsforge vibe.
globs:
alwaysApply: false
---

# SkillsForge vibe

Start with \`node plugins/skillsforge/bin/skillsforge.mjs vibe\` in a clone, or \`skillsforge vibe\` after install.
`);
}

async function writeDocs() {
  await writeFile(join(root, 'docs', 'inspiration.md'), `# Inspiration (no-copy)

SkillsForge learns from ecosystems without copying skill bodies:

| Source | What we learn | What we refuse |
|---|---|---|
| Everything Claude Code | Surface completeness, profiles, cross-harness | Copying skill text |
| Superpowers | Discipline / TDD iron laws | Copying skill text |
| gstack | Role lenses, ship/QA | Cloning binaries / browse daemon |
| Matt Pocock skills | Composition | Personal dump |
| Addy Osmani agent-skills | SDLC breadth | Marketplace clone |
| VoltAgent catalogues | Discovery | Unvalidated lists |
| Ruflo | Swarm is complementary | AgentDB / Raft / MCP swarm clone |
| skills.sh | Volume is not quality | Shipping unvalidated skills |

**Rule:** Original SKILL.md + skillsforge.json only. Attribute ideas here; never paste foreign skill bodies.
`);
  await writeFile(join(root, 'docs', 'skill-authoring.md'), `# Skill authoring (TDD for skills)

**Iron law:** No discipline skill without a failing pressure fixture first.

1. Write \`pressure/baseline.json\` with expected baseline violations.
2. Scaffold with \`skillsforge scaffold --name <id> --pack <pack>\`.
3. Run \`skillsforge pressure --skill <dir>\`.
4. Run \`skillsforge quality --skill <dir>\`. Quality score is a lint gate, not proof of production depth.
5. CSO: description starts with \`Use when...\` and does not summarize workflow.

See Superpowers writing-skills for the methodology inspiration (original SkillsForge text only).
`);
  await writeFile(join(root, 'docs', 'competitive-matrix.md'), `# Claim boundaries

Do not publish competitor counts or "weak/no/rare" claims without dated sources and reproduction notes.

Current local facts only:

- SkillsForge catalog entries come from \`catalog/skillsforge.catalog.yaml\`.
- Skill sidecars are checked by \`skillsforge validate --all\`.
- Routing metrics are corpus-bound to \`evaluation/routing-holdout.json\`.
- Quality scores are lint signals, not independent proof of production depth.
`);
  await writeFile(join(root, 'docs', 'work-os.md'), `# SkillsForge Work OS

Six pillars: Catalog OS, Vibe CLI, Authoring Factory, Cross-Harness, SkillShield+Evidence, Capture→Forge.

Magical moment:

\`\`\`bash
npm ci
node plugins/skillsforge/bin/skillsforge.mjs vibe
\`\`\`
`);
}

async function main() {
  const counts = assertInventoryCounts();
  console.log(JSON.stringify({ phase: 'inventory', ...counts }, null, 2));
  if (counts.skills < 350) throw new Error(`need ≥350 skills, got ${counts.skills}`);
  if (counts.agents < 70) throw new Error(`need ≥70 agents, got ${counts.agents}`);
  if (counts.commands < 100) throw new Error(`need ≥100 commands, got ${counts.commands}`);

  await writeCatalogYaml();
  const results = [];
  for (const skill of allSkills()) {
    results.push(await writeSkill(skill));
  }
  await writeAgents();
  await writeCommands();
  await writeRules();
  await writeDocs();

  const created = results.filter((r) => r.action === 'created').length;
  const patched = results.filter((r) => r.action === 'patched').length;
  const synced = results.filter((r) => r.action === 'synced').length;
  console.log(JSON.stringify({
    ok: true,
    skills: counts.skills,
    created,
    patched,
    synced,
    agents: counts.agents,
    commands: counts.commands,
    packs: counts.packs
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
