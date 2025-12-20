import { motion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  speed?: number;
  className?: string;
}

export const Marquee = ({ items, speed = 30, className = "" }: MarqueeProps) => {
  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <span
            key={index}
            className="mx-6 text-lg md:text-xl font-semibold text-muted-foreground/70"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export const CollegeMarquee = () => {
  const colleges = [
    "IIT Bombay",
    "Delhi University",
    "GTU",
    "VIT",
    "SRM University",
    "BITS Pilani",
    "NIT Trichy",
    "Anna University",
    "Manipal University",
    "Your College?",
  ];

  return (
    <div className="py-8 bg-secondary/30 border-y border-border">
      <p className="text-center text-sm font-medium text-muted-foreground mb-4">
        Trusted by students from
      </p>
      <Marquee items={colleges} speed={40} />
    </div>
  );
};
