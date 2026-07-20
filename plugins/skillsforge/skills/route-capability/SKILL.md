---
name: route-capability
description: Use when deciding which SkillsForge skill applies to a task and an
  explained, scored selection is needed.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/route-capability/skillsforge.json"
---

# Route a Capability

## Purpose

Return an explainable skill selection from the bundled router (`lib/capabilities/router.mjs` via `skillsforge route`) - never a guessed skill name.

## When to Use

When multiple skills could apply, when pack-scoped routing is needed, or when the user asks "which skill should I use?"

## Phases

1. **Query** - Run `skillsforge route --query "<user task>"`. Optionally scope with pack-aware prompts (e.g. include pack keywords) so `routing.mode: explicit` skills can win when intended.
2. **Explain** - Present winner (or null), score margin, trigger hits, anti-trigger hits, and rejected alternatives from the JSON/CLI output.
3. **Respect mode** - Do not force-invoke `explicit` skills unless the user or pack context selected them; `auto` heroes may activate on trigger evidence alone.
4. **Tie-break** - If scores collide, trust the router's alphabetical tie-break; do not override.

## Exit

- Router output quoted or paraphrased without inventing skills
- Clear statement when margin/trigger evidence is too weak to recommend
- Next action named (invoke skill, or `skillsforge catalog --pack <id>`)

## Anti-patterns

- Re-scoring triggers in the agent's head
- Recommending skills absent from install/catalog
- Ignoring anti-trigger hits

## Handoff

On a strong winner, load that skill's `SKILL.md`. On null/weak, use `browse-catalog` / `skillsforge catalog --search <text>`. After routing changes, run `skillsforge eval`.

## Output Contract

- Decision or artifact: concrete result for route capability, including file path, command, or explicit no-change finding.
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

Prompt: "Do route capability fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

