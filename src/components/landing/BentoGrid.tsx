import { motion } from "framer-motion";
import { BookOpen, Briefcase, Trophy, Calendar } from "lucide-react";

const cards = [
  {
    icon: "📚",
    title: "Last Minute Notes",
    description: "Access PYQs and notes shared by toppers instantly.",
    color: "from-blue-500/20 to-cyan-500/20",
    delay: 0,
  },
  {
    icon: "💼",
    title: "Verified Internships",
    description: "No fake listings. Only real opportunities.",
    color: "from-purple-500/20 to-pink-500/20",
    delay: 0.1,
  },
  {
    icon: "🏆",
    title: "Leaderboards & XP",
    description: "Earn XP for helping others. Flex your rank.",
    color: "from-yellow-500/20 to-orange-500/20",
    delay: 0.2,
  },
  {
    icon: "🎫",
    title: "Campus Buzz",
    description: "Never miss a hackathon or fest again.",
    color: "from-green-500/20 to-emerald-500/20",
    delay: 0.3,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 20,
    },
  },
};

export const BentoGrid = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything sorted, in <span className="text-primary">one place</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No more juggling between apps. Level up your campus life with one super-app.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              custom={card.delay}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true }}
              variants={cardVariants}
              className={`relative p-6 rounded-3xl bg-gradient-to-br ${card.color} border-2 border-border/50 backdrop-blur-sm cursor-pointer overflow-hidden group`}
            >
              {/* Doodle decoration */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
              </div>

              <div className="relative z-10">
                <motion.span 
                  className="text-4xl block mb-4"
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {card.icon}
                </motion.span>
                <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-muted-foreground">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
