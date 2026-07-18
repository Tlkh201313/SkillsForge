import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, SceneShell, fadeSlide } from './shared';

export const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = fadeSlide(frame, fps, 0);
  const thesis = fadeSlide(frame, fps, 0.35);
  const sub = fadeSlide(frame, fps, 0.7);
  const pulse = interpolate(frame, [0, fps * 2], [0.92, 1], {
    extrapolateRight: 'clamp'
  });

  return (
    <SceneShell eyebrow="SkillsForge · OpenAI Build Week">
      <div style={{ ...brand, fontSize: 92, fontWeight: 700, letterSpacing: -1.5, transform: `scale(${pulse})` }}>
        SkillsForge
      </div>
      <div style={{ ...thesis, marginTop: 28, fontSize: 48, maxWidth: 1500, lineHeight: 1.25, fontWeight: 600 }}>
        Codex makes workflows reusable.
        <br />
        SkillsForge makes Agent Skills{' '}
        <span style={{ color: COLORS.accent }}>reviewable, least-privilege, measurable,</span> and tamper-evident.
      </div>
      <div style={{ ...sub, marginTop: 36, fontSize: 32, color: COLORS.muted, maxWidth: 1200 }}>
        Magical moment: unsafe skill denied → safe skill packaged → evidence receipt — in under 90 seconds.
      </div>
    </SceneShell>
  );
};
