# Hackathon demo script (2:50)

Target: installable SkillsForge v0.3 — forge → prove → route → enforce → receipt.

Offline rehearsal: `npm run demo` (deterministic, noninteractive, CLI on `plugins/skillsforge` or `dist/claude-code`).

| Time | Beat | What to show |
| --- | --- | --- |
| 0:00–0:20 | Install | `/plugin marketplace add Tlkh201313/SkillsForge` → install `skillsforge`. Optionally `claude plugin details skillsforge`. |
| 0:20–0:45 | Forge | `skillsforge forge --spec examples/safe-dependency-upgrade/forge-spec.json --dry-run`. Show generated SKILL.md + sidecar preview, no write. |
| 0:45–1:15 | Policy fail | `skillsforge validate tests/fixtures/policy/undeclared-exec --profile claude-code`. Integrated validation+policy exits non-zero with blocking undeclared-exec evidence. Guardrail, not sandbox. |
| 1:15–1:40 | Route | `skillsforge route --query "explain what is skillsforge about"` (holdout paraphrase). Show selected skill, score, trigger/antiTrigger reasons; mention holdout P/R gate. |
| 1:40–2:10 | Enforce | `skillsforge enforce --policy <deny-network sidecar>` with WebSearch stdin → PreToolUse `permissionDecision: deny` (fail-closed). |
| 2:10–2:50 | Receipt | `skillsforge verify-receipt dist/trust-receipt.json --package dist/claude-code --evaluation artifacts/evaluation/routing-report.json` (run `npm run eval` first if report missing). Show Cursor lossiness claim boundary. |

## Claim boundaries (say aloud)

- Claude Code: full installable flow.
- Cursor: deterministic export + lossiness proof.
- Codex / OpenCode: unsupported.
- Policy hooks: guardrails, not OS isolation.

## Rehearsal gate

Scripted offline path (`npm run demo`) must pass 10/10 clean runs under 2:50 wall clock for the fixture sequence.
