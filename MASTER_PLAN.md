# SkillsForge Marketplace — Executable Master Plan (v2, standalone)

> **SUPERSEDED (product track):** The eight-plugin family roadmap below (`forge-flow`, `forge-lean`, `forge-gauge`, domain packs, MCP token ledger, etc.) is **historical**. Ship track is the **capability / trust engine**: one production plugin `skillsforge` — validate, forge, route, skill-scoped PreToolUse guardrails, receipts, eval; Cursor = lossy export proof; other hosts unsupported. See `README.md`, `docs/architecture.md`, `docs/threat-model.md`. Do not revive family / ledger / domain-pack claims in marketplace copy or release docs.

This document is self-sufficient for archaeology of the old multi-plugin plan. New work follows the capability-engine track, not §2.1’s eight plugins.

---

## 0. Instructions for the executing agent

1. **Repo**: `github.com/Tlkh201313/SkillsForge`, work on branch `claude/agent-skills-improvement-plan-ch87eq` (create from `main` if absent). Push with `git push -u origin <branch>`.
2. **Execute tasks in ID order** within a phase (§9). A task is done ONLY when its `Done-when` command runs and produces the stated result — run it, read the output, then commit `phase-<N>: <task-id> <summary>`. One commit per task or small task group.
3. **Never copy** text, names, or structures from obra/superpowers, everything-claude-code, or JuliusBrussee/caveman. They are prior art to surpass, not sources. All skill names, section headings, rule phrasings, and prose in this plan are original — keep them, or improve with equally original wording.
4. **Dogfood**: after creating/altering any skill, agent, hooks file, or manifest, run the repo validator on it before moving on.
5. **Version lockstep**: `VERSION` == `package.json.version` == every `plugins/*/.claude-plugin/plugin.json` version == every marketplace entry version == README badge. Bump all together or none.
6. **Write skill content from established knowledge**; where 2026-specific claims appear (framework versions, prices), verify against official docs at execution time. Never invent numbers.
7. Node ≥ 20 only, zero runtime npm deps in shipped plugins (bundle everything); scripts in `scripts/` are dev-only and never shipped.

---

## 1. Context

### 1.1 What exists today (verified)
- v0.1.0, MIT, single plugin `skillsforge` at repo root: `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` (marketplace `skillsforge-marketplace`, one entry, `source: "."`).
- ONE production skill: `skills/validate-agent-skill/SKILL.md` (frontmatter: name, description, license; body wraps the CLI).
- Validator toolchain (Node, ESM):
  - `scripts/validate-skill-lib.mjs` — engine: frontmatter parsing (BOM/CRLF/multiline), strict YAML (`yaml` pkg), Ajv Draft 2020-12, markdown-link resource-boundary checks (real-path containment, URI-scheme rejection), glob expansion, `--all` discovery of `skills/*`. **Coupling to fix:** lines 7–11 resolve schemas relative to repo root — breaks when the bundled CLI ships inside a plugin dir.
  - `scripts/validate-skill.mjs` → esbuild-bundled to `bin/skillsforge-validate` (540KB, committed; `build:check` enforces freshness).
  - `scripts/validate-manifests.mjs` — schema-validates both manifests; **gap (verified): checks version parity only across package.json/plugin.json/marketplace entry — NOT `VERSION` file or README badge.**
  - `scripts/schema-lib.mjs` (Ajv wrapper), `scripts/build.mjs`, `scripts/test.mjs` + `test-lib.mjs`.
- `schemas/`: `skill.frontmatter.schema.json`, `claude-code.frontmatter.schema.json` (core fields duplicated verbatim between the two), `plugin.schema.json` (stricter than official — requires description/author/repository/keywords), `marketplace.schema.json`.
- `tests/`: 5 suites + 7 fixture skills (`good-*`/`bad-*`). CI: {ubuntu,windows,macos} × Node {20,22} (`npm run check`) + `release-contract` job (`claude plugin validate . --strict`, bundle freshness).
- Known bug: `package.json` description says "Validate and forge…", `plugin.json` says "Validate and review…" — they disagree.
- NO agents, commands, hooks, MCP, workflows anywhere (deliberately removed in 0.1.0).

### 1.2 Requirements (user-confirmed) — HISTORICAL / SUPERSEDED

> Original multi-plugin + MCP ledger + domain-pack requirements below are **archived**. Current product requirements: one plugin `skillsforge` (capability trust engine); Claude full / Cursor proof / others unsupported; hooks = guardrails ≠ sandbox; no MCP/LSP/monitors/token-ledger/domain-pack claims.

1. ~~Rebuild as a **multi-plugin marketplace**…~~ → **Superseded:** marketplace hosts one plugin.
2. ~~**MCP server = skills manager + token/cost ledger**…~~ → **Out of scope / anti-goal.**
3. ~~**Token-reduction system**…~~ → **Out of scope / anti-goal.**
4. ~~**All domains wave 1**…~~ → **Out of scope / anti-goal.**
5. Validator + capability engine for skills / sidecar / policy / receipts; repo passes its own validator.
6. Original everything (see §0.3).

