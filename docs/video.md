# SkillsForge demo video

Judge-facing demo video for GitHub / Devpost (~90s). Mirrors `npx skillsforge demo`.

## Committed asset

The rendered MP4 lives at:

**`assets/video/skillsforge-demo.mp4`**

Poster still (when present): `assets/skillsforge-demo-poster.png`

> **Note:** The Remotion source project was removed from this repo. Do not expect `video/` + `npm run video:render` to rebuild the clip here. Re-render offline if you need a new cut, then replace the committed MP4.

## Upload

1. Use the committed MP4 (or a locally re-rendered replacement under 3 minutes).
2. Upload to YouTube (unlisted/public).
3. Paste URL into Devpost + `docs/submission.md`.
4. Optional: attach `skillsforge-demo.mp4` / poster as GitHub release assets.

## Beats (~90s)

| Time | Scene |
|------|--------|
| 0:00 | Thesis + brand |
| 0:12 | Unsafe validate deny |
| 0:28 | Safe validate + package |
| 0:44 | Trust scoreboard / package-tree hash |
| 1:00 | Scale punchline (367 catalog / 8 auto) |
| 1:16 | CTA clone + `npx skillsforge demo` |

Do not invent Session IDs in the video. Keep claim boundaries (hooks ≠ sandbox; receipts unsigned; demo scoreboard ≠ full trust receipt).
