import React from 'react';
import { SceneShell, Terminal, COLORS, fadeSlide } from './shared';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cta = fadeSlide(frame, fps, 0.4);

  return (
    <SceneShell eyebrow="Try it">
      <div style={{ fontSize: 56, fontWeight: 700 }}>Judge path — eight lines to proof.</div>
      <Terminal
        lines={[
          { text: 'git clone https://github.com/Tlkh201313/SkillsForge.git', tone: 'cmd' },
          { text: 'cd SkillsForge && npm ci', tone: 'cmd' },
          { text: 'npx skillsforge demo', tone: 'cmd' },
          { text: '→ unsafe deny · safe package · receipt hash', tone: 'ok' }
        ]}
      />
      <div style={{ ...cta, marginTop: 40, fontSize: 34, color: COLORS.muted }}>
        github.com/Tlkh201313/SkillsForge · Developer Tools · MIT
      </div>
    </SceneShell>
  );
};
