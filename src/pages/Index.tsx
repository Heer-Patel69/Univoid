import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { DoodleStar, DoodleBook, DoodleLightbulb, DoodleRocket, DoodleHeart, DoodlePencil, DoodleChat, DoodleGradCap, DoodleSquiggle, DoodleUnderline } from "@/components/common/SketchDoodles";
import { FloatingDoodles } from "@/components/common/FloatingDoodles";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { ArrowRight, FileText, Users, BookOpen, Bell, Library, Calendar, Puzzle, Repeat, LogIn, UserCheck, Map, Zap, CheckCircle, Plus, Minus } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const {
    user,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const {
    getRedirectPath
  } = useRoleRedirect();
  useEffect(() => {
    if (!isLoading && user) {
      navigate(getRedirectPath(), {
        replace: true
      });
    }
  }, [user, isLoading, navigate, getRedirectPath]);
  useEffect(() => {
    // PERFORMANCE: Skip parallax on mobile for faster paint
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.offsetHeight;
        if (window.scrollY < heroBottom) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  if (!isLoading && user) {
    return null;
  }
  const trustItems = [{
    icon: FileText,
    label: "Student-shared Study Materials"
  }, {
    icon: Users,
    label: "Projects & Tasks"
  }, {
    icon: BookOpen,
    label: "Book Exchange"
  }, {
    icon: Bell,
    label: "Real-time Notifications"
  }];
  const features = [{
    icon: Library,
    title: "Study Materials",
    description: "Find and download notes, PDFs, and resources shared by students."
  }, {
    icon: Calendar,
    title: "Events",
    description: "Discover campus events, workshops, and hackathons."
  }, {
    icon: Puzzle,
  }, {
    icon: Puzzle,
    title: "Projects Partner",
    description: "Collaborate on real projects or find teammates."
  }, {
    icon: Repeat,
    title: "Book Exchange",
    description: "Buy, sell, or exchange books directly with students."
  }];
  const steps = [{
    icon: LogIn,
    title: "Sign in with Google",
    description: "Quick and secure authentication"
  }, {
    icon: UserCheck,
    title: "Complete your profile",
    description: "Tell us about your college and interests"
  }, {
    icon: Map,
    title: "Get a guided tour",
    description: "Learn how to use all features"
  }, {
    icon: Zap,
    title: "Start learning & collaborating",
    description: "Access everything you need"
  }];
  const benefits = ["One platform instead of many", "Personalized content (not random feeds)", "Made for Indian colleges", "Works smoothly on mobile & desktop", "No spam — only relevant notifications"];
  const faqs = [{
    q: "Is UniVoid free?",
    a: "Yes, UniVoid is completely free for students."
  }, {
    q: "Can I upload my own study material?",
    a: "Yes. Upload notes to help others and earn recognition."
  }, {
    q: "How does Book Exchange work?",
    a: "List books and connect directly with students near you."
  }, {
    q: "Will I get notifications?",
    a: "Yes, for events and tasks relevant to you."
  }, {
    q: "Is profile completion mandatory?",
    a: "Yes. It helps personalize content for you."
  }];
  return <div className="min-h-screen flex flex-col bg-sketch pb-20 md:pb-0 paper-texture">
    <SEOHead
      title="UniVoid - Everything a College Student Needs"
      description="Study materials, events, projects, tasks, and book exchange — all personalized for Indian students. Access notes, find teammates, and explore opportunities."
      url="/"
      keywords={['student platform', 'study materials', 'college events', 'hackathons', 'book exchange', 'project partner', 'UniVoid', 'Indian students']}
      structuredData={{
        "@type": "WebSite",
        "name": "UniVoid",
        "url": "https://univoid.tech",
        "description": "India's largest student learning platform",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://univoid.tech/materials?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }}
    />
    <Header onAuthClick={() => setAuthOpen(true)} />

    <main className="flex-1">
      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
        {/* Floating Doodles Background */}
        <FloatingDoodles density="high" section="hero" />

        {/* Parallax Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating shapes that move at different speeds */}
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" style={{
            transform: `translateY(${scrollY * 0.3}px)`
          }} />
          <div className="absolute top-1/4 -right-32 w-80 h-80 rounded-full bg-accent/20 blur-3xl" style={{
            transform: `translateY(${scrollY * 0.2}px)`
          }} />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-pastel-purple/30 blur-2xl" style={{
            transform: `translateY(${scrollY * 0.4}px)`
          }} />

          {/* Decorative sketch elements */}
          <svg className="absolute top-20 left-10 w-16 h-16 text-foreground/5" style={{
            transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * 0.02}deg)`
          }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
          </svg>
          <svg className="absolute top-40 right-20 w-20 h-20 text-foreground/5" style={{
            transform: `translateY(${scrollY * 0.25}px) rotate(-${scrollY * 0.03}deg)`
          }} viewBox="0 0 100 100">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
          </svg>
          <svg className="absolute bottom-32 left-1/3 w-12 h-12 text-foreground/5" style={{
            transform: `translateY(${scrollY * 0.35}px)`
          }} viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
          </svg>
        </div>

        <div className="container-wide relative z-10">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-foreground mb-6 text-balance text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight" style={{
              transform: `translateY(${scrollY * 0.1}px)`
            }}>
              Everything a College Student Needs — In One Place
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed" style={{
              transform: `translateY(${scrollY * 0.05}px)`
            }}>
              Study materials, events, projects, tasks, and book exchange — personalized for Indian students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setAuthOpen(true)} className="btn-sketch btn-sketch-primary font-semibold text-base h-14 px-8">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Get Started with Google
              </Button>
              <Link to="/materials">
                <Button variant="outline" size="lg" className="btn-sketch btn-sketch-secondary font-semibold text-base h-14 px-8 w-full sm:w-auto">
                  Explore Features
                  <ArrowRight className="w-5 h-5 ml-2" strokeWidth={2} />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust Strip */}
      <AnimatedSection animation="fade-up" delay={100}>
        <section className="py-8 border-y-2 border-sketch-border bg-card">
          <div className="container-wide">
            <p className="text-center text-sm font-semibold text-muted-foreground mb-6 tracking-wide uppercase">
              Built by students, for students.
            </p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {trustItems.map((item, index) => <div key={index} className="flex items-center gap-2 text-foreground">
                <item.icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>)}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* What is UniVoid */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Floating Doodles */}
        <FloatingDoodles density="low" />

        {/* Doodle decorations */}
        <DoodleLightbulb className="absolute top-10 left-8 w-16 h-20 opacity-60 hidden md:block animate-float-doodle" />
        <DoodleBook className="absolute bottom-10 right-12 w-14 h-14 opacity-60 hidden md:block animate-float-doodle" />

        <div className="container-wide relative z-10">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-foreground mb-6 text-3xl md:text-4xl font-bold relative inline-block">
              What is UniVoid?
              <DoodleUnderline className="absolute -bottom-2 left-0 w-full h-4 opacity-40" />
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg md:text-xl mt-4">
              UniVoid is a student-first platform designed to simplify college life. Instead of using multiple apps and websites, UniVoid brings everything students actually need into one guided and personalized experience. No clutter. No confusion. Just useful features.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 md:py-24 bg-card border-y-2 border-sketch-border relative overflow-hidden">
        {/* Floating Doodles */}
        <FloatingDoodles density="medium" />

        {/* Doodle decorations */}
        <DoodleStar className="absolute top-16 right-10 w-12 h-12 opacity-50 hidden lg:block animate-float-doodle" />
        <DoodleRocket className="absolute bottom-20 left-8 w-14 h-16 opacity-50 hidden lg:block animate-float-doodle" />
        <DoodlePencil className="absolute top-1/2 right-4 w-10 h-10 opacity-40 hidden xl:block animate-float-doodle" />

        <div className="container-wide relative z-10">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-display text-foreground mb-4 text-3xl md:text-4xl font-bold">
              Core Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in college, organized in one place.
            </p>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <AnimatedSection key={index} delay={index * 100} animation="scale">
              <div className="card-sketch-hover group h-full cursor-pointer p-6">
                <div className="w-12 h-12 rounded-xl bg-sketch border-2 border-sketch-border shadow-sketch-sm flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-secondary">
                  <feature.icon className="w-6 h-6 text-foreground transition-all duration-300" strokeWidth={2} />
                </div>
                <h3 className="font-display font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </AnimatedSection>)}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Doodle decorations */}
        <DoodleSquiggle className="absolute top-20 right-0 w-24 h-8 opacity-40 hidden md:block" />
        <DoodleChat className="absolute bottom-16 left-6 w-12 h-12 opacity-50 hidden md:block" />

        <div className="container-wide relative z-10">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-display text-foreground mb-4 text-3xl md:text-4xl font-bold">
              How It Works
            </h2>
          </AnimatedSection>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {steps.map((step, index) => <AnimatedSection key={index} delay={index * 150} animation="fade-left">
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-card border-2 border-sketch-border shadow-sketch flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-sketch-sm group-hover:bg-primary/10">
                    <step.icon className="w-6 h-6 text-foreground transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                  </div>
                  <div className="flex-1 pt-2 transition-transform duration-200 group-hover:translate-x-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-foreground text-lg">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              </AnimatedSection>)}
            </div>
          </div>
        </div>
      </section>

      {/* Why Students Use UniVoid */}
      <section className="py-16 md:py-24 bg-card border-y-2 border-sketch-border relative overflow-hidden">
        {/* Doodle decorations */}
        <DoodleHeart className="absolute top-12 left-10 w-10 h-10 opacity-50 hidden md:block" />
        <DoodleGradCap className="absolute bottom-12 right-8 w-16 h-14 opacity-50 hidden md:block" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection className="mb-8">
              <h2 className="font-display text-foreground text-3xl md:text-4xl font-bold text-center">
                Why Students Use UniVoid
              </h2>
            </AnimatedSection>
            <div className="space-y-4">
              {benefits.map((benefit, index) => <AnimatedSection key={index} delay={index * 100} animation="fade-right">
                <div className="flex items-center gap-4 p-4 bg-sketch rounded-xl border-2 border-sketch-border shadow-sketch-sm group cursor-pointer transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sketch">
                  <div className="w-8 h-8 rounded-full bg-card border-2 border-sketch-border flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-success/20 group-hover:border-success">
                    <CheckCircle className="w-5 h-5 text-foreground transition-colors duration-300 group-hover:text-success" strokeWidth={2} />
                  </div>
                  <span className="font-medium text-foreground transition-transform duration-200 group-hover:translate-x-1">{benefit}</span>
                </div>
              </AnimatedSection>)}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection className="mb-8">
              <h2 className="font-display text-foreground text-3xl md:text-4xl font-bold text-center">
                Frequently Asked Questions
              </h2>
            </AnimatedSection>
            <div className="space-y-4">
              {faqs.map((faq, index) => <AnimatedSection key={index} delay={index * 80}>
                <div className="card-sketch cursor-pointer" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">{faq.q}</h3>
                    <div className="w-8 h-8 rounded-lg bg-sketch flex items-center justify-center flex-shrink-0 ml-4">
                      {openFaq === index ? <Minus className="w-4 h-4 text-foreground" strokeWidth={2} /> : <Plus className="w-4 h-4 text-foreground" strokeWidth={2} />}
                    </div>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </AnimatedSection>)}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <AnimatedSection animation="scale">
        <section className="py-16 md:py-24 bg-card border-y-2 border-sketch-border">
          <div className="container-wide">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-foreground mb-6 text-3xl md:text-4xl font-bold">
                Start Your Smarter College Journey Today
              </h2>
              <Button size="lg" onClick={() => setAuthOpen(true)} className="btn-sketch btn-sketch-primary font-semibold text-base h-14 px-8">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Get Started with Google
              </Button>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>

    <Footer />
    <BottomNav />

    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
  </div>;
};
export default Index;