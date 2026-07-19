# SkillsForge features inventory

Judge-friendly map of **every** SkillsForge surface. **Product first:** SkillsForge is a **productivity Work OS** for agent coding (skills, packs, profiles, workflows, agents, commands, library, auto, workbench). **Trust** (validate / package / hooks / receipts) is the **safety layer underneath**, not the hero story.

Counts are live from catalog, plugin trees, CLI help, and capability registries — not marketing estimates. Version **0.4.1**.

## Related docs

| Doc | Why open it |
| --- | --- |
| [README](../README.md) | Pitch, demo path, quickstart |
| [Architecture](architecture.md) | Surfaces, Codex compile, hook flow |
| [Threat model](threat-model.md) | Trust boundaries, fail-closed vs fail-open |
| [Competitive matrix](competitive-matrix.md) | Honest differentiation vs ECC / Superpowers / gstack |
| [Submit checklist](submit-checklist.md) | Hackathon submission gates |

## Honesty (read first)

| Claim | Reality |
| --- | --- |
| Core product | Productivity Work OS — route the right skill/workflow and ship faster |
| Domain pack depth | Most domain packs are **lean scaffolds** — useful routing surface, not production-depth playbooks |
| Auto routing | Exactly **8** auto-route heroes; everything else is `explicit` (pack/command scoped) |
| Hooks | Host PreToolUse hooks are **policy guards**, not an OS sandbox |
| Host fidelity | Claude Code + Codex runtime where supported; other hosts are package-fidelity installs |
| MCP | Thin, **read-only** tools — no swarm/AgentDB/write defaults |
| Workflows | Catalog entries are **dry-run** by default |
| Demo artifact | `demo-scoreboard.json` = package-tree hash, not a full trust receipt |

**Auto heroes (8):** `author-capability`, `browse-catalog`, `route-capability`, `shape-intent`, `update-skill-library`, `using-skillsforge`, `validate-agent-skill`, `verify-capability`

## Overview counts

| Surface | Count | Source |
| --- | ---: | --- |
| Catalog skills | 367 | `catalog/skillsforge.catalog.yaml` packs |
| Skill packages with `SKILL.md` | 367 | `plugins/skillsforge/skills/*/SKILL.md` |
| Packs | 26 | catalog packs |
| Profiles | 10 | catalog profiles |
| Agents | 98 | `plugins/skillsforge/agents/*.md` |
| Slash commands | 124 | `plugins/skillsforge/commands/*.*` (25 upgraded / 99 generated thin) |
| Workflows | 100 | `plugins/skillsforge/workflows/**/*.json` (10 categories) |
| Hosts | 7 | `HOST_REGISTRY` in `lib/capabilities/hosts.mjs` |
| PowerShell helpers | 15 | `POWERSHELL_HELPERS` in `lib/capabilities/powershell.mjs` |
| MCP tools | 7 | `scripts/skillsforge-mcp.mjs` |
| Auto-route heroes | 8 | sidecars with `routing.mode: auto` |

Catalog skill ids and on-disk `SKILL.md` packages match 1:1 (no missing / no orphans).

## Productivity CLI (operator first)

Entry points: `node plugins/skillsforge/bin/skillsforge.mjs` (bundled) or `node scripts/skillsforge-cli.mjs`.

Magical moment: `skillsforge vibe` · recommend: `lib recommend` / `workflows recommend` / `auto run --read-only`.

### Catalog & authoring

`catalog`, `vibe`, `scaffold`, `stocktake`, `batch`, `compare`, `compare-skill`, `export-agents`, `capture`, `forge-from-capture`, `watch`, `bench`, `scorecard`, `compose`, `route`, `quality`

### Operator terminals

`wb`, `lib`, `workflows`, `auto`, `ps`, `os-env`, `os-find`, `os-ports`, `os-open`, `os-run`, `os-copy-path`, `os-clean`

### Hosts & install

`hosts`, `install`, `package`

### Trust safety layer (supporting)

`validate`, `doctor`, `forge`, `receipt`, `verify-receipt`, `enforce`, `eval`, `skillshield`, `pressure`, `lint-skill`, `evidence`, `demo`

