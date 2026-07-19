/** Compact skill inventory for SkillsForge. Original skills only. */

function skill(id, opts = {}) {
  return {
    id,
    mode: opts.mode ?? 'explicit',
    write: opts.write ?? 'project',
    title: opts.title,
    purpose: opts.purpose
  };
}

function expand(ids, defaults = {}) {
  return ids.map((id) => (typeof id === 'string' ? skill(id, defaults) : skill(id.id, { ...defaults, ...id })));
}

export const PACKS = {
  trust: {
    description: 'SkillsForge trust spine (validate, forge, route, verify)',
    skills: expand([
      { id: 'using-skillsforge', mode: 'auto' },
      { id: 'author-capability', mode: 'auto' },
      { id: 'route-capability', mode: 'auto' },
      { id: 'validate-agent-skill', mode: 'auto' },
      { id: 'verify-capability', mode: 'auto' }
    ], { write: 'none' })
  },
  'browse-catalog': {
    description: 'Discover SkillsForge packs and profiles',
    skills: expand([{ id: 'browse-catalog', mode: 'auto' }], { write: 'none' })
  },
  methodology: {
    description: 'Discipline iron laws — brainstorm, plan, TDD, verify (original)',
    // All methodology is explicit: invoke via command/pack, not global auto-route.
    skills: expand([
      'brainstorm-first',
      'write-plan',
      'tdd-first',
      'verify-before-done',
      'design-before-code',
      'subagent-driven-dev',
      'executing-plans',
      'no-rationalize',
      'pressure-test-skill',
      'cso-skill-description',
      'completeness-over-shortcut',
      'finish-with-evidence'
    ])
  },
  roles: {
    description: 'Role lenses for product, eng, design, QA, security, ship',
    skills: expand([
      'role-ceo-review',
      'role-eng-review',
      'role-design-review',
      'role-devex-review',
      'role-qa-lead',
      'role-security-officer',
      'role-shipper',
      'role-growth-lead',
      'role-researcher',
      'role-pm',
      'role-tech-writer',
      'role-sre',
      'role-support',
      'role-data-analyst',
      'role-founder',
      'role-crew-coordinator'
    ])
  },
  lifecycle: {
    description: 'Work OS spine from shape to prove and learn',
    // Only shape-intent stays auto; rest are pack/command-scoped.
    skills: expand([
      { id: 'shape-intent', mode: 'auto' },
      'plan-work',
      'lock-design',
      'run-build',
      'review-diff',
      'debug-issue',
      'qa-flow',
      'crew-handoff',
      'ship-release',
      'prove-outcome',
      'capture-learning',
      'triage-inbox',
      'spike-explore',
      'retro-improve'
    ])
  },
  eng: {
    description: 'Software engineering patterns',
    skills: expand([
      'eng-api-design', 'eng-refactor-safe', 'eng-perf-profile', 'eng-code-review',
      'eng-ci-pipeline', 'eng-feature-flags', 'eng-migrations', 'eng-error-handling',
      'eng-logging', 'eng-caching', 'eng-concurrency', 'eng-idempotency',
      'eng-contracts', 'eng-versioning', 'eng-deps-upgrade', 'eng-dead-code',
      'eng-types-strict', 'eng-module-boundaries', 'eng-config-hygiene', 'eng-secrets-handling',
      'eng-rate-limits', 'eng-pagination', 'eng-webhooks', 'eng-background-jobs',
      'eng-observability', 'eng-rollback', 'eng-hotfixes', 'eng-tech-debt'
    ])
  },
  design: {
    description: 'Product design and UI craft',
    skills: expand([
      'design-anti-slop', 'design-a11y', 'design-motion', 'design-brand',
      'design-critique', 'design-system', 'design-typography', 'design-color',
      'design-layout', 'design-forms', 'design-empty-states', 'design-responsive',
      'design-dark-mode', 'design-icons', 'design-prototype', 'design-handoff',
      'design-tokens', 'design-content'
    ])
  },
  product: {
    description: 'Product management and discovery',
    skills: expand([
      'product-jtbd', 'product-rice', 'product-prd', 'product-launch',
      'product-postmortem', 'product-roadmap', 'product-metrics', 'product-experiment',
      'product-persona', 'product-onboarding', 'product-pricing-signal', 'product-feedback',
      'product-scope-cut', 'product-north-star'
    ])
  },
  growth: {
    description: 'Growth, SEO, retention, launch',
    skills: expand([
      'growth-seo', 'growth-copy', 'growth-launch', 'growth-retention',
      'growth-pricing', 'growth-referral', 'growth-landing', 'growth-email',
      'growth-analytics', 'growth-activation', 'growth-churn', 'growth-viral',
      'growth-content-engine', 'growth-waitlist', 'growth-partnerships', 'growth-positioning'
    ])
  },
  research: {
    description: 'Research and competitive teardown',
    skills: expand([
      'research-question', 'research-sources', 'research-teardown', 'research-synth',
      'research-interview', 'research-survey', 'research-desk', 'research-market',
      'research-user-journey', 'research-assumptions', 'research-evidence-grade', 'research-contradictions'
    ])
  },
  docs: {
    description: 'Documentation and developer writing',
    skills: expand([
      'docs-readme', 'docs-quickstart', 'docs-adr', 'docs-runbook',
      'docs-llms-txt', 'docs-api-ref', 'docs-changelog', 'docs-contributing',
      'docs-migration', 'docs-faq', 'docs-troubleshooting', 'docs-examples'
    ])
  },
  security: {
    description: 'Security and privacy practices',
    skills: expand([
      'sec-threat-model', 'sec-secrets', 'sec-authz', 'sec-deps',
      'sec-incident', 'sec-privacy', 'sec-owasp', 'sec-supply-chain',
      'sec-input-validation', 'sec-session', 'sec-crypto-hygiene', 'sec-audit-log',
      'sec-pentest-prep', 'sec-disclosure'
    ])
  },
  ops: {
    description: 'Operations and reliability',
    skills: expand([
      'ops-deploy', 'ops-health', 'ops-oncall', 'ops-cost',
      'ops-env-parity', 'ops-backup', 'ops-capacity', 'ops-slos',
      'ops-incident-comms', 'ops-runbook-drill', 'ops-feature-freeze', 'ops-canary'
    ])
  },
  os: {
    description: 'Cross-platform OS helpers for agentic workstations',
    skills: expand([
      'os-command-router', 'os-file-ops-safe', 'os-process-port-doctor', 'os-env-doctor',
      'os-shell-modernize', 'os-app-launcher', 'os-path-cleanup', 'os-agent-terminal'
    ])
  },
  agentic: {
    description: 'Agentic workflows and crew patterns',
    skills: expand([
      'agent-crew', 'agent-fanout', 'agent-babysit', 'agent-context',
      'agent-eval-loop', 'agent-handoff', 'agent-tool-policy', 'agent-prompt-budget',
      'agent-memory-lite', 'agent-parallel', 'agent-stop-gates', 'agent-critique',
      'agent-replay', 'agent-sandbox'
    ])
  },
  lang: {
    description: 'Language-specific lean patterns (original)',
    skills: expand([
      'lang-js', 'lang-ts', 'lang-python', 'lang-go', 'lang-rust', 'lang-java',
      'lang-kotlin', 'lang-swift', 'lang-sql', 'lang-bash', 'lang-powershell',
      'lang-ruby', 'lang-php', 'lang-csharp', 'lang-cpp', 'lang-scala',
      'lang-elixir', 'lang-dart', 'lang-r', 'lang-lua', 'lang-html',
      'lang-css', 'lang-graphql', 'lang-protobuf', 'lang-wasm', 'lang-terraform',
      'lang-yaml', 'lang-json-schema', 'lang-markdown', 'lang-regex'
    ])
  },
  framework: {
    description: 'Framework lean patterns (original)',
    skills: expand([
      'fw-react', 'fw-next', 'fw-vue', 'fw-svelte', 'fw-angular',
      'fw-django', 'fw-fastapi', 'fw-flask', 'fw-rails', 'fw-laravel',
      'fw-spring', 'fw-express', 'fw-nest', 'fw-hono', 'fw-remix',
      'fw-astro', 'fw-flutter', 'fw-rn', 'fw-electron', 'fw-tauri',
      'fw-prisma', 'fw-drizzle', 'fw-tailwind', 'fw-vitest', 'fw-playwright',
      'fw-jest', 'fw-pytest', 'fw-docker'
    ])
  },
  data: {
    description: 'Data and analytics planning',
    skills: expand([
      'data-schema', 'data-etl', 'data-warehouse', 'data-analytics-plan',
      'data-quality', 'data-lineage', 'data-privacy', 'data-metrics-dict',
      'data-experiment-design', 'data-dashboard', 'data-sql-review', 'data-pipelines',
      'data-streaming', 'data-backfill', 'data-contracts', 'data-governance'
    ])
  },
  testing: {
    description: 'Testing strategies',
    skills: expand([
      'test-unit', 'test-e2e', 'test-property', 'test-load',
      'test-fixture', 'test-contract', 'test-snapshot', 'test-mutation',
      'test-flaky', 'test-coverage', 'test-smoke', 'test-regression',
      'test-a11y', 'test-visual', 'test-security', 'test-chaos'
    ])
  },
  media: {
    description: 'Media and creative briefs',
    skills: expand([
      'media-image-brief', 'media-video-script', 'media-brand-asset', 'media-podcast',
      'media-thumbnail', 'media-storyboard', 'media-alt-text', 'media-compression',
      'media-style-guide', 'media-ugc', 'media-localization', 'media-accessibility',
      'media-video-watch', 'media-frame-sampling', 'media-video-plan', 'media-caption-qc'
    ])
  },
  mobile: {
    description: 'Mobile release and store',
    skills: expand([
      'mobile-ios-release', 'mobile-android-release', 'mobile-store-listing', 'mobile-push',
      'mobile-offline', 'mobile-perf', 'mobile-deep-links', 'mobile-permissions',
      'mobile-crash', 'mobile-beta'
    ])
  },
  enterprise: {
    description: 'Enterprise stakeholder and process lite',
    skills: expand([
      'ent-stakeholder-brief', 'ent-raci', 'ent-compliance-lite', 'ent-procurement',
      'ent-sla', 'ent-change-mgmt', 'ent-vendor', 'ent-security-review',
      'ent-audit-prep', 'ent-training', 'ent-support-tiers', 'ent-roadmap-align'
    ])
  },
  content: {
    description: 'Content production',
    skills: expand([
      'content-longform', 'content-social', 'content-newsletter', 'content-blog',
      'content-docs-voice', 'content-case-study', 'content-script', 'content-edit',
      'content-seo-draft', 'content-repurpose', 'content-calendar', 'content-cta'
    ])
  },
  'legal-lite': {
    description: 'Non-advice legal awareness helpers',
    skills: expand([
      'legal-nda-skim', 'legal-clause-risk', 'legal-license-pick', 'legal-tos-outline',
      'legal-privacy-outline', 'legal-disclaimer', 'legal-oss-notice', 'legal-data-processing'
    ])
  },
  'finance-lite': {
    description: 'Lightweight finance notes for builders',
    skills: expand([
      'fin-unit-econ', 'fin-pricing-table', 'fin-runway', 'fin-budget',
      'fin-invoice-hygiene', 'fin-mrr', 'fin-burn', 'fin-forecast-lite'
    ])
  },
  'cloud-devops': {
    description: 'Cloud and DevOps basics',
    skills: expand([
      'cloud-docker', 'cloud-k8s-basics', 'cloud-ci-providers', 'cloud-iac',
      'cloud-secrets-mgr', 'cloud-networking', 'cloud-cdn', 'cloud-observability',
      'cloud-cost-tags', 'cloud-iam', 'cloud-serverless', 'cloud-queues',
      'cloud-storage', 'cloud-dns'
    ])
  }
};

