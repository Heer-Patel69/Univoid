import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    college: "IIT Delhi",
    degree: "B.Tech CSE",
    quote: "Found last-minute notes for my end-sem and went from backlog to 8.5 CGPA. UniVoid is actually a lifesaver!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=b6e3f4",
    accent: "from-purple-500 to-pink-500",
  },
  {
    name: "Arjun Patel",
    college: "BITS Pilani",
    degree: "B.E. Electronics",
    quote: "The XP system is lowkey addictive. I've uploaded 15 notes and now I'm #3 on the leaderboard. Flex mode on! 💪",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun&backgroundColor=c0aede",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    name: "Sneha Reddy",
    college: "VIT Vellore",
    degree: "MBA Marketing",
    quote: "Finally a platform that doesn't spam me with fake internships. Every opportunity here is verified. 10/10 recommend.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha&backgroundColor=ffd5dc",
    accent: "from-orange-500 to-red-500",
  },
  {
    name: "Rahul Verma",
    college: "DTU",
    degree: "B.Tech IT",
    quote: "Registered for 3 hackathons through UniVoid. Won one of them! The event discovery feature is goated 🐐",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul&backgroundColor=d1f4d1",
    accent: "from-green-500 to-emerald-500",
  },
  {
    name: "Ananya Singh",
    college: "SRM Chennai",
    degree: "B.Sc Data Science",
    quote: "My go-to for PYQs. Literally saved me during exam week. The search is super fast and organized.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya&backgroundColor=ffe4c4",
    accent: "from-yellow-500 to-orange-500",
  },
  {
    name: "Karthik Menon",
    college: "NIT Trichy",
    degree: "M.Tech AI",
    quote: "As a senior, I love helping juniors with study materials. The XP rewards make contributing actually fun!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=karthik&backgroundColor=c4e0ff",
    accent: "from-indigo-500 to-purple-500",
  },
];

const TestimonialCard = ({ 
  testimonial, 
  index 
}: { 
  testimonial: typeof testimonials[0]; 
  index: number;
}) => {
  // Create staggered layout
  const yOffset = index % 2 === 0 ? 0 : 40;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: yOffset }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.6,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ y: yOffset - 8, scale: 1.02 }}
      className="group"
    >
      <div className="relative p-6 bg-card rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.accent} rounded-t-2xl`} />
        
        {/* Quote icon */}
        <div className={`absolute -top-4 right-6 w-8 h-8 bg-gradient-to-br ${testimonial.accent} rounded-full flex items-center justify-center shadow-lg`}>
          <Quote className="w-4 h-4 text-white" />
        </div>
        
        {/* Content */}
        <div className="pt-2">
          {/* Avatar and info */}
          <div className="flex items-center gap-3 mb-4">
            <motion.img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full bg-muted border-2 border-border"
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
            <div>
              <h4 className="font-bold text-foreground text-sm">{testimonial.name}</h4>
              <p className="text-xs text-muted-foreground">{testimonial.college}</p>
              <p className="text-xs text-primary font-medium">{testimonial.degree}</p>
            </div>
          </div>
          
          {/* Quote */}
          <p className="text-foreground/90 text-sm leading-relaxed italic">
            "{testimonial.quote}"
          </p>
        </div>
        
        {/* Hover glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.accent} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300 pointer-events-none`} />
      </div>
    </motion.div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section className="py-20 px-4 bg-secondary/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl">💬</div>
        <div className="absolute bottom-10 right-10 text-8xl">⭐</div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block text-4xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🎤
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What students are <span className="text-primary">saying</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real students. Real results. No cap. 🧢
          </p>
        </motion.div>
        
        {/* Staggered grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={testimonial.name} 
              testimonial={testimonial} 
              index={index} 
            />
          ))}
        </div>
        
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {[
            { number: "10K+", label: "Active Students" },
            { number: "50K+", label: "Notes Shared" },
            { number: "4.9", label: "App Rating ⭐" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
            >
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
