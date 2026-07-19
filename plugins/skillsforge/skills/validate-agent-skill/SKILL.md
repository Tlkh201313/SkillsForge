---
name: validate-agent-skill
description: Use when creating, reviewing, debugging, or preparing a SKILL.md package
  for distribution and structural Agent Skills checks must pass before quality
  judgment.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/validate-agent-skill/skillsforge.json"
---

# Validate an Agent Skill

## Purpose

Prove structural conformance of a skill directory (frontmatter, naming, links, optional Claude Code extensions, and sidecar policy) before anyone debates writing quality.

## When to Use

On create/review/debug of a skill package, before `package`, `install`, or PR merge of skill trees.

## Phases

1. **Locate** - Identify the directory containing `SKILL.md` (and usually `skillsforge.json`).
2. **Canonical validate** - Run `skillsforge validate <skill-dir>` or `node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" validate --profile claude-code <skill-dir>`.
3. **Bulk option** - For library health: `skillsforge validate --all --json`.
4. **Report** - List failures with field/path and a concrete fix; advisory notes only after blockers.
5. **Separate quality** - Reminder: validate != quality. Follow with `skillsforge quality --skill <dir>` when the user asks about CSO/body depth.

## Exit

- CLI exit code interpreted (0 success, 1 validation/policy failure, 2 bad usage)
- Blocking findings enumerated with remediation
- No silent file edits unless the user requested fixes

## Anti-patterns

- Judging "good skill" from prose without running validate
- Editing during validate-only requests
- Claiming safety certification from structural PASS alone

## Handoff

On PASS -> `verify-capability` / `skillsforge doctor` for installed-set health, or `skillsforge package --host codex --skill <dir> --dry-run`. On FAIL -> `author-capability` to repair via forge.

## Output Contract

- Decision or artifact: concrete result for validate agent skill, including file path, command, or explicit no-change finding.
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

Prompt: "Do validate agent skill fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