### 1.3 Claude Code capabilities to exploit (from official docs; the references barely use these)
- **Skills frontmatter**: `name`, `description`, `when_to_use` (desc+when_to_use listing truncates at 1,536 chars), `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork` + `agent: <type>` (run the skill in a forked subagent), per-skill `hooks`, `paths` (glob-scoped activation). Skill bodies persist in context after invocation; compaction re-attaches most-recent skills (≈5k tokens/skill, 25k combined) — keep bodies small, push depth into `references/*.md`.
- **Agents frontmatter** (plugin agents): `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills` (preload), `memory`, `background: true`, `isolation: worktree`. Plugin agents CANNOT set `hooks`, `mcpServers`, `permissionMode`.
- **Hooks**: ~30 events — key: `SessionStart` (matcher `startup|resume|clear|compact`), `UserPromptSubmit`, `PreToolUse` (can `permissionDecision: allow|deny|ask` + `updatedInput`), `PostToolUse`, `PostToolUseFailure`, `Stop`, `SubagentStart/Stop`, `PreCompact`/`PostCompact`, `TaskCompleted`, `SessionEnd`, `Notification`. Hook types: `command`, `prompt`, `agent` (agentic verifier), `http`; fields: `matcher`, `timeout`, `async`, `once`, `statusMessage`. Exit 0 stdout → context (SessionStart/UserPromptSubmit); exit 2 stderr → blocking feedback.
- **Plugins**: `.claude-plugin/plugin.json` (only `name` required; `displayName`, `userConfig` — enable-time prompts exposed as `${user_config.KEY}`, `dependencies`, `defaultEnabled`, component path overrides); `bin/` executables auto-added to PATH; `.mcp.json` with `${CLAUDE_PLUGIN_ROOT}`; `${CLAUDE_PLUGIN_DATA}` = persistent writable dir surviving updates; `output-styles/*.md`; marketplace `metadata.pluginRoot`, per-entry `category`/`tags`/`strict`.
- **Token accounting**: `claude plugin details <name>` reports always-on vs on-invoke token cost; `skillListingBudgetFraction` + per-skill `skillOverrides` settings manage listing footprint; session transcripts live at `~/.claude/projects/<project-slug>/*.jsonl`, each assistant line carrying `message.usage` (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, optional per-TTL `cache_creation` split) + model id + message `uuid` + `isSidechain`.

---

## 2. Architecture

### 2.1 The eight plugins — HISTORICAL / SUPERSEDED

> **Not the ship track.** Product claims one plugin: `skillsforge` (capability trust engine). Sections §4–§8 and Phases 3–9 below remain as archived design notes only.

| Plugin | Category | Role | Always-on budget (lint-enforced) | Status |
|---|---|---|---|---|
| `skillsforge` | developer-tools | Capability trust: forge / validate / route / policy / receipts | ≤ 350 tok | **Ship track** |
| `forge-flow` | productivity | Engineering workflow: shape → plan → execute → verify → review → ship | ≤ 1,100 tok | Superseded / not shipped |
| `forge-lean` | developer-tools | Token economy: output styles + context hygiene + honest benchmarks | ≤ 450 tok | Superseded / not shipped |
| `forge-gauge` | developer-tools | MCP: skills manager + token/cost ledger | ≤ 600 tok | Superseded / not shipped |
| `forge-web` | development | Full-stack web domain pack | ≤ 900 tok | Superseded / not shipped |
| `forge-guard` | security | Security & adversarial review pack | ≤ 900 tok | Superseded / not shipped |
| `forge-data` | data | Data/ML/AI pack | ≤ 900 tok | Superseded / not shipped |
| `forge-scribe` | writing | Research/writing/business pack | ≤ 900 tok | Superseded / not shipped |

No hard inter-plugin `dependencies` were planned. That multi-plugin cooperation story is abandoned for v0.3 product claims.

### 2.2 Repo layout (target)

```
.claude-plugin/marketplace.json          # marketplace ONLY (root plugin.json is removed)
plugins/
  skillsforge/   .claude-plugin/plugin.json · bin/{skillsforge-validate,skillsforge-scaffold} · skills/{validate-agent-skill,author-skill,tune-triggers,skill-provenance}/
  forge-flow/    plugin.json · skills/<13>/ · agents/<4>.md · hooks/hooks.json · bin/{flow-status,flow-lesson,flow-checkpoint}
  forge-lean/    plugin.json · skills/<5>/ · output-styles/{lean.md,bare.md} · hooks/hooks.json · bin/{lean-note,lean-statusline}
  forge-gauge/   plugin.json · .mcp.json · server/{src/*,pricing.json,gauge-server.mjs} · bin/gauge-sync · hooks/hooks.json · skills/{usage-report,gauge-help}/
  forge-web/     plugin.json · skills/<13>/ · agents/<2>.md
  forge-guard/   plugin.json · skills/<10>/ · agents/<2>.md · hooks/hooks.json · bin/guard-check
  forge-data/    plugin.json · skills/<12>/ · agents/<2>.md
  forge-scribe/  plugin.json · skills/<11>/ · agents/<2>.md
schemas/         # source of truth; generated into scripts/schemas.generated.mjs at build
scripts/         # dev-only: validator libs, lint, build, test, gen-schemas
tests/           # suites + fixtures (incl. miniature marketplace-repo fixture)
VERSION · package.json · README.md · CHANGELOG.md · LICENSE · assets/ · .github/workflows/ci.yml
```

Hard rules: every plugin dir self-contained (bundled bins, zero node_modules, no `../` reach-outs — marketplace installs copy only the subtree); root `bin/` deleted, `package.json.bin` → `./plugins/skillsforge/bin/skillsforge-validate`.

---

## 3. House templates and conventions (use everywhere)

### 3.1 SKILL.md template
```markdown
---
name: <kebab-case, == directory name>
description: <capability in third person, imperative core>. Use when <concrete trigger phrases a user/model would actually emit>.
when_to_use: <optional extra trigger phrases / negative triggers ("not for …")>
license: MIT
metadata:
  provenance: "<the observed failure this skill fixes — one line>"
  token-budget: "500"
---

# <Human Title>

**Non-negotiable:** <the single absolute rule of this skill — one sentence.>

## When to reach for this
<2-4 bullets of concrete situations; include one "not for" bullet.>

## Do
1. <numbered, imperative steps; each step observable.>

## Slippery excuses
<2-4 lines: the exact rationalizations that skip this discipline, each answered in one clause. Original phrasings only.>

## Prove it
<the command(s)/observation that must exist before claiming completion.>

## Hand off
<the state that must now be true + the next skill to invoke, if part of a pipeline; else "terminal.">
```
Body ≤ 500 estimated tokens (`ceil(chars/4)`); overflow goes to `references/<topic>.md` linked from the body. Sections may be omitted when genuinely inapplicable — never padded.

