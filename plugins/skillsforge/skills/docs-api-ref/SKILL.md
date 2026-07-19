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

1. **Source of truth** — `help`, schemas, or code — not memory.
2. **Examples** — Copy-runnable; prefer repo binary path.
3. **Failures** — Exit codes and common denies.
4. **Safety** — Note dry-run / confirmation requirements.
5. **Verify** — Run one example; paste only verified output.

## Exit

- Flags match `help`
- At least one verified example
- No invented options

## Anti-patterns

- Documenting unbuilt flags
- `npx` CTAs when unpublished
- Omitting confirmation for writes

## Handoff

→ `docs-readme` / `docs-examples` / `prove-outcome`.

