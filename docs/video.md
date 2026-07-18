# SkillsForge Remotion presentation video

Programmatic judge-demo video for GitHub / Devpost (~90s). Mirrors `npx skillsforge demo`.

## Preview (Studio)

```bash
cd video
npm install
npm run studio
```

Open composition **SkillsForgeDemo**.

## Render MP4

```bash
mkdir -p ../artifacts/video
npm run render
```

Output: `artifacts/video/skillsforge-demo.mp4`

Poster still:

```bash
npm run still
```

## Upload

1. Render MP4 locally (needs Chromium via Remotion).
2. Upload to YouTube (unlisted/public) under 3 minutes.
3. Paste URL into Devpost + `docs/submission.md`.
4. Optional: attach `skillsforge-demo.mp4` / poster as GitHub release assets.

## Beats (~90s)

| Time | Scene |
|------|--------|
| 0:00 | Thesis + brand |
| 0:12 | Unsafe validate deny |
| 0:28 | Safe validate + package |
| 0:44 | Trust scoreboard / receipt |
| 1:00 | Scale punchline (354 / 25 / 7) |
| 1:16 | CTA clone + `npx skillsforge demo` |

Do not invent Session IDs in the video. Keep claim boundaries (hooks ≠ sandbox; receipts unsigned).
