# SkillsForge Demo Video Design

Status: Approved by the user on 2026-07-20.

## Goal

Replace the existing local demo video with a polished hackathon demo MP4 that is short enough for judges, clear enough for YouTube, and trustworthy enough for GitHub. The target runtime is 110 to 120 seconds. The hard maximum is under 180 seconds.

## Required Deliverables

- Replace `assets/video/skillsforge-demo.mp4` with a new 1920x1080 MP4.
- Include audible English voiceover, original background music, and light UI sound effects.
- Add synchronized English captions in the video.
- Add a local preview page so the demo can be viewed from the repository without relying only on README MP4 playback.
- Update README/docs copy to explain how Codex and GPT-5.6 were used.
- Keep YouTube upload and the real `/feedback` Codex Session ID as human-owned tasks. The implementation must not invent either value.

## Audience

Hackathon judges who will spend less than three minutes on the video. The video must prove the product quickly, show real commands and evidence, and avoid long explanations.

## Claim Boundaries

- Use only current repository evidence for counts and command output.
- It is safe to show:
  - `511` skills
  - `28` packs
  - `11` profiles
  - `node plugins/skillsforge/bin/skillsforge.mjs vibe`
  - `node plugins/skillsforge/bin/skillsforge.mjs demo`
  - Demo output: unsafe deny PASS, safe validate PASS, packaged PASS, false-allow 0, receipt hash prefix `0344639d08d3c7f0`, elapsed `212ms`
- Do not claim that host hooks are an operating-system sandbox.
- Do not claim cryptographic signatures for the demo receipt hash.
- Do not claim CI is green unless it is actually run and confirmed.
- Do not claim a YouTube URL or `/feedback` Session ID until the user supplies real values.

## Creative Direction

Use a premium product-tour style: real product surfaces, sharp focus changes, proof-first captions, and motion that guides attention. The visual language must be high-end and technical without copying Gemini, Google, OpenAI, or any third-party brand assets.

Visual theme:

- 16:9, 1920x1080, 30 fps.
- Deep graphite base with mint, white, electric blue, and restrained violet accents.
- Layered scenes: background atmosphere, product UI, proof badges, captions, and foreground motion accents.
- No stock images, no third-party logos, no copyrighted music.
- Animated terminal and dashboard elements must be generated in Remotion from text/data, not screen-recorded from unverified external assets.

Motion rules:

- Use Remotion frame-based animation only: `useCurrentFrame()`, `interpolate()`, `spring()`, `Sequence`, and easing.
- No CSS animations or CSS transitions.
- Use spring entrances with opacity, translate, and scale.
- Stagger repeated items.
- Give every major visual an exit, not only an entrance.
- Keep new visual information appearing at least every 2 to 4 seconds.

## Storyboard

| Time | Scene | Purpose |
| --- | --- | --- |
| 0-6s | Cold open: SkillsForge title, 511 skills, trust spine forming | Hook judges immediately |
| 6-18s | Problem: scattered skills, unsafe actions, unclear provenance | Establish why this matters |
| 18-30s | Codex + GPT-5.6 collaboration: human decisions, AI implementation/review acceleration | Satisfy hackathon AI-use requirement |
| 30-45s | Real CLI `vibe`: 511 skills, 28 packs, 11 profiles, quality sample | Show the product working |
| 45-62s | Route/library workflow: query becomes skill selection and work artifact | Show the useful workflow |
| 62-78s | Trust gate: unsafe skill denied before execution | Show safety value |
| 78-94s | Safe package: validated skill becomes Codex plugin/package output | Show portability and testability |
| 94-106s | Demo scoreboard: PASS/PASS/PASS, false-allow 0, hash, 212ms | Show evidence |
| 106-118s | CTA: free local test command, no account needed, YouTube/Devpost ready | End with next action |

## Voiceover Script

Most agent skill systems look useful until they become powerful. Then the hard question is trust. Which skill is running? Who wrote it? What can it touch? And can a judge test it without signing up for anything?

SkillsForge is a local trust and routing layer for agent skills. It turns a messy skill folder into a catalog that can be validated, searched, routed, packaged, and checked.

This Build Week version was made with Codex and GPT-5.6 in the loop. Codex accelerated the implementation, repo navigation, video production work, and verification passes. GPT-5.6 helped reason through product claims, edge cases, and review quality. The human decisions stayed human: what to build, what not to claim, and what evidence was strong enough for submission.

Here is the local magical moment. One command loads the SkillsForge catalog: 511 skills, 28 packs, and 11 profiles.

Now a user asks for help. SkillsForge routes the request to the right skill surface instead of dumping every instruction into the context window.

The trust gate is the core. Unsafe behavior is denied before execution. Safe skills can be validated and packaged for real agent hosts, including Codex.

The judge demo finishes with a scoreboard: unsafe deny passes, safe validation passes, packaging passes, false allows are zero, and the run emits a receipt hash.

SkillsForge is free to test locally. No account is needed. Clone the repo, install dependencies, and run the demo command shown here.

## Audio Design

- Voiceover: English, neutral, confident, clear pronunciation.
- Music: original procedural electronic bed generated locally, no third-party music.
- SFX: original lightweight UI sounds for route, deny, pass, hash, and final logo moments.
- Mix target: voice clearly above music; background ducked under narration, with integrated loudness in the range of -18 to -12 LUFS when measurable.
- Validation: inspect audio stream, detect silence, and confirm measurable loudness with ffmpeg.

## Repository Changes

Expected implementation files may include:

- Remotion source under a scoped video folder.
- Generated audio assets under `assets/video/` or a video-local public asset folder.
- `assets/video/skillsforge-demo.mp4`
- `assets/video/skillsforge-demo-poster.png`
- `docs/demo-video.html`
- README and submission docs updates for preview, AI collaboration notes, and remaining human upload steps.

## Acceptance Checks

- MP4 duration is between 110 and 120 seconds and under 180 seconds.
- MP4 is 1920x1080, 30 fps, H.264 video, AAC audio.
- Audio is not silent for the full duration.
- Voiceover mentions Codex and GPT-5.6 clearly.
- Captions are legible and synchronized enough for judging.
- No copyrighted music, stock media, or third-party logo assets are included.
- README explains Codex/GPT-5.6 collaboration and human decision boundaries.
- Preview page can play the local MP4 in a browser.
- `npm run check` is run after changes.
- `npm pack --dry-run --json` is run after changes.
- Dirty unrelated user changes are not reverted.

## Human-Owned Completion Items

- Upload the final MP4 to YouTube as public or unlisted.
- Add the YouTube URL to Devpost.
- Run `/feedback` in the real Codex session and replace the existing feedback Session ID field with the real Session ID.
- Confirm CI after push if a remote workflow is available.
