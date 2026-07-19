---
name: docs-readme
description: Use when updating README for operators or judges so claims stay verifiable and demo commands actually run.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/docs-readme/skillsforge.json"
---

# Docs Readme

## Purpose

Keep README accurate: what it is, why it exists, demo path, safety model - no fake stats or dead CTAs.

## When to Use

Release notes, hackathon submit, post-feature README sync.

## Phases

1. **Audience** - Judges vs operators; lead with Work OS value.
2. **Claims audit** - Every count/command must match `catalog` / `help` / tests.
3. **Demo** - Repo binary path; poster + MP4 honesty for GitHub.
4. **Safety** - validate/package/hooks/receipts as layer, not OS sandbox.
5. **Verify** - Run the demo command; fix drift before merge.

## Exit

- README matches VERSION
- No `npx skillsforge` without not-published warning
- Media paths exist

## Anti-patterns

- Superlatives without evidence
- Removed renderer CTAs when source is absent
- Inflating skill depth beyond evidence-backed contracts

## Handoff

Use `readme-claim-auditor` agent / `prove-outcome` / `skillsforge demo`.

## Output Contract

- Decision or artifact: concrete result for docs readme, including file path, command, or explicit no-change finding.
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

Prompt: "Do docs readme fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.