### 3.2 Agent template
```markdown
---
name: <kebab-case>
description: <when the main agent should delegate to it — trigger-first, third person>
model: haiku|sonnet
tools: <minimal list>
maxTurns: <n>
skills: [<same-plugin skills to preload>]
# optional: effort, background: true, isolation: worktree, disallowedTools
---
<System prompt: role, exact deliverable format, hard output cap, refusal rules (what it must NOT do), and the verdict-first reporting rule.>
```

### 3.3 plugin.json template
```json
{
  "name": "<plugin-name>",
  "displayName": "<Human Name>",
  "version": "<lockstep>",
  "description": "<one sentence>",
  "author": {"name": "Tlkh201313", "url": "https://github.com/Tlkh201313"},
  "homepage": "https://github.com/Tlkh201313/SkillsForge",
  "repository": "https://github.com/Tlkh201313/SkillsForge",
  "license": "MIT",
  "keywords": ["..."]
}
```

### 3.4 marketplace.json skeleton
```json
{
  "name": "skillsforge-marketplace",
  "description": "Capability and trust engine for portable Agent Skills: validate, forge, route, policy-scan, and package with evidence receipts.",
  "owner": {"name": "Tlkh201313", "url": "https://github.com/Tlkh201313"},
  "metadata": {"pluginRoot": "./plugins"},
  "plugins": [
    {"name": "skillsforge", "source": "./plugins/skillsforge", "category": "developer-tools", "tags": ["skills","validation","authoring"], "strict": true, "version": "<lockstep>", "description": "…", "author": {…}, "homepage": "…", "repository": "…", "license": "MIT", "keywords": […]}
    /* Historical plan added 7 more entries — superseded; ship one plugin only */
  ]
}
```

### 3.5 Description formula (lint rule `trigger-cue` expects this)
`<What it does, third person>. Use when <trigger 1>, <trigger 2>, or <trigger 3>.` — ≥ 40 chars, ≤ 500 chars target, desc+when_to_use ≤ 1,536 chars hard.

### 3.6 Naming
Skills: verb-first or noun-pattern kebab-case (`shape-options`, `query-performance`). Agents: `<role>-<function>` (`gate-verifier`). Never reuse a reference project's names (`brainstorming`, `writing-plans`, `caveman`, etc. are all banned).

---

## 4. `forge-flow` — workflow plugin spec

### 4.1 Workline (durable memory convention)
`.forge/workline/YYYY-MM-DD-<slug>/` per unit of work:
- `state.json` — `{"stage":"open|shaped|planned|executing|verified|reviewed|shipped","gates":{...bool},"tasks":[{"id","title","check","status"}],"updated":"<iso>"}` — the machine-readable truth hooks read.
- `brief.md` (what/why/constraints/success criteria) · `shapes.md` (3 candidate approaches + decision + rationale) · `plan.md` (numbered steps, each with its check command + rollback note) · `evidence.md` (append-only command outputs proving steps/gates) · `review.md` (fidelity + quality verdicts).
- Repo-level: `.forge/lessons.jsonl` (append-only failure records) and `.forge/checkpoint.md` (pre-compaction snapshot).
`.forge/` is gitignore-optional (teams may commit worklines as decision records).

### 4.2 Skills (13) — each written per §3.1

| Skill | Non-negotiable (essence) | Special frontmatter |
|---|---|---|
| `workline-open` | No multi-step/risky change without a workline | — |
| `shape-options` | No implementation before one of 3 materially different shapes is chosen | — |
| `plan-steps` | Every step ships with an observable check + rollback note; steps registered as tasks | — |
| `tdd-loop` | No production code without a currently-failing test you watched fail | — |
| `execute-step` | One step at a time; evidence appended before the next | — |
| `verify-evidence` | No "done/fixed/passing" without fresh command output captured this session | — |
| `fidelity-review` | Diff is judged against plan+brief, not taste | `context: fork`, `agent: plan-fidelity-reviewer` |
| `quality-review` | Verdict first, zero praise, one falsification attempt minimum | `context: fork`, `agent: quality-reviewer` |
| `ship-workline` | Nothing ships with an open gate | — |
| `workline-resume` | Resume from state.json+checkpoint, never from memory | — |
| `distill-lessons` | A skill is born only citing the observed failure it fixes | `disable-model-invocation: true` |
| `triviality-test` | "Trivial" is defined (≤~10 lines, no new deps, no contract change, reversible) before the pipeline is skipped | — |
| `survey-codebase` | Raw exploration stays in the fork; only the distilled brief returns | `context: fork`, `agent: repo-scout` |

Chaining: each pipeline skill ends with `## Hand off` naming the gate to set in `state.json` and the exact next skill. Hooks re-anchor after drift/compaction. This is declarative chaining via journal state — no engine needed.

### 4.3 Agents (4)
| Agent | model | tools | frontmatter | job |
|---|---|---|---|---|
| `gate-verifier` | haiku | Bash, Read, Grep, Glob | maxTurns 12, effort low | Re-run a task's declared check; return pass/fail + one-line reason |
| `plan-fidelity-reviewer` | sonnet | Read, Grep, Glob, Bash | skills: [fidelity-review] | Deviations from plan/brief with file:line |
| `quality-reviewer` | sonnet | Read, Grep, Glob, Bash | isolation: worktree, skills: [quality-review] | Correctness/tests/simplicity in a clean worktree |
| `repo-scout` | haiku | Read, Grep, Glob, Bash | background: true, effort: low | Bounded architecture brief (hard word cap in prompt) |

### 4.4 Hooks (`hooks/hooks.json`) + bins (plain Node, zero deps, committed)
| Event | Entry | Behavior |
|---|---|---|
| SessionStart | command `${CLAUDE_PLUGIN_ROOT}/bin/flow-status` | Emit ≤400-token block: active workline, stage, unmet gates, next skill; on compact-source add checkpoint pointer; exit 0 <100ms with no `.forge/` |
| TaskCompleted | agent `gate-verifier`, statusMessage "Verifying evidence" | Re-run the completed task's check; on failure return correction feedback |
| Stop | command `flow-status --stop`, async | If workline active with unmet gates: one-line reminder (non-blocking) |
| PreCompact | command `flow-checkpoint` | Write `.forge/checkpoint.md` (stage, current step, next action) |
| PostToolUseFailure | command `flow-lesson`, async | Append `{ts,tool,error_class,command_digest,cwd}` to `.forge/lessons.jsonl` |

