# Universal Host Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Subagents are disabled by user instruction. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SkillsForge read as a universal Agent Skills trust layer with Codex-first packaging, Claude Code full-fidelity install, package-fidelity support for more AI CLIs, stronger judge-facing visuals, and a verified Word documentary.

**Architecture:** Keep runtime lazy-loaded: catalog and host metadata load first, selected skill bodies load only for route/install/package. Host support is explicit and honest: Codex gets guarded native packaging, Claude Code keeps full runtime hooks, other hosts get complete skill packages plus sidecar provenance and a clear "runtime policy not enforced by host" boundary. Docs and graphics explain the trust gap without fake statistics or unsupported competitor claims.

**Tech Stack:** Node.js 20+ ESM, `yaml`, `ajv`, existing SkillsForge CLI, SVG README assets, bundled Python document runtime for `.docx`, Superpowers executing-plans workflow.

## Global Constraints

- Never use subagents.
- Plan first, then edit.
- Preserve checkpoint commit `960125a` as rollback point.
- No fake stats, fake session IDs, unsupported competitor claims, or stale unrelated source explanations.
- Codex is primary; Claude Code is second; OpenCode, ZCode, Hermes, Cursor, Gemini and custom hosts are package-fidelity unless runtime enforcement is actually implemented.
- Keep installation dry-run by default unless `--yes` or `--write` is explicit.
- Verify every changed feature with targeted tests before full `npm run check`.
- Word doc must be generated after code/docs are finished, then rendered or explicitly report if render QA is unavailable.

---

### Task 1: Universal Host Registry And CLI Surface

**Files:**
- Modify: `lib/capabilities/hosts.mjs`
- Modify: `scripts/skillsforge-cli.mjs`
- Test: `tests/hosts.test.mjs`
- Test: `tests/install.test.mjs`
- Test: `tests/cli.test.mjs`

**Interfaces:**
- Consumes: existing `HOST_REGISTRY`, `detectHosts(options)`, `resolveHostSelection(ids, options)`, `installSkills(options)`.
- Produces:
  - `buildCustomHost(spec, options)` returning a host object compatible with `installSkills`.
  - CLI command `skillsforge hosts [--json] [--home <dir>]`.
  - `install --hosts all|detected|<comma-list>`.
  - `install --custom-host <id>:<skills-dir>` for unknown AI CLIs.

- [x] **Step 1: Add host metadata tests**

Add tests asserting registry contains `codex`, `claude-code`, `opencode`, `zcode`, `hermes`, `cursor`, and `gemini`; each entry has `id`, `label`, `skillsRel`, `fidelity`, `runtimeEnforced`, `usesSidecar`, and `installHint`.

Run: `node --test tests/hosts.test.mjs`
Expected: new tests fail because `zcode`, `hermes`, `installHint`, and custom host support do not exist yet.

- [x] **Step 2: Implement host registry metadata**

In `lib/capabilities/hosts.mjs`, extend entries with `installHint` and add:

```js
Object.freeze({
  id: 'zcode',
  label: 'ZCode-compatible local agent',
  detectRels: ['.zcode', join('.config', 'zcode')],
  skillsRel: join('.zcode', 'skills'),
  fidelity: 'package',
  runtimeEnforced: false,
  usesSidecar: false,
  installHint: 'Package-fidelity install. Verify the configured ZCode skill directory for your local build.'
})
```

and:

```js
Object.freeze({
  id: 'hermes',
  label: 'Hermes Agent',
  detectRels: ['.hermes', join('.config', 'hermes')],
  skillsRel: join('.hermes', 'skills'),
  fidelity: 'package',
  runtimeEnforced: false,
  usesSidecar: false,
  installHint: 'Package-fidelity install. Runtime policy enforcement is not claimed.'
})
```

Run: `node --test tests/hosts.test.mjs`
Expected: registry assertions pass.

- [x] **Step 3: Implement custom host builder**

Add:

```js
export function buildCustomHost(spec, options = {}) {
  const home = resolve(options.home ?? homedir());
  const [id, dir] = String(spec ?? '').split(':');
  if (!id || !/^[a-z0-9][a-z0-9-]*$/i.test(id)) throw new Error('custom host id must be kebab-case');
  if (!dir) throw new Error('custom host requires <id>:<skills-dir>');
  const skillsDir = resolve(home, dir);
  if (!isInsideHome(home, skillsDir)) throw new Error(`custom host path escaped home: ${id}`);
  return {
    id,
    label: `Custom host: ${id}`,
    detected: true,
    detectDir: skillsDir,
    detectDirs: [skillsDir],
    skillsDir,
    fidelity: 'package',
    runtimeEnforced: false,
    usesSidecar: false,
    installHint: 'Custom package-fidelity target. SkillsForge copies validated skill packages only.'
  };
}
```

