---
name: cso-skill-description
description: Use when editing a skill description so it starts with Use when and
  stays free of workflow-summary phrasing for CSO compliance.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/cso-skill-description/skillsforge.json"
---

# CSO Skill Description

## Purpose

Bring skill `description` fields in line with SkillsForge CSO: start with `Use when...`, <=500 chars, and avoid workflow-summary wording that fails `quality` CSO checks.

## When to Use

When `skillsforge quality --skill <dir>` reports CSO failure, or before publishing a skill.

## Phases

1. **Score** - Run `skillsforge quality --skill <dir> --json` and inspect `csoOk` / checks.
2. **Rewrite description** - Trigger-oriented; no "first/then/step N/run the/dispatch" summary of the body.
3. **Keep body deep** - Phases stay in `SKILL.md` body, not frontmatter.
4. **Re-score** - Quality again; heroes still need >=85 overall.

## Exit

- `csoOk: true`
- Description still matches real triggers
- No third-party text pasted into description

## Anti-patterns

- Stuffing the whole workflow into description
- Empty "Use when needed" stubs
- Changing `name` to pass frontmatter checks incorrectly

## Handoff

-> `author-capability` for broader structural fixes; `pressure-test-skill` if triggers are weak.

## Output Contract

- Decision or artifact: concrete result for cso skill description, including file path, command, or explicit no-change finding.
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

Prompt: "Do cso skill description fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

