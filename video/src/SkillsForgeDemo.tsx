import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ThesisScene } from './scenes/ThesisScene';
import { UnsafeDenyScene } from './scenes/UnsafeDenyScene';
import { SafePackageScene } from './scenes/SafePackageScene';
import { ReceiptScene } from './scenes/ReceiptScene';
import { ScaleScene } from './scenes/ScaleScene';
import { CtaScene } from './scenes/CtaScene';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** ~90s judge video — matches demo budget, under 3:00 Devpost limit */
export const TOTAL_FRAMES = 90 * FPS;

const s = (sec: number) => Math.round(sec * FPS);

export const SkillsForgeDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0B1020' }}>
      <Sequence from={s(0)} durationInFrames={s(12)}>
        <ThesisScene />
      </Sequence>
      <Sequence from={s(12)} durationInFrames={s(16)}>
        <UnsafeDenyScene />
      </Sequence>
      <Sequence from={s(28)} durationInFrames={s(16)}>
        <SafePackageScene />
      </Sequence>
      <Sequence from={s(44)} durationInFrames={s(16)}>
        <ReceiptScene />
      </Sequence>
      <Sequence from={s(60)} durationInFrames={s(16)}>
        <ScaleScene />
      </Sequence>
      <Sequence from={s(76)} durationInFrames={s(14)}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
