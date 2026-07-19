# SkillsForge threat model (v0.4)

## Scope

SkillsForge validates, forges, routes, policy-scans, and packages Agent Skills for **Codex** (native plugin + guarded package) and **Claude Code** (full), with package-fidelity installs for Cursor / OpenCode / ZCode / Hermes / Gemini and custom local AI CLI targets. This document covers trust boundaries for static capability scanning and host PreToolUse policy hooks.

One plugin: `skillsforge`. Thin read-only MCP only (`scripts/skillsforge-mcp.mjs`: validate/route/skillshield plus library/workflow recommendation). No LSP, monitors, or token ledgers. Domain packs ship as lean scaffolds — productivity surface is in scope; OS sandboxing and third-party attestation are not.

## Assets

- Declared skill capabilities (`exec`, `network`, `write`) in `skillsforge.json`
- Skill package contents (`SKILL.md`, scripts, references, assets)
- Generated Codex plugin trees (manifest, hooks, immutable policy copy)
- Trust receipts and evaluation / evidence bundles
- Host tool invocations (Claude: Bash, Write, Edit, WebFetch, WebSearch; Codex: Bash, apply_patch, mcp__*)

## Trust boundaries

| Boundary | What crosses it | Control |
| --- | --- | --- |
| Skill package → scanner | Files on disk | Static `scanSkill` rules |
| Declared sidecar → Claude runtime | Tool calls during a skill session | Skill-scoped PreToolUse hook |
| Declared sidecar → Codex runtime | Matched plugin-level tools | Compiled PreToolUse hook (`Bash\|apply_patch\|mcp__*`) |
| Plugin package → agent host | Installed hooks/CLI | Bundled `skillsforge` / policy runner |

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

There are **no blanket host exemptions**. If a host is not declared on the sidecar allowlist, it is a finding. Regex / static analysis is **best-effort**.

## Runtime hook threats (Claude Code)

Compiled skill frontmatter installs a PreToolUse command hook that reads the skill sidecar and calls `enforcePolicy` (via `hooks/pre-tool-policy.mjs` / `skillsforge enforce`).

Hooks are **guardrails, not an OS sandbox**:

- They run with the same privileges as the user/agent session.
- They can deny matched tool calls when the host honors PreToolUse decisions.
- They cannot confine processes, block arbitrary filesystem access outside matched tools, or replace OS-level isolation.
- Exit with no stdout means “no SkillsForge decision,” never an auto-approve.

## Runtime hook threats (Codex)

`skillsforge package --host codex` compiles plugin-level hooks that invoke `hooks/codex-pre-tool-policy.mjs` with an immutable policy copy under `${PLUGIN_ROOT}`.

### Codex PreToolUse limitations

| Limitation | Risk | Mitigation / honest claim |
| --- | --- | --- |
| **Incomplete tool interception** | Codex does not comprehensively surface every tool path to PreToolUse. Tools outside `Bash`, `apply_patch`, and `mcp__*` matchers are **not** SkillsForge-guarded. | Document matcher scope; never claim universal sandboxing. |
| **`/hooks` trust review** | Newly installed or changed hooks may require the operator to accept them via Codex `/hooks` before they run. Until trusted, policy does not enforce. | Demo and docs show the trust step; treat untrusted hooks as inactive. |
| **Invalid hook output fail-open** | If a hook returns malformed output, the **host** may fail open (allow the tool) even when SkillsForge intends fail-closed on load/parse errors inside the runner. | Keep runner stdout strictly shaped; test adversarial stdin; surface this as residual host risk. |

SkillsForge’s Codex runner still aims to **fail closed** on missing/invalid policy, malformed stdin, and unexpected exceptions (explicit deny + exit 0). That does not override host fail-open on invalid hook protocol output.

## Non-goals / anti-goals

- Preventing a malicious local user from editing their own sidecar or disabling hooks
- Guaranteeing confidentiality against a compromised host runtime
- Replacing container/VM sandboxing for untrusted code execution
- Claiming full MCP product surface, LSP, monitors, token ledgers, domain packs, multi-host parity, or attestation (thin read-only MCP tools are in scope; see Scope)
- Claiming that package-fidelity installs for Cursor/OpenCode/ZCode/Hermes/Gemini/custom hosts enforce runtime policy

## Residual risk

Static scanning is best-effort over text-like content. Encoded payloads, novel interpreters, and host tools outside the matcher can bypass both scanner and hook. Treat receipts and policy findings as **unsigned tamper evidence**, not proof of safety or third-party certification. A trust receipt hashes packaged plugin bytes plus optional evaluation report SHA; verification detects byte-level tampering, not semantic safety.

Write confinement uses `realpath` when the skill/project root and candidate path already exist. **Residual:** creating a new path (file does not exist yet) cannot be realpath-checked; only the lexical `isInside` check applies until the path exists on disk.