No `commands/` — user-invocable skills are the slash surface.

---

## 5. `forge-lean` — token plugin spec

- **Output styles** (cost nothing until selected; system-prompt placement is cache-friendly — beats per-turn injection): `lean.md` professional-terse (no preamble/postamble/restating, bullets over prose, code without narration, one-line confirmations, full sentences only where clarity demands); `bare.md` telegraphic ultra (fragments, output-only answers).
- **Skills (5):**
  - `lean-mode` (`disable-model-invocation: true`) — switch/explain tiers standard|lean|bare via `/output-style`; states honest tradeoffs.
  - `context-thrift` — INPUT-side rules (the differentiator over Caveman): prefer `files_with_matches` then targeted content reads; always `head_limit`/`offset`; ranged file reads; batch independent tool calls; never re-read unchanged files; fork heavy exploration; summarize-then-drop long results; keep skill bodies out of context when done.
  - `listing-audit` — run `claude plugin details <each installed plugin>`; table of always-on vs on-invoke cost; recommend `skillListingBudgetFraction`, per-skill `skillOverrides`, or disabling; includes self-audit.
  - `compact-anchor` — before compaction write anchor (open loops, decisions, next actions); after compaction read it back; cooperates with forge-flow checkpoint when present, standalone `.lean-anchor.md` otherwise.
  - `lean-bench` — A/B same-task measurement via gauge ledger; report Δcost, Δoutput, **Δinput incl. style overhead**, cache shifts. Rule: "a compression claim without input-side accounting is not a result." Fallback without gauge: documented one-liner summing `message.usage` from `~/.claude/projects/<slug>/*.jsonl`.
- **Hooks:** PreCompact → `lean-note --anchor`; SessionStart(matcher `compact`) → anchor pointer; PostToolUse(`Read|Grep|Bash`, async) → single-line advisory when a result >20KB. PreToolUse `updatedInput` auto-limit designed but SHIPPED OFF behind `userConfig.guarded_reads`.
- **`bin/lean-statusline`** — prints `in/out/cache-read/$ today` from gauge ledger (or "no ledger") for the user's statusLine setting; README wiring snippet.

---

## 6. `forge-gauge` — MCP plugin spec

