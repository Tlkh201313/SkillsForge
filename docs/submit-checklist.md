# Stage One submission closeout (human track)

SkillsForge hardening is code-complete. Remaining items are **human-only** — do not invent Session IDs or fake videos.

## Checklist

| # | Action | Status |
|---|---|---|
| 1 | Codex GPT-5.6 session → `/feedback` → paste Session ID into `BUILD_WEEK.md` | Open |
| 2 | Upload demo video (`docs/video.md`) to YouTube &lt;3min | Open (committed MP4 at `assets/video/skillsforge-demo.mp4`) |
| 3 | Commit + push hardening branch; open/update PR; CI green | PR [#9](https://github.com/Tlkh201313/SkillsForge/pull/9) open — wait for CI then merge |
| 4 | Devpost: Developer Tools, repo, Session ID, video, limitations, free access | Open |
| 5 | Merge when checks pass; tag `v0.4.0-buildweek` | Open |

## Quick verify before record/submit

```bash
npx skillsforge demo
npm run check
```

See also: [submission.md](submission.md), [hackathon-demo.md](hackathon-demo.md), [video.md](video.md), [roadmap-next.md](roadmap-next.md), [BUILD_WEEK.md](../BUILD_WEEK.md).
