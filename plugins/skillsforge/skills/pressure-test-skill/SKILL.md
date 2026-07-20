---
name: pressure-test-skill
description: Use when authoring or checking discipline skills so pressure fixtures
  fail before the skill body is considered done.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/pressure-test-skill/skillsforge.json"
---

# Pressure Test Skill

## Purpose

SkillsForge iron law for discipline skills: a failing `pressure/` fixture exists before the skill body is trusted - enforced via `skillsforge pressure --skill <dir>`.

## When to Use

When creating/editing methodology or other discipline skills, or when SkillShield/quality is not enough to prove behavior.

## Phases

1. **Baseline first** - Write `pressure/baseline.json` (and related fixtures) expecting known violations.
2. **Run pressure** - `skillsforge pressure --skill <dir>`; confirm red where required.
3. **Author/fix skill** - Use `author-capability` / forge; keep original SkillsForge prose only.
4. **Go green** - Re-pressure until fixtures match intent; also `skillsforge quality --skill <dir>` (hero >=85).
5. **SkillShield** - `skillsforge skillshield --skill <dir>` for unsafe patterns.

## Exit

- Pressure command exercised with interpreted results
- Fixtures committed beside the skill
- Quality/CSO acceptable

## Anti-patterns

- Skill body without pressure fixtures for discipline packs
- Editing fixtures to hide real regressions
- Copying third-party pressure text

## Handoff

-> `validate-agent-skill` / `verify-capability`. Batch: `skillsforge batch --pack methodology --action pressure`.

## Output Contract

- Decision or artifact: concrete result for pressure test skill, including file path, command, or explicit no-change finding.
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

Prompt: "Do pressure test skill fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