export const PROFILES = {
  vibe: {
    description: 'Magical moment — trust + lifecycle + browse',
    packs: ['trust', 'browse-catalog', 'lifecycle']
  },
  core: {
    description: 'Default install for vibecoders',
    packs: ['trust', 'browse-catalog', 'lifecycle', 'methodology', 'roles', 'eng', 'design', 'os']
  },
  full: {
    description: 'Everything -- broad trusted skill surface',
    packs: Object.keys(PACKS)
  },
  eng: { description: 'Engineering focus', packs: ['trust', 'methodology', 'eng', 'testing', 'lang', 'framework'] },
  design: { description: 'Design focus', packs: ['trust', 'design', 'roles', 'content'] },
  product: { description: 'Product focus', packs: ['trust', 'product', 'research', 'growth'] },
  growth: { description: 'Growth focus', packs: ['trust', 'growth', 'content', 'media'] },
  ops: { description: 'Ops focus', packs: ['trust', 'ops', 'os', 'security', 'cloud-devops'] },
  methodology: { description: 'Discipline only', packs: ['trust', 'methodology'] },
  roles: { description: 'Role lenses', packs: ['trust', 'roles'] }
};

export const AGENTS = [
  'planner', 'builder', 'reviewer', 'designer', 'researcher', 'security-officer',
  'shipper', 'growth-lead', 'qa-lead', 'pm', 'tech-writer', 'sre', 'support',
  'data-analyst', 'founder', 'crew-coordinator', 'ceo-reviewer', 'eng-reviewer',
  'design-reviewer', 'devex-reviewer', 'debugger', 'perf-engineer', 'api-designer',
  'frontend-dev', 'backend-dev', 'fullstack-dev', 'mobile-dev', 'devops-engineer',
  'security-engineer', 'privacy-officer', 'content-lead', 'seo-specialist',
  'docs-engineer', 'test-automator', 'release-manager', 'incident-commander',
  'cost-optimizer', 'data-engineer', 'ml-lite', 'prompt-engineer', 'eval-engineer',
  'policy-engineer', 'trust-engineer', 'catalog-curator', 'skill-author',
  'pressure-tester', 'skillshield-auditor', 'capture-miner', 'compose-orchestrator',
  'bench-runner', 'quality-gate', 'install-helper', 'host-adapter', 'codex-specialist',
  'cursor-specialist', 'claude-specialist', 'opencode-specialist', 'gemini-specialist',
  'enterprise-liaison', 'legal-lite', 'finance-lite', 'media-producer', 'mobile-releaser',
  'framework-coach', 'language-coach', 'growth-experimenter', 'research-synthesizer',
  'retro-facilitator', 'oncall-lead', 'validator', 'os-workstation-helper',
  'video-workflow-producer', 'skill-pack-architect', 'agent-terminal-operator',
  'repo-map-specialist', 'dependency-upgrade-surgeon', 'package-auditor',
  'cli-workbench-engineer', 'policy-tester', 'llm-index-librarian',
  'ui-systems-designer', 'motion-qa', 'data-quality-auditor',
  'data-governance-auditor', 'hackathon-judge-reviewer',
  'terminal-output-compressor', 'ci-diagnostician', 'workflow-curator',
  'token-budget-controller', 'handoff-compressor', 'powershell-workbench-engineer',
  'library-librarian', 'mcp-interface-engineer', 'star-map-designer',
  'documentarian', 'readme-claim-auditor', 'local-ui-builder',
  'safe-removal-operator'
];

