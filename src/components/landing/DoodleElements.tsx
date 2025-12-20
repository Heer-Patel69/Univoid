import { motion } from "framer-motion";

// Floating doodle elements with SVG
export const FloatingDoodles = () => {
  const doodles = [
    { id: 1, x: "5%", y: "15%", rotate: -15, delay: 0, emoji: "🎓" },
    { id: 2, x: "90%", y: "20%", rotate: 10, delay: 0.5, emoji: "🎮" },
    { id: 3, x: "8%", y: "60%", rotate: 5, delay: 1, emoji: "💻" },
    { id: 4, x: "88%", y: "65%", rotate: -10, delay: 1.5, emoji: "☕" },
    { id: 5, x: "15%", y: "85%", rotate: 15, delay: 0.8, emoji: "📚" },
    { id: 6, x: "85%", y: "85%", rotate: -5, delay: 1.2, emoji: "🚀" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {doodles.map((doodle) => (
        <motion.div
          key={doodle.id}
          className="absolute text-4xl md:text-5xl"
          style={{ left: doodle.x, top: doodle.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -15, 0],
            rotate: [doodle.rotate, doodle.rotate + 5, doodle.rotate]
          }}
          transition={{
            opacity: { delay: doodle.delay, duration: 0.5 },
            scale: { delay: doodle.delay, duration: 0.5 },
            y: { repeat: Infinity, duration: 3, ease: "easeInOut", delay: doodle.delay },
            rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: doodle.delay }
          }}
        >
          {doodle.emoji}
        </motion.div>
      ))}
    </div>
  );
};

// Hand-drawn circle around text
export const DoodleCircle = ({ children, color = "hsl(var(--primary))" }: { children: React.ReactNode; color?: string }) => (
  <span className="relative inline-block">
    {children}
    <svg
      className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M5,20 Q5,5 50,5 Q95,5 95,20 Q95,35 50,35 Q5,35 5,20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  </span>
);

// Hand-drawn underline
export const DoodleUnderline = ({ children, color = "hsl(270 70% 60%)" }: { children: React.ReactNode; color?: string }) => (
  <span className="relative inline-block">
    {children}
    <svg
      className="absolute -bottom-2 left-0 w-full h-3 pointer-events-none"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0,5 Q25,0 50,5 Q75,10 100,5"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
      />
    </svg>
  </span>
);

// Hand-drawn arrow
export const DoodleArrow = ({ className = "", direction = "right" }: { className?: string; direction?: "right" | "down" }) => (
  <motion.svg
    className={`${className} ${direction === "down" ? "rotate-90" : ""}`}
    width="60"
    height="30"
    viewBox="0 0 60 30"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1, duration: 0.5 }}
  >
    <motion.path
      d="M5,15 Q15,10 30,15 Q45,20 50,15"
      fill="none"
      stroke="hsl(25 95% 55%)"
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 1.2 }}
    />
    <motion.path
      d="M45,8 L55,15 L45,22"
      fill="none"
      stroke="hsl(25 95% 55%)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 1.6 }}
    />
  </motion.svg>
);

// Scribble decorations
export const ScribbleStar = ({ className = "" }: { className?: string }) => (
  <motion.svg
    className={className}
    width="40"
    height="40"
    viewBox="0 0 40 40"
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
  >
    <motion.path
      d="M20,2 L23,15 L36,15 L25,23 L29,36 L20,28 L11,36 L15,23 L4,15 L17,15 Z"
      fill="none"
      stroke="hsl(45 93% 50%)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, delay: 0.8 }}
    />
  </motion.svg>
);

// Sparkle burst
export const SparkleBurst = ({ className = "" }: { className?: string }) => (
  <motion.div className={`relative ${className}`}>
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
        style={{
          left: "50%",
          top: "50%",
        }}
        initial={{ scale: 0, x: 0, y: 0 }}
        animate={{
          scale: [0, 1, 0],
          x: Math.cos((i * 60 * Math.PI) / 180) * 20,
          y: Math.sin((i * 60 * Math.PI) / 180) * 20,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 2,
          delay: i * 0.1,
        }}
      />
    ))}
  </motion.div>
);

// Notebook lines background
export const NotebookBackground = () => (
  <div 
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `
        radial-gradient(circle, hsl(var(--foreground) / 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, transparent 95%, hsl(var(--foreground) / 0.03) 95%)
      `,
      backgroundSize: "24px 24px, 100% 32px",
    }}
  />
);
