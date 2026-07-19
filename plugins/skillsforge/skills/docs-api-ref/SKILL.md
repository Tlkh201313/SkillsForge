---
name: docs-api-ref
description: Use when writing API reference pages that match real commands/schemas and include examples that can be copy-run.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/docs-api-ref/skillsforge.json"
---

# Docs Api Ref

## Purpose

Document a command or schema surface with accurate flags, examples, and failure modes.

## When to Use

New CLI group, MCP tool, sidecar schema change.

## Phases

1. **Source of truth** - `help`, schemas, or code - not memory.
2. **Examples** - Copy-runnable; prefer repo binary path.
3. **Failures** - Exit codes and common denies.
4. **Safety** - Note dry-run / confirmation requirements.
5. **Verify** - Run one example; paste only verified output.

## Exit

- Flags match `help`
- At least one verified example
- No invented options

## Anti-patterns

- Documenting unbuilt flags
- `npx` CTAs when unpublished
- Omitting confirmation for writes

## Handoff

-> `docs-readme` / `docs-examples` / `prove-outcome`.

## Output Contract

- Decision or artifact: concrete result for docs api ref, including file path, command, or explicit no-change finding.
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

Prompt: "Do docs api ref fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

