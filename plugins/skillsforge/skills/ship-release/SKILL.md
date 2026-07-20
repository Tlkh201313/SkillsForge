---
name: ship-release
description: Use when preparing a release note and ship checklist after proof is
  accepted, including package and receipt steps when skills ship.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/ship-release/skillsforge.json"
---

# Ship Release

## Purpose

Close the Work OS loop: package what needs packaging, record ship notes, and leave a learning hook - only after proof exists.

## When to Use

When `docs/work/proof.md` (or equivalent evidence) supports a ship decision.

## Phases

1. **Gate on proof** - Read `docs/work/proof.md`; if blockers remain, stop and return to `prove-outcome`.
2. **Package / receipt (when skills)** - `skillsforge package --host codex --skill <dir> --dry-run` then `--write` on approval; `skillsforge receipt --out dist/trust-receipt.json`; `skillsforge verify-receipt`.
3. **Ship notes** - Write `docs/work/ship-notes.md` (what shipped, hosts, version/VERSION touch if applicable, rollback).
4. **Learn** - `skillsforge capture --insight "..."` -> `docs/work/learning.md` / `artifacts/capture`.

## Exit

- Ship notes filed
- Receipts verified when packaging occurred
- Capture entry or explicit "nothing to learn" note

## Anti-patterns

- Shipping without proof
- `--force` package overwrite without user intent
- Skipping verify-receipt

## Handoff

Announce done with links to proof + ship-notes. Follow-ups -> `forge-from-capture` if learnings repeat, or `browse-catalog` for next pack.

## Output Contract

- Decision or artifact: concrete result for ship release, including file path, command, or explicit no-change finding.
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

Prompt: "Do ship release fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

