import { Composition } from "remotion";
import { Demo } from "./Demo";

// 40秒 × 30fps = 1200 フレーム
const FPS = 30;
const DURATION_SEC = 40;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={DURATION_SEC * FPS}
      fps={FPS}
      width={1280}
      height={720}
    />
  );
};
