# Devpost / judging submission checklist

**Category:** Developer Tools  
**Repo:** https://github.com/Tlkh201313/SkillsForge  
**Branch:** `fix/trust-hardening-from-review`  
**Thesis:** Codex makes workflows reusable. SkillsForge makes Agent Skills reviewable, least-privilege, measurable, and tamper-evident — with a &lt;90s demo that proves it.

## Automated gates (done on this branch)

- [x] Native Codex plugin + local marketplace
- [x] Full-fidelity Agent Skill installs across hosts
- [x] `skillsforge package --host codex` (one guarded skill → one plugin)
- [x] Codex PreToolUse policy hooks
- [x] `skillsforge evidence` + `skillsforge demo` (unsafe deny → safe package → scoreboard)
- [x] Path confinement + routing honesty (eight auto heroes) + hero depth + thin read-only MCP
- [x] Codex-first README / demo / safe-unsafe examples
- [ ] Local `npm run check` green (re-run before submit)

## Human / Stage One blockers (you execute)

- [ ] Start a **Codex + GPT-5.6** qualifying session after build-window start
- [ ] Run `/feedback` in that thread; paste Session ID into `BUILD_WEEK.md` (replace `REPLACE_WITH_CODEX_FEEDBACK_SESSION_ID`)
- [ ] Commit: `docs: record Build Week Codex Session ID`
- [ ] Record/upload public YouTube demo **under 3 minutes** (see [video.md](video.md) / [hackathon-demo.md](hackathon-demo.md))
- [ ] Push branch; open/update PR; confirm CI green
- [ ] Devpost: category Developer Tools, repo, Session ID, video, limitations, free access through judging
- [ ] Merge when checks pass; tag release (suggested: `v0.4.0-buildweek`)

See also: [submit-checklist.md](submit-checklist.md), [roadmap-next.md](roadmap-next.md).

## Judge install / test path

```bash
git clone https://github.com/Tlkh201313/SkillsForge.git
cd SkillsForge
git checkout fix/trust-hardening-from-review   # or main after merge
npm ci
npx skillsforge demo
npm run check
```

Codex plugin (from repo root):

```bash
codex plugin marketplace add .
codex plugin list --json
codex plugin add skillsforge@skillsforge-marketplace
```

## Claim boundaries (put on Devpost)

- Hooks are host guardrails, not an OS sandbox
- Static / regex policy checks and SkillShield are best-effort
- Pressure is a fixture gate (expanding toward behavioral pressure)
- Receipts are unsigned tamper-evident hashes (not third-party attestation)
- Judge demo scoreboard uses a package-tree hash artifact, not a full `buildReceipt`/`verifyReceipt` trust receipt
- 367 catalog entries / eight auto-route heroes — honest depth claim
- Codex does not intercept every tool path; changed hooks need `/hooks` trust review
