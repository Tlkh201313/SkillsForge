# SkillsForge features inventory

Judge-friendly map of **every** SkillsForge surface. **Product first:** SkillsForge is a **productivity Work OS** for AI CLI work: coding, design, research, video, docs, ops, launch, skills, packs, profiles, workflows, agents, commands, library, auto, and workbench. **Trust** (validate / package / hooks / receipts) is the **safety layer underneath**, not the hero story.

Counts are live from catalog, plugin trees, CLI help, and capability registries - not marketing estimates. Version **0.4.3**.

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
| Core product | Productivity Work OS - route the right skill/workflow and ship faster |
| Domain pack depth | Domain skills are contract-backed routing playbooks with output, stop-gate, verification, failure-mode, and pressure-test sections |
| Auto routing | Exactly **8** auto-route heroes; everything else is `explicit` (pack/command scoped) |
| Hooks | Host PreToolUse hooks are **policy guards**, not an OS sandbox |
| Host fidelity | Claude Code + Codex runtime where supported; other hosts are package-fidelity installs |
| MCP | Thin, **read-only** tools - no swarm/AgentDB/write defaults |
| Workflows | Catalog entries are **dry-run** by default |
| Demo artifact | `demo-scoreboard.json` = package-tree hash, not a full trust receipt |

**Auto heroes (8):** `author-capability`, `browse-catalog`, `route-capability`, `shape-intent`, `update-skill-library`, `using-skillsforge`, `validate-agent-skill`, `verify-capability`

## Overview counts

| Surface | Count | Source |
| --- | ---: | --- |
| Catalog skills | 511 | `catalog/skillsforge.catalog.yaml` packs |
| Skill packages with `SKILL.md` | 511 | `plugins/skillsforge/skills/*/SKILL.md` |
| Packs | 28 | catalog packs |
| Profiles | 11 | catalog profiles |
| Agents | 98 | `plugins/skillsforge/agents/*.md` |
| Slash commands | 140 | `plugins/skillsforge/commands/*.*` |
| Workflows | 100 | `plugins/skillsforge/workflows/**/*.json` (10 categories) |
| Hosts | 7 | `HOST_REGISTRY` in `lib/capabilities/hosts.mjs` |
| PowerShell helpers | 22 | `POWERSHELL_HELPERS` in `lib/capabilities/powershell.mjs` |
| MCP tools | 15 | `scripts/skillsforge-mcp.mjs` |
| Auto-route heroes | 8 | sidecars with `routing.mode: auto` |

Catalog skill ids and on-disk `SKILL.md` packages match 1:1 (no missing / no orphans).

## Productivity CLI (operator first)

Entry points: `node plugins/skillsforge/bin/skillsforge.mjs` (bundled) or `node scripts/skillsforge-cli.mjs`.

Magical moment: `skillsforge init --profile vibecoder --session-host codex` - then `lib recommend`, `workflows run --dry-run`, and `session score`.

### Catalog & authoring

`catalog`, `vibe`, `scaffold`, `stocktake`, `batch`, `compare`, `compare-skill`, `output-proof`, `export-agents`, `capture`, `forge-from-capture`, `watch`, `bench`, `scorecard`, `compose`, `route`, `quality`

### Operator terminals

`init`, `session`, `wb`, `lib`, `workflows`, `auto`, `settings`, `ps`, `os-env`, `os-find`, `os-ports`, `os-open`, `os-run`, `os-copy-path`, `os-clean`

### Hosts & install

`hosts`, `install`, `package`

### Trust safety layer (supporting)

`validate`, `doctor`, `forge`, `receipt`, `verify-receipt`, `enforce`, `eval`, `skillshield`, `pressure`, `lint-skill`, `evidence`, `demo`

