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

1. **Scope** — Direct vs transitive; security vs feature.
2. **Plan** — Target versions; note breaking changelogs.
3. **Apply** — Update manifests/lockfile only as needed.
4. **Verify** — `npm test` / project check subset that proves the bump.
5. **Record** — Residual risk (peer warnings, skipped majors).

## Exit

- Lockfile committed
- Verification commands listed with results
- No drive-by refactors

## Anti-patterns

- Blind `npm audit fix --force`
- Major bumps without reading changelog
- Committing `node_modules`

## Handoff

→ `sec-deps` / `sec-supply-chain` / `review-diff`.

