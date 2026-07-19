# Devpost / judging submission checklist

**Category:** Developer Tools  
**Repo:** https://github.com/Tlkh201313/SkillsForge  
**Branch:** `main`  
**Thesis:** SkillsForge is the Work OS that makes Agent Skills productive - route, workflows, library, multi-host install - with validate/package/hooks/receipts as the safety layer. Prove it in &lt;90s with `demo`.

## Automated gates (done)

- [x] Native Codex plugin + local marketplace
- [x] Full-fidelity Agent Skill installs across hosts
- [x] Productivity surfaces: catalog, lib, workflows, auto, wb, ps helpers
- [x] `skillsforge package --host codex` (one guarded skill -> one plugin)
- [x] Codex PreToolUse policy hooks
- [x] `skillsforge evidence` + `skillsforge demo` (unsafe deny -> safe package -> scoreboard)
- [x] Path confinement + routing honesty (eight auto heroes) + thin read-only MCP
- [x] Codex-first README / demo / safe-unsafe examples
- [ ] Local `npm run check` green (re-run before submit)

## Human / Stage One blockers (you execute)

- [ ] Start a **Codex + GPT-5.6** qualifying session after build-window start
- [ ] Run `/feedback` in that thread; paste Session ID into `BUILD_WEEK.md` (replace `REPLACE_WITH_CODEX_FEEDBACK_SESSION_ID`)
- [ ] Commit: `docs: record Build Week Codex Session ID`
- [ ] Record/upload public YouTube demo **under 3 minutes** (see [video.md](video.md) / [hackathon-demo.md](hackathon-demo.md))
- [ ] Push; confirm CI green on `main`
- [ ] Devpost: category Developer Tools, repo, Session ID, video, limitations, free access through judging
- [ ] Tag release (suggested: `v0.4.1-buildweek`)

See also: [submit-checklist.md](submit-checklist.md), [roadmap-next.md](roadmap-next.md), [features.md](features.md).

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
- 399 catalog entries / 50 design skills / eight auto-route heroes - honest depth claim (contract-backed domain skills)
- Codex does not intercept every tool path; incomplete matchers; invalid hook output can fail open at the host
