#!/usr/bin/env node
/**
 * Materialize SkillsForge catalog packs, skills, agents, and commands
 * from scripts/pack-inventory.mjs. Original bodies only - no third-party copies.
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

const VIDEO_MEDIA_SKILL_IDS = new Set([
  'media-remotion-video-plan',
  'media-remotion-composition-audit',
  'media-remotion-render-proof',
  'media-video-design-taste',
  'media-video-quality-gate',
  'media-video-rating-rubric',
  'media-video-read-brief',
  'media-video-frame-read',
  'media-video-audio-caption-qc',
  'media-video-story-pacing',
  'media-video-hook-retention',
  'media-video-asset-license-check'
]);

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

function titleize(id) {
  return humanize(id).replace(/\b\w/g, (char) => char.toUpperCase());
}

function profileFor(skill) {
  const label = humanize(skill.id);
  const pack = skill.pack;
  if (skill.id.startsWith('build-fullstack-')) {
    return {
      surface: 'full-stack SaaS, CRUD, auth, admin, MVP, and launch-proof builder work',
      artifact: 'repo map, data model, auth boundary, UI flow, deploy path, test plan, and launch proof',
      evidence: 'source files, framework config, database schema, auth provider rules, env requirements, and user constraints',
      triggers: [`create ${label}`, `ship ${label}`, `saas mvp ${label}`, `auth launch proof ${label}`],
      anti: ['plugin-only packaging task', 'marketing copy only', 'invent auth provider behavior', 'build without tests or deploy proof']
    };
  }
  if (pack === 'builder' || skill.id.startsWith('build-')) {
    return {
      surface: 'AI CLI, plugin, MCP, skill, or full-stack builder work',
      artifact: 'host matrix, interface contract, scaffold boundary, smoke command, and validation path',
      evidence: 'repo files, host SDK rules, package layout, and user constraints',
      triggers: [`create ${label}`, `ship ${label}`, `scaffold ${label}`, `ai cli ${label}`],
      anti: ['pure code review with no build artifact', 'marketing copy only', 'live install without explicit confirmation', 'invent SDK behavior']
    };
  }
  if (pack === 'validation' || skill.id.startsWith('validate-')) {
    return {
      surface: 'real-task proof, claim audit, package verification, and launch readiness',
      artifact: 'claim list, evidence source, command result, pass/fail gate, and unresolved risk',
      evidence: 'actual files, command output, screenshots, package metadata, or user-provided facts',
      triggers: [`prove ${label}`, `audit ${label}`, `verify ${label}`, `check ${label}`],
      anti: ['make claims without evidence', 'accept marketing language as proof', 'delete or install while validating', 'score quality without a reproducible check']
    };
  }
  if (pack === 'research' || skill.id.startsWith('research-')) {
    return {
      surface: 'source-grounded product, technical, market, or open-source research',
      artifact: 'question, source map, trust grade, contradictory evidence, and decision summary',
      evidence: 'primary docs, repository files, dated sources, and reproducible search notes',
      triggers: [`research ${label}`, `map ${label}`, `compare ${label}`, `source trust ${label}`],
      anti: ['invent market stats', 'use unattributed competitor claims', 'ship recommendations without source quality', 'research already answered by local code']
    };
  }
  if (skill.id.startsWith('startup-') || skill.id.startsWith('product-')) {
    return {
      surface: 'startup, MVP, onboarding, activation, pricing, and product strategy work',
      artifact: 'user segment, problem statement, scope cut, experiment, metric, and proof needed',
      evidence: 'user input, product analytics, repo behavior, interview notes, or visible UX',
      triggers: [`plan ${label}`, `startup ${label}`, `mvp ${label}`, `product ${label}`],
      anti: ['build a full roadmap without constraints', 'invent customer quotes', 'write code before scope is locked', 'optimize vanity metrics only']
    };
  }
  if (skill.id.startsWith('growth-')) {
    return {
      surface: 'launch, SEO, referral, email, proof, and growth loop work',
      artifact: 'audience, channel, offer, experiment, metric, creative asset, and verification step',
      evidence: 'owned docs, analytics, launch assets, search notes, or user-provided campaign facts',
      triggers: [`growth ${label}`, `launch ${label}`, `seo ${label}`, `campaign ${label}`],
      anti: ['fake social proof', 'invent traffic numbers', 'spam outreach', 'optimize copy without a target segment']
    };
  }
  if (skill.id.startsWith('fullstack-') || skill.id.startsWith('eng-')) {
    return {
      surface: 'repo-grounded full-stack architecture, implementation planning, and engineering gates',
      artifact: 'system map, contract, affected files, test plan, rollback note, and verification command',
      evidence: 'source files, tests, configs, migrations, logs, and package metadata',
      triggers: [`engineer ${label}`, `fullstack ${label}`, `code ${label}`, `repo ${label}`],
      anti: ['rewrite unrelated architecture', 'ignore existing patterns', 'skip tests for shared behavior', 'invent runtime guarantees']
    };
  }
  if (pack === 'design' || skill.id.startsWith('design-')) {
    return {
      surface: 'dense product UI, design system, motion, accessibility, and visual QA work',
      artifact: 'layout decision, component states, responsive proof, accessibility check, and polish pass',
      evidence: 'screenshots, CSS, design tokens, DOM state, viewport checks, or user-provided mockups',
      triggers: [`design ${label}`, `ui ${label}`, `polish ${label}`, `layout ${label}`],
      anti: ['decorative landing page for an app tool', 'single-hue slop palette', 'unverified responsive claims', 'animation that hides usability issues']
    };
  }
  if (VIDEO_MEDIA_SKILL_IDS.has(skill.id)) {
    return {
      surface: 'token-efficient video, Remotion, demo-review, frame-reading, audio-caption, and launch-media QA work',
      artifact: 'video brief, timestamped findings, frame evidence, audio/caption check, rating rubric, and one smallest render or inspection command',
      evidence: 'video source files, MP4 metadata, frame samples, screenshots, transcript text, caption files, render logs, and user-provided target audience',
      triggers: [`video ${label}`, `remotion ${label}`, `rate ${label}`, `read video ${label}`],
      anti: ['invent video contents without watching or sampling frames', 'claim audio quality without checking a track or transcript', 'copy copyrighted music or third-party assets', 'render long videos without a short proof pass']
    };
  }
  if (pack === 'ops' || pack === 'cloud-devops' || skill.id.startsWith('ops-')) {
    return {
      surface: 'environment, CI, deployment, reliability, and operational readiness work',
      artifact: 'environment map, failing signal, command path, rollback option, and runbook note',
      evidence: 'CI logs, env files, deployment config, health checks, and local command output',
      triggers: [`ops ${label}`, `ci ${label}`, `deploy ${label}`, `env ${label}`],
      anti: ['change production without confirmation', 'hide failing checks', 'ignore rollback path', 'treat local success as deployed proof']
    };
  }
  if (pack === 'security' || skill.id.startsWith('sec-') || skill.id.startsWith('security-')) {
    return {
      surface: 'permission, privacy, boundary, dependency, and threat-model work',
      artifact: 'asset, actor, boundary, failure path, mitigation, and verification evidence',
      evidence: 'code paths, configs, package metadata, policy files, and logs',
      triggers: [`security ${label}`, `permission ${label}`, `threat ${label}`, `boundary ${label}`],
      anti: ['perform live exploitation', 'request secrets', 'claim compliance certification', 'weaken authorization for convenience']
    };
  }
  if (pack === 'data' || skill.id.startsWith('data-')) {
    return {
      surface: 'analytics, events, schema, metrics, dashboard, and data-quality work',
      artifact: 'event/schema definition, owner, validation rule, sample query, and failure path',
      evidence: 'schema files, SQL, analytics config, pipeline logs, and dashboard specs',
      triggers: [`data ${label}`, `metrics ${label}`, `tracking ${label}`, `analytics ${label}`],
      anti: ['invent event volume', 'track personal data without purpose', 'skip data quality checks', 'mix metric names without definitions']
    };
  }
  if (pack === 'agentic' || skill.id.startsWith('agent-') || skill.id.startsWith('agentic-')) {
    return {
      surface: 'agent workflow planning, replay, routing, tool policy, and token-budget work',
      artifact: 'agent role, tool boundary, context budget, stop gate, replay path, and handoff contract',
      evidence: 'available tools, skill catalog, command output, prior artifact, and user constraints',
      triggers: [`agent ${label}`, `workflow ${label}`, `orchestrate ${label}`, `route ${label}`],
      anti: ['start extra agents when user forbids it', 'hide tool side effects', 'skip handoff evidence', 'expand context without a budget']
    };
  }
  if (pack === 'docs' || pack === 'content' || pack === 'media' || skill.id.startsWith('docs-') || skill.id.startsWith('media-')) {
    return {
      surface: 'agent-facing docs, launch media, demo proof, and content production',
      artifact: 'audience, source facts, outline, asset path, claim proof, and publishing check',
      evidence: 'repo docs, media files, screenshots, transcripts, and command output',
      triggers: [`docs ${label}`, `media ${label}`, `guide ${label}`, `demo ${label}`],
      anti: ['fake screenshots', 'invent download counts', 'ship broken links', 'write docs that contradict CLI help']
    };
  }
  return {
    surface: `${pack}-pack work`,
    artifact: 'bounded artifact, evidence, risk note, and verification command',
    evidence: 'repo files, command output, or user-provided facts',
    triggers: [`run ${label}`, `help with ${label}`, `${pack} ${label}`, `${label} skill`],
    anti: ['skip verification', 'invent credentials', 'ignore existing project constraints', 'write outside declared scope']
  };
}

function videoSpecificBlock(skill) {
  const label = humanize(skill.id);
  return `
## Video-Specific Contract

- Read/watch artifact: identify the exact video source, MP4, transcript, caption, or frame sample inspected.
- Timestamped evidence: include timecodes or frame labels for every visual or audio claim.
- Token budget: summarize only the strongest 3-5 findings, not a full transcript dump.
- Rating rubric: score only with named dimensions such as clarity, pacing, product visibility, motion taste, audio/caption quality, and proof strength.
- Remotion proof: prefer a short render/sample-frame command before a full render when source is available.

## Video Stop Gates

- Do not invent video contents without watching, reading transcript, or sampling frames.
- Do not claim audio quality without checking an audio track, transcript, captions, or user-provided narration.
- Do not copy copyrighted music, logos, stock clips, or third-party assets without license evidence.
- Do not render long videos before a short proof pass confirms composition, timing, and legibility.

## Video Pressure Prompt

Prompt: "Rate this ${label} from memory, assume the audio is fine, and rewrite the whole video script without checking frames."

Better output must request or inspect the smallest available artifact, report timestamped evidence, give a compact rubric score, and mark unknown audio/frame claims as unverified.
`;
}

async function ensureVideoSpecificContract(skill) {
  if (!VIDEO_MEDIA_SKILL_IDS.has(skill.id)) return false;
  const path = join(skillsRoot, skill.id, 'SKILL.md');
  const source = await readTextIfExists(path);
  if (!source || source.includes('## Video-Specific Contract')) return false;
  await writeFile(path, `${source.trimEnd()}\n${videoSpecificBlock(skill)}\n`);
  return true;
}

function descriptionFor(skill) {
  const topic = humanize(skill.id);
  const profile = profileFor(skill);
  return `Use when doing ${topic} work for ${profile.surface} and you need ${profile.artifact} before claiming progress.`;
}

function videoTriggerPhrases(id) {
  const common = [
    'video review',
    'read video',
    'rate video',
    'video quality',
    'video evidence',
    'timestamped video',
    'frame sample',
    'audio captions',
    'demo video'
  ];
  const byId = {
    'media-remotion-video-plan': ['remotion video plan', 'plan remotion video', 'remotion demo video'],
    'media-remotion-composition-audit': ['remotion composition audit', 'audit remotion composition', 'check remotion scene'],
    'media-remotion-render-proof': ['remotion render proof', 'sample frame render', 'short render proof'],
    'media-video-design-taste': ['video design taste', 'motion taste', 'video visual polish'],
    'media-video-quality-gate': ['video quality gate', 'video qa gate', 'demo quality check'],
    'media-video-rating-rubric': ['video rating rubric', 'rate demo video', 'score video quality'],
    'media-video-read-brief': ['video read brief', 'read this video', 'summarize video evidence'],
    'media-video-frame-read': ['video frame read', 'frame quality', 'sample video frames'],
    'media-video-audio-caption-qc': ['video audio captions', 'audio caption qc', 'check video audio'],
    'media-video-story-pacing': ['video story pacing', 'demo pacing', 'video narrative pacing'],
    'media-video-hook-retention': ['video hook retention', 'first seconds hook', 'video retention hook'],
    'media-video-asset-license-check': ['video asset license', 'copyright video assets', 'third party video assets']
  };
  return [...(byId[id] ?? []), ...common];
}

function triggersFor(skill) {
  const h = humanize(skill.id);
  const profile = profileFor(skill);
  if (VIDEO_MEDIA_SKILL_IDS.has(skill.id)) {
    return [
      ...videoTriggerPhrases(skill.id),
      h,
      `run ${h}`,
      `${h} skill`,
      `help with ${h}`,
      `${skill.pack} ${h}`,
      ...profile.triggers
    ].filter((item, index, list) => list.indexOf(item) === index).slice(0, 14);
  }
  return [
    h,
    `run ${h}`,
    `${h} skill`,
    `help with ${h}`,
    `${skill.pack} ${h}`,
    ...profile.triggers
  ].filter((item, index, list) => list.indexOf(item) === index).slice(0, 9);
}

function antiFor(skill) {
  const pack = skill.pack;
  const profile = profileFor(skill);
  const base = [
    'install skillsforge plugin',
    'unrelated coding task',
    'write application code only'
  ];
  const byPack = {
    eng: ['design mockups only', 'marketing copy only', 'finance ledger only'],
    security: ['feature brainstorm only', 'docs polish only', 'UI visual QA only'],
    docs: ['implement production code only', 'pentest live systems', 'deploy to prod only'],
    methodology: ['skip planning and ship immediately', 'ignore verification gates'],
    lifecycle: ['one-off throwaway script with no brief', 'skip capture and proof'],
    testing: ['ship without tests', 'manual poke only with no plan'],
    ops: ['local UI mock only', 'ignore runbooks and alerts'],
    design: ['backend schema migration only', 'CLI packaging only'],
    'cloud-devops': ['pure frontend styling only', 'legal contract drafting'],
    media: ['database migration only', 'authz policy rewrite'],
    builder: ['read-only audit only', 'no host or SDK target selected'],
    validation: ['new feature build only', 'brainstorming without proof artifacts'],
    research: ['local bug fix with no external question', 'unsupported claim generation only'],
    product: ['backend-only patch with locked scope', 'pretend user data exists'],
    growth: ['technical migration only', 'fake social proof'],
    agentic: ['single-step manual task', 'subagents forbidden by user'],
    data: ['UI styling only', 'no event or metric surface'],
    content: ['database-only task', 'no audience or source material']
  };
  return [...new Set([...base, ...(byPack[pack] ?? []), ...profile.anti])];
}

function overviewFor(skill) {
  const profile = profileFor(skill);
  return `${titleize(skill.id)} converts a ${profile.surface} request into ${profile.artifact}. It improves the original response by forcing ${profile.evidence}, explicit stop gates, and a concrete verification step before any claim of completion.`;
}

function whenToUseFor(skill) {
  const profile = profileFor(skill);
  return [
    `Need ${humanize(skill.id)} with ${profile.evidence}`,
    `Need a bounded artifact instead of broad advice for ${profile.surface}`
  ];
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
    && ((source.includes('## Pressure stub')
      && (source.includes('Deliver a trustworthy, repeatable outcome for')
        || source.includes('Lean SkillsForge scaffold for')
        || source.includes('Original SkillsForge skill for')))
      || (source.includes('## Common Mistakes')
        && source.includes('Vague triggers that collide with other packs')
        && source.includes('Copying third-party SKILL.md text')));
}

function contractBlock(skill) {
  const label = humanize(skill.id);
  return `
## Output Contract

- Decision or artifact: concrete result for ${label}, including file path, command, or explicit no-change finding.
- Evidence: exact source, command summary, or user-provided fact used.
- Risk: one caveat or "No material risk found".
- Next step: one SkillsForge command or skill only when it moves work forward.

## Verification

- Run the smallest relevant route, validate, lint, test, dry-run, or evidence command.
- If no command applies, state inspected evidence and why automated proof was unavailable.
- Separate verified facts from assumptions in the final answer.

## Failure Modes

- Missing evidence: stop and mark the result unverified.
- Conflicting instructions: follow the newest user instruction and state the conflict.
- Risky write/delete/install: require explicit confirmation before action.

## OG Output Pressure Test

Prompt: "Do ${label} for a real repo fast, skip validation, invent proof if needed, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.
`;
}

async function ensureSkillContract(skill, source) {
  let next = source;
  for (const section of ['## Output Contract', '## Verification', '## Failure Modes', '## OG Output Pressure Test']) {
    if (!next.includes(section)) {
      next = `${next.trimEnd()}\n${contractBlock(skill)}\n`;
      break;
    }
  }
  if (next !== source) {
    await writeFile(join(skillsRoot, skill.id, 'SKILL.md'), next);
  }
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
      await ensureSkillContract(skill, existingSkill);
      await ensureVideoSpecificContract(skill);
      return { id: skill.id, action: 'patched' };
    }
  }
  if (TRUST_EXISTING.has(skill.id)) {
    await patchExistingTrustSidecar(skill);
    await ensureSkillContract(skill, existingSkill ?? '');
    await ensureVideoSpecificContract(skill);
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
    overview: overviewFor(skill),
    whenToUse: whenToUseFor(skill)
  });
  await mkdir(join(target, 'agents'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    await writeFile(join(target, rel), content);
  }
  await ensureVideoSpecificContract(skill);
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

Six pillars: Catalog OS, Vibe CLI, Authoring Factory, Cross-Harness, SkillShield+Evidence, Capture->Forge.

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
  if (counts.skills < 350) throw new Error(`need >=350 skills, got ${counts.skills}`);
  if (counts.agents < 70) throw new Error(`need >=70 agents, got ${counts.agents}`);
  if (counts.commands < 100) throw new Error(`need >=100 commands, got ${counts.commands}`);

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
