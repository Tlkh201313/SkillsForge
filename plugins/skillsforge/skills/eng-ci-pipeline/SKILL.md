---
name: eng-ci-pipeline
description: Use when adding or fixing CI gates and you need a minimal green path with fail-closed checks and honest artifacts.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-ci-pipeline/skillsforge.json"
---

# Eng Ci Pipeline

## Purpose

Make the smallest CI path that fails closed on trust/validation and reports usable artifacts.

## When to Use

New repo CI, flaky jobs, missing validate/test gates.

## Phases

1. **Inventory** - Existing workflows and required secrets (no secret dumps).
2. **Minimal path** - install -> validate/test -> build/evidence.
3. **Fail closed** - Do not continue after validate/test failure.
4. **Artifacts** - Upload evidence/scoreboard paths that exist.
5. **Prove** - Confirm the gate blocks on a known-bad change, or document why not.

## Exit

- Workflow file updated with named gates
- Local equivalent commands documented
- No fake green (skipping required checks)

## Anti-patterns

- `continue-on-error` on trust gates
- Hiding failures with `|| true`
- Requiring unavailable secrets for the happy path

## Handoff

-> `prove-outcome` / `skillsforge evidence`. Host packaging -> `package` / `hosts`.

## Output Contract

- Decision or artifact: concrete result for eng ci pipeline, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng ci pipeline fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

