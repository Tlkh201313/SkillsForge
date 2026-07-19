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

Replace "trust me it's done" with a proof record in `docs/work/proof.md` plus optional `skillsforge evidence` bundle.

## When to Use

After implementation/QA and before `ship-release`, or when a reviewer asks for evidence.

## Phases

1. **Collect commands** - Re-run or cite: `skillsforge validate` (relevant paths), tests, `skillsforge quality` / `lint-skill` for touched skills, `skillsforge skillshield` if policy-sensitive.
2. **Write proof** - Update `docs/work/proof.md` with command -> result -> artifact paths (`artifacts/evidence`, coverage, screenshots).
3. **Emit bundle** - `skillsforge evidence --out artifacts/evidence` when shipping a trust story.
4. **Gap list** - Document what was not proven and why.

## Exit

- Proof file cites real commands and exit codes/results
- Failures not papered over
- Ready for `ship-release` or explicit block

## Anti-patterns

- Proof that only restates the plan
- Claiming validate PASS without running it
- Deleting failing logs

## Handoff

-> `ship-release` / `finish-with-evidence`. If proof fails -> `debug-issue` or `verify-before-done`.

## Output Contract

- Decision or artifact: concrete result for prove outcome, including file path, command, or explicit no-change finding.
- Evidence: exact source, command summary, or user-provided fact used.
- Risk: one caveat or "No material risk found".
- Next step: one SkillsForge command or skill only when it moves work forward.

## Verification

- Run the smallest relevant route, validate, lint, test, dry-run, or evidence command.
- If no command applies, state inspected evidence and why automated proof was unavailable.
- Separate verified facts from assumptions in the final answer.

## Failure Modes

- Missing evidence: stop and mark the result unverified.
- Conflicting instructions: follow the newest user instruction and state the conflict.
- Risky write/delete/install: require explicit confirmation before action.

## OG Output Pressure Test

Prompt: "Do prove outcome fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

