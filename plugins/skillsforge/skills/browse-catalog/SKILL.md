---
name: browse-catalog
description: Use when discovering SkillsForge packs, profiles, or skill ids before
  installing or routing to a domain skill.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/browse-catalog/skillsforge.json"
---

# Browse Catalog

## Purpose

Help the user pick packs/profiles/skills from the SkillsForge catalog without guessing ids - powered by `skillsforge catalog` and `catalog/skillsforge.catalog.yaml`.

## When to Use

When the user asks what packs exist, which profile to install (`vibe`, `core`, `full`, ...), or needs a skill id for routing.

## Phases

1. **List or filter** - Run `skillsforge catalog` (`--pack <id>`, `--profile <id>`, `--search <text>`, `--json` as needed).
2. **Explain profiles** - Summarize only profiles returned (e.g. `vibe` = trust + lifecycle + browse; `full` = maximal surface).
3. **Suggest next CLI** - For install planning: `skillsforge install --list`; for task fit: `skillsforge route --query "..."`.
4. **Optional stocktake** - `skillsforge stocktake` when comparing installed set vs catalog.

## Exit

- Concrete pack/profile/skill ids from catalog output
- No invented pack names
- Recommended follow-up command named

## Anti-patterns

- Dumping entire 300+ skill list unprompted
- Claiming a skill is installed without `install --list` / stocktake evidence
- Routing domain skills as `auto` when inventory marks them `explicit`

## Handoff

Hand off to `using-skillsforge` for CLI orientation, `route-capability` for task matching, or `scaffold` / `author-capability` when creating a missing skill.

## Output Contract

- Decision or artifact: concrete result for browse catalog, including file path, command, or explicit no-change finding.
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

Prompt: "Do browse catalog fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

