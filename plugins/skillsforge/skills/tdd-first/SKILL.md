---
name: tdd-first
description: Use when implementation is about to start and failing tests or pressure
  fixtures must exist before production code or skill body changes.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/tdd-first/skillsforge.json"
---

# TDD First

## Purpose

Enforce red → green → refactor: no production code (and no discipline skill body) without a failing test or pressure fixture that defines done.

## When to Use

Before implementing app code or authoring methodology/discipline skills.

## Phases

1. **Name the behavior** — One testable claim from `docs/work/plan.md` or the user story.
2. **Red** — Add a failing unit/integration test *or* for skills: `pressure/baseline.json` then `skillsforge pressure --skill <dir>` expecting failure.
3. **Green** — Implement the minimum to pass; for skills use `author-capability` / forge then re-pressure.
4. **Refactor** — Clean up; re-run tests and `skillsforge validate` / `quality --skill` as applicable.
5. **Record** — Note test paths in `docs/work/proof.md` as you go.

## Exit

- Evidence of an initial failing run
- Passing suite / pressure after change
- No “we’ll test later” escapes without user override

## Anti-patterns

- Writing implementation before the red bar
- Deleting failing tests to go green
- Copying third-party TDD skill prose

## Handoff

→ `run-build` for broader implementation, `verify-before-done` before claiming complete, `pressure-test-skill` for skill-specific fixtures.
