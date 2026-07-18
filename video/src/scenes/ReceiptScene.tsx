import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, SceneShell, fadeSlide } from './shared';

export const ReceiptScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const board = fadeSlide(frame, fps, 0.25);
  const hashPulse = interpolate(frame % (fps * 2), [0, fps], [0.98, 1.02], {
    extrapolateRight: 'clamp'
  });

  const rows = [
    ['unsafe deny', 'PASS'],
    ['safe validate', 'PASS'],
    ['packaged', 'PASS'],
    ['false-allow', '0'],
    ['receipt hash', 'eacb7fd54c0d6803…']
  ];

  return (
    <SceneShell eyebrow="03 · Evidence receipt">
      <div style={{ fontSize: 56, fontWeight: 700 }}>Trust scoreboard — unsigned tamper evidence.</div>
      <div
        style={{
          ...board,
          marginTop: 40,
          display: 'grid',
          gap: 16,
          maxWidth: 900
        }}
      >
        {rows.map(([label, value], index) => {
          const row = fadeSlide(frame, fps, 0.3 + index * 0.12);
          return (
            <div
              key={label}
              style={{
                ...row,
                display: 'flex',
                justifyContent: 'space-between',
                background: COLORS.panel,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 12,
                padding: '18px 28px',
                fontSize: 34,
                transform: label === 'receipt hash' ? `scale(${hashPulse})` : undefined
              }}
            >
              <span style={{ color: COLORS.muted }}>{label}</span>
              <span style={{ color: value === 'PASS' || value === '0' ? COLORS.accent : COLORS.text, fontWeight: 700 }}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
};
