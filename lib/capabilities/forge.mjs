import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { validateWithSchema } from '../../scripts/schema-lib.mjs';
import { schemas } from '../../scripts/schemas.generated.mjs';
import { validateSkillPath } from '../../scripts/validate-skill-lib.mjs';
import { loadSkill } from './skill-loader.mjs';
import { scanSkill } from './policy.mjs';

const forgeSchema = schemas['forge-spec'];

export async function forgeSkill(spec, options = {}) {
  const schemaResult = await validateWithSchema(forgeSchema, spec);
  if (!schemaResult.valid) {
    return { ok: false, errors: schemaResult.errors.map((error) => `forge-spec ${error}`), files: [] };
  }

  const outRoot = resolve(options.outRoot ?? join(process.cwd(), 'plugins', 'skillsforge', 'skills'));
  const target = join(outRoot, spec.name);
  const skillMarkdown = renderSkillMarkdown(spec);
  const sidecar = renderSidecar(spec);
  const files = [
    { path: 'SKILL.md', content: skillMarkdown },
    { path: 'skillsforge.json', content: `${JSON.stringify(sidecar, null, 2)}\n` }
  ];

  if (options.dryRun !== false && options.write !== true) {
    return { ok: true, dryRun: true, target, files, errors: [] };
  }

  if (!options.force) {
    try {
      await access(target);
      return { ok: false, errors: [`refusing to overwrite existing skill without --force: ${target}`], files };
    } catch {
      // ok
    }
  }

  const stagingRoot = `${target}.staging-${process.pid}`;
  const staging = join(stagingRoot, spec.name);
  await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  await mkdir(staging, { recursive: true });
  for (const file of files) {
    const absolute = join(staging, file.path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, file.content);
  }

  const validation = await validateSkillPath(staging, { root: process.cwd() });
  if (validation.status !== 'pass') {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    return { ok: false, errors: validation.errors, files };
  }

  const loaded = await loadSkill(staging);
  const findings = await scanSkill({
    ...loaded,
    files: loaded.files.filter((file) => file !== loaded.sidecarFile)
  });
  const blocking = findings.filter((item) => item.blocking);
  if (blocking.length > 0) {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    return { ok: false, errors: blocking.map((item) => `${item.rule}: ${item.evidence.join(', ')}`), files, findings };
  }

  await rm(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  await mkdir(dirname(target), { recursive: true });
  await rename(staging, target);
  await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  return { ok: true, dryRun: false, target, files, findings, errors: [] };
}

function renderSkillMarkdown(spec) {
  const when = (spec.whenToUse ?? []).map((item) => `- ${item}`).join('\n') || '- Use when the forge spec matches the task.';
  return `---
name: ${spec.name}
description: ${spec.description}
license: ${spec.provenance?.license ?? 'MIT'}
---

# ${spec.name}

## Overview

${spec.overview}

## When to Use

${when}
`;
}

function renderSidecar(spec) {
  return {
    schemaVersion: 1,
    maturity: spec.maturity ?? 'experimental',
    requires: spec.requires ?? [],
    routing: {
      triggers: spec.routing.triggers,
      antiTriggers: spec.routing.antiTriggers ?? [],
      ...(spec.routing.mode ? { mode: spec.routing.mode } : {}),
      ...(spec.routing.pack ? { pack: spec.routing.pack } : {})
    },
    capabilities: {
      exec: {
        allowed: Boolean(spec.capabilities.exec?.allowed),
        commands: spec.capabilities.exec?.commands ?? []
      },
      network: {
        allowed: Boolean(spec.capabilities.network?.allowed),
        hosts: spec.capabilities.network?.hosts ?? []
      },
      write: {
        scope: spec.capabilities.write?.scope ?? 'skill'
      }
    },
    compatibility: spec.compatibility ?? {
      'claude-code': 'full',
      cursor: 'partial'
    },
    provenance: spec.provenance ?? {
      source: 'forge',
      license: 'MIT'
    }
  };
}
