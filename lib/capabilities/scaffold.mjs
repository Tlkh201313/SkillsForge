import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { assertSkillId, isInside } from './paths.mjs';

function titleCase(id) {
  return id.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function buildScaffoldFiles(spec) {
  const name = spec.name;
  const pack = spec.pack ?? 'eng';
  const mode = spec.mode ?? 'explicit';
  const description = spec.description
    ?? `Use when you need ${name.replace(/-/g, ' ')} guidance in a SkillsForge workflow.`;
  const triggers = spec.triggers ?? [
    name.replace(/-/g, ' '),
    `run ${name.replace(/-/g, ' ')}`,
    `${name.replace(/-/g, ' ')} skill`,
    `help with ${name.replace(/-/g, ' ')}`
  ];
  const antiTriggers = spec.antiTriggers ?? ['unrelated coding task', 'install skillsforge'];
  const writeScope = spec.write ?? 'project';
  const title = titleCase(name);
  const allowImplicitInvocation = mode !== 'explicit';

  const skillMd = `---
name: ${name}
description: ${description}
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "\${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "\${CLAUDE_PLUGIN_ROOT}/skills/${name}/skillsforge.json"
---

# ${title}

## Overview

${spec.overview ?? `Lean SkillsForge scaffold for ${title}. Use it as a routed starting point; extend with domain-specific examples, edge cases, and verification before claiming production depth.`}

## Purpose

Deliver a trustworthy, repeatable outcome for ${title} without copying third-party skill bodies or overstating this scaffold's depth.

## When to Use

- ${description}
${(spec.whenToUse ?? []).map((item) => `- ${item}`).join('\n')}

## Phases

1. Clarify the goal and constraints.
2. Gather evidence from the repo or user.
3. Produce the artifact under docs/work/ or the stated path.
4. Verify against the exit criteria below.

## Exit

- Concrete artifact written (or explicit skip with reason)
- Risks and open questions listed
- Next SkillsForge skill or CLI command recommended

## Anti-patterns

- Skipping verification
- Inventing credentials or Session IDs
- Copying third-party SKILL.md text

## Handoff

Recommend \`skillsforge route --pack ${pack}\` or the next lifecycle skill. Capture learnings with \`skillsforge capture\`.

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## Pressure stub

See \`pressure/\` fixtures when this is a discipline skill.
`;

  const sidecar = {
    schemaVersion: 1,
    maturity: spec.maturity ?? 'experimental',
    requires: spec.requires ?? [],
    routing: {
      triggers,
      antiTriggers,
      mode,
      pack
    },
    capabilities: {
      exec: { allowed: false, commands: [] },
      network: { allowed: false, hosts: [] },
      write: { scope: writeScope }
    },
    compatibility: {
      'claude-code': 'full',
      cursor: 'partial',
      codex: 'full'
    },
    provenance: {
      source: 'original',
      license: 'MIT'
    }
  };

  const openai = `interface:
  display_name: ${title}
  short_description: ${description.replace(/\n/g, ' ').slice(0, 200)}
  default_prompt: Use the ${name} skill for this task.
policy:
  allow_implicit_invocation: ${allowImplicitInvocation ? 'true' : 'false'}
`;

  return {
    'SKILL.md': skillMd,
    'skillsforge.json': `${JSON.stringify(sidecar, null, 2)}\n`,
    'agents/openai.yaml': openai
  };
}

export async function scaffoldSkill(root, spec, options = {}) {
  let name;
  try {
    name = assertSkillId(spec.name);
  } catch (error) {
    return { ok: false, error: error.message, target: null };
  }

  const repoRoot = resolve(root);
  const defaultOut = join(repoRoot, 'plugins', 'skillsforge', 'skills');
  const outRoot = resolve(options.outRoot ?? defaultOut);
  if (!isInside(repoRoot, outRoot) && outRoot !== repoRoot) {
    return { ok: false, error: `outRoot escapes repository root: ${outRoot}`, target: null };
  }

  const target = join(outRoot, name);
  if (!isInside(repoRoot, target)) {
    return { ok: false, error: `refusing to write outside repository root: ${target}`, target };
  }

  if (!options.force) {
    try {
      await access(target);
      return { ok: false, error: `refusing to overwrite existing skill without force: ${target}`, target };
    } catch {
      // ok
    }
  }

  const files = buildScaffoldFiles({ ...spec, name });
  if (options.dryRun) {
    return { ok: true, dryRun: true, target, files };
  }

  await mkdir(join(target, 'agents'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(target, rel);
    if (!isInside(target, abs) && abs !== join(target, '')) {
      // rel must stay under target
      if (!isInside(target, abs)) {
        return { ok: false, error: `refusing nested escape: ${rel}`, target };
      }
    }
    await writeFile(abs, content);
  }
  return { ok: true, dryRun: false, target, files: Object.keys(files) };
}