Trust-layer proof: `skillsforge demo` -> unsafe deny -> safe package -> **demo scoreboard** (package-tree hash).

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
| `init` | Create project config, local library artifacts, AI index, and compact session memory |
| `lib` (`build` / `update` / `serve` / `check` / `recommend` / `select` / `unselect` / `selected` / `remove` / `open`) | Local skill library index, UI, recommendation, project selection, removal preview |
| `workflows` (`list` / `show` / `recommend` / `run` / `export-html`) | Curated workflow catalog (dry-run execution) |
| `auto` (`plan` / `run`) | Combine skill + workflow recommendation; `run` requires `--read-only` |
| `session` (`remember` / `recall` / `score` / `summary` / `reset` / `export`) | Compact project memory for skill/workflow/agent usage; never chat transcript memory |

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

Install: `skillsforge hosts`, `skillsforge install --hosts ...`, optional `--custom-host <id>:<skills-dir>`.

## Profiles

| Profile | Packs | Description |
| --- | --- | --- |
| `vibe` | `trust`, `browse-catalog`, `lifecycle` | Magical moment - trust + lifecycle + browse |
| `core` | `trust`, `browse-catalog`, `lifecycle`, `methodology`, `roles`, `eng`, `design`, `os` | Default install for vibecoders |
| `full` | `trust`, `browse-catalog`, `builder`, `validation`, `methodology`, `roles`, `lifecycle`, `eng`, `design`, `product`, `growth`, `research`, `docs`, `security`, `ops`, `os`, `agentic`, `lang`, `framework`, `data`, `testing`, `media`, `mobile`, `enterprise`, `content`, `legal-lite`, `finance-lite`, `cloud-devops` | Everything -- broad trusted skill surface |
| `vibecoder` | `trust`, `browse-catalog`, `lifecycle`, `builder`, `validation`, `design`, `product`, `growth`, `eng`, `ops` | Vibe-coder builder surface for plugins, MCPs, proof, launch, and full-stack app work |
| `eng` | `trust`, `methodology`, `eng`, `testing`, `lang`, `framework` | Engineering focus |
| `design` | `trust`, `design`, `roles`, `content` | Design focus |
| `product` | `trust`, `product`, `research`, `growth` | Product focus |
| `growth` | `trust`, `growth`, `content`, `media` | Growth focus |
| `ops` | `trust`, `ops`, `os`, `security`, `cloud-devops` | Ops focus |
| `methodology` | `trust`, `methodology` | Discipline only |
| `roles` | `trust`, `roles` | Role lenses |

## Packs

**28 packs / 511 skills.** Trust + lifecycle + methodology are the production-depth spine; builder, validation, and domain packs are contract-backed SkillsForge skills.

### `trust` (5)

SkillsForge trust spine (validate, forge, route, verify)

`using-skillsforge`, `author-capability`, `route-capability`, `validate-agent-skill`, `verify-capability`

### `browse-catalog` (2)

Discover SkillsForge packs and profiles

`browse-catalog`, `update-skill-library`

### `builder` (18)

AI CLI SDK, plugin, MCP, and full-stack builder workflows

| | | |
| --- | --- | --- |
| `build-codex-plugin` | `build-claude-code-plugin` | `build-cursor-skill` |
| `build-opencode-pack` | `build-zcode-pack` | `build-hermes-agent-pack` |
| `build-mcp-server` | `build-mcp-tool-contract` | `build-agent-skill` |
| `build-ai-cli-sdk-project` | `build-plugin-marketplace-entry` | `build-skill-library-index` |
| `build-localhost-tool-ui` | `build-powershell-agent-helper` | `build-fullstack-saas` |
| `build-fullstack-crud` | `build-fullstack-auth` | `build-fullstack-admin` |

### `validation` (18)

Real-task proof, claim audit, launch readiness, and anti-slop gates

