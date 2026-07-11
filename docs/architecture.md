# Architecture

SkillsForge treats the Agent Skills specification as its portable core. Platform profiles may add recognized fields, but they must not change the meaning of core metadata.

## Current boundary

The 0.1 implementation contains:

- JSON Schemas for portable skills, Claude Code extensions, plugin metadata, and marketplace metadata;
- a YAML and resource validator under `scripts/`;
- a generated, dependency-free runtime command under `bin/`;
- a Claude Code skill that invokes that command;
- tests and release gates.

The generated command is committed so marketplace installations do not need to install npm dependencies. `npm run build:check` prevents source and bundle drift.

## Extension rule

Portable metadata belongs in standard fields. SkillsForge-specific values belong under `metadata` until a versioned extension contract exists. Platform-only fields require an explicit validation profile.

## Future components

Forge, routing, adapters, synchronization, and orchestration will be added as vertical slices. A component is public only after it has a working command, failure behavior, tests, and an installation smoke test.
