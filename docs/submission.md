# Devpost / judging submission checklist

**Category:** Developer Tools  
**Repo:** https://github.com/Tlkh201313/SkillsForge  
**PR branch:** `upgrade/work-os-quality`
**Thesis:** SkillsForge is an AI CLI development plugin / Work OS for vibe coders - skill packs, custom commands, local HTML indexing, routing, workflows, token-efficient operator tools, and multi-host installs - with validate/package/hooks/receipts as the safety layer.

## Automated gates (done)

- [x] Native Codex plugin + local marketplace
- [x] Full-fidelity Agent Skill installs across hosts
- [x] Productivity surfaces: catalog, lib, workflows, auto, wb, ps helpers
- [x] `skillsforge package --host codex` (one guarded skill -> one plugin)
- [x] Codex PreToolUse policy hooks
- [x] Trust-layer proof: `skillsforge evidence` + `skillsforge demo` (unsafe deny -> safe package -> scoreboard)
- [x] Path confinement + routing honesty (eight auto heroes) + thin read-only MCP
- [x] AI CLI-first README / demo / safe-unsafe examples
- [x] README graphics updated: banner, generated library preview, star map, host fanout, visible poster, packaged MP4
- [x] Local `npm run check` green (re-run before submit)

## Human / Stage One blockers (you execute)

- [ ] Start a **Codex + GPT-5.6** qualifying session after build-window start
- [ ] Run `/feedback` in that thread; paste Session ID into `BUILD_WEEK.md` (replace `REPLACE_WITH_CODEX_FEEDBACK_SESSION_ID`)
- [ ] Commit: `docs: record Build Week Codex Session ID`
- [ ] Upload the committed 2:19 YouTube demo as public/unlisted **under 3 minutes** (see [video.md](video.md) / [hackathon-demo.md](hackathon-demo.md))
- [ ] Push; confirm CI green on `main`
- [ ] Devpost: category Developer Tools, repo, Session ID, video, limitations, free access through judging
- [ ] Tag release (suggested: `v0.4.2-buildweek`)

See also: [submit-checklist.md](submit-checklist.md), [roadmap-next.md](roadmap-next.md), [features.md](features.md).

## Visual / media assets

| Asset | Purpose |
| --- | --- |
| `assets/skillsforge-banner.svg` | README hero with current repo inventory |
| `assets/skillsforge-library-preview.png` | Product preview; generated image, no embedded text claims |
| `assets/skillsforge-demo-poster.png` | Always-visible fallback for GitHub README |
| `assets/video/skillsforge-demo.mp4` | Packaged demo MP4 for upload / release assets |
| `assets/skillsforge-star-map.svg` | Static inventory map |
| `assets/skillsforge-universal-fanout.svg` | Host boundary map |

## Judge install / test path

```bash
git clone https://github.com/Tlkh201313/SkillsForge.git
cd SkillsForge
npm ci
node plugins/skillsforge/bin/skillsforge.mjs demo
npm run check
```

> Not published to npm - do **not** use `npx skillsforge`.

Codex plugin (from repo root):

```bash
codex plugin marketplace add .
codex plugin list --json
codex plugin add skillsforge@skillsforge-marketplace
```

## Claim boundaries (put on Devpost)

- Product is a **productivity Work OS**; trust is the safety layer
- Hooks are host guardrails, not an OS sandbox
- Static / regex policy checks and SkillShield are best-effort
- Pressure is a fixture gate (expanding toward behavioral pressure)
- Receipts are unsigned tamper-evident hashes (not third-party attestation)
- Judge demo scoreboard (`artifacts/demo-evidence/demo-scoreboard.json`) is a package-tree hash, not a full `buildReceipt`/`verifyReceipt` trust receipt
- 499 catalog entries / 60 design skills / eight auto-route heroes - honest depth claim (contract-backed domain skills)
- Codex does not intercept every tool path; incomplete matchers; invalid hook output can fail open at the host
