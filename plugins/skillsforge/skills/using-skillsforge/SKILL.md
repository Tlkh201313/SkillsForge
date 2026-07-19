---
name: using-skillsforge
description: Use when a SkillsForge session starts and the agent needs to know
  which SkillsForge commands, checks, and evidence surfaces are available.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/using-skillsforge/skillsforge.json"
---

# Using SkillsForge

## Purpose

Orient the agent to the SkillsForge trust and routing layer: which CLI commands exist, when to validate vs route vs package, and where work artifacts live under `docs/work/`.

## When to Use

At session start, after a host install, or whenever the user asks which SkillsForge command applies.

## Token budget (iron law for AI CLIs)

Before raw `git` / `npm test` / `rg` / multi-file reads, use compact operator commands so context stays small:

| Instead of | Use |
|---|---|
| `git status` / long `git diff` | `sf slim status` / `sf slim diff` |
| Grep + open many files for "where is X" | `sf map symbol\|callers\|impact <name>` or `sf map explore --query ...` |
| Pasting full test logs | `sf slim test -- npm test` (or `sf slim run -- <cmd>`) |
| Loading many skill bodies | `sf route` / `sf digest --query ...` then **one** `SKILL.md`; `sf tokens --catalog --limit 10` |
| Guessing next step | `sf next` |

Aliases: `sf` ≡ `skillsforge`. Build the map once: `sf map index`. Check savings: `sf slim gain`.

## Phases

1. **Surface health** - Run `skillsforge doctor --json` (or `node "${CLAUDE_PLUGIN_ROOT}/bin/skillsforge.mjs" doctor --json`) and report PASS/FAIL checks only.
2. **Map the spine** - Point to validate -> route -> forge -> package -> evidence; do not invent commands outside `skillsforge --help`.
3. **Route before loading** - Use `skillsforge catalog --pack <id>` or `skillsforge route --query "<task>"`; load only the chosen `SKILL.md`, not the whole catalog.
4. **Name the Work OS paths** - `docs/work/brief.md`, `plan.md`, `design-lock.md`, `proof.md`, `ship-notes.md`, `learning.md`, `findings.md`.
5. **Offer the magical moment** - Suggest `node plugins/skillsforge/bin/skillsforge.mjs vibe` in a clone, or `skillsforge catalog --profile vibe` after install.
6. **Stay compact** - Prefer `sf slim` / `sf map` / `sf digest` over raw shell dumps for the rest of the session.

## Exit

- Doctor (or validate) result summarized with concrete failures
- At least one next command named (`route`, `catalog`, `vibe`, `digest`, `map`, `slim`, or `validate`)
- No claim of sandboxing or certification beyond scanner/hook evidence

## Anti-patterns

- Loading every skill body before routing
- Reimplementing routing in prose instead of calling `skillsforge route`
- Editing skills during an orientation session
- Inventing Session IDs, credentials, or marketplace claims
- Dumping full `git diff` / test / ripgrep output into the model when `sf slim` exists

## Handoff

If the user has a concrete task, run `skillsforge digest --query "<task>"` or `skillsforge route --query "<task>"`, then read only the selected skill. If they want pack discovery, use `skillsforge catalog` / skill `browse-catalog`. Capture session learnings with `skillsforge capture --insight "..."`.

## Quick Reference

- `skillsforge validate --all`
- `skillsforge route --query "..."`
- `skillsforge digest --query "..."`
- `skillsforge map index` / `map symbol|callers|impact|explore`
- `skillsforge slim status|diff|test|run|rg|gain`
- `skillsforge tokens --catalog --limit 10`
- `skillsforge evidence --out artifacts/evidence`
- `skillsforge package --host codex --skill <dir> --dry-run`

## Output Contract

- Decision or artifact: concrete result for using skillsforge, including file path, command, or explicit no-change finding.
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

Prompt: "Do using skillsforge fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

