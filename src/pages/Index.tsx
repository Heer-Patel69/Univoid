import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight,
  GraduationCap,
  FileText,
  Users,
  BookOpen,
  Bell,
  Library,
  Award,
  Calendar,
  Puzzle,
  Repeat,
  Newspaper,
  LogIn,
  UserCheck,
  Map,
  Zap,
  CheckCircle,
  Plus,
  Minus,
  Instagram
} from "lucide-react";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (!isLoading && user) {
    return null;
  }

  const trustItems = [
    { icon: GraduationCap, label: "India-only Scholarships" },
    { icon: FileText, label: "Student-shared Study Materials" },
    { icon: Users, label: "Projects & Tasks" },
    { icon: BookOpen, label: "Book Exchange" },
    { icon: Bell, label: "Real-time Notifications" },
  ];

  const features = [
    { 
      icon: Library, 
      title: "Study Materials", 
      description: "Find and download notes, PDFs, and resources shared by students." 
    },
    { 
      icon: Award, 
      title: "Scholarships (India-Only)", 
      description: "Get scholarship updates personalized by your state and course." 
    },
    { 
      icon: Calendar, 
      title: "Events", 
      description: "Discover campus events, workshops, and hackathons." 
    },
    { 
      icon: Puzzle, 
      title: "Projects & Task Plaza", 
      description: "Collaborate on real projects or find short tasks." 
    },
    { 
      icon: Repeat, 
      title: "Book Exchange", 
      description: "Buy, sell, or exchange books directly with students." 
    },
    { 
      icon: Newspaper, 
      title: "Campus News", 
      description: "Stay updated with scholarships, jobs, and student news." 
    },
  ];

  const steps = [
    { icon: LogIn, title: "Sign in with Google", description: "Quick and secure authentication" },
    { icon: UserCheck, title: "Complete your profile", description: "Tell us about your college and interests" },
    { icon: Map, title: "Get a guided tour", description: "Learn how to use all features" },
    { icon: Zap, title: "Start learning & collaborating", description: "Access everything you need" },
  ];

  const benefits = [
    "One platform instead of many",
    "Personalized content (not random feeds)",
    "Made for Indian colleges",
    "Works smoothly on mobile & desktop",
    "No spam — only relevant notifications",
  ];

  const faqs = [
    { q: "Is UniVoid free?", a: "Yes, UniVoid is completely free for students." },
    { q: "Are scholarships verified?", a: "Scholarships are sourced from trusted portals, but verify on official sites." },
    { q: "Can I upload my own study material?", a: "Yes. Upload notes to help others and earn recognition." },
    { q: "How does Book Exchange work?", a: "List books and connect directly with students near you." },
    { q: "Will I get notifications?", a: "Yes, for scholarships, events, and tasks relevant to you." },
    { q: "Is profile completion mandatory?", a: "Yes. It helps personalize content for you." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-sketch pb-20 md:pb-0">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-display text-foreground mb-6 text-balance text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                Everything a College Student Needs — In One Place
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                Study materials, scholarships, events, projects, tasks, and book exchange — personalized for Indian students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setAuthOpen(true)}
                  className="btn-sketch btn-sketch-primary font-semibold text-base h-14 px-8"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Get Started with Google
                </Button>
                <Link to="/materials">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="btn-sketch btn-sketch-secondary font-semibold text-base h-14 px-8 w-full sm:w-auto"
                  >
                    Explore Features
                    <ArrowRight className="w-5 h-5 ml-2" strokeWidth={2} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="py-8 border-y-2 border-sketch-border bg-card">
          <div className="container-wide">
            <p className="text-center text-sm font-semibold text-muted-foreground mb-6 tracking-wide uppercase">
              Built by students, for students.
            </p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {trustItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-foreground">
                  <item.icon className="w-5 h-5" strokeWidth={2} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What is UniVoid */}
        <section className="py-16 md:py-24">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-foreground mb-6 text-3xl md:text-4xl font-bold">
                What is UniVoid?
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg md:text-xl">
                UniVoid is a student-first platform designed to simplify college life. Instead of using multiple apps and websites, UniVoid brings everything students actually need into one guided and personalized experience. No clutter. No confusion. Just useful features.
              </p>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 md:py-24 bg-card border-y-2 border-sketch-border">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="font-display text-foreground mb-4 text-3xl md:text-4xl font-bold">
                Core Features
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to succeed in college, organized in one place.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="card-sketch group">
                  <div className="w-12 h-12 rounded-xl bg-sketch flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <feature.icon className="w-6 h-6 text-foreground" strokeWidth={2} />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="font-display text-foreground mb-4 text-3xl md:text-4xl font-bold">
                How It Works
              </h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-card border-2 border-sketch-border shadow-sketch flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          Step {index + 1}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-foreground text-lg">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Students Use UniVoid */}
        <section className="py-16 md:py-24 bg-card border-y-2 border-sketch-border">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-foreground mb-8 text-3xl md:text-4xl font-bold text-center">
                Why Students Use UniVoid
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-sketch rounded-xl border-2 border-sketch-border shadow-sketch-sm">
                    <div className="w-8 h-8 rounded-full bg-card border-2 border-sketch-border flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-foreground" strokeWidth={2} />
                    </div>
                    <span className="font-medium text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-foreground mb-8 text-3xl md:text-4xl font-bold text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className="card-sketch cursor-pointer"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-foreground">{faq.q}</h3>
                      <div className="w-8 h-8 rounded-lg bg-sketch flex items-center justify-center flex-shrink-0 ml-4">
                        {openFaq === index ? (
                          <Minus className="w-4 h-4 text-foreground" strokeWidth={2} />
                        ) : (
                          <Plus className="w-4 h-4 text-foreground" strokeWidth={2} />
                        )}
                      </div>
                    </div>
                    {openFaq === index && (
                      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-card border-y-2 border-sketch-border">
          <div className="container-wide">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-foreground mb-6 text-3xl md:text-4xl font-bold">
                Start Your Smarter College Journey Today
              </h2>
              <Button 
                size="lg" 
                onClick={() => setAuthOpen(true)}
                className="btn-sketch btn-sketch-primary font-semibold text-base h-14 px-8"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Get Started with Google
              </Button>
            </div>
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
