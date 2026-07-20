import React from "react";
import { Composition } from "remotion";
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from "./data";
import { SkillsForgeDemo, SkillsForgePoster } from "./SkillsForgeDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SkillsForgeDemo"
        component={SkillsForgeDemo}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SkillsForgePoster"
        component={SkillsForgePoster}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
