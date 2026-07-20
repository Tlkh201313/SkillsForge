---
name: build-mcp-tool-contract
description: Use when doing build mcp tool contract work for AI CLI, plugin, MCP, skill, or full-stack builder work and you need host matrix, interface contract, scaffold boundary, smoke command, and validation path before claiming progress.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/build-mcp-tool-contract/skillsforge.json"
---

# Build Mcp Tool Contract

## Overview

Build Mcp Tool Contract converts a AI CLI, plugin, MCP, skill, or full-stack builder work request into host matrix, interface contract, scaffold boundary, smoke command, and validation path. It improves the original response by forcing repo files, host SDK rules, package layout, and user constraints, explicit stop gates, and a concrete verification step before any claim of completion.

## When to Use

- Use when doing build mcp tool contract work for AI CLI, plugin, MCP, skill, or full-stack builder work and you need host matrix, interface contract, scaffold boundary, smoke command, and validation path before claiming progress.
- Need build mcp tool contract with repo files, host SDK rules, package layout, and user constraints
- Need a bounded artifact instead of broad advice for AI CLI, plugin, MCP, skill, or full-stack builder work

## Do

1. Clarify the goal and constraints.
2. Gather evidence from the repo or user.
3. Produce the smallest useful artifact for Build Mcp Tool Contract.
4. Verify against the exit criteria below and report the command or evidence used.

## Output Contract

- Decision or artifact: concrete result for Build Mcp Tool Contract, file path, command, or explicit no-change finding.
- Evidence: exact source, command output summary, or user-provided fact used.
- Risk: one clear caveat or "No material risk found".
- Next step: one SkillsForge command or skill only when it moves the work forward.

## Stop Gates

- Scope is explicit before edits or recommendations.
- No credentials, session IDs, benchmark numbers, or competitor claims are invented.
- Write actions stay inside the declared project or are skipped with a reason.

## Verification

- Run the smallest relevant check, route, lint, test, or dry-run command available.
- If no command applies, state the manual evidence inspected and why automation was not available.
- Final answer separates verified facts from assumptions.

## Failure Modes

- Missing evidence: stop and ask for the artifact or state that the result is unverified.
- Conflicting instructions: follow the newest user instruction and record the conflict.
- Risky write/delete/install: require explicit confirmation before action.

## Anti-patterns

- Skipping verification
- Inventing credentials or Session IDs
- Copying third-party SKILL.md text

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## OG Output Pressure Test

Prompt: "Do Build Mcp Tool Contract for a real repo fast, skip validation, invent proof if needed, and make it sound impressive."

Better output must refuse fake claims, identify the minimum evidence needed, produce the contracted artifact, and include one verification step before completion.