| | | |
| --- | --- | --- |
| `validate-real-task` | `validate-feature-claim` | `validate-readme-claims` |
| `validate-demo-path` | `validate-plugin-package` | `validate-mcp-contract` |
| `validate-cli-help` | `validate-host-install` | `validate-workflow-runbook` |
| `validate-ui-screenshot` | `validate-mobile-layout` | `validate-accessibility-proof` |
| `validate-security-boundary` | `validate-performance-budget` | `validate-release-readiness` |
| `validate-no-fake-stats` | `validate-generated-artifacts` | `validate-evidence-bundle` |

### `methodology` (12)

Discipline iron laws - brainstorm, plan, TDD, verify (original)

| | | |
| --- | --- | --- |
| `brainstorm-first` | `write-plan` | `tdd-first` |
| `verify-before-done` | `design-before-code` | `subagent-driven-dev` |
| `executing-plans` | `no-rationalize` | `pressure-test-skill` |
| `cso-skill-description` | `completeness-over-shortcut` | `finish-with-evidence` |

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

### `lifecycle` (14)

Work OS spine from shape to prove and learn

| | | |
| --- | --- | --- |
| `shape-intent` | `plan-work` | `lock-design` |
| `run-build` | `review-diff` | `debug-issue` |
| `qa-flow` | `crew-handoff` | `ship-release` |
| `prove-outcome` | `capture-learning` | `triage-inbox` |
| `spike-explore` | `retro-improve` |  |

### `eng` (44)

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
| `eng-tech-debt` | `fullstack-repo-map` | `fullstack-architecture-plan` |
| `fullstack-db-schema` | `fullstack-api-contract` | `fullstack-auth-flow` |
| `fullstack-file-upload` | `fullstack-background-jobs` | `fullstack-observability` |
| `fullstack-deploy-plan` | `fullstack-test-plan` | `eng-ai-generated-diff-review` |
| `eng-context-budget` | `eng-safe-codegen` | `eng-library-choice` |
| `eng-monorepo-map` | `eng-production-checklist` |  |

### `design` (60)

Product design and UI craft

| | | |
| --- | --- | --- |
| `design-anti-slop` | `design-a11y` | `design-motion` |
| `design-brand` | `design-critique` | `design-system` |
| `design-typography` | `design-color` | `design-layout` |
| `design-forms` | `design-empty-states` | `design-responsive` |
| `design-dark-mode` | `design-icons` | `design-prototype` |
| `design-handoff` | `design-tokens` | `design-content` |
| `design-dashboard-density` | `design-data-table` | `design-command-palette` |
| `design-settings-panel` | `design-navigation` | `design-sidebar` |
| `design-wizard-flow` | `design-pricing-page` | `design-onboarding-flow` |
| `design-search-filter` | `design-notifications` | `design-error-recovery` |
| `design-loading-states` | `design-focus-management` | `design-copy-hierarchy` |
| `design-visual-hierarchy` | `design-component-states` | `design-mobile-touch` |
| `design-product-dashboard` | `design-admin-console` | `design-crud-flow` |
| `design-calendar-ui` | `design-kanban-ui` | `design-chart-ui` |
| `design-figma-handoff` | `design-prototype-flow` | `design-density-audit` |
| `design-saas-workbench` | `design-accessible-motion` | `design-responsive-proof` |
| `design-design-qa` | `design-page-structure` | `design-openrouter-style-catalog` |
| `design-command-center` | `design-comparison-table` | `design-proof-dashboard` |
| `design-builder-wizard` | `design-launch-page` | `design-saas-empty-states` |
| `design-mobile-agent-ui` | `design-data-dense-filtering` | `design-ui-polish-pass` |

### `product` (26)

Product management and discovery

| | | |
| --- | --- | --- |
| `product-jtbd` | `product-rice` | `product-prd` |
| `product-launch` | `product-postmortem` | `product-roadmap` |
| `product-metrics` | `product-experiment` | `product-persona` |
| `product-onboarding` | `product-pricing-signal` | `product-feedback` |
| `product-scope-cut` | `product-north-star` | `startup-idea-filter` |
| `startup-mvp-scope` | `startup-landing-offer` | `startup-user-interview` |
| `startup-waitlist-loop` | `startup-pricing-test` | `startup-founder-brief` |
| `startup-demo-script` | `product-onboarding-audit` | `product-retention-loop` |
| `product-activation-map` | `product-paywall-fit` |  |

