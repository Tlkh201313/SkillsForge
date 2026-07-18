import React from 'react';
import { Composition } from 'remotion';
import { SkillsForgeDemo, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from './SkillsForgeDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SkillsForgeDemo"
      component={SkillsForgeDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
