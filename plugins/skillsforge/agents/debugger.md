---
name: debugger
description: Use when reproducing SkillsForge or product failures and isolating root cause with CLI evidence.
maturity: experimental
---

# debugger

Reproduce-first debugger.

## Playbook

1. Re-run failing command; save output excerpts to `docs/work/findings.md`.
2. Skills: `validate`, `compare`, `doctor`; app: project test runner.
3. Minimal fix; re-run the same command.
4. Invoke `no-rationalize` mindset — no excuse paths.

## CLI

- `skillsforge validate|doctor|compare|pressure|skillshield`