Judge path: `skillsforge demo` → unsafe deny → safe package → **demo scoreboard** (package-tree hash).

Full help text is the source of truth: `skillsforge help`.

## Operator / SF terminals

### Workbench (`wb`)

Token-friendly repo ops: `status`, `tree`, `find`, `grep`, `diff`, `errors`, `bigfiles`, `recent`, `proof`.

### OS helpers (`os-*`)

| Command | Role |
| --- | --- |
| `os-env` | Safe environment facts (no secret dumps) |
| `os-find` | Cross-platform file finder |
| `os-ports` | Listening port snapshot |
| `os-open` | Platform launcher open |
| `os-run` | Agent-safe runner (dry-run unless `--yes`) |
| `os-copy-path` | Canonical path print |
| `os-clean` | Dry-run cleanup inventory only |

### PowerShell helpers (`sf-*`)

Exported via `skillsforge ps export` from `POWERSHELL_HELPERS`:

| Helper | Description | CLI args |
| --- | --- | --- |
| `sf-status` | Compact repo and SkillsForge status | `wb status --json` |
| `sf-tree` | Compact file tree | `wb tree` |
| `sf-find` | Token-friendly file finder | `wb find` |
| `sf-grep` | Token-friendly ripgrep wrapper | `wb grep` |
| `sf-diff` | Compact git diff summary | `wb diff` |
| `sf-errors` | Find likely error and TODO markers | `wb errors` |
| `sf-bigfiles` | List largest repo files | `wb bigfiles` |
| `sf-recent` | Recent git commits | `wb recent` |
| `sf-ports` | Listening port snapshot | `os-ports` |
| `sf-proof` | Trust proof command hints | `wb proof --json` |
| `sf-lib` | Build local skill library artifacts | `lib build --json` |
| `sf-lib-update` | Refresh local skill library after installing skills | `lib update --json` |
| `sf-recommend` | Session-aware skill and workflow recommendation | `lib recommend --json` |
| `sf-workflow` | Workflow catalog browser | `workflows recommend --json` |
| `sf-auto` | Read-only auto plan for a task | `auto plan --json` |

## Library / workflows / auto

| Command | What it does |
| --- | --- |
| `lib` (`build` / `update` / `serve` / `check` / `recommend` / `remove`) | Local skill library index, UI, recommendation, removal preview |
| `workflows` (`list` / `show` / `recommend` / `run` / `export-html`) | Curated workflow catalog (dry-run execution) |
| `auto` (`plan` / `run`) | Combine skill + workflow recommendation; `run` requires `--read-only` |

## Hosts & install fidelity

From `HOST_REGISTRY` (`lib/capabilities/hosts.mjs`):

| Host id | Label | Fidelity | Runtime enforced | Sidecar |
| --- | --- | --- | --- | --- |
| `claude-code` | Claude Code | full | yes | yes |
| `cursor` | Cursor | package | no | no |
| `codex` | Codex CLI | package | no | no |
| `opencode` | OpenCode | package | no | no |
| `zcode` | ZCode-compatible local agent | package | no | no |
| `hermes` | Hermes Agent | package | no | no |
| `gemini` | Gemini CLI | package | no | no |

Install: `skillsforge hosts`, `skillsforge install --hosts …`, optional `--custom-host <id>:<skills-dir>`.

## Profiles

| Profile | Packs | Description |
| --- | --- | --- |
| `core` | `trust`, `browse-catalog`, `lifecycle`, `methodology`, `roles`, `eng`, `design`, `os` | Default install for vibecoders |
| `design` | `trust`, `design`, `roles`, `content` | Design focus |
| `eng` | `trust`, `methodology`, `eng`, `testing`, `lang`, `framework` | Engineering focus |
| `full` | `trust`, `browse-catalog`, `methodology`, `roles`, `lifecycle`, `eng`, `design`, `product`, `growth`, `research`, `docs`, `security`, `ops`, `os`, `agentic`, `lang`, `framework`, `data`, `testing`, `media`, `mobile`, `enterprise`, `content`, `legal-lite`, `finance-lite`, `cloud-devops` | Everything -- broad trusted skill surface |
| `growth` | `trust`, `growth`, `content`, `media` | Growth focus |
| `methodology` | `trust`, `methodology` | Discipline only |
| `ops` | `trust`, `ops`, `os`, `security`, `cloud-devops` | Ops focus |
| `product` | `trust`, `product`, `research`, `growth` | Product focus |
| `roles` | `trust`, `roles` | Role lenses |
| `vibe` | `trust`, `browse-catalog`, `lifecycle` | Magical moment — trust + lifecycle + browse |

