---
name: eng-api-design
description: Use when designing or changing an API contract and you need compatibility, errors, and verification notes before implementation.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-api-design/skillsforge.json"
---

# Eng Api Design

## Purpose

Lock a small, versioned API contract (shapes, errors, auth assumptions) before coding handlers.

## When to Use

New endpoints, breaking field changes, public SDK surfaces.

## Phases

1. **Consumers** - Who calls this and what must not break.
2. **Resources** - Nouns, IDs, pagination, idempotency keys.
3. **Errors** - Status map + stable error codes.
4. **Compat** - Additive vs breaking; migration note if needed.
5. **Verify plan** - Contract tests or example requests listed.

## Exit

- Contract sketch in `docs/work/` or OpenAPI fragment
- Compat decision recorded
- Test/verify commands named

## Anti-patterns

- Coding handlers before contract agreement
- Silent breaking changes
- Vague REST-ish blobs without error model

## Handoff

-> `write-plan` / `run-build`. Security-sensitive -> `sec-authz` / `sec-input-validation`.

## Output Contract

- Decision or artifact: concrete result for eng api design, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng api design fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

