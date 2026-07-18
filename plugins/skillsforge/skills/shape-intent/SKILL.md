---
name: shape-intent
description: Use when a workstream needs a clear problem brief and success criteria
  before planning or coding starts.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/shape-intent/skillsforge.json"
---

# Shape Intent

## Purpose

Turn a fuzzy ask into a locked problem brief at `docs/work/brief.md` so later lifecycle skills (plan, build, prove) share one intent.

## When to Use

At the start of a Work OS loop, after `skillsforge vibe`, or when the user says “shape this” / “what are we solving?”

## Phases

1. **Interview for JTBD** — Capture who, job-to-be-done, constraints, and non-goals in plain language.
2. **Write the brief** — Update `docs/work/brief.md` with problem, users, success signals, and out-of-scope.
3. **Route check** — `skillsforge route --query "plan this work"` to confirm next skill (usually `plan-work` / `write-plan`).
4. **Light validate** — If shaping produced a new skill idea, note it; do not author yet — hand to `author-capability`.

## Exit

- `docs/work/brief.md` has concrete success criteria (not “make it better”)
- Open questions listed
- Next command/skill named (`plan-work` or `lock-design` if UI)

## Anti-patterns

- Jumping to code before the brief exists
- Copying third-party brainstorm templates verbatim
- Treating vibe catalog output as a product brief

## Handoff

→ `plan-work` / `write-plan` for `docs/work/plan.md`. Design-heavy → `lock-design` → `docs/work/design-lock.md`. Capture surprises with `skillsforge capture`.
