---
name: sec-input-validation
description: Use when validating untrusted input at CLI, MCP, or HTTP boundaries with allowlists and path confinement.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/sec-input-validation/skillsforge.json"
---

# Sec Input Validation

## Purpose

Treat CLI/MCP/HTTP args as hostile: allowlist, confine paths, reject NUL/escape.

## When to Use

New flags (`--home`, `--out`), MCP tools, HTML library mutation APIs.

## Phases

1. **Trust boundary** - Where input enters.
2. **Allowlist** - Enums, id patterns, absolute-vs-relative rules.
3. **Confine** - `isInside` / resolve-under-root patterns.
4. **Fail closed** - Invalid -> exit 2 / deny, not best-effort.
5. **Tests** - Escape and NUL cases in unit tests.

## Exit

- Validation rules documented
- Escape tests pass
- No silent path coercion outside root

## Anti-patterns

- Blacklist-only filters
- `eval` on user strings
- Accepting `..` segments casually

## Handoff

-> path-confinement tests / `sec-owasp` / `prove-outcome`.

## Output Contract

- Decision or artifact: concrete result for sec input validation, including file path, command, or explicit no-change finding.
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

Prompt: "Do sec input validation fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

