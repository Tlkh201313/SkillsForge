# Stage One submission closeout (human track)

SkillsForge hardening is code-complete. Remaining items are **human-only** — do not invent Session IDs or fake videos.

## Checklist

| # | Action | Status |
|---|---|---|
| 1 | Codex GPT-5.6 session → `/feedback` → paste Session ID into `BUILD_WEEK.md` | Open |
| 2 | Render Remotion video (`docs/video.md`) → upload YouTube &lt;3min | Open (poster ready; MP4 via `npm run video:render`) |
| 3 | Commit + push `feat/skillsforge-total-dominance`; open/update PR; CI green | Open |
| 4 | Devpost: Developer Tools, repo, Session ID, video, limitations, free access | Open |
| 5 | Merge when checks pass; tag `v0.4.0-buildweek` | Open |

## Quick verify before record/submit

```bash
npx skillsforge demo
npm run check
npm run video:studio   # optional preview
npm run video:render   # MP4 → artifacts/video/skillsforge-demo.mp4
```

See also: [submission.md](submission.md), [hackathon-demo.md](hackathon-demo.md), [video.md](video.md), [roadmap-next.md](roadmap-next.md), [BUILD_WEEK.md](../BUILD_WEEK.md).