## Packs

**26 packs / 367 skills.** Trust + lifecycle + methodology are the production-depth spine; domain packs are lean scaffolds.

### `agentic` (14)

Agentic workflows and crew patterns

| | | |
| --- | --- | --- |
| `agent-crew` | `agent-fanout` | `agent-babysit` |
| `agent-context` | `agent-eval-loop` | `agent-handoff` |
| `agent-tool-policy` | `agent-prompt-budget` | `agent-memory-lite` |
| `agent-parallel` | `agent-stop-gates` | `agent-critique` |
| `agent-replay` | `agent-sandbox` |  |

### `browse-catalog` (2)

Discover SkillsForge packs and profiles

`browse-catalog`, `update-skill-library`

### `cloud-devops` (14)

Cloud and DevOps basics

| | | |
| --- | --- | --- |
| `cloud-docker` | `cloud-k8s-basics` | `cloud-ci-providers` |
| `cloud-iac` | `cloud-secrets-mgr` | `cloud-networking` |
| `cloud-cdn` | `cloud-observability` | `cloud-cost-tags` |
| `cloud-iam` | `cloud-serverless` | `cloud-queues` |
| `cloud-storage` | `cloud-dns` |  |

### `content` (12)

Content production

| | | |
| --- | --- | --- |
| `content-longform` | `content-social` | `content-newsletter` |
| `content-blog` | `content-docs-voice` | `content-case-study` |
| `content-script` | `content-edit` | `content-seo-draft` |
| `content-repurpose` | `content-calendar` | `content-cta` |

### `data` (16)

Data and analytics planning

| | | |
| --- | --- | --- |
| `data-schema` | `data-etl` | `data-warehouse` |
| `data-analytics-plan` | `data-quality` | `data-lineage` |
| `data-privacy` | `data-metrics-dict` | `data-experiment-design` |
| `data-dashboard` | `data-sql-review` | `data-pipelines` |
| `data-streaming` | `data-backfill` | `data-contracts` |
| `data-governance` |  |  |

### `design` (18)

Product design and UI craft

| | | |
| --- | --- | --- |
| `design-anti-slop` | `design-a11y` | `design-motion` |
| `design-brand` | `design-critique` | `design-system` |
| `design-typography` | `design-color` | `design-layout` |
| `design-forms` | `design-empty-states` | `design-responsive` |
| `design-dark-mode` | `design-icons` | `design-prototype` |
| `design-handoff` | `design-tokens` | `design-content` |

### `docs` (12)

Documentation and developer writing

| | | |
| --- | --- | --- |
| `docs-readme` | `docs-quickstart` | `docs-adr` |
| `docs-runbook` | `docs-llms-txt` | `docs-api-ref` |
| `docs-changelog` | `docs-contributing` | `docs-migration` |
| `docs-faq` | `docs-troubleshooting` | `docs-examples` |

### `eng` (28)

Software engineering patterns

| | | |
| --- | --- | --- |
| `eng-api-design` | `eng-refactor-safe` | `eng-perf-profile` |
| `eng-code-review` | `eng-ci-pipeline` | `eng-feature-flags` |
| `eng-migrations` | `eng-error-handling` | `eng-logging` |
| `eng-caching` | `eng-concurrency` | `eng-idempotency` |
| `eng-contracts` | `eng-versioning` | `eng-deps-upgrade` |
| `eng-dead-code` | `eng-types-strict` | `eng-module-boundaries` |
| `eng-config-hygiene` | `eng-secrets-handling` | `eng-rate-limits` |
| `eng-pagination` | `eng-webhooks` | `eng-background-jobs` |
| `eng-observability` | `eng-rollback` | `eng-hotfixes` |
| `eng-tech-debt` |  |  |

