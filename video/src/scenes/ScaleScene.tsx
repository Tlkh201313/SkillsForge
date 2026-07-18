import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, SceneShell, fadeSlide } from './shared';

export const ScaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(
    interpolate(frame, [fps * 0.4, fps * 1.6], [0, 354], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    })
  );
  const heroes = Math.round(
    interpolate(frame, [fps * 0.8, fps * 1.8], [0, 25], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    })
  );
  const punch = fadeSlide(frame, fps, 1.4);

  return (
    <SceneShell eyebrow="04 · Scale is proof — trust is the product">
      <div style={{ display: 'flex', gap: 64, marginTop: 20 }}>
        <div>
          <div style={{ fontSize: 120, fontWeight: 700, color: COLORS.accent }}>{count}</div>
          <div style={{ fontSize: 32, color: COLORS.muted }}>catalog entries</div>
        </div>
        <div>
          <div style={{ fontSize: 120, fontWeight: 700 }}>{heroes}</div>
          <div style={{ fontSize: 32, color: COLORS.muted }}>production-depth heroes</div>
        </div>
        <div>
          <div style={{ fontSize: 120, fontWeight: 700 }}>7</div>
          <div style={{ fontSize: 32, color: COLORS.muted }}>auto-route skills</div>
        </div>
      </div>
      <div style={{ ...punch, marginTop: 48, fontSize: 40, maxWidth: 1400, lineHeight: 1.35 }}>
        Domain packs stay lean scaffolds on purpose. Judges remember the trust pipeline — not an inventory dump.
      </div>
    </SceneShell>
  );
};
