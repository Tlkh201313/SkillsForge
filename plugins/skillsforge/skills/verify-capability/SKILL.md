---
name: verify-capability
description: Use when checking whether a skill is safe and correct, including
  validation failures, undeclared capabilities, dependency cycles, and routing
  regressions.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/verify-capability/skillsforge.json"
---

# Verify a Capability

## Purpose

Run the verification contract end-to-end: structural validation, capability policy scan, routing evaluation, and trust receipts - explain evidence only; never override policy.

## When to Use

Before packaging, after editing any skill/sidecar, when routing looks wrong, or when integrity of a receipt is in doubt.

## Phases

1. **Doctor / validate** - `skillsforge doctor --json` for plugin+installed set, or `skillsforge validate --json <path>` for one skill. Treat JSON `ok`, `findings` (`rule`, `evidence`, `fix`, `blocking`) as authoritative.
2. **Routing regressions** - If triggers/modes changed: `skillsforge eval`.
3. **Integrity** - `skillsforge receipt --out dist/trust-receipt.json` then `skillsforge verify-receipt <file>` (add `--package <dir>` when hashing packaged bytes).
4. **Evidence bundle** - For ship/CI: `skillsforge evidence --out artifacts/evidence`.
5. **SkillShield (optional)** - `skillsforge skillshield --skill <dir>` for unsafe-pattern scan; do not conflate with validate.

## Exit

- Blocking findings listed with exact remediation
- Explicit statement of what was *not* proven (no sandbox/certification claims)
- Zero skill file edits during verify - **Never edit** skill or sidecar files in this skill

## Anti-patterns

- Editing sidecars "to make doctor green" without user approval
- Inventing PASS when CLI exited 1
- Skipping receipt verify after packaging

## Handoff

Failures -> `author-capability` or `validate-agent-skill`. Clean verify -> `skillsforge package` / `finish-with-evidence` / work artifact `docs/work/proof.md`.

## Output Contract

- Decision or artifact: concrete result for verify capability, including file path, command, or explicit no-change finding.
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

Prompt: "Do verify capability fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

