---
name: eng-error-handling
description: Use when designing failure paths so errors are typed, logged without secrets, and recoverable with clear operator next steps.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-error-handling/skillsforge.json"
---

# Eng Error Handling

## Purpose

Make failures actionable: stable codes, no secret leakage, and recovery steps.

## When to Use

CLI exit codes, API errors, hook deny messages, library serve failures.

## Phases

1. **Taxonomy** - User error vs system vs policy deny.
2. **Contracts** - Exit codes / HTTP / JSON error shape.
3. **Redaction** - Strip tokens/paths as needed.
4. **Recovery** - Next command the operator should run.
5. **Tests** - Failure-path tests for at least one case each.

## Exit

- Error contract documented
- Tests cover deny/invalid usage
- No secret-bearing logs in happy examples

## Anti-patterns

- Swallowing errors
- Dumping full env on failure
- Vague "something went wrong"

## Handoff

-> `eng-logging` / `run-build` / `prove-outcome`.

## Output Contract

- Decision or artifact: concrete result for eng error handling, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng error handling fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

