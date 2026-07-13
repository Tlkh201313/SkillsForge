![SkillsForge — Portable Agent Skills validation](assets/skillsforge-banner.svg)

[![CI](https://github.com/Tlkh201313/SkillsForge/actions/workflows/ci.yml/badge.svg)](https://github.com/Tlkh201313/SkillsForge/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.3.0-7c3aed)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=nodedotjs&logoColor=white)
[![License: MIT](https://img.shields.io/badge/license-MIT-0ea5e9)](LICENSE)

SkillsForge is a multi-plugin marketplace for portable Agent Skills. Version 0.3.0 ships one production plugin: a bundled validator for [Agent Skills](https://agentskills.io/specification) packages and supported Claude Code extensions. Planned plugins are listed separately and are not presented as available.

## What ships today

| Surface | Actual implementation |
|---|---|
| Claude Code skill | `validate-agent-skill` reviews and validates a requested skill package |
| Standalone command | `skillsforge-validate` is bundled into one executable Node.js file |
| Portable profile | Enforces the Agent Skills name, description, metadata, compatibility, license, and tool fields |
| Claude Code profile | Adds supported Claude-specific invocation, tool, model, context, agent, and hook fields |
| Diagnostics | Human-readable output and structured JSON with non-zero failure exits |
| Safety | Reads skill metadata and resources without executing bundled skill scripts |

Routing, generation, synchronization, adapters, and orchestration are not implemented or advertised as working commands.

## Validation pipeline

```mermaid
flowchart LR
    A["SKILL.md package"] --> B["YAML parser"]
    B --> C["Selected profile"]
    C --> D["Resource boundary checks"]
    D --> E["Text or JSON diagnostics"]
```

The parser accepts valid BOM, CRLF, comments, quoted values, and multiline YAML. Profile validation uses Draft 2020-12 JSON Schema. Resource checks reject missing files, unsupported URI schemes, sibling-prefix escapes, and links whose real path leaves the skill directory.

## Plugin availability

| Plugin | Purpose | Version 0.3.0 | Install command |
|---|---|:---:|---|
| `skillsforge` | Validate portable and Claude Code skill packages | Available | `/plugin install skillsforge@skillsforge-marketplace` |
| `skill-author` | Guided skill authoring | Planned | — |
| `skill-reviewer` | Qualitative skill review | Planned | — |
| `skill-router` | Skill selection and routing | Planned | — |
| `skill-sync` | Cross-environment synchronization | Planned | — |
| `skill-adapters` | Format adapters | Planned | — |
| `skill-orchestrator` | Multi-skill orchestration | Planned | — |

Only `skillsforge` is installable in this release.

## Install in Claude Code

```text
/plugin marketplace add Tlkh201313/SkillsForge
/plugin install skillsforge@skillsforge-marketplace
```

Invoke the installed skill with a path:

```text
/skillsforge:validate-agent-skill path/to/skill
```

Claude Code loads the skill, runs the bundled command, and reports structural failures before qualitative advice.

## Use the validator directly

```sh
npm ci
npm run build

# Portable Agent Skills specification
./plugins/skillsforge/bin/skillsforge-validate path/to/skill

# Portable fields plus supported Claude Code extensions
./plugins/skillsforge/bin/skillsforge-validate --profile claude-code path/to/skill

# Machine-readable diagnostics
./plugins/skillsforge/bin/skillsforge-validate --json path/to/skill

# Every production skill under plugins/*/skills
./plugins/skillsforge/bin/skillsforge-validate --all
```

On Windows PowerShell, use Node explicitly:

```powershell
node .\plugins\skillsforge\bin\skillsforge-validate path\to\skill
```

## Profiles

| Capability | `canonical` | `claude-code` |
|---|:---:|:---:|
| Agent Skills core fields | ✓ | ✓ |
| `metadata` string map | ✓ | ✓ |
| Portable `allowed-tools` string | ✓ | ✓ |
| Claude tool arrays | — | ✓ |
| Invocation controls | — | ✓ |
| Claude model, context, agent, and hooks | — | ✓ |
| Unknown top-level fields | Rejected | Rejected |

Put portable project-specific values under `metadata`. Select `claude-code` only when the package intentionally uses Claude extensions.

## Runtime architecture

```mermaid
flowchart TD
    A["User or coding agent"] --> B["validate-agent-skill"]
    B --> C["Bundled skillsforge-validate CLI"]
    C --> D["YAML, schema, and path engine"]
    D --> E["Actionable diagnostics"]
```

The committed CLI bundle contains its runtime dependencies, so a marketplace installation does not run `npm install`. Source and bundle drift is blocked by `npm run build:check`.

## Example output

Successful package:

```text
PASS validate-agent-skill (canonical)
```

Invalid package:

```text
FAIL example-skill
  - frontmatter / must contain description
  - relative markdown link must resolve: references/missing.md
```

Exit codes are `0` for success, `1` for validation failure, and `2` for invalid CLI usage.

## Verification

Run the same release-contract dry run locally from the repository root:

```sh
npm ci
npm run check
for plugin in plugins/*/; do
  npx @anthropic-ai/claude-code plugin validate "$plugin" --strict || exit 1
done
npx @anthropic-ai/claude-code plugin validate . --strict
```

GitHub Actions runs the validation and test suite on Ubuntu, Windows, and macOS with Node.js 20 and 22. A separate release-contract job strictly validates every directory under `plugins/`, validates the marketplace root, and verifies the committed CLI bundle.

## Security boundary

- Skill scripts are never executed during validation.
- Local Markdown resources must remain inside the skill directory after real-path resolution.
- Only HTTP, HTTPS, mailto, fragment, and valid local links are accepted.
- Empty production skill libraries fail closed unless `--allow-empty` is explicitly supplied.
- `VERSION`, `package.json`, every plugin and marketplace entry, and the README badge must use the same release version.

## License

[MIT](LICENSE) © 2026 Tlkh201313.
