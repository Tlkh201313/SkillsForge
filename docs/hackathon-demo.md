# Hackathon demo script (&lt;3 min)

Target: prove the developer-tools thesis: **SkillsForge turns vibe coding into a structured AI CLI development plugin** with skill packs, custom commands, routing, local HTML indexing, reusable workflows, token-efficient operator tools, and portable host packaging. Trust validation is the safety layer underneath, not the main pitch.

Offline quick proof: `node plugins/skillsforge/bin/skillsforge.mjs init --profile vibecoder --session-host codex`, then `lib recommend`, `workflows run --dry-run`, `session score`, `map`, `slim`, `digest`, and the trust-layer `demo`. The committed YouTube/Devpost MP4 is the 2:22 cut in [video.md](video.md). The longer beats below are a fallback for a live presentation slot.

## Judge framing

Start with the problem, then show the product running. Keep every claim tied to a visible artifact: the CLI output, the generated Codex plugin tree, the receipt JSON, or the local catalog stats. This matches public hackathon guidance to show the working project, connect to judging criteria, and provide a video/gallery artifact for review:

- Devpost demo guidance: [6 Tips For Making A Hackathon Demo Video](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)
- Devpost submission checklist: [Know your submission steps](https://help.devpost.com/article/126-know-your-submission-steps)
- MLH judging flow: [MLH Hackathon Rules](https://github.com/MLH/mlh-hackathon-rules/blob/master/Rules.md)
- Judge notes: [How to win a hackathon: notes from the judging table](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)

Criteria map:

| Criterion | SkillsForge proof |
| --- | --- |
| Working product | `vibe`, `catalog`, `route`, `lib`, `workflows`, `map`, `slim`, `digest`, and `demo` run locally |
| Technical depth | Skill catalog, command shims, workflow catalog, source-indexing, routing, slim/map context tools, host packaging |
| Practicality | Codex + Claude Code support, package-fidelity hosts, custom local AI CLI paths, no account required |
| Honesty | Claim boundaries are explicit: trust is a safety layer; hooks are not an OS sandbox |

| Time | Beat | What to show / say |
| --- | --- | --- |
| 0:00-0:20 | Thesis | *SkillsForge is a development plugin layer for AI CLIs: skills, custom commands, workflows, routing, and token-efficient operator tools.* |
| 0:20-0:45 | Inventory + command surface | Show `vibe` and `catalog`: 511 skills, 28 packs, 11 profiles, 100 workflows, 140 command shims. |
| 0:45-1:10 | Project library OS | `init --profile vibecoder --session-host codex` creates config, `skillsforge-library.html`, `skillsforge-ai-index.html`, and compact session memory; explain discoverability before context burn. |
| 1:10-1:35 | Routing + token efficiency | `route --query`, `digest --query`, `map explore`, and `slim test` show selecting the right capability and compressing noisy output. |
| 1:35-2:00 | Workflows + memory | `workflows recommend --query "release"` and `session score --json` show reusable playbooks, roles, commands, stop gates, artifacts, and compact usage memory. |
| 2:00-2:25 | Host ecosystem | `hosts --json` and `install --dry-run` show Codex, Claude Code, Cursor, OpenCode, Gemini, and custom CLI paths. |
| 2:25-2:45 | Trust underneath | `demo` or `validate` proves unsafe deny / safe package as a foundation, not the headline. |
| 2:45-3:00 | Submission proof | CI green, local `npm run check`, package dry-run, no account required. Do not cite session IDs unless a real one exists. |

## Claim boundaries (say aloud)

- Pressure = fixture gate + expanding (not full agent behavior sim yet).
- SkillShield = skill-body scanner (best-effort).
- Hooks = host guardrails, not OS isolation; receipts = unsigned hashes.
- Codex: native plugin + guarded package; Claude Code = full; Cursor/OpenCode/ZCode/Hermes/Gemini/custom hosts = package fidelity only.

## Rehearsal gate

- `node plugins/skillsforge/bin/skillsforge.mjs demo` green under 90s
- `node plugins/skillsforge/bin/skillsforge.mjs hosts --json` lists Codex, Claude Code, Cursor, OpenCode, ZCode, Hermes, Gemini
- `node plugins/skillsforge/bin/skillsforge.mjs workflows list --json` reports 100 workflows
- `node plugins/skillsforge/bin/skillsforge.mjs init --profile vibecoder --session-host codex --json` creates config, HTML, AI index, and session summary
- `node plugins/skillsforge/bin/skillsforge.mjs lib update --session-host codex` emits HTML + AI index locally
- `node plugins/skillsforge/bin/skillsforge.mjs lib recommend --query "audit README claims" --session-host codex` returns read-only skill/workflow recommendations
- `node plugins/skillsforge/bin/skillsforge.mjs session score --json` reports compact usage-memory score
- Live video under 3:00
- Prefer development-tool architecture over a security-only pitch
