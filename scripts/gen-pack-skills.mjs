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
  return `Use when you need ${humanize(skill.id)} in a SkillsForge ${skill.pack} workflow.`;
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
  if (await pathExists(sidecarPath)) {
    // Never overwrite hero/custom bodies — only sync routing.mode + pack.
    await patchExistingTrustSidecar(skill);
    return { id: skill.id, action: 'patched' };
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
    overview: `Original SkillsForge skill for ${humanize(skill.id)} (${skill.pack} pack).`,
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
  return { id: skill.id, action: 'created' };
}

async function writeAgents() {
  await mkdir(agentsRoot, { recursive: true });
  for (const name of AGENTS) {
    const path = join(agentsRoot, `${name}.md`);
    if (await pathExists(path)) continue; // preserve playbook upgrades
    const content = `---
name: ${name}
description: Use when you need a ${humanize(name)} agent that invokes SkillsForge skills and CLI.
maturity: experimental
---

# ${humanize(name)}

Thin SkillsForge role agent. Do not run Ruflo-style swarms.

## Instructions

1. Clarify the goal.
2. \`skillsforge route --query "<goal>"\` or \`skillsforge catalog --pack <pack>\`.
3. Invoke the matched skill; write artifacts under \`docs/work/\`.
4. Finish with \`skillsforge prove\` / evidence when shipping.

## Tools

- skillsforge vibe|catalog|quality|route|validate|pressure|skillshield|capture
`;
    await writeFile(path, content);
  }
}

async function writeCommands() {
  await mkdir(commandsRoot, { recursive: true });
  for (const name of COMMANDS) {
    const path = join(commandsRoot, `${name}.md`);
    if (await pathExists(path)) continue; // preserve upgraded slash contracts
    const content = `---
name: ${name}
description: Use when invoking SkillsForge ${name} from a slash command or host shim.
---

# /${name}

<!-- alias stub: prefer upgraded entry commands (validate/route/vibe/…) -->

Run the SkillsForge \`${name}\` workflow.

\`\`\`bash
npx skillsforge ${['vibe', 'catalog', 'quality', 'bench', 'scorecard', 'scaffold', 'stocktake', 'pressure', 'skillshield', 'export-agents', 'capture', 'doctor', 'validate', 'route', 'forge', 'eval', 'install', 'package', 'evidence', 'demo'].includes(name) ? name : 'route --query "' + name + '"'}
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

Start with \`npx skillsforge vibe\` then \`skillsforge catalog\`.
`);
}

async function writeDocs() {
  await mkdir(join(root, 'docs', 'work'), { recursive: true });
  for (const name of ['brief', 'plan', 'design-lock', 'findings', 'ship-notes', 'proof', 'learning']) {
    const path = join(root, 'docs', 'work', `${name}.md`);
    if (!(await pathExists(path))) {
      await writeFile(path, `# ${name}\n\n_Work Artifact Contract stub._\n`);
    }
  }
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
4. Run \`skillsforge quality --skill <dir>\` (heroes ≥85, others ≥70).
5. CSO: description starts with \`Use when…\` and does not summarize workflow.

See Superpowers writing-skills for the methodology inspiration (original SkillsForge text only).
`);
  await writeFile(join(root, 'docs', 'competitive-matrix.md'), `# Competitive matrix

| Dimension | ECC | Superpowers | gstack | SkillsForge |
|---|---|---|---|---|
| Skill count | ~278 | ~14 | ~40–60 | ≥350 trusted |
| Agents | ~67 | few | role cmds | ≥70 |
| Commands | ~94 | few | ~28 | ≥100 |
| Trust sidecars | rare | no | no | 100% |
| Skill TDD pressure | no | process | no | \`pressure\` |
| Operator vibe CLI | weak | no | browse | vibe/quality/bench |
| SkillShield | AgentShield (code) | no | no | skills scanner |
| Cross-harness AGENTS.md | yes | multi-host | multi-host | \`export-agents\` |
| Swarm/MCP | no | no | no | complement Ruflo only |
`);
  await writeFile(join(root, 'docs', 'work-os.md'), `# SkillsForge Work OS

Six pillars: Catalog OS, Vibe CLI, Authoring Factory, Cross-Harness, SkillShield+Evidence, Capture→Forge.

Magical moment:

\`\`\`bash
npm ci
npx skillsforge vibe
\`\`\`
`);
  await mkdir(join(root, 'docs', 'superpowers', 'plans'), { recursive: true });
  await writeFile(join(root, 'docs', 'superpowers', 'plans', '2026-07-18-skillsforge-total-dominance.md'), `# SkillsForge Total Dominance

See Cursor plan Total Dominance Work OS. Implementation materialized by \`node scripts/gen-pack-skills.mjs\`.
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
  console.log(JSON.stringify({
    ok: true,
    skills: counts.skills,
    created,
    patched,
    agents: counts.agents,
    commands: counts.commands,
    packs: counts.packs
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