export const COMMANDS = [
  'vibe', 'catalog', 'quality', 'lint-skill', 'bench', 'compose', 'watch', 'scorecard',
  'scaffold', 'stocktake', 'batch', 'compare', 'pressure', 'skillshield', 'export-agents',
  'capture', 'forge-from-capture', 'shape', 'plan', 'lock-design', 'build', 'review',
  'debug', 'qa', 'crew', 'ship', 'prove', 'learn', 'triage', 'spike', 'retro',
  'brainstorm', 'tdd', 'verify', 'design-first', 'no-rationalize', 'ceo', 'eng-review',
  'design-review', 'devex', 'security', 'growth', 'research', 'docs', 'ops', 'agentic',
  'eng', 'testing', 'data', 'lang', 'framework', 'media', 'mobile', 'enterprise',
  'content', 'legal', 'finance', 'cloud', 'threat-model', 'secrets', 'deploy', 'oncall',
  'seo', 'copy', 'launch', 'retention', 'prd', 'jtbd', 'rice', 'a11y', 'anti-slop',
  'readme', 'quickstart', 'adr', 'runbook', 'unit-test', 'e2e', 'load-test', 'refactor',
  'perf', 'ci', 'migrations', 'flags', 'incident', 'privacy', 'docker', 'k8s',
  'doctor', 'validate', 'route', 'forge', 'receipt', 'verify-receipt', 'enforce',
  'eval', 'install', 'package', 'evidence', 'browse', 'pack-methodology', 'pack-roles',
  'pack-lifecycle', 'next', 'status', 'work-brief', 'work-plan', 'work-proof',
  'os-run', 'os-open', 'os-find', 'os-ports', 'os-env', 'os-copy-path',
  'os-clean', 'wb', 'lib', 'workflows', 'auto', 'ps',
  'agent-terminal', 'video-watch', 'video-frames', 'skill-generate',
  'pack-author'
];

export function allSkills() {
  const out = [];
  for (const [packId, pack] of Object.entries(PACKS)) {
    for (const s of pack.skills) {
      out.push({ ...s, pack: packId });
    }
  }
  return out;
}

export function assertInventoryCounts() {
  const skills = allSkills();
  const ids = new Set(skills.map((s) => s.id));
  if (ids.size !== skills.length) {
    const dupes = skills.map((s) => s.id).filter((id, i, arr) => arr.indexOf(id) !== i);
    throw new Error(`duplicate skill ids: ${[...new Set(dupes)].join(', ')}`);
  }
  return {
    skills: ids.size,
    packs: Object.keys(PACKS).length,
    agents: AGENTS.length,
    commands: COMMANDS.length
  };
}
