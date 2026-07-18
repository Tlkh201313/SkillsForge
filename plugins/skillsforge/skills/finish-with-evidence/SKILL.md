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

Make “done” auditable: `skillsforge evidence --out artifacts/evidence` plus `docs/work/proof.md` (and receipts when packaging).

## When to Use

End of a trust, skill-library, or release-sensitive task.

## Phases

1. **Re-validate** — `skillsforge validate` on touched skills; `doctor --json` if install surface changed.
2. **Evidence** — `skillsforge evidence --out artifacts/evidence`.
3. **Receipts** — If a package was written: `receipt` + `verify-receipt`.
4. **Proof** — Finalize `docs/work/proof.md` linking evidence paths.
5. **Capture** — `skillsforge capture --insight "..."` for durable learning.

## Exit

- Evidence directory populated / commands cited
- Proof links match disk paths
- No done claim without artifacts when this skill was invoked

## Anti-patterns

- Empty evidence folders claimed as success
- Skipping verify-receipt after package
- Evidence from a different commit than the ship

## Handoff

→ `ship-release`. Gaps → `verify-capability`.
