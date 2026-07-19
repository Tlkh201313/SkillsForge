---
name: sec-secrets
description: Use when hunting leaked secrets or designing secret handling so keys stay out of git, logs, and skill bodies.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/sec-secrets/skillsforge.json"
---

# Sec Secrets

## Purpose

Find and prevent secret leakage in repo, skills, CI logs, and agent transcripts.

## When to Use

Pre-ship audit, suspected leak, new install/home path handling.

## Phases

1. **Scan** — Config, examples, fixtures, skill bodies, committed `.env*`.
2. **Classify** — Real secret vs placeholder vs public ID.
3. **Contain** — Rotate if real; purge guidance if needed (do not force-push unless asked).
4. **Prevent** — `.gitignore`, allowlists, redaction in `os-env`, no secret dumps in CLI.
5. **Verify** — Re-scan; document remaining placeholders.

## Exit

- Findings list with severity
- Rotation done or explicitly not needed
- Prevention note for authors

## Anti-patterns

- Printing full env dumps
- Committing temporary tokens
- Claiming tools that were not run

## Handoff

→ `sec-supply-chain` / `review-diff` / `skillshield`.

