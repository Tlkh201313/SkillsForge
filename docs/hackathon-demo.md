# Hackathon demo script (&lt;3 min)

Target: prove the trust thesis: **unsafe skill denied -> safe skill packaged -> evidence receipt**. Then show verified local inventory.

Offline: `node plugins/skillsforge/bin/skillsforge.mjs demo` (deterministic, &lt;90s). Live video uses the beats below.

## Judge framing

Start with the problem, then show the product running. Keep every claim tied to a visible artifact: the CLI output, the generated Codex plugin tree, the receipt JSON, or the local catalog stats. This matches public hackathon guidance to show the working project, connect to judging criteria, and provide a video/gallery artifact for review:

- Devpost demo guidance: [6 Tips For Making A Hackathon Demo Video](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)
- Devpost submission checklist: [Know your submission steps](https://help.devpost.com/article/126-know-your-submission-steps)
- MLH judging flow: [MLH Hackathon Rules](https://github.com/MLH/mlh-hackathon-rules/blob/master/Rules.md)
- Judge notes: [How to win a hackathon: notes from the judging table](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)

Criteria map:

| Criterion | SkillsForge proof |
| --- | --- |
| Working product | `demo` runs unsafe deny -> safe package -> receipt locally |
| Technical depth | Sidecar policy, static scan, Codex hook compiler, receipt hashing |
| Practicality | `hosts` and `install` target Codex, Claude Code, package-fidelity hosts, and custom local AI CLIs |
| Honesty | Claim boundaries are explicit: hooks are not an OS sandbox; package-fidelity hosts do not enforce runtime policy |

| Time | Beat | What to show / say |
| --- | --- | --- |
| 0:00-0:20 | Thesis | *Codex makes workflows reusable. SkillsForge makes Agent Skills reviewable, least-privilege, measurable, and tamper-evident.* A release helper can hide undeclared shell + network. |
| 0:20-0:50 | Unsafe deny | `node plugins/skillsforge/bin/skillsforge.mjs demo` **or** `node plugins/skillsforge/bin/skillsforge.mjs validate examples/codex-unsafe-release` -> blocking findings, exit non-zero. Say: rejected **without executing** the skill. |
| 0:50-1:20 | Safe package | Same demo packages `examples/codex-safe-release` -> native Codex plugin tree. Show sidecar capabilities + hooks. |
| 1:20-1:50 | Scoreboard | Show package-tree hash and `artifacts/demo-evidence/demo-scoreboard.json`. Optional: `compare-skill` unsafe vs safe. |
| 1:50-2:20 | Runtime deny (optional live) | Feed PreToolUse stdin for undeclared Bash -> `permissionDecision: deny`. Say aloud: hook is not an OS sandbox. |
| 2:20-2:40 | Agent workbench | `wb status --json`, `workflows recommend --query "safe refactor code"`, and `auto run --read-only --query "audit README claims"` show token-efficient routing without writes. |
| 2:40-2:55 | Local library | `lib update --session-host codex` creates `skillsforge-library.html` and `skillsforge-ai-index.html`; `lib recommend --query "audit README claims"` proves session-aware selection; `ps export` creates Windows helper commands. |
| 2:55-3:00 | Provenance | CI green, package dry-run, audit, receipt verification, and `hosts --json`. Do not cite session IDs unless a real one exists. |

## Claim boundaries (say aloud)

- Pressure = fixture gate + expanding (not full agent behavior sim yet).
- SkillShield = skill-body scanner (best-effort).
- Hooks = host guardrails, not OS isolation; receipts = unsigned hashes.
- Codex: native plugin + guarded package; Claude Code = full; Cursor/OpenCode/ZCode/Hermes/Gemini/custom hosts = package fidelity only.

## Rehearsal gate

- `node plugins/skillsforge/bin/skillsforge.mjs demo` green under 90s
- `node plugins/skillsforge/bin/skillsforge.mjs hosts --json` lists Codex, Claude Code, Cursor, OpenCode, ZCode, Hermes, Gemini
- `node plugins/skillsforge/bin/skillsforge.mjs workflows list --json` reports 100 workflows
- `node plugins/skillsforge/bin/skillsforge.mjs lib update --session-host codex` emits HTML + AI index locally
- `node plugins/skillsforge/bin/skillsforge.mjs lib recommend --query "audit README claims" --session-host codex` returns read-only skill/workflow recommendations
- Live video under 3:00
- Prefer trust pipeline over unsupported skill-count claims
