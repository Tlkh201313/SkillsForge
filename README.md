# SkillsForge

SkillsForge validates portable [Agent Skills](https://agentskills.io/specification) packages and Claude Code skill extensions. Version 0.1 provides one complete, usable slice: standards-aware validation distributed as a Claude Code plugin and a standalone bundled command.

## What works

- Canonical Agent Skills frontmatter validation.
- An explicit `claude-code` profile for supported Claude extensions.
- Real YAML parsing, including CRLF, BOM, multiline values, comments, and duplicate-key diagnostics.
- Skill naming, non-empty instruction body, and local Markdown resource validation.
- Separator-aware and symlink-aware resource containment checks.
- Human-readable and JSON diagnostics.
- A bundled `skillsforge-validate` command with no runtime install step.
- Strict Claude plugin and marketplace validation.

Routing, skill generation, platform adapters, synchronization, and orchestration remain roadmap items. They are not exposed as placeholder commands.

## Install in Claude Code

```text
/plugin marketplace add Tlkh201313/SkillsForge
/plugin install skillsforge@skillsforge-marketplace
```

Then invoke:

```text
/skillsforge:validate-agent-skill path/to/skill
```

The skill uses the bundled validator and reports structural failures before advisory quality improvements.

## Command line

From a repository checkout:

```sh
npm ci
npm run build
node scripts/validate-skill.mjs path/to/skill
node scripts/validate-skill.mjs --profile claude-code path/to/skill
node scripts/validate-skill.mjs --json path/to/skill
```

After building, the standalone command is available at `bin/skillsforge-validate`.

Profiles:

- `canonical` validates the portable Agent Skills specification.
- `claude-code` accepts the portable fields plus supported Claude Code extensions.

Unknown top-level fields fail validation. Put portable project-specific values under the standard `metadata` mapping.

## Development checks

```sh
npm run validate:manifests
npm run validate:plugin
npm run validate
npm test
npm run build:check
```

`npm run check` runs all checks except the official Claude validator. CI runs that validator separately and tests Node 20 and 22 on Linux, Windows, and macOS.

## Safety boundary

Validation reads `SKILL.md` and referenced local resources. It does not execute scripts contained in a skill. URI schemes other than HTTP, HTTPS, and mailto are rejected in Markdown links, and local links must remain inside the skill directory after real-path resolution.

## Roadmap

1. Add golden conformance fixtures from each supported client.
2. Build a deterministic skill creation and normalization pipeline.
3. Add adapters only when each target has installation and invocation smoke tests.
4. Add dependency graphs, synchronization, and orchestration after the core package format is stable.