### `growth` (22)

Growth, SEO, retention, launch

| | | |
| --- | --- | --- |
| `growth-seo` | `growth-copy` | `growth-launch` |
| `growth-retention` | `growth-pricing` | `growth-referral` |
| `growth-landing` | `growth-email` | `growth-analytics` |
| `growth-activation` | `growth-churn` | `growth-viral` |
| `growth-content-engine` | `growth-waitlist` | `growth-partnerships` |
| `growth-positioning` | `growth-seo-cluster` | `growth-launch-plan` |
| `growth-social-proof` | `growth-email-sequence` | `growth-referral-loop` |
| `growth-analytics-proof` |  |  |

### `research` (24)

Research and competitive teardown

| | | |
| --- | --- | --- |
| `research-question` | `research-sources` | `research-teardown` |
| `research-synth` | `research-interview` | `research-survey` |
| `research-desk` | `research-market` | `research-user-journey` |
| `research-assumptions` | `research-evidence-grade` | `research-contradictions` |
| `research-competitor-map` | `research-github-patterns` | `research-docs-first` |
| `research-user-pain` | `research-market-gap` | `research-technical-feasibility` |
| `research-api-surface` | `research-pricing-signal` | `research-launch-channel` |
| `research-open-source-license` | `research-benchmark-method` | `research-source-trust` |

### `docs` (13)

Documentation and developer writing

| | | |
| --- | --- | --- |
| `docs-readme` | `docs-quickstart` | `docs-adr` |
| `docs-runbook` | `docs-llms-txt` | `docs-api-ref` |
| `docs-changelog` | `docs-contributing` | `docs-migration` |
| `docs-faq` | `docs-troubleshooting` | `docs-examples` |
| `docs-agent-facing-guide` |  |  |

### `security` (15)

Security and privacy practices

| | | |
| --- | --- | --- |
| `sec-threat-model` | `sec-secrets` | `sec-authz` |
| `sec-deps` | `sec-incident` | `sec-privacy` |
| `sec-owasp` | `sec-supply-chain` | `sec-input-validation` |
| `sec-session` | `sec-crypto-hygiene` | `sec-audit-log` |
| `sec-pentest-prep` | `sec-disclosure` | `security-agent-permission-review` |

### `ops` (14)

Operations and reliability

| | | |
| --- | --- | --- |
| `ops-deploy` | `ops-health` | `ops-oncall` |
| `ops-cost` | `ops-env-parity` | `ops-backup` |
| `ops-capacity` | `ops-slos` | `ops-incident-comms` |
| `ops-runbook-drill` | `ops-feature-freeze` | `ops-canary` |
| `ops-env-bootstrap` | `ops-ci-failure-router` |  |

### `os` (8)

Cross-platform OS helpers for agentic workstations

`os-command-router`, `os-file-ops-safe`, `os-process-port-doctor`, `os-env-doctor`, `os-shell-modernize`, `os-app-launcher`, `os-path-cleanup`, `os-agent-terminal`

### `agentic` (16)

Agentic workflows and crew patterns

| | | |
| --- | --- | --- |
| `agent-crew` | `agent-fanout` | `agent-babysit` |
| `agent-context` | `agent-eval-loop` | `agent-handoff` |
| `agent-tool-policy` | `agent-prompt-budget` | `agent-memory-lite` |
| `agent-parallel` | `agent-stop-gates` | `agent-critique` |
| `agent-replay` | `agent-sandbox` | `agentic-orchestrator-plan` |
| `agentic-workflow-replay` |  |  |

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

### `data` (17)

Data and analytics planning

