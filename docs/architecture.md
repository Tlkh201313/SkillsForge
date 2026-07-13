# SkillsForge architecture (v0.3)

SkillsForge ships **one** Claude Code marketplace plugin — a capability / trust engine that forges, validates, routes, policy-scans, and packages Agent Skills with reproducible evidence receipts.

## Surfaces

| Surface | Role |
| --- | --- |
| Marketplace | `.claude-plugin/marketplace.json` with `metadata.pluginRoot: ./plugins` — one entry: `skillsforge` |
| Plugin | `plugins/skillsforge/` — commands, skills, hooks, agents, bundled CLI |
| Canonical IR | `skillsforge.json` sidecar (Ajv Draft 2020-12) beside `SKILL.md` |
| Runtime CLI | `plugins/skillsforge/bin/skillsforge.mjs` (esbuild bundle; no `npm install` on install) |
| Capability engine | `lib/capabilities/*` — loader, graph, forge, router, policy, receipt, doctor |
| Distribution | `npm run build:dist` → `dist/claude-code`, `dist/cursor`, trust receipt, lossiness |

## Data flow

```mermaid
flowchart LR
  ForgeSpec[ForgeSpec] --> Forge[DeterministicForge]
  Forge --> Canonical[SKILL.md + skillsforge.json]
  Canonical --> Validate[AjvValidator]
  Canonical --> Route[ExplainableRouter]
  Canonical --> Policy[StaticPolicyScan]
  Policy --> HookCompiler[ClaudePolicyCompiler]
  Validate --> Receipt[EvidenceReceipt]
  Route --> Receipt
  Policy --> Receipt
  HookCompiler --> ClaudePlugin[ClaudePlugin]
  Canonical --> CursorExport[CursorExport]
  CursorExport --> Lossiness[LossinessReport]
```

## Fail-closed PreToolUse decision

```mermaid
flowchart TD
    Event["PreToolUse event"] --> Load{"Load sidecar policy?"}
    Load -->|missing or invalid JSON| DenyErr["deny + exit 0"]
    Load -->|ok| Tool{"Tool family"}
    Tool -->|Bash| Shell{"Shell control syntax?"}
    Shell -->|yes| DenyShell["deny"]
    Shell -->|no| Cmd{"Command family allowlisted?"}
    Cmd -->|no| DenyCmd["deny"]
    Cmd -->|yes| NetBash{"Needs network client?"}
    NetBash -->|undeclared| DenyNet["deny"]
    NetBash -->|ok or N/A| AllowBash["allow / no decision"]
    Tool -->|Write or Edit| Path{"Path present and in scope?"}
    Path -->|no| DenyWrite["deny"]
    Path -->|yes| AllowWrite["allow / no decision"]
    Tool -->|WebFetch| Host{"network.allowed + host allowlisted?"}
    Host -->|no| DenyFetch["deny"]
    Host -->|yes| AllowFetch["allow / no decision"]
    Tool -->|WebSearch| Search{"network.allowed + searchAllowed?"}
    Search -->|no| DenySearch["deny"]
    Search -->|yes| AllowSearch["allow / no decision"]
```

Hooks are guardrails honored by Claude Code — not an OS sandbox. Any unexpected hook error also emits an explicit deny.

## Host support

| Host | Status | Meaning |
| --- | --- | --- |
| Claude Code | Full | Marketplace install, SessionStart, skill-scoped PreToolUse guardrails, bundled CLI, receipts, eval |
| Cursor | Proof | Deterministic SKILL.md export + lossiness report; no runtime policy parity |
| Codex / OpenCode | Unsupported | Not packaged or claimed |

## Runtime root resolution

The bundled CLI resolves:

1. Explicit `--root` / cwd repository (`plugins/skillsforge` present)
2. Installed plugin root (directory containing `.claude-plugin/plugin.json` + `skills/`)
3. Module-adjacent plugin root when cache-copied

Cache-copy smoke tests copy **only** `plugins/skillsforge` and exercise doctor / validate / route / forge dry-run / enforce / receipt verify without repository `lib/` or `scripts/`.

## Trust boundaries

- Static policy scan is best-effort over text-like files (see [threat-model.md](threat-model.md)).
- PreToolUse hooks are guardrails honored by the host, not an OS sandbox.
- Receipts hash skill files + record evaluation denominators; they are evidence, not certification.
- Release receipts hash packaged `dist/claude-code` bytes and embed `reportSha256` for the external routing-report. Verification recomputes package hashes and checks the report file; unsigned receipts are reproducible evidence, not third-party attestation.

## Anti-goals

Not in scope for this product track (see also superseded eight-plugin notes in `MASTER_PLAN.md`):

- MCP servers, LSP integrations, or always-on monitors
- Token / usage ledgers or cost accounting
- Domain expertise skill packs or multi-plugin “family” installs
- Multi-host runtime policy parity (Cursor is export proof only)
- OS sandboxing or third-party attestation of safety
