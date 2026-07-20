# Stage One submission closeout (human track)

SkillsForge hardening is code-complete. Remaining items are **human-only** - do not invent Session IDs or fake videos.

## Checklist

| # | Action | Status |
|---|---|---|
| 1 | Codex GPT-5.6 session -> `/feedback` -> paste Session ID into `BUILD_WEEK.md` | Done (`019f75ef-1cae-7370-863c-c76f553ac2a7`) |
| 2 | Upload demo video (`docs/video.md`) to YouTube &lt;3min | Open (committed MP4 at `assets/video/skillsforge-demo.mp4`) |
| 3 | Commit + push polish; CI green on PR / `main` | In progress (0.4.3 local checks green; push / CI pending) |
| 4 | Devpost: Developer Tools, repo, Session ID, video, limitations, free access | Open |
| 5 | Tag `v0.4.3-buildweek` after Session ID + video | Open |

## Quick verify before record/submit

```bash
node plugins/skillsforge/bin/skillsforge.mjs demo
npm run check
npm pack --dry-run --json
```

> Not on npm - do **not** use `npx skillsforge`.

See also: [submission.md](submission.md), [features.md](features.md), [hackathon-demo.md](hackathon-demo.md), [video.md](video.md), [roadmap-next.md](roadmap-next.md), [BUILD_WEEK.md](../BUILD_WEEK.md).