Run: `node --test tests/hosts.test.mjs`
Expected: custom host accepts paths under home and rejects escapes.

- [x] **Step 4: Add `hosts` CLI command**

In `scripts/skillsforge-cli.mjs`, add help row:

```text
  hosts [--json] [--home <dir>]       List universal AI CLI host targets and trust boundaries
```

Add switch case:

```js
case 'hosts':
  return runHostsCommand(argv.slice(1), options);
```

Implement `runHostsCommand()` to print `detectHosts({ home })` with registry metadata and install examples. JSON payload shape:

```js
{
  ok: true,
  hosts,
  examples: [
    'skillsforge install --hosts codex,claude-code --yes --dry-run',
    'skillsforge install --hosts all --yes --dry-run',
    'skillsforge install --custom-host my-agent:.my-agent/skills --yes --dry-run'
  ]
}
```

Run: `node --test tests/cli.test.mjs`
Expected: help-list test updated and pass.

- [x] **Step 5: Add install host expansion**

In `runInstall()`, support:

```js
const customSpecs = consumeOptions(args, '--custom-host');
```

Add `consumeOptions(values, flag)` helper. Expand `--hosts all` to all registry ids and `--hosts detected` to detected host ids. Append custom hosts via `buildCustomHost()`, pass concrete `hosts` into `installSkills()`.

Run: `node --test tests/install.test.mjs tests/hosts.test.mjs tests/cli.test.mjs`
Expected: all pass.

### Task 2: Universal Host Docs And README Graphic

**Files:**
- Create: `assets/skillsforge-universal-fanout.svg`
- Create: `docs/universal-hosts.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/hackathon-demo.md`

**Interfaces:**
- Consumes: verified CLI facts from Task 1 and research sources:
  - Devpost demo guidance: `https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video`
  - MLH judging rules: `https://github.com/MLH/mlh-hackathon-rules/blob/master/Rules.md`
  - Devpost submission steps: `https://help.devpost.com/article/126-know-your-submission-steps`
  - JetBrains judge notes: `https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/`
- Produces: README section that says why SkillsForge exists when ECC/Superpowers/gstack already exist, with no fake superiority claims.

- [x] **Step 1: Add fanout SVG**

Create an SVG showing:

`Agent Skill -> SkillsForge validate/route/package -> Codex guarded plugin / Claude full install / Package-fidelity hosts / Custom host`.

Use only ASCII text inside SVG, stable dimensions, no external assets.

- [x] **Step 2: Add universal host doc**

Create `docs/universal-hosts.md` with:

- Codex-first model: `package --host codex` for guarded native plugin.
- Claude Code model: full install with hooks.
- Package-fidelity model: OpenCode, ZCode, Hermes, Cursor, Gemini.
- Custom host model: `install --custom-host my-agent:.my-agent/skills --yes --dry-run`.
- Exact CLI examples and warning that package-fidelity hosts do not enforce runtime policy unless the host honors SkillsForge hooks.

- [x] **Step 3: Rewrite README top for judge scan**

Place the fanout SVG after the demo video. Keep verified counts only. Add short "Why this exists" copy:

```md
Most skill packs solve discovery. SkillsForge solves trust: what can this skill do, can it be packaged safely, and can the bytes be verified later?
```

Add host command examples:

```sh
node ./plugins/skillsforge/bin/skillsforge.mjs hosts
node ./plugins/skillsforge/bin/skillsforge.mjs install --hosts codex,claude-code --yes --dry-run
node ./plugins/skillsforge/bin/skillsforge.mjs install --custom-host my-agent:.my-agent/skills --yes --dry-run
```

- [x] **Step 4: Update hackathon demo script from research**

Add a short "judge framing" section: show product running, state criteria mapping, prove working bytes, mention future scope in one sentence. Cite source links in Markdown, not fake quotes.

Run a claim scan over `README.md`, `docs`, and `plugins/skillsforge` for unsupported scale, install, and superiority language.
Expected: no matches.

### Task 3: Build, Bundle, And Verify Universal CLI

