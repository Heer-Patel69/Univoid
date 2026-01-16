import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DoodleConfig {
  id: number;
  component: React.ReactNode;
  x: number;
  y: number;
  size: number;
  animationDelay: number;
  animationDuration: number;
  animationType: 'float-1' | 'float-2' | 'float-3';
}

// Individual doodle SVG components
const DoodleSmallStar = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M12 2 L14 9 L21 10 L15 14 L17 22 L12 17 L7 22 L9 14 L3 10 L10 9 Z"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 1" />
  </svg>
);

const DoodleDot = () => (
  <svg viewBox="0 0 12 12" fill="none" className="w-full h-full">
    <circle cx="6" cy="6" r="3" fill="currentColor" opacity="0.5" />
  </svg>
);

const DoodlePlus = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M12 5 L12 19 M5 12 L19 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DoodleX = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DoodleSquiggleLine = () => (
  <svg viewBox="0 0 60 20" fill="none" className="w-full h-full">
    <path d="M5 10 Q 15 5, 25 10 T 45 10 T 55 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DoodleDashedArrow = () => (
  <svg viewBox="0 0 50 30" fill="none" className="w-full h-full">
    <path d="M5 15 L35 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M30 8 L40 15 L30 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const DoodlePaperPlane = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <path d="M4 16 L28 4 L20 28 L16 18 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 18 L28 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const DoodleMiniLightbulb = () => (
  <svg viewBox="0 0 24 32" fill="none" className="w-full h-full">
    <path d="M12 3 Q 20 3, 20 12 Q 20 18, 15 21 L15 25 L9 25 L9 21 Q 4 18, 4 12 Q 4 3, 12 3"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 28 L14 28" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const DoodleSpiral = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <path d="M16 16 Q 18 14, 20 16 Q 22 18, 20 20 Q 16 24, 12 20 Q 8 16, 12 12 Q 18 6, 24 12"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
  </svg>
);

const DoodleTriangle = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <path d="M16 6 L28 26 L4 26 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
  </svg>
);

const doodleComponents = [
  DoodleSmallStar,
  DoodleDot,
  DoodlePlus,
  DoodleX,
  DoodleSquiggleLine,
  DoodleDashedArrow,
  DoodlePaperPlane,
  DoodleMiniLightbulb,
  DoodleSpiral,
  DoodleTriangle,
];

interface FloatingDoodlesProps {
  className?: string;
  density?: "low" | "medium" | "high" | "global";
  section?: "hero" | "content" | "full";
}

export const FloatingDoodles = ({
  className,
  density = "medium",
  section = "full"
}: FloatingDoodlesProps) => {
  const isMobile = useIsMobile();

  // Density counts - reduce for mobile to improve performance
  const densityCount = useMemo(() => ({
    low: isMobile ? 8 : 20,
    medium: isMobile ? 12 : 32,
    high: isMobile ? 16 : 50,
    global: isMobile ? 20 : 70,
  }), [isMobile]);

  // Generate doodles only once on mount to prevent re-renders
  const doodles = useMemo(() => {
    const count = densityCount[density];
    const newDoodles: DoodleConfig[] = [];
    // Animation types for variety
    const animationTypes: Array<'float-1' | 'float-2' | 'float-3'> = ['float-1', 'float-2', 'float-3'];

    for (let i = 0; i < count; i++) {
      const DoodleComponent = doodleComponents[Math.floor(Math.random() * doodleComponents.length)];

      // Distribute based on section
      let xRange = { min: 0, max: 100 };
      const yRange = { min: 0, max: 100 };

      if (section === "hero") {
        const isLeftSide = Math.random() > 0.5;
        xRange = isLeftSide ? { min: 0, max: 20 } : { min: 80, max: 100 };
      }

      newDoodles.push({
        id: i,
        component: <DoodleComponent />,
        x: Math.random() * (xRange.max - xRange.min) + xRange.min,
        y: Math.random() * (yRange.max - yRange.min) + yRange.min,
        size: isMobile ? Math.random() * 12 + 10 : Math.random() * 16 + 12,
        animationDelay: Math.random() * 5,
        animationDuration: Math.random() * 4 + 5, // Slower for smoother feel
        animationType: animationTypes[i % 3], // Distribute animation types evenly
      });
    }

    return newDoodles;
  }, [density, section, densityCount, isMobile]);

  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden z-0 absolute inset-0",
        "will-change-auto contain-layout contain-paint",
        className
      )}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        isolation: "isolate",
      }}
      aria-hidden="true"
    >
      {doodles.map((doodle) => (
        <div
          key={doodle.id}
          className={cn(
            "absolute",
            doodle.animationType === 'float-1' && 'animate-float-doodle-1',
            doodle.animationType === 'float-2' && 'animate-float-doodle-2',
            doodle.animationType === 'float-3' && 'animate-float-doodle-3',
            density === 'global'
              ? 'text-sketch-border/20'
              : 'text-sketch-border/15',
          )}
          style={{
            left: `${doodle.x}%`,
            top: `${doodle.y}%`,
            width: `${doodle.size}px`,
            height: `${doodle.size}px`,
            animationDelay: `${doodle.animationDelay}s`,
            animationDuration: `${doodle.animationDuration}s`,
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        >
          {doodle.component}
        </div>
      ))}
    </div>
  );
};

export default FloatingDoodles;
