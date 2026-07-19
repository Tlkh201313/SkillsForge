# SkillsForge next-wave roadmap

Post-hackathon hardening. **Productivity Work OS** stays the product; trust pipeline is the safety layer. Scale is supporting context, not proof by itself.

## P0 — Human Stage One (blocking submit)

| Item | Owner | Notes |
|------|-------|-------|
| Video check | Human | Verify README poster/MP4 and script in `docs/hackathon-demo.md` |
| Push PR + CI green | Human | `docs/pre-submit-polish` → `main` (0.4.1) |
| Devpost | Human | Developer Tools + limitations + free access |
| Tag after merge | Human | Suggested `v0.4.1-buildweek` |

## P1 — Product (same release train)

1. **Behavioral pressure** — expand beyond fixture JSON shape; optional agent harness fixtures.
2. **Skill index fingerprint** — cache invalidate on file mtime, not only dir count.
3. **Quality scoring honesty** — score unique Purpose/Phases depth, not heading presence alone.
4. **compare-skill UX** — human terminal view (not only JSON) for judges.
5. **MCP framing** — optional Content-Length MCP framing for Cursor/Claude hosts.

## P2 — Depth (after submit)

1. Promote next 25 domain skills from lean scaffold → hero depth (eng/security/docs first).
2. Pack profiles install UX: `skillsforge install --profile vibe`.
3. Capture → forge approval TUI (still require human approve before write).
4. Windows path/docs polish for absolute `--allow-absolute` examples.
5. Deeper workbench probes: dependency graphs, test failure summarization, and CI log compression.

## Explicitly out of scope

- Ruflo swarm / AgentDB / Raft consensus
- Cloud dashboard or always-on service
- Rewriting every generated body in one batch
- Claiming OS sandbox or third-party attestation

## Success metrics

| Metric | Target |
|--------|--------|
| Local demo | `node plugins/skillsforge/bin/skillsforge.mjs demo` completes under 90s |
| Holdout P/R | ≥0.95 / ≥0.90 |
| Auto-route set | ≤8 |
| Hero depth | Stable skills clearly marked; lean scaffolds not claimed as production depth |
| Video | README poster is visible; MP4 is committed at `assets/video/skillsforge-demo.mp4`; final attachment URL added before judging |
