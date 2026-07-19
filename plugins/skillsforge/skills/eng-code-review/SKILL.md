---
name: eng-code-review
description: Use when reviewing a diff for correctness, trust regressions, and missing verification before approve or request-changes.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-code-review/skillsforge.json"
---

# Eng Code Review

## Purpose

Produce a severity-tagged review against the brief/plan — not a style-only pass.

## When to Use

PR review, pre-merge checklist, or after `run-build` when humans ask for eng review.

## Phases

1. **Intent** — Read PR description / `docs/work/brief.md` / plan tasks.
2. **Diff map** — List touched paths; flag surprise directories.
3. **Correctness** — Logic, edge cases, error paths, concurrency.
4. **Trust** — Secrets, policy sidecars, validate/skillshield on skill changes.
5. **Verdict** — APPROVE or REQUEST CHANGES with file:line anchors.

## Exit

- Explicit verdict
- Blockers have fix hints
- Nits clearly labeled non-blocking

## Anti-patterns

- Rubber-stamping generated scaffolds
- Blocking on preference without risk
- Ignoring failing CI / validate

## Handoff

REQUEST CHANGES → author + `run-build`. APPROVE → `qa-flow` / `prove-outcome`.

