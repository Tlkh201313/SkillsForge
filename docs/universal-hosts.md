# Universal AI CLI hosts

SkillsForge is not only a Codex plugin. Codex is the primary target, Claude Code is the second full-fidelity target, and other AI CLIs can receive validated skill packages when they expose a local skills directory.

The important boundary: package-fidelity hosts get complete skill directories and `skillsforge.json` sidecars, but SkillsForge does not claim runtime policy enforcement unless the host runs the generated hooks or honors an equivalent decision protocol.

## Host modes

| Mode | Hosts | What SkillsForge does | Runtime policy claim |
| --- | --- | --- | --- |
| Codex-first native package | Codex CLI | `package --host codex` creates a guarded native plugin tree for one skill | Guarded for matched Codex hook tools after host hook trust |
| Full-fidelity install | Claude Code | Copies the complete skill package, keeping Claude hooks and sidecar | Enforced when Claude Code honors PreToolUse |
| Package fidelity | Cursor, OpenCode, ZCode, Hermes, Gemini | Copies validated skill packages and strips incompatible Claude-only frontmatter where needed | Not claimed |
| Custom package target | Any local AI CLI with a skills folder | Copies validated packages into a user-declared path under `--home` | Not claimed |

## Inspect hosts

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs hosts
node ./plugins/skillsforge/bin/skillsforge.mjs hosts --json
```

The command reports detection status, skill install path, fidelity, and the trust boundary for every known host.

Known host ids:

```text
claude-code,cursor,codex,opencode,zcode,hermes,gemini
```

## Install selected hosts

Dry-run first:

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs install --hosts codex,claude-code --yes --dry-run plugins/skillsforge/skills/using-skillsforge
```

Install every known host target:

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs install --hosts all --yes --dry-run plugins/skillsforge/skills/using-skillsforge
```

Install only hosts detected under your home directory:

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs install --hosts detected --yes --dry-run plugins/skillsforge/skills/using-skillsforge
```

## Custom AI CLI target

Use this when a local agent is not in the registry yet but has a skills directory:

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs install --custom-host my-agent:.my-agent/skills --yes --dry-run plugins/skillsforge/skills/using-skillsforge
```

Security rules:

- The custom id must be kebab-case.
- The target path is resolved under `--home` or the current user home.
- Paths that escape home are rejected.
- The install remains package-fidelity. It does not make runtime hook claims for the custom agent.

## Codex package path

For Codex runtime guardrails, use packaging instead of plain install:

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs package --host codex --skill examples/codex-safe-release --out dist/codex-safe-release-plugin --dry-run
```

`install --hosts codex` copies a skill package to `~/.agents/skills`. `package --host codex` creates a native Codex plugin tree with policy hooks for one selected skill.

