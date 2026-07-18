---
name: using-skillsforge
description: Use when a SkillsForge session starts and the agent needs to know
  which SkillsForge commands, checks, and evidence surfaces are available.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/using-skillsforge/skillsforge.json"
---

# Using SkillsForge

## Purpose

Orient the agent to the SkillsForge trust and routing layer: which CLI commands exist, when to validate vs route vs package, and where work artifacts live under `docs/work/`.

## When to Use

At session start, after a host install, or whenever the user asks which SkillsForge command applies.

## Phases

1. **Surface health** — Run `skillsforge doctor --json` (or `node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" doctor --json`) and report PASS/FAIL checks only.
2. **Map the spine** — Point to validate → route → forge → package → evidence; do not invent commands outside `skillsforge --help`.
3. **Name the Work OS paths** — `docs/work/brief.md`, `plan.md`, `design-lock.md`, `proof.md`, `ship-notes.md`, `learning.md`, `findings.md`.
4. **Offer the magical moment** — Suggest `npx skillsforge vibe` or `skillsforge catalog --profile vibe` when the user wants a quick start.

## Exit

- Doctor (or validate) result summarized with concrete failures
- At least one next command named (`route`, `catalog`, `vibe`, or `validate`)
- No claim of sandboxing or certification beyond scanner/hook evidence

## Anti-patterns

- Reimplementing routing in prose instead of calling `skillsforge route`
- Editing skills during an orientation session
- Inventing Session IDs, credentials, or marketplace claims

## Handoff

If the user has a concrete task, run `skillsforge route --query "<task>"`. If they want pack discovery, use `skillsforge catalog` / skill `browse-catalog`. Capture session learnings with `skillsforge capture --insight "..."`.

## Quick Reference

- `skillsforge validate --all`
- `skillsforge route --query "..."`
- `skillsforge evidence --out artifacts/evidence`
- `skillsforge package --host codex --skill <dir> --dry-run`
