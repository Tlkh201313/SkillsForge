---
name: lock-design
description: Use when UI or UX decisions must be frozen in docs/work/design-lock.md
  before implementation thrash.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/lock-design/skillsforge.json"
---

# Lock Design

## Purpose

Freeze visual/interaction decisions in `docs/work/design-lock.md` so `run-build` does not renegotiate the UI every turn.

## When to Use

After shape/plan when UI is in scope, or when redesign churn is blocking ship.

## Phases

1. **Inventory decisions** - Layout, typography, key flows, a11y constraints, explicit non-goals (no purple-glow defaults unless brand requires).
2. **Write lock** - `docs/work/design-lock.md` with must-keep rules and open-optional items.
3. **Cross-check brief** - Ensure lock serves `docs/work/brief.md` success criteria.
4. **Gate** - Implementation may proceed only against the lock; changes require editing the lock first.

## Exit

- Design-lock file committed in spirit (written now)
- Builder-facing "do not invent" list
- Next: `run-build` / frontend skill via `route --pack design`

## Anti-patterns

- Locking nothing ("be tasteful")
- Relitigating locked items mid-PR without updating the file
- Copying external design-skill essays

## Handoff

-> `run-build`. Design review later -> design-reviewer agent / `review-diff` with screenshots in `docs/work/proof.md`.

## Output Contract

- Decision or artifact: concrete result for lock design, including file path, command, or explicit no-change finding.
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

Prompt: "Do lock design fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