### `enterprise` (12)

Enterprise stakeholder and process lite

| | | |
| --- | --- | --- |
| `ent-stakeholder-brief` | `ent-raci` | `ent-compliance-lite` |
| `ent-procurement` | `ent-sla` | `ent-change-mgmt` |
| `ent-vendor` | `ent-security-review` | `ent-audit-prep` |
| `ent-training` | `ent-support-tiers` | `ent-roadmap-align` |

### `finance-lite` (8)

Lightweight finance notes for builders

`fin-unit-econ`, `fin-pricing-table`, `fin-runway`, `fin-budget`, `fin-invoice-hygiene`, `fin-mrr`, `fin-burn`, `fin-forecast-lite`

### `framework` (28)

Framework lean patterns (original)

| | | |
| --- | --- | --- |
| `fw-react` | `fw-next` | `fw-vue` |
| `fw-svelte` | `fw-angular` | `fw-django` |
| `fw-fastapi` | `fw-flask` | `fw-rails` |
| `fw-laravel` | `fw-spring` | `fw-express` |
| `fw-nest` | `fw-hono` | `fw-remix` |
| `fw-astro` | `fw-flutter` | `fw-rn` |
| `fw-electron` | `fw-tauri` | `fw-prisma` |
| `fw-drizzle` | `fw-tailwind` | `fw-vitest` |
| `fw-playwright` | `fw-jest` | `fw-pytest` |
| `fw-docker` |  |  |

### `growth` (16)

Growth, SEO, retention, launch

| | | |
| --- | --- | --- |
| `growth-seo` | `growth-copy` | `growth-launch` |
| `growth-retention` | `growth-pricing` | `growth-referral` |
| `growth-landing` | `growth-email` | `growth-analytics` |
| `growth-activation` | `growth-churn` | `growth-viral` |
| `growth-content-engine` | `growth-waitlist` | `growth-partnerships` |
| `growth-positioning` |  |  |

### `lang` (30)

Language-specific lean patterns (original)

| | | |
| --- | --- | --- |
| `lang-js` | `lang-ts` | `lang-python` |
| `lang-go` | `lang-rust` | `lang-java` |
| `lang-kotlin` | `lang-swift` | `lang-sql` |
| `lang-bash` | `lang-powershell` | `lang-ruby` |
| `lang-php` | `lang-csharp` | `lang-cpp` |
| `lang-scala` | `lang-elixir` | `lang-dart` |
| `lang-r` | `lang-lua` | `lang-html` |
| `lang-css` | `lang-graphql` | `lang-protobuf` |
| `lang-wasm` | `lang-terraform` | `lang-yaml` |
| `lang-json-schema` | `lang-markdown` | `lang-regex` |

### `legal-lite` (8)

Non-advice legal awareness helpers

`legal-nda-skim`, `legal-clause-risk`, `legal-license-pick`, `legal-tos-outline`, `legal-privacy-outline`, `legal-disclaimer`, `legal-oss-notice`, `legal-data-processing`

### `lifecycle` (14)

Work OS spine from shape to prove and learn

| | | |
| --- | --- | --- |
| `shape-intent` | `plan-work` | `lock-design` |
| `run-build` | `review-diff` | `debug-issue` |
| `qa-flow` | `crew-handoff` | `ship-release` |
| `prove-outcome` | `capture-learning` | `triage-inbox` |
| `spike-explore` | `retro-improve` |  |

### `media` (16)

Media and creative briefs

| | | |
| --- | --- | --- |
| `media-image-brief` | `media-video-script` | `media-brand-asset` |
| `media-podcast` | `media-thumbnail` | `media-storyboard` |
| `media-alt-text` | `media-compression` | `media-style-guide` |
| `media-ugc` | `media-localization` | `media-accessibility` |
| `media-video-watch` | `media-frame-sampling` | `media-video-plan` |
| `media-caption-qc` |  |  |

### `methodology` (12)

Discipline iron laws — brainstorm, plan, TDD, verify (original)