| | | |
| --- | --- | --- |
| `data-schema` | `data-etl` | `data-warehouse` |
| `data-analytics-plan` | `data-quality` | `data-lineage` |
| `data-privacy` | `data-metrics-dict` | `data-experiment-design` |
| `data-dashboard` | `data-sql-review` | `data-pipelines` |
| `data-streaming` | `data-backfill` | `data-contracts` |
| `data-governance` | `data-event-tracking-plan` |  |

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

### `media` (29)

Media and creative briefs

| | | |
| --- | --- | --- |
| `media-image-brief` | `media-video-script` | `media-brand-asset` |
| `media-podcast` | `media-thumbnail` | `media-storyboard` |
| `media-alt-text` | `media-compression` | `media-style-guide` |
| `media-ugc` | `media-localization` | `media-accessibility` |
| `media-video-watch` | `media-frame-sampling` | `media-video-plan` |
| `media-caption-qc` | `media-demo-proof-pack` | `media-remotion-video-plan` |
| `media-remotion-composition-audit` | `media-remotion-render-proof` | `media-video-design-taste` |
| `media-video-quality-gate` | `media-video-rating-rubric` | `media-video-read-brief` |
| `media-video-frame-read` | `media-video-audio-caption-qc` | `media-video-story-pacing` |
| `media-video-hook-retention` | `media-video-asset-license-check` |  |

### `mobile` (10)

Mobile release and store

`mobile-ios-release`, `mobile-android-release`, `mobile-store-listing`, `mobile-push`, `mobile-offline`, `mobile-perf`, `mobile-deep-links`, `mobile-permissions`, `mobile-crash`, `mobile-beta`

### `enterprise` (12)

Enterprise stakeholder and process lite

| | | |
| --- | --- | --- |
| `ent-stakeholder-brief` | `ent-raci` | `ent-compliance-lite` |
| `ent-procurement` | `ent-sla` | `ent-change-mgmt` |
| `ent-vendor` | `ent-security-review` | `ent-audit-prep` |
| `ent-training` | `ent-support-tiers` | `ent-roadmap-align` |

### `content` (12)

Content production

| | | |
| --- | --- | --- |
| `content-longform` | `content-social` | `content-newsletter` |
| `content-blog` | `content-docs-voice` | `content-case-study` |
| `content-script` | `content-edit` | `content-seo-draft` |
| `content-repurpose` | `content-calendar` | `content-cta` |

### `legal-lite` (8)

Non-advice legal awareness helpers

`legal-nda-skim`, `legal-clause-risk`, `legal-license-pick`, `legal-tos-outline`, `legal-privacy-outline`, `legal-disclaimer`, `legal-oss-notice`, `legal-data-processing`

### `finance-lite` (8)

Lightweight finance notes for builders

`fin-unit-econ`, `fin-pricing-table`, `fin-runway`, `fin-budget`, `fin-invoice-hygiene`, `fin-mrr`, `fin-burn`, `fin-forecast-lite`

### `cloud-devops` (14)

Cloud and DevOps basics

| | | |
| --- | --- | --- |
| `cloud-docker` | `cloud-k8s-basics` | `cloud-ci-providers` |
| `cloud-iac` | `cloud-secrets-mgr` | `cloud-networking` |
| `cloud-cdn` | `cloud-observability` | `cloud-cost-tags` |
| `cloud-iam` | `cloud-serverless` | `cloud-queues` |
| `cloud-storage` | `cloud-dns` |  |

## Agents

**98 agents** under `plugins/skillsforge/agents/`. They are role files for humans or hosts to pick explicitly; SkillsForge does not auto-spawn subagents.

