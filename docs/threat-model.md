# SkillsForge threat model (v0.3)

## Scope

SkillsForge validates, forges, routes, policy-scans, and packages Agent Skills for Claude Code (full) with Cursor export proof. This document covers trust boundaries for static capability scanning and Claude Code PreToolUse policy hooks.

One plugin: `skillsforge`. No MCP, LSP, monitors, token ledgers, or domain packs are in scope.

## Assets

- Declared skill capabilities (`exec`, `network`, `write`) in `skillsforge.json`
- Skill package contents (`SKILL.md`, scripts, references, assets)
- Trust receipts and evaluation evidence produced by packaging
- Host tool invocations (Bash, Write, Edit, WebFetch, WebSearch)

## Trust boundaries

| Boundary | What crosses it | Control |
| --- | --- | --- |
| Skill package → scanner | Files on disk | Static `scanSkill` rules |
| Declared sidecar → runtime | Tool calls during a skill session | Skill-scoped PreToolUse hook |
| Plugin package → agent host | Installed hooks/CLI | Bundled `skillsforge` runtime |

## Static scanner threats

| Threat | Rule | Notes |
| --- | --- | --- |
| Undeclared executable/script | `undeclared-exec-file` | `.sh`, `.ps1`, `.cmd`, `.bat`, `.exe`, `.py`, `.mjs`, `.js`, `.cjs` |
| Process execution in text | `undeclared-exec-content` | `child_process`, `exec`, `spawn` references |
| Network references without capability | `undeclared-network` | URLs/fetch/curl/wget/WebFetch/WebSearch across text files |
| Host outside allowlist | `undeclared-host` | Only `capabilities.network.hosts` is authoritative |
| Write path escape | `write-scope-escape` | Absolute paths and `../` traversal when scope is `skill`/`none` |
| Symlink leaving skill root | `symlink-escape` | Resolved real path must stay inside skill root |
| Oversized text skipped silently | `oversized-unscanned-file` | Files over 256 KiB must not be silently omitted |
| Opaque binaries | `unverified-binary` | Recorded as unverified, not auto-trusted |

There are **no blanket host exemptions** (including GitHub, Anthropic, or Claude endpoints). If a host is not declared on the sidecar allowlist, it is a finding.

## Runtime hook threats

Compiled skill frontmatter installs a PreToolUse command hook that reads the skill sidecar and calls `enforcePolicy` (via `hooks/pre-tool-policy.mjs` / `skillsforge enforce`).

Hooks are **guardrails, not an OS sandbox**:

- They run with the same privileges as the user/agent session.
- They can deny matched tool calls when the host honors PreToolUse decisions.
- They cannot confine processes, block arbitrary filesystem access outside matched tools, or replace OS-level isolation.
- Exit with no stdout means “no SkillsForge decision,” never an auto-approve.

## Non-goals / anti-goals

- Preventing a malicious local user from editing their own sidecar or disabling hooks
- Guaranteeing confidentiality against a compromised host runtime
- Replacing container/VM sandboxing for untrusted code execution
- Claiming MCP, LSP, monitors, token ledgers, domain packs, multi-host parity, or attestation

## Residual risk

Static scanning is best-effort over text-like content. Encoded payloads, novel interpreters, and host tools outside the matcher can bypass both scanner and hook. Treat receipts and policy findings as evidence, not proof of safety. A trust receipt hashes packaged plugin bytes plus an external evaluation report SHA; it is reproducible evidence, not an attestation of safety or third-party certification.
