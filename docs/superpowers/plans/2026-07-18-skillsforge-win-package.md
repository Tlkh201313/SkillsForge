# SkillsForge Win Package — Unified Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship a judge-ready Remotion presentation video, close code-review HIGH findings from hardening, and lock a next-wave plugin roadmap — one coherent delivery.

**Architecture:** Keep the Node CLI trust engine as the product core. Put Remotion in an isolated `video/` package so root `npm run check` stays lean. Fix path-confinement gaps before marketing surfaces. Roadmap lives in docs only (no Ruflo/swarm scope creep).

**Tech Stack:** Node 20 ESM CLI, Remotion 4 + React + TypeScript (video/), existing SkillsForge test runner.

**DX review (condensed — CLI product):**
- **Persona:** Hackathon judge / busy founder — 90s tolerance, wants proof not inventory.
- **Magical moment:** `npx skillsforge demo` → unsafe deny → safe package → receipt hash.
- **TTHW target:** Champion (&lt;2 min) via demo; video is the watchable twin of that path.
- **Mode:** DX POLISH + ship video + roadmap (no new swarm/MCP sprawl).

---

## File map

| Path | Responsibility |
|------|----------------|
| `lib/capabilities/demo.mjs` | Budget-gated ok; honest falseAllow |
| `scripts/skillsforge-cli.mjs` | resolveUnderRoot on all user paths |
| `lib/capabilities/export-agents.mjs` | Honor allowAbsolute |
| `scripts/gen-pack-skills.mjs` | assertSkillId before write |
| `tests/path-confinement.test.mjs` | Cross-platform absolute escape |
| `video/` | Remotion judge-demo composition + render scripts |
| `docs/video.md` | How to preview/render/upload |
| `docs/roadmap-next.md` | Next-wave improvements |
| `README.md` | Link video + roadmap |

---

### Task 1: Close path-confinement HIGH findings

**Files:**
- Modify: `scripts/skillsforge-cli.mjs`
- Modify: `lib/capabilities/demo.mjs`
- Modify: `lib/capabilities/export-agents.mjs`
- Modify: `scripts/gen-pack-skills.mjs`
- Modify: `tests/path-confinement.test.mjs`

- [x] **Step 1:** Add shared CLI helper `resolveUserPath` and wire quality / lint-skill / pressure / watch / evidence / skillshield.
- [x] **Step 2:** Gate demo `ok` on `underBudget`; set `falseAllow: 1` on unexpected unsafe pass.
- [x] **Step 3:** Honor `allowAbsolute` in export-agents; assertSkillId in gen-pack-skills.
- [x] **Step 4:** Fix absolute escape test with `tmpdir()`.
- [x] **Step 5:** Run `node --test tests/path-confinement.test.mjs tests/demo-mcp.test.mjs` — PASS.

### Task 2: Remotion judge-demo video
...
- [x] Scaffold `video/` Remotion 4 project
- [x] Implement ~90s composition (thesis → deny → package → receipt → scale → CTA)
- [x] Poster + MP4 under `artifacts/video/` (gitignored artifacts; source in `video/`)
- [x] Document in `docs/video.md`

### Task 3: Next-wave roadmap
- [x] `docs/roadmap-next.md` + README / submit checklist links

### Task 4: Full verify
- [x] Path/demo tests + CLI rebuild
- [ ] Optional: full `npm run check` (run before PR)

## GSTACK REVIEW REPORT (DX)

| Review | Status | Findings |
|--------|--------|----------|
| DX Review | clean (condensed) | TTHW via demo; video = watchable twin; path gaps were ship blockers |
| Score | 8/10 → target 9/10 after Task 1–2 | Magical moment designed |

## NOT in scope

- Ruflo swarm / AgentDB / desktop dashboard
- Inventing Session ID or fake YouTube upload
- Rewriting all 354 skill bodies
- Editing `hackathon_win_hardening_*.plan.md`
