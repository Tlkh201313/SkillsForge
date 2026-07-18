# SkillsForge architecture (v0.3)

SkillsForge is a capability / trust engine for portable Agent Skills. Canonical IR is `SKILL.md` + `skillsforge.json`. Claude Code remains a full marketplace host; **Codex** is a first-class native plugin target with guarded per-skill packaging and PreToolUse policy hooks.

## Surfaces

| Surface | Role |
| --- | --- |
| Codex marketplace | `.agents/plugins/marketplace.json` → `plugins/skillsforge` |
| Codex plugin | `plugins/skillsforge/.codex-plugin/plugin.json` + skills + hooks |
| Claude marketplace | `.claude-plugin/marketplace.json` with `metadata.pluginRoot: ./plugins` |
| Claude plugin | `plugins/skillsforge/.claude-plugin/plugin.json` — commands, skills, hooks, agents, CLI |
| Canonical IR | `skillsforge.json` sidecar (Ajv Draft 2020-12) beside `SKILL.md` |
| Runtime CLI | `plugins/skillsforge/bin/skillsforge.mjs` (esbuild bundle) |
| Capability engine | `lib/capabilities/*` — loader, forge, router, policy, package, evidence, receipt, install |
| Codex compiler | `codex-package.mjs` + `codex-policy-compiler.mjs` — one skill → guarded plugin |
| Host installer | `skillsforge install` — full (Claude) or package-fidelity (Cursor/Codex/OpenCode/Gemini) |
| Distribution | `npm run build:dist` → `dist/claude-code`, `dist/codex`, `dist/cursor`, receipts |

## Canonical skill → Codex plugin compilation

```mermaid
flowchart TD
    SkillDir["Skill directory\nSKILL.md + skillsforge.json\n(+ scripts/references/assets)"] --> Load["loadSkill + verifySkillPaths"]
    Load --> Scan["Static capability policy scan"]
    Scan -->|blocking finding| Fail["ok:false — no write"]
    Scan -->|pass| Plan["planCodexPackage"]
    Plan --> Manifest[".codex-plugin/plugin.json"]
    Plan --> CopySkill["skills/name/ complete package"]
    Plan --> OpenaiYaml["skills/name/agents/openai.yaml"]
    Plan --> Hooks["hooks/hooks.json\nPreToolUse: Bash|apply_patch|mcp__*"]
    Plan --> Runner["hooks/codex-pre-tool-policy.mjs"]
    Plan --> PolicyCopy["immutable policy/skillsforge.json"]
    Manifest --> Out["--out Codex plugin tree"]
    CopySkill --> Out
    OpenaiYaml --> Out
    Hooks --> Out
    Runner --> Out
    PolicyCopy --> Out
    Out --> Receipt["package receipt / evidence"]
```

Rules:

- Dry-run is default; `--write` mutates the filesystem.
- Multi-skill inputs are rejected — Codex hooks are plugin-level, so one capability policy per generated plugin.
- Validation or policy failure leaves `--out` unwritten.

## Codex hook trust flow

```mermaid
flowchart TD
    ToolCall["Codex tool call"] --> Matcher{"matcher:\nBash | apply_patch | mcp__*?"}
    Matcher -->|no| HostDefault["Host default — not intercepted"]
    Matcher -->|yes| Hook["codex-pre-tool-policy.mjs\n--policy ${PLUGIN_ROOT}/policy/..."]
    Hook --> LoadPol{"Load sidecar policy?"}
    LoadPol -->|missing / invalid / exception| DenyFC["deny + exit 0\nfail-closed from SkillsForge"]
    LoadPol -->|ok| Family{"Tool family"}
    Family -->|Bash| BashRules["exec allowlist +\nno shell control +\nnetwork if implied"]
    Family -->|apply_patch| WriteRules["write scope path checks"]
    Family -->|mcp__*| McpRules["deny unless declared"]
    BashRules --> Decision{"allow or deny?"}
    WriteRules --> Decision
    McpRules --> Decision
    Decision -->|deny| Block["permissionDecision: deny"]
    Decision -->|allow| Allow["allow / no decision"]
```

Host caveats (see [threat-model.md](threat-model.md)):

- Incomplete interception — tools outside the matcher are not guarded by SkillsForge.
- After installing or changing hooks, Codex may require `/hooks` trust review.
- If the host receives **invalid hook output**, behavior can fail open at the host even when SkillsForge intends fail-closed.

## Data flow (all hosts)

```mermaid
flowchart LR
  ForgeSpec[ForgeSpec] --> Forge[DeterministicForge]
  Forge --> Canonical[SKILL.md + skillsforge.json]
  Canonical --> Validate[AjvValidator]
  Canonical --> Route[ExplainableRouter]
  Canonical --> Policy[StaticPolicyScan]
  Policy --> ClaudeHooks[ClaudePolicyCompiler]
  Policy --> CodexHooks[CodexPolicyCompiler]
  Validate --> Package[CodexPackage]
  CodexHooks --> Package
  Package --> Evidence[EvidenceBundle]
  Validate --> Receipt[EvidenceReceipt]
  Route --> Receipt
  Policy --> Receipt
  Canonical --> Install[HostInstall full or package]
```

## Fail-closed Claude PreToolUse decision

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

## Host installer flow

```mermaid
flowchart TD
    Run["skillsforge install"] --> Detect["Detect hosts in home directory"]
    Detect --> TUI{"Interactive terminal?"}
    TUI -->|yes| Picker["Checkbox picker: detected agents"]
    TUI -->|"no or --yes"| Flags["--hosts list"]
    Picker --> Validate["Validate selected skills"]
    Flags --> Validate
    Validate -->|fail| Abort["Exit 1, nothing written"]
    Validate -->|pass| Copy["Per host: full or package-fidelity copy"]
    Copy --> Report["Install report JSON + summary"]
```

## Host support

| Host | Status | Meaning |
| --- | --- | --- |
| Codex CLI | Native plugin + guarded package | Marketplace plugin; `package --host codex`; install copies complete packages to `~/.agents/skills` |
| Claude Code | Full | Marketplace, SessionStart, skill-scoped PreToolUse, CLI, receipts, eval |
| Cursor | Package fidelity | Complete skill directories; no runtime policy parity |
| OpenCode | Package fidelity | Complete skill directories; no runtime policy parity |
| Gemini CLI | Package fidelity | Complete skill directories; no runtime policy parity |

## Runtime root resolution

The bundled CLI resolves:

1. Explicit `--root` / cwd repository (`plugins/skillsforge` present)
2. Installed plugin root (directory containing plugin manifest + `skills/`)
3. Module-adjacent plugin root when cache-copied

Cache-copy smoke tests copy **only** `plugins/skillsforge` and exercise doctor / validate / route / forge dry-run / enforce / receipt verify without repository `lib/` or `scripts/`.

## Trust boundaries

- Static policy scan is best-effort over text-like files (see [threat-model.md](threat-model.md)).
- PreToolUse hooks are guardrails honored by the host, not an OS sandbox.
- Receipts hash skill/plugin files + record evaluation denominators; they are **unsigned tamper evidence**, not certification.
- Codex plugin packaging refuses to write when validation or policy fails.

## Anti-goals

Not in scope for this product track:

- MCP servers, LSP integrations, or always-on monitors
- Token / usage ledgers or cost accounting
- Domain expertise skill packs or multi-plugin “family” installs
- Multi-host runtime policy parity (package install ≠ Codex/Claude hooks)
- OS sandboxing or third-party attestation of safety
