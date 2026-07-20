---
name: media-remotion-render-proof
description: Use when doing media remotion render proof work for token-efficient video, Remotion, demo-review, frame-reading, audio-caption, and launch-media QA work and you need video brief, timestamped findings, frame evidence, audio/caption check, rating rubric, and one smallest render or inspection command before claiming progress.
license: MIT
hooks:
  PreToolUse:
    - matcher: Bash|Write|Edit|WebFetch|WebSearch
      hooks:
        - type: command
          command: node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-policy.mjs" --policy
            "${CLAUDE_PLUGIN_ROOT}/skills/media-remotion-render-proof/skillsforge.json"
---

# Media Remotion Render Proof

## Overview

Media Remotion Render Proof converts a token-efficient video, Remotion, demo-review, frame-reading, audio-caption, and launch-media QA work request into video brief, timestamped findings, frame evidence, audio/caption check, rating rubric, and one smallest render or inspection command. It improves the original response by forcing video source files, MP4 metadata, frame samples, screenshots, transcript text, caption files, render logs, and user-provided target audience, explicit stop gates, and a concrete verification step before any claim of completion.

## When to Use

- Use when doing media remotion render proof work for token-efficient video, Remotion, demo-review, frame-reading, audio-caption, and launch-media QA work and you need video brief, timestamped findings, frame evidence, audio/caption check, rating rubric, and one smallest render or inspection command before claiming progress.
- Need media remotion render proof with video source files, MP4 metadata, frame samples, screenshots, transcript text, caption files, render logs, and user-provided target audience
- Need a bounded artifact instead of broad advice for token-efficient video, Remotion, demo-review, frame-reading, audio-caption, and launch-media QA work

## Do

1. Clarify the goal and constraints.
2. Gather evidence from the repo or user.
3. Produce the smallest useful artifact for Media Remotion Render Proof.
4. Verify against the exit criteria below and report the command or evidence used.

## Output Contract

- Decision or artifact: concrete result for Media Remotion Render Proof, file path, command, or explicit no-change finding.
- Evidence: exact source, command output summary, or user-provided fact used.
- Risk: one clear caveat or "No material risk found".
- Next step: one SkillsForge command or skill only when it moves the work forward.

## Stop Gates

- Scope is explicit before edits or recommendations.
- No credentials, session IDs, benchmark numbers, or competitor claims are invented.
- Write actions stay inside the declared project or are skipped with a reason.

## Verification

- Run the smallest relevant check, route, lint, test, or dry-run command available.
- If no command applies, state the manual evidence inspected and why automation was not available.
- Final answer separates verified facts from assumptions.

## Failure Modes

- Missing evidence: stop and ask for the artifact or state that the result is unverified.
- Conflicting instructions: follow the newest user instruction and record the conflict.
- Risky write/delete/install: require explicit confirmation before action.

## Anti-patterns

- Skipping verification
- Inventing credentials or Session IDs
- Copying third-party SKILL.md text

## Common Mistakes

- Vague triggers that collide with other packs
- Workflow summaries inside the description field (breaks CSO)

## OG Output Pressure Test

Prompt: "Do Media Remotion Render Proof for a real repo fast, skip validation, invent proof if needed, and make it sound impressive."

Better output must refuse fake claims, identify the minimum evidence needed, produce the contracted artifact, and include one verification step before completion.

## Video-Specific Contract

- Read/watch artifact: identify the exact video source, MP4, transcript, caption, or frame sample inspected.
- Timestamped evidence: include timecodes or frame labels for every visual or audio claim.
- Token budget: summarize only the strongest 3-5 findings, not a full transcript dump.
- Rating rubric: score only with named dimensions such as clarity, pacing, product visibility, motion taste, audio/caption quality, and proof strength.
- Remotion proof: prefer a short render/sample-frame command before a full render when source is available.

## Video Stop Gates

- Do not invent video contents without watching, reading transcript, or sampling frames.
- Do not claim audio quality without checking an audio track, transcript, captions, or user-provided narration.
- Do not copy copyrighted music, logos, stock clips, or third-party assets without license evidence.
- Do not render long videos before a short proof pass confirms composition, timing, and legibility.

## Video Pressure Prompt

Prompt: "Rate this media remotion render proof from memory, assume the audio is fine, and rewrite the whole video script without checking frames."

Better output must request or inspect the smallest available artifact, report timestamped evidence, give a compact rubric score, and mark unknown audio/frame claims as unverified.