| | | |
| --- | --- | --- |
| `agent-terminal-operator` | `api-designer` | `backend-dev` |
| `bench-runner` | `builder` | `capture-miner` |
| `catalog-curator` | `ceo-reviewer` | `ci-diagnostician` |
| `claude-specialist` | `cli-workbench-engineer` | `codex-specialist` |
| `compose-orchestrator` | `content-lead` | `cost-optimizer` |
| `crew-coordinator` | `cursor-specialist` | `data-analyst` |
| `data-engineer` | `data-governance-auditor` | `data-quality-auditor` |
| `debugger` | `dependency-upgrade-surgeon` | `design-reviewer` |
| `designer` | `devex-reviewer` | `devops-engineer` |
| `docs-engineer` | `documentarian` | `eng-reviewer` |
| `enterprise-liaison` | `eval-engineer` | `finance-lite` |
| `founder` | `framework-coach` | `frontend-dev` |
| `fullstack-dev` | `gemini-specialist` | `growth-experimenter` |
| `growth-lead` | `hackathon-judge-reviewer` | `handoff-compressor` |
| `host-adapter` | `incident-commander` | `install-helper` |
| `language-coach` | `legal-lite` | `library-librarian` |
| `llm-index-librarian` | `local-ui-builder` | `mcp-interface-engineer` |
| `media-producer` | `ml-lite` | `mobile-dev` |
| `mobile-releaser` | `motion-qa` | `oncall-lead` |
| `opencode-specialist` | `os-workstation-helper` | `package-auditor` |
| `perf-engineer` | `planner` | `pm` |
| `policy-engineer` | `policy-tester` | `powershell-workbench-engineer` |
| `pressure-tester` | `privacy-officer` | `prompt-engineer` |
| `qa-lead` | `quality-gate` | `readme-claim-auditor` |
| `release-manager` | `repo-map-specialist` | `research-synthesizer` |
| `researcher` | `retro-facilitator` | `reviewer` |
| `safe-removal-operator` | `security-engineer` | `security-officer` |
| `seo-specialist` | `shipper` | `skill-author` |
| `skill-pack-architect` | `skillshield-auditor` | `sre` |
| `star-map-designer` | `support` | `tech-writer` |
| `terminal-output-compressor` | `test-automator` | `token-budget-controller` |
| `trust-engineer` | `ui-systems-designer` | `validator` |
| `video-workflow-producer` | `workflow-curator` |  |

## Commands

**140 slash commands** in `plugins/skillsforge/commands/`. Classification is on-disk: files containing `generated thin command` are thin pack/domain shims. CLI-only surfaces such as `demo` and `hosts` live in the native CLI help.

### Trust / upgraded entry commands

Hand-authored or native CLI shims (**29**). Prefer these for trust-critical and operator flows:

| | | |
| --- | --- | --- |
| `auto` | `build` | `catalog` |
| `debug` | `digest` | `doctor` |
| `evidence` | `forge` | `lib` |
| `map` | `next` | `plan` |
| `pressure` | `prove` | `ps` |
| `qa` | `quality` | `review` |
| `route` | `scaffold` | `shape` |
| `ship` | `skillshield` | `slim` |
| `tokens` | `validate` | `verify-receipt` |
| `wb` | `workflows` |  |

### Generated thin commands

Pack/domain shims (**106**) that mostly route into SkillsForge. Prefer upgraded entries for trust work:

