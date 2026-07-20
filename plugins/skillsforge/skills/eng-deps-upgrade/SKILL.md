---
name: eng-deps-upgrade
description: Use when upgrading dependencies with a bounded blast radius, lockfile discipline, and regression checks before merge.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/eng-deps-upgrade/skillsforge.json"
---

# Eng Deps Upgrade

## Purpose

Upgrade deps safely: one concern per PR when possible, verify, and record risk.

## When to Use

Routine bumps, audit findings, engine changes.

## Phases

1. **Scope** - Direct vs transitive; security vs feature.
2. **Plan** - Target versions; note breaking changelogs.
3. **Apply** - Update manifests/lockfile only as needed.
4. **Verify** - `npm test` / project check subset that proves the bump.
5. **Record** - Residual risk (peer warnings, skipped majors).

## Exit

- Lockfile committed
- Verification commands listed with results
- No drive-by refactors

## Anti-patterns

- Blind `npm audit fix --force`
- Major bumps without reading changelog
- Committing `node_modules`

## Handoff

-> `sec-deps` / `sec-supply-chain` / `review-diff`.

## Output Contract

- Decision or artifact: concrete result for eng deps upgrade, including file path, command, or explicit no-change finding.
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

Prompt: "Do eng deps upgrade fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

