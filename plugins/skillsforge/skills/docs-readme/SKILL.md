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

Keep README accurate: what it is, why it exists, demo path, safety model — no fake stats or dead CTAs.

## When to Use

Release notes, hackathon submit, post-feature README sync.

## Phases

1. **Audience** — Judges vs operators; lead with Work OS value.
2. **Claims audit** — Every count/command must match `catalog` / `help` / tests.
3. **Demo** — Repo binary path; poster + MP4 honesty for GitHub.
4. **Safety** — validate/package/hooks/receipts as layer, not OS sandbox.
5. **Verify** — Run the demo command; fix drift before merge.

## Exit

- README matches VERSION
- No `npx skillsforge` without not-published warning
- Media paths exist

## Anti-patterns

- Superlatives without evidence
- Remotion render CTAs when source removed
- Inflating skill depth beyond lean scaffolds

## Handoff

→ `readme-claim-auditor` agent / `prove-outcome` / `skillsforge demo`.