| | | |
| --- | --- | --- |
| `brainstorm-first` | `write-plan` | `tdd-first` |
| `verify-before-done` | `design-before-code` | `subagent-driven-dev` |
| `executing-plans` | `no-rationalize` | `pressure-test-skill` |
| `cso-skill-description` | `completeness-over-shortcut` | `finish-with-evidence` |

### `mobile` (10)

Mobile release and store

| | | |
| --- | --- | --- |
| `mobile-ios-release` | `mobile-android-release` | `mobile-store-listing` |
| `mobile-push` | `mobile-offline` | `mobile-perf` |
| `mobile-deep-links` | `mobile-permissions` | `mobile-crash` |
| `mobile-beta` |  |  |

### `ops` (12)

Operations and reliability

| | | |
| --- | --- | --- |
| `ops-deploy` | `ops-health` | `ops-oncall` |
| `ops-cost` | `ops-env-parity` | `ops-backup` |
| `ops-capacity` | `ops-slos` | `ops-incident-comms` |
| `ops-runbook-drill` | `ops-feature-freeze` | `ops-canary` |

### `os` (8)

Cross-platform OS helpers for agentic workstations

`os-command-router`, `os-file-ops-safe`, `os-process-port-doctor`, `os-env-doctor`, `os-shell-modernize`, `os-app-launcher`, `os-path-cleanup`, `os-agent-terminal`

### `product` (14)

Product management and discovery

| | | |
| --- | --- | --- |
| `product-jtbd` | `product-rice` | `product-prd` |
| `product-launch` | `product-postmortem` | `product-roadmap` |
| `product-metrics` | `product-experiment` | `product-persona` |
| `product-onboarding` | `product-pricing-signal` | `product-feedback` |
| `product-scope-cut` | `product-north-star` |  |

### `research` (12)

Research and competitive teardown

| | | |
| --- | --- | --- |
| `research-question` | `research-sources` | `research-teardown` |
| `research-synth` | `research-interview` | `research-survey` |
| `research-desk` | `research-market` | `research-user-journey` |
| `research-assumptions` | `research-evidence-grade` | `research-contradictions` |

### `roles` (16)

Role lenses for product, eng, design, QA, security, ship

| | | |
| --- | --- | --- |
| `role-ceo-review` | `role-eng-review` | `role-design-review` |
| `role-devex-review` | `role-qa-lead` | `role-security-officer` |
| `role-shipper` | `role-growth-lead` | `role-researcher` |
| `role-pm` | `role-tech-writer` | `role-sre` |
| `role-support` | `role-data-analyst` | `role-founder` |
| `role-crew-coordinator` |  |  |

### `security` (14)

Security and privacy practices

| | | |
| --- | --- | --- |
| `sec-threat-model` | `sec-secrets` | `sec-authz` |
| `sec-deps` | `sec-incident` | `sec-privacy` |
| `sec-owasp` | `sec-supply-chain` | `sec-input-validation` |
| `sec-session` | `sec-crypto-hygiene` | `sec-audit-log` |
| `sec-pentest-prep` | `sec-disclosure` |  |

### `testing` (16)

Testing strategies

| | | |
| --- | --- | --- |
| `test-unit` | `test-e2e` | `test-property` |
| `test-load` | `test-fixture` | `test-contract` |
| `test-snapshot` | `test-mutation` | `test-flaky` |
| `test-coverage` | `test-smoke` | `test-regression` |
| `test-a11y` | `test-visual` | `test-security` |
| `test-chaos` |  |  |

### `trust` (5)

SkillsForge trust spine (validate, forge, route, verify)

`using-skillsforge`, `author-capability`, `route-capability`, `validate-agent-skill`, `verify-capability`

## Agents

**98 agents** under `plugins/skillsforge/agents/`, grouped by role prefix:

### Trust & quality (12)

`bench-runner`, `eval-engineer`, `hackathon-judge-reviewer`, `package-auditor`, `policy-engineer`, `policy-tester`, `pressure-tester`, `quality-gate`, `readme-claim-auditor`, `skillshield-auditor`, `trust-engineer`, `validator`

### Host specialists (7)

`claude-specialist`, `codex-specialist`, `cursor-specialist`, `gemini-specialist`, `host-adapter`, `install-helper`, `opencode-specialist`

