import { MorphingBlobs } from './MorphingBlobs';
import { FloatingShapes } from './FloatingShapes';

interface LiquidBackgroundProps {
  scrollY: number;
}

export const LiquidBackground = ({ scrollY }: LiquidBackgroundProps) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <MorphingBlobs scrollY={scrollY} />
      <FloatingShapes />
    </div>
  );
}; 