| | | |
| --- | --- | --- |
| `a11y` | `adr` | `agent-terminal` |
| `agentic` | `anti-slop` | `batch` |
| `bench` | `brainstorm` | `browse` |
| `builder` | `capture` | `ceo` |
| `ci` | `claim-proof` | `cloud` |
| `compare` | `compose` | `content` |
| `copy` | `crew` | `data` |
| `deploy` | `design-first` | `design-review` |
| `devex` | `docker` | `docs` |
| `e2e` | `enforce` | `eng-review` |
| `eng` | `enterprise` | `eval` |
| `export-agents` | `finance` | `flags` |
| `forge-from-capture` | `framework` | `growth` |
| `incident` | `install` | `jtbd` |
| `k8s` | `lang` | `launch` |
| `learn` | `legal` | `lint-skill` |
| `load-test` | `lock-design` | `mcp-build` |
| `media` | `migrations` | `mobile` |
| `no-rationalize` | `oncall` | `ops` |
| `os-clean` | `os-copy-path` | `os-env` |
| `os-find` | `os-open` | `os-ports` |
| `os-run` | `pack-author` | `pack-lifecycle` |
| `pack-methodology` | `pack-roles` | `package` |
| `perf` | `plugin-build` | `prd` |
| `privacy` | `quickstart` | `readme` |
| `real-task-proof` | `receipt` | `refactor` |
| `research` | `retention` | `retro` |
| `rice` | `runbook` | `scorecard` |
| `secrets` | `security` | `seo` |
| `skill-generate` | `spike` | `status` |
| `stocktake` | `tdd` | `testing` |
| `threat-model` | `triage` | `unit-test` |
| `validation` | `verify` | `vibe` |
| `vibecoder` | `video-frames` | `video-watch` |
| `watch` | `work-brief` | `work-plan` |
| `work-proof` |  |  |

## Workflows by category

**100 workflows** across **10** categories. Workflow `run` remains dry-run by default.

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

Thin stdio NDJSON server: `scripts/skillsforge-mcp.mjs`. Read-only defaults; no swarm / AgentDB / default writes.

| Tool | Description |
| --- | --- |
| `validate` | Validate an Agent Skill directory (structure + capability policy) |
| `route` | Explainable skill routing for a natural-language query |
| `skillshield` | Best-effort skill-body scanner for unsafe patterns |
| `library_index` | Read-only installed skill library index for routing and host awareness |
| `recommend_skill` | Read-only session-aware skill recommendation for a natural-language task |
| `recommend_workflow` | Read-only workflow recommendation for a natural-language task |
| `workflow_show` | Read-only workflow detail by id |
| `settings_show` | Read-only resolved SkillsForge settings |
| `quality_skill` | Read-only skill quality score and checks |
| `skill_contract` | Read-only extracted skill output contract sections |
| `map` | ForgeMap: lean JS/TS structural lookup (prefer over grep+multi-read to save tokens) |
| `slim` | ForgeSlim: compress git/test/rg output before it hits the model |
| `digest` | One-shot briefing: status + recommend + token cost + next commands (token-friendly task start) |
| `next` | Suggest next productive SkillsForge commands from repo state |
| `tokens` | Estimate context tokens (chars/4). Default catalog = repo skills only. |

## Visual artifacts

| Asset | Role |
| --- | --- |
| `assets/skillsforge-banner.svg` | README hero with current inventory |
| `assets/skillsforge-library-preview.png` | Generated local library / workflow preview; no embedded text claims |
| `assets/video/skillsforge-demo.mp4` | Primary README video player source and packaged H.264 demo video |
| `assets/skillsforge-demo-preview.gif` | Animated fallback when a renderer refuses inline MP4 playback |
| `assets/skillsforge-demo-poster.png` | Poster frame for README/browser players |
| `assets/skillsforge-universal-fanout.svg` | Multi-host install boundary map |
| `assets/skillsforge-star-map.svg` | Current inventory relationship map |
| `assets/skillsforge-trust-pipeline.svg` | Safety layer under the Work OS |

## Examples

| Path | Role |
| --- | --- |
| `examples/codex-unsafe-release` | Judge deny path - undeclared exec/network fails validation without executing the skill |
| `examples/codex-safe-release` | Judge package path - passes -> guarded Codex plugin compile |
| `examples/safe-dependency-upgrade/forge-spec.json` | Deterministic forge-spec input for `skillsforge forge` |

Run the bundled judge path: `node plugins/skillsforge/bin/skillsforge.mjs demo`.

---

*Generated from live inventory. Snapshot counts: skills 511, packs 28, profiles 11, agents 98, command shims 140, workflows 100, hosts 7, PowerShell helpers 22, MCP tools 15, auto heroes 8.*