**Files:**
- Modify: `plugins/skillsforge/bin/skillsforge.mjs` via `npm run build`

**Interfaces:**
- Consumes: source CLI and host registry changes.
- Produces: bundled CLI with `hosts`, `zcode`, `hermes`, custom host support.

- [x] **Step 1: Run targeted tests**

Run:

```sh
node --test tests/hosts.test.mjs tests/install.test.mjs tests/cli.test.mjs tests/os-cli.test.mjs
```

Expected: all pass.

- [x] **Step 2: Build bundle**

Run:

```sh
npm run build
```

Expected: bundled CLI contains `case 'hosts'`.

- [x] **Step 3: Smoke CLI**

Run:

```sh
node plugins/skillsforge/bin/skillsforge.mjs hosts --json
node plugins/skillsforge/bin/skillsforge.mjs install --hosts codex,claude-code --yes --dry-run --json plugins/skillsforge/skills/using-skillsforge
node plugins/skillsforge/bin/skillsforge.mjs install --custom-host lab-agent:.lab-agent/skills --yes --dry-run --json plugins/skillsforge/skills/using-skillsforge
```

Expected: commands exit 0 and report package/full fidelity accurately.

### Task 4: Documentary DOCX

**Files:**
- Create: `docs/SkillsForge-documentary.docx`
- Create internal-only render directory if needed under `artifacts/docx-render/`

**Interfaces:**
- Consumes: README, architecture docs, hackathon research sources, latest verified command output.
- Produces: Word documentary covering "from scratch to developed", choices, architecture, verification evidence, and judge framing.

- [x] **Step 1: Read DOCX design preset reference**

Read `references/design_presets.md` from the documents skill and choose `standard_business_brief`.

- [x] **Step 2: Generate DOCX**

Use bundled Python and `python-docx`. Document outline:

1. Title page: SkillsForge Hackathon Build Documentary.
2. Problem: skill packs lack trust proof.
3. Why build it when others exist: SkillsForge adds capability sidecars, packaging guardrails, receipts, and host fanout.
4. Architecture: lazy-load catalog -> route -> validate -> package/install -> verify.
5. Universal host strategy: Codex first, Claude second, package-fidelity for others, custom host.
6. Features shipped: CLI, OS helpers, media skills, policy hardening, receipts, evidence.
7. Verification: tests/eval/demo/audit/pack/check results.
8. Hackathon pitch lessons from sourced research.
9. Next risks and roadmap.

- [x] **Step 3: Render and inspect DOCX**

Run:

```sh
python render_docx.py docs/SkillsForge-documentary.docx --output_dir artifacts/docx-render
```

Expected: PNG pages render. Inspect all pages with image viewer. If LibreOffice missing, structurally validate DOCX ZIP and mention render skip in final.

Result: render attempted; local `soffice` was missing. Structural DOCX ZIP/OOXML and content QA passed.

### Task 5: Final Review, Checkpoint, And Ship Gate

**Files:**
- Read/write as needed only for failures.

**Interfaces:**
- Produces: final clean branch with commit and verification summary.

- [x] **Step 1: Full gates**

Run:

```sh
npm run check
npm audit --package-lock-only --audit-level=low --json
npm pack --dry-run --json
```

Expected: pass, zero vulnerabilities, MP4 included, old `video/` tree excluded.

- [x] **Step 2: Strict text scan**

Run:

```sh
rg -n -i "unsupported claim|unverified install|superiority claim" README.md docs plugins/skillsforge -g "*.md" --glob "!docs/superpowers/plans/**"
rg -n -i "unrelated source explanation" README.md docs -g "*.md" --glob "!docs/superpowers/plans/**"
```

Expected: first scan no matches. Second scan no public unrelated source explanation; only legitimate skill names outside README/docs are allowed.

- [x] **Step 3: Commit final work**

Run:

```sh
git add -A
git commit -m "feat: add universal host polish"
```

Expected: final checkpoint commit created.

- [x] **Step 4: Stop goal**

Use `update_goal(status: complete)` only after all gates pass and final commit exists.

## Self-Review

- Spec coverage: plan covers universal hosts, auto detection, custom CLI install, README/graphics, research-informed demo, Word documentary, no subagents, checkpoints, and strict verification.
- Placeholder scan: no TBD/TODO/implement-later markers.
- Type consistency: host objects stay compatible with `installSkills()` fields; CLI JSON payloads use `ok`, `hosts`, `examples`, `installs`.
