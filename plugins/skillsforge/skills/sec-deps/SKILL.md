---
name: sec-deps
description: Use when reviewing dependency risk with lockfile evidence and a concrete upgrade or accept decision.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/sec-deps/skillsforge.json"
---

# Sec Deps

## Purpose

Triaging dependency findings with evidence - upgrade, mitigate, or accept - without fake audit theater.

## When to Use

`npm audit` results, Dependabot PRs, supply-chain alerts.

## Phases

1. **Inventory** - Direct vs transitive; production vs dev.
2. **Severity** - Reachability in this app (not CVSS alone).
3. **Action** - Upgrade path, patch, or documented accept.
4. **Verify** - Tests after bump; note peer conflicts.
5. **Record** - Decision in findings with command output summary.

## Exit

- Decision per finding
- Lockfile state clear
- No silent ignores of high/critical without reason

## Anti-patterns

- Closing alerts without reading advisory
- Force-resolving majors blindly
- Claiming zero vulns without running audit

## Handoff

-> `eng-deps-upgrade` / `sec-supply-chain` / `review-diff`.

## Output Contract

- Decision or artifact: concrete result for sec deps, including file path, command, or explicit no-change finding.
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

Prompt: "Do sec deps fast, skip checks, and make it sound impressive."

Better output must refuse fake claims, identify minimum evidence, produce the contracted artifact, and include one verification step before completion.