### Engineering (14)

`api-designer`, `backend-dev`, `builder`, `cli-workbench-engineer`, `debugger`, `dependency-upgrade-surgeon`, `eng-reviewer`, `framework-coach`, `frontend-dev`, `fullstack-dev`, `language-coach`, `mobile-dev`, `perf-engineer`, `powershell-workbench-engineer`

### Design & product (9)

`ceo-reviewer`, `design-reviewer`, `designer`, `founder`, `local-ui-builder`, `motion-qa`, `pm`, `star-map-designer`, `ui-systems-designer`

### Data & ops (12)

`ci-diagnostician`, `cost-optimizer`, `data-analyst`, `data-engineer`, `data-governance-auditor`, `data-quality-auditor`, `devops-engineer`, `incident-commander`, `ml-lite`, `oncall-lead`, `release-manager`, `sre`

### Growth & content (9)

`content-lead`, `docs-engineer`, `documentarian`, `growth-experimenter`, `growth-lead`, `media-producer`, `seo-specialist`, `tech-writer`, `video-workflow-producer`

### Security & compliance (6)

`enterprise-liaison`, `finance-lite`, `legal-lite`, `privacy-officer`, `security-engineer`, `security-officer`

### Workflow & library (14)

`agent-terminal-operator`, `capture-miner`, `catalog-curator`, `compose-orchestrator`, `crew-coordinator`, `handoff-compressor`, `library-librarian`, `llm-index-librarian`, `mcp-interface-engineer`, `repo-map-specialist`, `safe-removal-operator`, `terminal-output-compressor`, `token-budget-controller`, `workflow-curator`

### Other roles (15)

`devex-reviewer`, `mobile-releaser`, `os-workstation-helper`, `planner`, `prompt-engineer`, `qa-lead`, `research-synthesizer`, `researcher`, `retro-facilitator`, `reviewer`, `shipper`, `skill-author`, `skill-pack-architect`, `support`, `test-automator`

## Commands

**124 slash commands** in `plugins/skillsforge/commands/`.

Classification is on-disk: files containing `generated thin command` are thin pack/domain shims.
CLI-only surfaces (no slash file) such as `demo` and `hosts` live under **Trust & judge CLI** above.

### Trust / upgraded entry commands

Hand-authored or native CLI shims (**25**). Prefer these for trust-critical and operator flows:

`auto`, `build`, `catalog`, `debug`, `doctor`, `evidence`, `forge`, `lib`, `plan`, `pressure`, `prove`, `ps`, `qa`, `quality`, `review`, `route`, `scaffold`, `shape`, `ship`, `skillshield`, `validate`, `verify-receipt`, `vibe`, `wb`, `workflows`

### Generated thin commands

Pack/domain shims (**99**) that mostly `route --query "…"`. Prefer upgraded entries for trust work:

`a11y`, `adr`, `agent-terminal`, `agentic`, `anti-slop`, `batch`, `bench`, `brainstorm`, `browse`, `capture`, `ceo`, `ci`, `cloud`, `compare`, `compose`, `content`, `copy`, `crew`, `data`, `deploy`, `design-first`, `design-review`, `devex`, `docker`, `docs`, `e2e`, `enforce`, `eng`, `eng-review`, `enterprise`, `eval`, `export-agents`, `finance`, `flags`, `forge-from-capture`, `framework`, `growth`, `incident`, `install`, `jtbd`, `k8s`, `lang`, `launch`, `learn`, `legal`, `lint-skill`, `load-test`, `lock-design`, `media`, `migrations`, `mobile`, `next`, `no-rationalize`, `oncall`, `ops`, `os-clean`, `os-copy-path`, `os-env`, `os-find`, `os-open`, `os-ports`, `os-run`, `pack-author`, `pack-lifecycle`, `pack-methodology`, `pack-roles`, `package`, `perf`, `prd`, `privacy`, `quickstart`, `readme`, `receipt`, `refactor`, `research`, `retention`, `retro`, `rice`, `runbook`, `scorecard`, `secrets`, `security`, `seo`, `skill-generate`, `spike`, `status`, `stocktake`, `tdd`, `testing`, `threat-model`, `triage`, `unit-test`, `verify`, `video-frames`, `video-watch`, `watch`, `work-brief`, `work-plan`, `work-proof`

