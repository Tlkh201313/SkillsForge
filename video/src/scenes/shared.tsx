import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const COLORS = {
  bg: '#0B1020',
  panel: '#121A2F',
  text: '#E8EEF9',
  muted: '#9AA8C7',
  accent: '#3DDC97',
  danger: '#FF5C7A',
  warn: '#F5C542',
  line: '#243049'
};

export const fadeSlide = (frame: number, fps: number, delaySec = 0) => {
  const start = delaySec * fps;
  const opacity = interpolate(frame, [start, start + fps * 0.45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const y = interpolate(frame, [start, start + fps * 0.45], [28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  return { opacity, transform: `translateY(${y}px)` };
};

export const SceneShell: React.FC<{ children: React.ReactNode; eyebrow?: string }> = ({
  children,
  eyebrow
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = fadeSlide(frame, fps, 0);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        padding: 80,
        fontFamily: 'Segoe UI Variable, Segoe UI, system-ui, sans-serif'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(61,220,151,0.12), transparent 45%), radial-gradient(ellipse at 80% 90%, rgba(90,120,255,0.10), transparent 40%)'
        }}
      />
      <div style={{ position: 'relative', ...intro }}>
        {eyebrow ? (
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: COLORS.accent,
              marginBottom: 24,
              fontWeight: 600
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const Terminal: React.FC<{ lines: Array<{ text: string; tone?: 'ok' | 'fail' | 'muted' | 'cmd' }> }> = ({
  lines
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        marginTop: 36,
        backgroundColor: COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 16,
        padding: 28,
        fontFamily: 'Cascadia Mono, Consolas, ui-monospace, monospace',
        fontSize: 28,
        lineHeight: 1.55,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)'
      }}
    >
      {lines.map((line, index) => {
        const style = fadeSlide(frame, fps, 0.2 + index * 0.18);
        const color =
          line.tone === 'ok'
            ? COLORS.accent
            : line.tone === 'fail'
              ? COLORS.danger
              : line.tone === 'cmd'
                ? COLORS.text
                : COLORS.muted;
        return (
          <div key={`${index}-${line.text}`} style={{ ...style, color, whiteSpace: 'pre-wrap' }}>
            {line.text}
          </div>
        );
      })}
    </div>
  );
};
