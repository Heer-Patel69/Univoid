import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FloatingDoodles, 
  DoodleCircle, 
  DoodleUnderline,
  DoodleArrow,
  NotebookBackground
} from "@/components/landing/DoodleElements";
import { CollegeMarquee } from "@/components/landing/Marquee";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { LiveStatsBanner } from "@/components/landing/LiveStatsBanner";
import { 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shield,
  Zap,
  X,
  FileText,
  MessageSquare,
  Clock
} from "lucide-react";

// Typing animation for "One Tab"
const TypeWriter = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayText(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span className="text-primary">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.7 }}
        className="inline-block w-0.5 h-[1em] bg-primary ml-1 align-middle"
      />
    </span>
  );
};

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (!isLoading && user) {
    return null;
  }

  // Problem section items
  const messyItems = [
    { icon: MessageSquare, label: "10 WhatsApp Groups", color: "text-green-500" },
    { icon: FileText, label: "Scattered Drive Links", color: "text-blue-500" },
    { icon: Clock, label: "Missed Deadlines", color: "text-red-500" },
  ];

  const trustPoints = [
    "Admin-reviewed content only",
    "Verified student contributors",
    "No spam or outdated materials",
    "Secure & private profiles",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] pb-20 md:pb-0 overflow-x-hidden">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 overflow-hidden">
          <NotebookBackground />
          <FloatingDoodles />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Your Student Super-App
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight"
            >
              Your Entire Campus Life.
              <br />
              <DoodleCircle color="hsl(270 70% 60%)">
                <TypeWriter text="One Tab." delay={1000} />
              </DoodleCircle>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Stop juggling 10 different WhatsApp groups, drive links, and notice boards. 
              UniVoid brings <DoodleUnderline>notes, events, and internships</DoodleUnderline> into one super-app.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              <motion.button
                onClick={() => setAuthOpen(true)}
                className="relative group px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white font-bold text-lg rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  Launch Student Dashboard
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    🚀
                  </motion.span>
                </span>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 blur-xl opacity-50 group-hover:opacity-75 -z-10 transition-opacity" />
              </motion.button>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-4 text-sm text-muted-foreground flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-yellow-500" />
                No signup forms. 1-click Google Login.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-20 px-4 bg-secondary/50 relative">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-2xl mb-4 block">😫</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Still doing <span className="text-red-500">this</span>?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Messy Side */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-3xl bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800/30 border-dashed"
              >
                <div className="absolute -top-3 left-6 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 text-xs font-bold">
                  THE CHAOS
                </div>
                <div className="space-y-4">
                  {messyItems.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-background rounded-xl shadow-sm"
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-foreground font-medium">{item.label}</span>
                      <X className="w-4 h-4 text-red-400 ml-auto" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <DoodleArrow className="w-16 h-8" />
              </div>

              {/* Clean Side */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-3xl bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800/30"
              >
                <div className="absolute -top-3 left-6 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 text-xs font-bold">
                  UNIVOID
                </div>
                <div className="text-center py-8">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl mb-4"
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Clean. Organized. Zen.
                  </h3>
                  <p className="text-muted-foreground">
                    Everything in one sorted dashboard
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bento Grid - Value Props */}
        <BentoGrid />

        {/* Social Proof Marquee */}
        <CollegeMarquee />

        {/* Live Stats Banner */}
        <LiveStatsBanner />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Trust Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-4">
                  <Shield className="w-4 h-4" />
                  Quality you can trust
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  No spam. <DoodleUnderline color="hsl(152 69% 45%)">No fake stuff.</DoodleUnderline>
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                  Every piece of content goes through admin review before going live. 
                  Only verified, helpful resources from real students.
                </p>
                <ul className="space-y-3">
                  {trustPoints.map((point, i) => (
                    <motion.li 
                      key={point} 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{point}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <motion.div 
                className="flex justify-center"
                whileInView={{ scale: [0.9, 1] }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <motion.div 
                    className="w-48 h-48 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center shadow-xl"
                    animate={{ rotate: [0, 2, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  >
                    <Shield className="w-20 h-20 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <motion.div 
                    className="absolute -bottom-4 -right-4 w-16 h-16 bg-white dark:bg-card rounded-2xl flex items-center justify-center shadow-lg border border-green-200 dark:border-green-800"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section - Dark Mode */}
        <section className="py-24 px-4 bg-foreground relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-6xl">📚</div>
            <div className="absolute top-20 right-20 text-5xl">🎓</div>
            <div className="absolute bottom-10 left-1/4 text-4xl">⚡</div>
            <div className="absolute bottom-20 right-10 text-5xl">🏆</div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-background mb-6"
            >
              Ready to upgrade your <span className="text-yellow-400">grades</span>?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-background/70 text-lg mb-10 max-w-xl mx-auto"
            >
              Join thousands of students already crushing their academics. 
              It's free, it's fast, and it's sorted.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="relative inline-block"
            >
              {/* Hand-drawn arrow pointing to button */}
              <motion.div
                className="absolute -right-20 -top-8 hidden md:block"
                animate={{ x: [0, 5, 0], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <svg width="60" height="50" viewBox="0 0 60 50">
                  <path
                    d="M5,10 Q20,5 40,20 Q50,30 55,40"
                    fill="none"
                    stroke="#FCD34D"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50,35 L55,40 L48,42"
                    fill="none"
                    stroke="#FCD34D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-yellow-400 text-sm font-medium absolute -top-2 -left-2 rotate-[-15deg]">
                  It's free!
                </span>
              </motion.div>

              <motion.button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-3 px-8 py-4 bg-background text-foreground font-bold text-lg rounded-full shadow-xl hover:shadow-2xl transition-all group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
      />
    </div>
  );
};

export default Index;