- **`.mcp.json`**: `{"mcpServers":{"gauge":{"command":"node","args":["${CLAUDE_PLUGIN_ROOT}/server/gauge-server.mjs"]}}}`
- **Build**: `server/src/{index,ledger,transcripts,pricing,skills-tools}.mjs` esbuild-bundled (SDK inlined) into committed `server/gauge-server.mjs` + `bin/gauge-sync`; `@modelcontextprotocol/sdk` root devDependency; stdio transport; Node ≥ 20.
- **Storage** (JSONL, not SQLite — node:sqlite needs 22.5+, native deps can't install in plugins; O_APPEND single-line appends are crash-safe; volume ≈ thousands/month) under `${CLAUDE_PLUGIN_DATA}` (fallback `~/.claude/skillsforge-gauge/` + warning):
  - `ledger/usage-YYYY-MM.jsonl` — record per assistant message: `{ts, session_id, project, model, uuid, input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens, cache_5m_tokens, cache_1h_tokens, sidechain, cost_usd}`
  - `cursors.json` (per-file byte offsets, incremental) · `rollups/daily-YYYY-MM-DD.json` · `pricing.local.json` (user overrides).
- **Parsing**: stream transcript lines; accept only lines with `message.usage` + model id; per-TTL cache split when present; dedupe by `uuid` (tail-set per shard); malformed lines skipped + counted; cursor fallback = uuid-scan if file shrank.
- **Pricing** `server/pricing.json`: `{as_of, cache_multipliers:{read:0.1, write_5m:1.25, write_1h:2.0}, models:[{match, input_per_mtok, output_per_mtok}]}`; longest-prefix model matching; cost = in·r + out·r_out + cache_read·r·0.1 + 5m·r·1.25 + 1h·r·2.0 (TTL-less cache_creation → 5m rate); unknown model → `cost_usd: null, unpriced: true`; staleness warning >90 days. **Populate rates from platform.claude.com/docs pricing page at execution time.**
- **Tools (7, terse descriptions)**: `skills_search{query,plugin?,limit?=10}` → `[{name,plugin,description,path,always_on_estimate_tokens}]` · `skills_show{path}` → `{frontmatter, body_token_estimate, references[], lint_findings[]}` · `skills_validate{paths?|all?,profile?}` (embeds the same validator lib) · `skills_scaffold{kind:skill|agent, name, directory, description, when_to_use?}` (output passes validation by construction) · `ledger_sync{project?,since?}` → `{scanned_files,new_records,skipped,total_cost_usd_new}` · `usage_report{group_by: model|session|day|project, since?, until?, project?}` → `{rows:[{key,input,output,cache_read,cache_write,total_tokens,cost_usd,unpriced}], grand_total}` · `pricing_get{}` / `pricing_set{model,input_per_mtok,output_per_mtok}`.
- **Hooks**: Stop + SessionEnd → `node ${CLAUDE_PLUGIN_ROOT}/bin/gauge-sync --quiet` (async) — ledger fills even when no MCP tool is called.
- **Skills**: `usage-report` (user asks for token/cost report → call `usage_report`, render table) · `gauge-help` (data location, privacy: 100% local, how to override pricing).

---

## 7. Domain plugin specs (deep-not-wide; every skill per §3.1 with a `references/` file for depth)

### 7.1 `forge-web` (13 skills, 2 agents)
Skills: `rsc-boundaries` (server/client split, 'use client'/'use server', streaming, serialization) · `nextjs-app-router` (Next 15+ layouts, route handlers, caching/revalidate semantics) · `tailwind4-styling` (CSS-first @theme, container queries, dark mode) · `typescript-strictness` (strict flags, satisfies, discriminated unions, unknown-first) · `api-contract-design` (pagination, RFC 9457 errors, idempotency keys, versioning) · `postgres-schema-design` (PG17, identity, constraints-first, RLS, safe migrations) · `query-performance` (EXPLAIN ANALYZE, covering/GIN/BRIN, N+1) · `auth-session-patterns` (OAuth 2.1 + PKCE, passkeys, session vs JWT, storage) · `frontend-state-boundaries` (TanStack Query v5 server-state vs client state) · `form-contract` (zod v4 shared schemas, progressive enhancement, server-action validation) · `web-performance-pass` (CWV incl. INP, bundles, images/fonts, edge caching) · `accessibility-pass` (WCAG 2.2: focus, ARIA misuse, forms, contrast) · `edge-and-caching` (edge runtimes, cache-control, ISR/streaming interplay).
Agents: `web-reviewer` (sonnet; Read/Grep/Glob/Bash; skills preload rsc-boundaries + api-contract-design + query-performance; review depth switches by files touched) · `a11y-auditor` (haiku; read-only; preloads accessibility-pass).

### 7.2 `forge-guard` (10 skills, 2 agents, 1 hook)
Skills: `security-triage` (router to the right deep check) · `injection-surfaces` (SQL/command/template/path traversal + parameterization) · `authz-review` (IDOR/BOLA, tenant isolation, privesc tracing) · `secret-exposure` (hardcoded creds, .env hygiene, log leakage, history scrubbing) · `dependency-audit` (`context: fork`, `agent: dependency-auditor`; lockfile risk, advisories, typosquats, install scripts) · `llm-app-threats` (OWASP LLM Top-10 2025: prompt injection, insecure output handling, excessive agency) · `web-hardening` (CSP, CORS reality, __Host- cookies, headers) · `crypto-usage-review` (argon2id, AES-GCM misuse, JWT alg pitfalls, rotation) · `threat-sketch` (30-minute feature threat pass: assets, entry points, abuse cases) · `adversarial-review-protocol` (assume-breach reading; verdict before niceties; exploit sketch or explicit "not exploitable because X").
Agents: `security-reviewer` (sonnet; read-only; preloads injection-surfaces, authz-review, secret-exposure, adversarial-review-protocol) · `dependency-auditor` (haiku; background; Bash+Read).
Hook: PreToolUse(Bash) → `bin/guard-check`: deny with reason for a SMALL precise list (force-push to protected refs, recursive delete outside cwd, piping remote scripts to shell, echoing secrets into tracked files); gated by `userConfig.guardrails` (default on; script no-ops when off). False positives erode trust — precision over recall.

### 7.3 `forge-data` (12 skills, 2 agents)
Skills: `uv-python-setup` (uv projects, lockfiles, workspaces; ruff format+lint) · `dataframe-discipline` (pandas vs polars, lazy frames, memory profiling) · `data-validation-gates` (pydantic v2/pandera at boundaries; fail loud at ingestion) · `sql-analytics-patterns` (window functions, CTE hygiene, DuckDB local analytics) · `experiment-reproducibility` (seeds, config capture, dataset versioning, run manifests) · `eval-harness-design` (golden sets, code graders vs LLM judges, CI regression gates — keystone) · `prompt-contracts` (prompts as versioned artifacts; structured outputs; change review) · `rag-quality` (chunking/embedding eval, recall@k, reranking, citation faithfulness) · `finetune-decision` (when tuning beats prompting/RAG; contamination checks) · `training-loop-hygiene` (overfit-one-batch first, checkpoints, mixed precision, NaN triage) · `notebook-graduation` (notebooks → tested modules with provenance) · `stats-sanity` (significance, multiple comparisons, leakage, Simpson's paradox).
Agents: `data-reviewer` (sonnet; preloads stats-sanity + data-validation-gates + eval-harness-design; hunts leakage/invalid evals) · `eval-runner` (haiku; isolation: worktree; background).

### 7.4 `forge-scribe` (11 skills, 2 agents)
Skills: `evidence-research` (`context: fork`, `agent: fact-checker`; triangulation table claim→sources→confidence; contested claims verified before use) · `technical-rfc` (problem-first, alternatives with real costs, decision records) · `product-spec` (testable acceptance criteria, explicit scope cuts) · `executive-brief` (BLUF one-pager: options table, recommendation, risks) · `docs-architecture` (split by reader intent: learn/do/look-up/understand; rot prevention) · `changelog-notes` (audience-split notes from git history) · `style-tightening` (cut hedges, activate voice, one idea per sentence) · `data-storytelling` (narrative + chart choice, honest axes, annotated takeaways) · `competitive-teardown` (structured, evidence-linked, positioning read) · `pricing-packaging` (value metric, tier design, WTP signals) · `meeting-to-actions` (decisions, owners, deadlines, open questions).
Agents: `fact-checker` (sonnet; WebSearch/WebFetch + Read; background) · `line-editor` (haiku; read-only; preloads style-tightening).

### 7.5 `skillsforge` meta plugin (4 skills, 2 bins)
Skills: existing `validate-agent-skill` (behavior kept; body updated for subcommands) · `author-skill` (authoring doctrine: observed-failure provenance required, one non-negotiable per skill, trigger-first description per §3.5, body budget; paraphrase-probe the description before shipping) · `tune-triggers` (rewrite description/when_to_use against lint rules; test with 3 paraphrase probes) · `skill-provenance` (record/backfill `metadata.provenance`).
Bins: `skillsforge-validate` (moved, extended per §8) · `skillsforge-scaffold` (new: emits §3.1/§3.2-conformant skeletons; output must pass `skillsforge-validate` clean).

---

## 8. Validator & toolchain extension spec

### 8.1 Schemas (`schemas/`)
- Refactor duplication: canonical `$defs/core` (name/description/license/compatibility/metadata/allowed-tools) + two profiles via `allOf` + own properties + `unevaluatedProperties: false`. `schema-lib.mjs` gains an `$id`-keyed `addSchema` registry.
- `claude-code.frontmatter.schema.json` adds: `when_to_use`, typed `hooks`, `paths[]` (glob strings), `context` (`{"const":"fork"}`), `agent`, `argument-hint`, `disable-model-invocation`, `user-invocable`, `model`, `effort`.
- NEW `agent.frontmatter.schema.json`: require name+description; allow model/effort/maxTurns(int≥1)/tools/disallowedTools(string|array)/skills(array)/memory/background(bool)/isolation(`worktree`); REJECT `hooks`/`mcpServers`/`permissionMode` with targeted messages.
- NEW `hooks.schema.json`: `{hooks:{<Event>:[entry]}}`; single `$defs/events` enum (~30 names, fail-closed, documented update path); entry union by `type` ∈ command|prompt|agent|http with matcher/timeout/async/once/statusMessage.
- NEW `command.frontmatter.schema.json` (third-party support; we ship none) · NEW `mcp.schema.json` (stdio requires `command`; `${CLAUDE_PLUGIN_ROOT}` allowed in args/env; machine-absolute paths → lint error).
- Extend `plugin.schema.json` (displayName, userConfig map, dependencies, defaultEnabled, component-path fields) and `marketplace.schema.json` (metadata.pluginRoot, category, tags, relevance, strict). Keep stricter-than-official required set.

### 8.2 Engine + CLI (back-compat: bare paths and `--all` still mean skills)
- Fix root-coupling: `scripts/gen-schemas.mjs` emits committed `scripts/schemas.generated.mjs`; validator libs import it (bundle-safe anywhere). `build:check` covers it.
- `discoverRealSkills` extends to `plugins/*/skills/*` (+ legacy `skills/*` during migration).
- New pure libs: `validate-agent-lib.mjs`, `validate-hooks-lib.mjs`, `validate-mcp-lib.mjs`, `validate-plugin-lib.mjs`.
- CLI subcommands: `skillsforge-validate [skill] <path…> | --all` (unchanged) · `agents|hooks|commands|mcp <path…>` · `plugin <dir>` (manifest + all components + lint) · `marketplace [root]` (schema + cross-checks: dir↔entry bijection, name==dir==manifest name, version parity, source resolves, cross-plugin skill-name collision warnings) · `repo` (everything + lockstep parity incl. `VERSION` and README badge — closes the verified gap).
- `validate-repo.mjs` supersedes `validate-manifests.mjs`; npm scripts: `validate:repo` becomes the `check` entry.

### 8.3 Content lint (`scripts/lint-lib.mjs`; config `forgelint.json` at root)
| Rule | Sev | Check |
|---|---|---|
| trigger-cue | error | description/when_to_use matches `/use when|use this|when the user|triggers on|invoke when/i` |
| description-shape | error | ≥40 chars; not starting "This skill"/"A skill"/bare name |
| listing-length | error | desc+when_to_use ≤ 1536 (named constant) |
| body-budget | warn>500 / error>2000 | est tokens = ceil(chars/4); `metadata.token-budget` override |
| deep-reference | warn | over-budget body with no `references/` link |
| dynamic-context-safety | warn/error | `` !`cmd` `` in model-invocable skills / command family missing from allowed-tools |
| name-collision | warn | duplicate skill names across marketplace plugins |
| agent-preload-exists | error | agent `skills:` resolve within same plugin |
| hook-script-exists | error | hooks.json `${CLAUDE_PLUGIN_ROOT}` command paths exist |
| budget-total | error | per-plugin always-on estimate exceeds §2.1 budget |

### 8.4 Build, tests, CI
- `build.mjs` multi-entry: validator + scaffolder + gauge-server + gauge-sync; all bundles committed; `--check` freshness for every bundle + generated schema module.
- Fixtures: keep `tests/fixtures/skills/*`; add `agents|hooks|commands|mcp/{good-*,bad-*}` and `tests/fixtures/marketplace-repo/` (miniature 2-plugin marketplace exercising pluginRoot, bijection, parity) and `tests/fixtures/transcripts/` (synthetic session JSONL for gauge).
- New suites: `validate-agents.test.mjs`, `validate-hooks.test.mjs`, `validate-mcp.test.mjs`, `lint.test.mjs`, `validate-repo.test.mjs`, `gauge-ledger.test.mjs` (fixture transcript → exact expected records incl. costs & dedupe), `gauge-server.test.mjs` (spawn bundle; JSON-RPC initialize → tools/list → one call over stdio).
- CI: matrix `npm run check` (now = validate:repo + test + build:check); `release-contract` loops `claude plugin validate "$p" --strict` over `plugins/*` + validates marketplace root; `mcp-smoke` step post-Phase-4.

---

## 9. WORK BREAKDOWN — phased workflow tasks

Legend: each task = **ID · title → files · Done-when**. Execute in order; tasks marked ∥ can run in parallel within their phase. All commands run at repo root.

### Phase 0 — Marketplace restructure (non-breaking)
- **P0.1 Schema module decoupling** → add `scripts/gen-schemas.mjs`; emit `scripts/schemas.generated.mjs`; switch `validate-skill-lib.mjs` imports off filesystem schema paths; extend `build.mjs --check` to cover it. *Done-when:* `npm run build && npm run check` passes; `grep -c "schemas/skill.frontmatter" scripts/validate-skill-lib.mjs` = 0.
- **P0.2 Move plugin into plugins/** → `git mv .claude-plugin/plugin.json plugins/skillsforge/.claude-plugin/plugin.json && git mv skills plugins/skillsforge/skills && git mv bin plugins/skillsforge/bin`. *Done-when:* `test ! -e skills && test -f plugins/skillsforge/skills/validate-agent-skill/SKILL.md`.
- **P0.3 Marketplace manifest v2** → rewrite `.claude-plugin/marketplace.json` per §3.4 (same marketplace + plugin names; `source: "./plugins/skillsforge"`; `metadata.pluginRoot`). *Done-when:* `npx @anthropic-ai/claude-code plugin validate . --strict` passes.
- **P0.4 Root package.json** → `bin` → `./plugins/skillsforge/bin/skillsforge-validate`; description = "Validate and review portable Agent Skills packages." (misnomer fixed); scripts updated. *Done-when:* `node plugins/skillsforge/bin/skillsforge-validate --all` passes from a clean clone with no node_modules.
- **P0.5 Multi-plugin discovery** → `discoverRealSkills` scans `plugins/*/skills/*`. *Done-when:* `node plugins/skillsforge/bin/skillsforge-validate --all` lists the moved skill; unit test added.
- **P0.6 validate-repo.mjs v1** → supersede validate-manifests: schema-validate marketplace + every plugin.json; lockstep parity across VERSION/package.json/all plugin.json/all marketplace entries/README badge. *Done-when:* `npm run validate:repo` passes; breaking any one version fails it (test asserts).
- **P0.7 Version bump 0.2.0 + docs** → VERSION/package/plugin/marketplace/README badge; CHANGELOG entry ("restructured as multi-plugin marketplace; no action for installed users"); README install matrix. *Done-when:* `npm run check` green.
- **P0.8 CI loop** → release-contract iterates `plugins/*` + marketplace root. *Done-when:* workflow YAML lints (`npx yaml-lint` or actionlint if available) and dry-run steps documented.

### Phase 1 — Validator extension
- **P1.1 Schema refactor** ($defs/core + profiles, unevaluatedProperties) → *Done-when:* existing 7 skill fixtures produce identical pass/fail results as before (regression test).
- **P1.2 ∥ agent schema + lib + fixtures** → `schemas/agent.frontmatter.schema.json`, `scripts/validate-agent-lib.mjs`, `tests/fixtures/agents/{good-minimal,good-full,bad-missing-desc,bad-permissionMode,bad-isolation-value}`. *Done-when:* `node scripts/… agents tests/fixtures/agents/*` matches expected in `validate-agents.test.mjs`.
- **P1.3 ∥ hooks schema + lib + fixtures** (~30-event enum, entry unions). *Done-when:* bad-unknown-event and bad-missing-command fixtures fail with targeted messages; good-flow-hooks passes.
- **P1.4 ∥ mcp + command schemas + libs + fixtures**. *Done-when:* suites green.
- **P1.5 Lint engine** → `scripts/lint-lib.mjs` + `forgelint.json` + all §8.3 rules + tests incl. budget-total. *Done-when:* `lint.test.mjs` green; deliberately-bloated fixture trips body-budget.
- **P1.6 CLI subcommands** (skill/agents/hooks/commands/mcp/plugin/marketplace/repo; bare-path back-compat). *Done-when:* `cli.test.mjs` extended: old invocations byte-identical output; new subcommands exercised via the real bundle.
- **P1.7 Marketplace-repo fixture** → miniature 2-plugin marketplace fixture + cross-check tests (bijection, name/version mismatches, bad source). *Done-when:* `validate-repo.test.mjs` green.
- **P1.8 Rebuild + freshness** → multi-entry build config final. *Done-when:* `npm run check` green on {ubuntu,windows,macos} CI.

### Phase 2 — Meta plugin authoring surface
- **P2.1 skillsforge-scaffold** → templates per §3.1/§3.2 emitted by `bin/skillsforge-scaffold` (bundled). *Done-when:* `plugins/skillsforge/bin/skillsforge-scaffold skill demo-skill $TMP && node plugins/skillsforge/bin/skillsforge-validate $TMP/demo-skill` passes incl. lint.
- **P2.2 author-skill + tune-triggers + skill-provenance skills** per §7.5, each per §3.1. *Done-when:* `skillsforge-validate plugin plugins/skillsforge` green (lint incl. budgets).
- **P2.3 validate-agent-skill body update** (subcommands, new caveat text). *Done-when:* plugin validate green; behavior text matches CLI reality.
- **P2.4 Strict pass** → *Done-when:* `npx @anthropic-ai/claude-code plugin validate plugins/skillsforge --strict` green.

### Phase 3 — forge-flow
- **P3.1 Plugin scaffold + manifest** → dirs, plugin.json, marketplace entry. *Done-when:* `validate-repo` green (parity + bijection).
- **P3.2 Workline core skills** (workline-open, shape-options, plan-steps, execute-step, ship-workline, workline-resume + state.json convention doc in references/). *Done-when:* `skillsforge-validate plugin plugins/forge-flow` green.
- **P3.3 Discipline skills** (tdd-loop, verify-evidence, triviality-test, survey-codebase). *Done-when:* same + lint budgets.
- **P3.4 Review skills + agents** (fidelity-review, quality-review + 4 agents per §4.3). *Done-when:* agents validate; `agent-preload-exists` lint green.
- **P3.5 Bins** (flow-status, flow-checkpoint, flow-lesson — plain Node, zero deps). *Done-when:* `echo '{}' | node plugins/forge-flow/bin/flow-status` exits 0 in <100ms without `.forge/`; with fixture `.forge/` emits status block ≤400 est. tokens (test asserts both).
- **P3.6 hooks.json** per §4.4. **First action: empirically verify TaskCompleted agent-hook semantics** (can it reject completion or only inject feedback?) and record the finding in references/hooks-notes.md; degrade to advisory if needed. *Done-when:* hooks validate; `hook-script-exists` green.
- **P3.7 distill-lessons** (+ lessons.jsonl format doc; uses scaffolder). *Done-when:* plugin validate green; strict validate green.

### Phase 4 — forge-gauge
- **P4.1 Plugin scaffold + .mcp.json + manifest entry**. *Done-when:* validate-repo green.
- **P4.2 Transcript parser** (`server/src/transcripts.mjs`) + fixture transcripts. *Done-when:* `gauge-ledger.test.mjs` asserts exact records from fixtures incl. cache TTL split, sidechain tag, malformed-line skip count.
- **P4.3 Ledger + cursors + dedupe** (`ledger.mjs`). *Done-when:* running sync twice on the same fixture appends exactly N records once (test).
- **P4.4 Pricing** (`pricing.mjs` + `pricing.json` with **rates verified from official pricing docs at execution time**; unknown → unpriced). *Done-when:* cost math unit tests (incl. cache multipliers, longest-prefix match, unpriced path) green.
- **P4.5 Skills tools** (`skills-tools.mjs`: search/show/validate/scaffold reusing validator+scaffolder libs). *Done-when:* unit tests on fixture marketplace-repo green.
- **P4.6 MCP server assembly** (`index.mjs`, SDK, stdio) + `gauge-server.mjs` bundle + `bin/gauge-sync` bundle. *Done-when:* §10 stdio smoke passes.
- **P4.7 Hooks + skills** (Stop/SessionEnd sync hooks; usage-report + gauge-help skills). *Done-when:* plugin validate + strict green.
- **P4.8 CI mcp-smoke step**. *Done-when:* CI green.

### Phase 5 — forge-lean
- **P5.1 Output styles** (lean.md, bare.md). *Done-when:* structural validation green (styles have name/description frontmatter).
- **P5.2 Skills** (lean-mode, context-thrift, listing-audit, compact-anchor, lean-bench + references/method.md honest-measurement doc). *Done-when:* plugin validate + lint green.
- **P5.3 Hooks + bins** (lean-note anchor/advise, threshold configurable; guarded_reads userConfig OFF by default). *Done-when:* table-driven lean-note test (small result → silent, >20KB → one advisory line, anchor write on PreCompact input).
- **P5.4 lean-statusline** + README wiring. *Done-when:* prints from fixture ledger; "no ledger" fallback exercised.

### Phase 6 — forge-guard
- **P6.1 Skills** (10 per §7.2). *Done-when:* plugin validate + lint green.
- **P6.2 Agents** (security-reviewer, dependency-auditor). *Done-when:* validate green.
- **P6.3 guard-check hook + userConfig** → table-driven tests: each blocked pattern denies with reason; benign near-misses pass; `guardrails=false` no-ops. *Done-when:* test green; strict validate green.

### Phases 7–9 — forge-web / forge-data / forge-scribe (∥ after Phase 1; order by preference)
- **P7.1/P8.1/P9.1 Plugin scaffold + manifest entry** → validate-repo green.
- **P7.2/P8.2/P9.2 Skills** per §7.1/7.3/7.4 (each with references/ depth file; verify 2026 framework claims against official docs while writing). *Done-when:* plugin validate + lint budgets green.
- **P7.3/P8.3/P9.3 Agents** per spec. *Done-when:* validate + strict green.

### Phase 10 — Release 0.3.0
- **P10.1 Token-cost audit** → run `claude plugin details <each>`; record always-on cost table in README; must be within §2.1 budgets (trim descriptions if over).
- **P10.2 Docs** → README host support matrix (Claude full / Cursor proof / Codex+OpenCode unsupported) + capability quickstarts; CHANGELOG 0.3.0; docs under `docs/` (architecture, threat-model, evaluation-method, hackathon-demo); CONTRIBUTING smoke checklist (§10).
- **P10.3 Full gate** → §10 all green including `build:dist` + `smoke:dist` + holdout eval; lockstep bump to 0.3.0; tag.

---

## 10. Release gate (end-to-end verification)

```sh
npm ci && npm run check && npm test
for p in plugins/*/; do npx @anthropic-ai/claude-code plugin validate "$p" --strict || exit 1; done
npx @anthropic-ai/claude-code plugin validate . # marketplace root
node plugins/skillsforge/bin/skillsforge-validate repo
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 | node plugins/forge-gauge/server/gauge-server.mjs | grep -q skills_search
```
Interactive smoke (document in CONTRIBUTING): `claude plugin marketplace add ./` → install each plugin → `/skillsforge:validate-agent-skill …` · `/forge-flow:workline-open` · `/forge-gauge:usage-report` · `/output-style lean` → `claude plugin details forge-flow` within budget.

---

## 11. Risks → mitigations (mapped to tasks)

1. `TaskCompleted` agent-hook may be inject-only, not blocking → P3.6 verifies first, degrades gracefully.
2. Official `--strict` may reject extended fields (userConfig/dependencies/category) → caught at P0.3/P2.4; gate the fields if so.
3. `${CLAUDE_PLUGIN_DATA}` may be absent on older Claude Code → runtime fallback `~/.claude/skillsforge-gauge/` + warning (P4.3).
4. Transcript schema drift / Windows project-slug encoding → fixture contract tests (P4.2); manual Windows check before release.
5. Pricing drift → `as_of` + staleness warning + `pricing.local.json` overrides; **rates always re-verified at P4.4, never trusted from this document**.
6. Hook-event enum rot → single `$defs/events` + documented update path; optional `--relaxed-events` flag if third parties complain.
7. Listing truncation constant (1536) may change → named constant, one test (P1.5).
8. `updatedInput` read-guarding could break legit reads → OFF by default behind userConfig (P5.3); promote only with bench data.
9. Scope (~85 skills / 14 agents / 5 hook sets / 8 plugins) → phases are independent PRs; infra value (P0–P5) ships even if domain waves trail; every phase leaves the repo green.

### Critical existing files
`scripts/validate-skill-lib.mjs` (engine; lines 7–11 root-coupling, discovery fn) · `scripts/validate-manifests.mjs` (→ superseded by validate-repo.mjs) · `scripts/build.mjs` (→ multi-entry) · `.claude-plugin/marketplace.json` (→ 8-entry marketplace) · `skills/validate-agent-skill/SKILL.md` (→ moves under plugins/skillsforge/) · `.github/workflows/ci.yml` (→ per-plugin strict loop + mcp-smoke).
