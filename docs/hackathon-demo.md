# Hackathon demo script (&lt;3 min)

Target: prove the trust thesis: **unsafe skill denied -> safe skill packaged -> evidence receipt**. Then show verified local inventory.

Offline: `node plugins/skillsforge/bin/skillsforge.mjs demo` (deterministic, &lt;90s). Live video uses the beats below.

| Time | Beat | What to show / say |
| --- | --- | --- |
| 0:00–0:20 | Thesis | *Codex makes workflows reusable. SkillsForge makes Agent Skills reviewable, least-privilege, measurable, and tamper-evident.* A release helper can hide undeclared shell + network. |
| 0:20-0:50 | Unsafe deny | `node plugins/skillsforge/bin/skillsforge.mjs demo` **or** `node plugins/skillsforge/bin/skillsforge.mjs validate examples/codex-unsafe-release` -> blocking findings, exit non-zero. Say: rejected **without executing** the skill. |
| 0:50-1:20 | Safe package | Same demo packages `examples/codex-safe-release` -> native Codex plugin tree. Show sidecar capabilities + hooks. |
| 1:20-1:50 | Receipt | Show receipt hash and `artifacts/demo-evidence/trust-receipt.json`. Optional: `compare-skill` unsafe vs safe. |
| 1:50-2:20 | Runtime deny (optional live) | Feed PreToolUse stdin for undeclared Bash -> `permissionDecision: deny`. Say aloud: hook is not an OS sandbox. |
| 2:20-2:45 | Inventory punchline | `node plugins/skillsforge/bin/skillsforge.mjs catalog` and `quality` show catalog, packs, sidecars, and lean-vs-stable depth honestly. |
| 2:45-3:00 | Provenance | CI green, package dry-run, audit, and receipt verification. Do not cite session IDs unless a real one exists. |

## Claim boundaries (say aloud)

- Pressure = fixture gate + expanding (not full agent behavior sim yet).
- SkillShield = skill-body scanner (best-effort).
- Hooks = host guardrails, not OS isolation; receipts = unsigned hashes.
- Codex: native plugin + guarded package; Cursor/OpenCode/Gemini = package fidelity only.

## Rehearsal gate

- `node plugins/skillsforge/bin/skillsforge.mjs demo` green under 90s
- Live video under 3:00
- Prefer trust pipeline over unsupported skill-count claims
