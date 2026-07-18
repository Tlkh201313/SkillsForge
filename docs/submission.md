# Devpost / judging submission checklist

**Category:** Developer Tools  
**Repo:** https://github.com/Tlkh201313/SkillsForge  
**Branch:** `feat/codex-hackathon-win`  
**Thesis:** Codex makes workflows reusable. SkillsForge makes Agent Skills reviewable, least-privilege, measurable, and tamper-evident before teams run them.

## Automated gates (done on this branch)

- [x] Native Codex plugin (`.codex-plugin/plugin.json`) + local marketplace (`.agents/plugins/marketplace.json`)
- [x] Full-fidelity Agent Skill installs across hosts
- [x] `skillsforge package --host codex` (one guarded skill → one plugin)
- [x] Codex PreToolUse policy hooks (Bash / apply_patch / MCP deny-by-default)
- [x] `skillsforge evidence --out artifacts/evidence`
- [x] Codex-first README, architecture, threat model, demo script, safe/unsafe examples
- [x] Local `npm run check` green (validate, tests, eval, demo, dist, host validate, evidence)

## Human / Stage One blockers (required before submit)

- [ ] Start a **Codex + GPT-5.6** qualifying session after build-window start
- [ ] Run `/feedback` in that thread; paste Session ID into `BUILD_WEEK.md` (replace `REPLACE_WITH_CODEX_FEEDBACK_SESSION_ID`)
- [ ] Commit: `docs: record Build Week Codex Session ID`
- [ ] Record public YouTube demo **under 3 minutes** using `docs/hackathon-demo.md` beats
- [ ] Devpost form: category, repo URL, install path, Session ID, screenshots, architecture image, limitations, free access through judging
- [ ] Confirm GitHub Actions green on the PR; merge only when required checks pass
- [ ] Tag release after merge (suggested: `v0.3.0-buildweek`)

## Judge install / test path

```bash
git clone https://github.com/Tlkh201313/SkillsForge.git
cd SkillsForge
npm ci
npm run check
```

Codex plugin (from repo root):

```bash
codex plugin marketplace add .
codex plugin list --json
codex plugin add skillsforge@skillsforge-marketplace
```

Unsafe vs safe demo:

```bash
node plugins/skillsforge/bin/skillsforge.mjs validate examples/codex-unsafe-release
node plugins/skillsforge/bin/skillsforge.mjs validate examples/codex-safe-release
node plugins/skillsforge/bin/skillsforge.mjs package --host codex --skill examples/codex-safe-release --out /tmp/sf-codex-plugin --write
node plugins/skillsforge/bin/skillsforge.mjs evidence --out artifacts/evidence
```

## Claim boundaries (put on Devpost)

- Hooks are host guardrails, not an OS sandbox
- Static / regex policy checks are best-effort
- Receipts are unsigned tamper-evident hashes (not third-party attestation)
- Codex does not intercept every tool path; changed hooks need `/hooks` trust review
