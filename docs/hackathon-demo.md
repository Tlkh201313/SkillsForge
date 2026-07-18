# Hackathon demo script (2:50)

Target: Codex-first SkillsForge trust pipeline — inspect → reject unsafe → package guarded plugin → deny undeclared tools → verify receipt.

Offline rehearsal: `npm run demo` (deterministic, noninteractive). Live story below is the judge video.

| Time | Beat | What to show / say |
| --- | --- | --- |
| 0:00–0:15 | Real problem | Teams reuse Agent Skills across Codex without review. A “release helper” skill can hide undeclared shell + network. Thesis: *Codex makes workflows reusable. SkillsForge makes Agent Skills reviewable, least-privilege, measurable, and tamper-evident before teams run them.* |
| 0:15–0:35 | Native Codex install | From repo root: `codex plugin marketplace add <path-to-repo>` → `codex plugin list --json` → `codex plugin add skillsforge@skillsforge-marketplace`. Show SkillsForge as a native plugin, not a portable copy. |
| 0:35–1:05 | Unsafe rejected | `skillsforge validate examples/codex-unsafe-release`. Blocking `undeclared-exec` / `undeclared-network` findings; exit non-zero. Then `skillsforge package --host codex --skill examples/codex-unsafe-release --out /tmp/should-not-exist --write` — fails closed, no plugin written. Say: rejected **without executing** the skill. |
| 1:05–1:30 | Guarded plugin | `skillsforge validate examples/codex-safe-release` (PASS). `skillsforge package --host codex --skill examples/codex-safe-release --out /tmp/codex-safe-release --write`. Show generated `.codex-plugin/`, `hooks/`, policy copy. Invoke as `$skillsforge:…` / installed skill path — least-privilege sidecar in view. |
| 1:30–2:05 | Runtime deny | Feed PreToolUse stdin for undeclared `Bash` (e.g. `curl https://evil.example`), `apply_patch` outside write scope, or `mcp__*` without declaration → `permissionDecision: deny`. Say aloud: hook guardrail ≠ OS sandbox; only matched tools are intercepted. |
| 2:05–2:35 | Receipt + tamper | `skillsforge receipt` / `verify-receipt` on the packaged plugin (or `dist/codex`) — clean verify passes. Flip one byte in a hashed file → verify fails. Say: unsigned tamper evidence, not attestation. |
| 2:35–2:50 | Evidence + provenance | Show green `npm run check` / `skillsforge evidence --out artifacts/evidence` summary, CI badge, and Build Week Codex/GPT-5.6 Session ID from `BUILD_WEEK.md`. |

## Claim boundaries (say aloud)

- Codex: native plugin + guarded `package --host codex`.
- Claude Code: full marketplace + skill-scoped PreToolUse.
- Cursor / OpenCode / Gemini: package-fidelity installs — not runtime policy parity.
- Hooks: guardrails, not OS isolation; static scan is best-effort; receipts are unsigned hashes.
- Codex limitations: incomplete tool interception; `/hooks` trust review after hook changes; invalid hook output can fail open at the host.

## Rehearsal gate

Live video under 2:50. Offline `npm run demo` must pass cleanly for the scripted fixture sequence. Prefer `examples/codex-unsafe-release` / `examples/codex-safe-release` over feature-count tours.
