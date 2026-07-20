---
name: update-skill-library
description: Use when installed skills changed and the local SkillsForge library
  HTML/AI index must be refreshed for the current session.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/update-skill-library/skillsforge.json"
---

# Update Skill Library

## Purpose

Refresh or initialize the project-local SkillsForge library artifacts after skills, plugins, hosts, project selections, or session context changed.

## When to Use

Use this when the user says they added skills, installed a plugin, removed a skill, switched host sessions, wants `sf init`, wants the AI-readable library HTML updated, or wants the agent to pick the smallest project skill from the local index.

## Phases

1. **Initialize if missing** - If `skillsforge.config.json` or `artifacts/skillsforge-library/skillsforge-ai-index.html` is absent, run `skillsforge init --profile vibecoder --session-host <host> --json`.
2. **Refresh** - Otherwise run `skillsforge lib update --session-host <host> --json` or `node plugins/skillsforge/bin/skillsforge.mjs lib update --session-host <host> --json`.
3. **Check** - Confirm the JSON reports `ok: true`, real skill/workflow/source counts, `selectedSkills`, and output paths.
4. **Use AI index** - Point the agent to `artifacts/skillsforge-library/skillsforge-ai-index.html`; read that compact file before loading skill bodies.
5. **Optional project selection** - To change the project set, use `skillsforge lib select --skill <id>` or `skillsforge lib unselect --skill <id>` only when the user asked for project selection.
6. **Record usage** - After selecting a skill or workflow, use `skillsforge session remember --query "<task>" --skill <id> --workflow <id> --outcome "<compact result>"` when session memory is enabled.
7. **Keep writes narrow** - Do not install, delete, or mutate real skill folders from this skill. Installed-skill removal is a separate explicit localhost mutation path.

## Exit

- `skillsforge-library.json`, `skillsforge-library.html`, and `skillsforge-ai-index.html` exist
- Counts are reported from command output only
- AI-facing path and refresh command are shown
- Project selected skills and session score are shown when available
- Any errors are shown without inventing missing stats

## Anti-patterns

- Recommending a skill that is absent from the refreshed index
- Deleting installed skill folders while updating the index
- Loading every `SKILL.md` before consulting the compact AI index
- Saving chat transcripts as memory; session memory is only skill/workflow/agent usage metadata
- Claiming marketplace, certification, or benchmark numbers not present in the command output

## Output Contract

- Decision or artifact: concrete result for update skill library, including file path, command, or explicit no-change finding.
- Evidence: exact source, command summary, or user-provided fact used.
- Risk: one caveat or "No material risk found".
- Next step: one SkillsForge command, AI index path, or selected skill/workflow only when it moves work forward.

## Verification

- Run the smallest relevant route, validate, lint, test, dry-run, or evidence command.
- If no command applies, state inspected evidence and why automated proof was unavailable.
- Separate verified facts from assumptions in the final answer.

## Failure Modes

- Missing evidence: stop and mark the result unverified.
- Conflicting instructions: follow the newest user instruction and state the conflict.
- Risky write/delete/install: require explicit confirmation before action.

## OG Output Pressure Test

Prompt: "Do update skill library fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.
