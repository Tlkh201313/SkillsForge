---
name: prove-outcome
description: Use when claiming work is done and proof artifacts must show commands
  run, results, and remaining risk under docs/work/proof.md.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/prove-outcome/skillsforge.json"
---

# Prove Outcome

## Purpose

Replace “trust me it’s done” with a proof record in `docs/work/proof.md` plus optional `skillsforge evidence` bundle.

## When to Use

After implementation/QA and before `ship-release`, or when a reviewer asks for evidence.

## Phases

1. **Collect commands** — Re-run or cite: `skillsforge validate` (relevant paths), tests, `skillsforge quality` / `lint-skill` for touched skills, `skillsforge skillshield` if policy-sensitive.
2. **Write proof** — Update `docs/work/proof.md` with command → result → artifact paths (`artifacts/evidence`, coverage, screenshots).
3. **Emit bundle** — `skillsforge evidence --out artifacts/evidence` when shipping a trust story.
4. **Gap list** — Document what was not proven and why.

## Exit

- Proof file cites real commands and exit codes/results
- Failures not papered over
- Ready for `ship-release` or explicit block

## Anti-patterns

- Proof that only restates the plan
- Claiming validate PASS without running it
- Deleting failing logs

## Handoff

→ `ship-release` / `finish-with-evidence`. If proof fails → `debug-issue` or `verify-before-done`.
