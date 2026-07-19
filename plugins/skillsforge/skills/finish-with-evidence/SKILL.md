---
name: finish-with-evidence
description: Use when closing a trust-sensitive change and an evidence bundle plus
  proof artifact must accompany the done claim.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/finish-with-evidence/skillsforge.json"
---

# Finish With Evidence

## Purpose

Make "done" auditable: `skillsforge evidence --out artifacts/evidence` plus `docs/work/proof.md` (and receipts when packaging).

## When to Use

End of a trust, skill-library, or release-sensitive task.

## Phases

1. **Re-validate** - `skillsforge validate` on touched skills; `doctor --json` if install surface changed.
2. **Evidence** - `skillsforge evidence --out artifacts/evidence`.
3. **Receipts** - If a package was written: `receipt` + `verify-receipt`.
4. **Proof** - Finalize `docs/work/proof.md` linking evidence paths.
5. **Capture** - `skillsforge capture --insight "..."` for durable learning.

## Exit

- Evidence directory populated / commands cited
- Proof links match disk paths
- No done claim without artifacts when this skill was invoked

## Anti-patterns

- Empty evidence folders claimed as success
- Skipping verify-receipt after package
- Evidence from a different commit than the ship

## Handoff

-> `ship-release`. Gaps -> `verify-capability`.

## Output Contract

- Decision or artifact: concrete result for finish with evidence, including file path, command, or explicit no-change finding.
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

Prompt: "Do finish with evidence fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