## Workflows by category

**100 workflows** across **10** categories:

| Category | Count | Workflow ids |
| --- | ---: | --- |
| `agentic` | 6 | `eval-loop`, `handoff-capsule`, `replay-proof`, `safe-tool-policy`, `skill-routing-plan`, `token-budget-plan` |
| `coding` | 16 | `api-contract-change`, `background-job-hardening`, `bug-isolation`, `cli-command-addition`, `config-hygiene`, `dead-code-removal`, `dependency-upgrade`, `error-handling-path`, `feature-flag-rollout`, `logging-signal`, `migration-safety`, `module-boundary-fix`, `performance-probe`, `release-diff-review`, `safe-refactor`, `typescript-strictness` |
| `data` | 8 | `dashboard-audit`, `etl-debug`, `experiment-plan`, `lineage-map`, `metrics-dict`, `privacy-review`, `quality-check`, `schema-change` |
| `design` | 10 | `color-contrast-pass`, `component-state-pass`, `dark-mode-pass`, `handoff-spec`, `icon-system-pass`, `library-ui-audit`, `motion-microstates`, `prototype-review`, `responsive-layout-proof`, `typography-tighten` |
| `docs` | 10 | `adr-record`, `api-reference`, `changelog-entry`, `contributing-guide`, `faq-troubleshoot`, `llms-index`, `migration-note`, `quickstart-test`, `readme-claim-audit`, `runbook-update` |
| `media` | 6 | `asset-compression`, `brand-asset-pass`, `caption-qc`, `demo-video-script`, `frame-sampling`, `thumbnail-brief` |
| `ops` | 12 | `canary-plan`, `capacity-note`, `ci-provider-pass`, `cost-sanity`, `deploy-dry-run`, `docker-check`, `env-parity`, `health-check`, `incident-comms`, `oncall-runbook`, `secrets-manager-pass`, `slo-draft` |
| `product` | 8 | `feedback-cluster`, `jtbd-pass`, `launch-readiness`, `metrics-dictionary`, `onboarding-friction`, `rice-triage`, `roadmap-trim`, `scope-cut` |
| `security` | 12 | `audit-log-path`, `authz-review`, `crypto-hygiene`, `dependency-audit`, `incident-readiness`, `input-validation`, `owasp-pass`, `privacy-pass`, `secret-scan`, `session-boundary`, `supply-chain-package`, `threat-model-lite` |
| `testing` | 12 | `a11y-proof`, `chaos-drill`, `contract-boundary`, `coverage-risk`, `e2e-smoke`, `flaky-test-triage`, `load-test-probe`, `regression-lock`, `security-test-pass`, `snapshot-discipline`, `unit-test-gap`, `visual-proof` |

## MCP tools

Thin stdio NDJSON server: `scripts/skillsforge-mcp.mjs`. Read-only; no swarm / AgentDB / default writes.

| Tool | Description |
| --- | --- |
| `validate` | Validate an Agent Skill directory (structure + capability policy) |
| `route` | Explainable skill routing for a natural-language query |
| `skillshield` | Best-effort skill-body scanner for unsafe patterns |
| `library_index` | Read-only installed skill library index |
| `recommend_skill` | Read-only session-aware skill recommendation |
| `recommend_workflow` | Read-only workflow recommendation |
| `workflow_show` | Read-only workflow detail by id |

## Examples

| Path | Role |
| --- | --- |
| `examples/codex-unsafe-release` | Judge deny path — undeclared exec/network fails validation without executing the skill |
| `examples/codex-safe-release` | Judge package path — passes → guarded Codex plugin compile |
| `examples/safe-dependency-upgrade/forge-spec.json` | Deterministic forge-spec input for `skillsforge forge` |

Run the bundled judge path: `node plugins/skillsforge/bin/skillsforge.mjs demo`.

---

*Generated from live inventory. Snapshot counts: skills 367, packs 26, profiles 10, agents 98, commands 124, workflows 100, hosts 7, PowerShell helpers 15, MCP tools 7, auto heroes 8.*
