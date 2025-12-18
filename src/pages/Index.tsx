import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LiveStatsSection } from "@/components/common/LiveStatsSection";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { 
  BookOpen, 
  Newspaper, 
  PenLine, 
  ArrowLeftRight, 
  Trophy, 
  Star, 
  Shield, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { leaderboard } = useLeaderboard(3);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Don't render Home page for logged-in users
  if (!isLoading && user) {
    return null;
  }

  const features = [
    {
      icon: BookOpen,
      title: "Study Materials",
      description: "Access notes, past papers, and resources shared by verified students.",
      href: "/materials",
    },
    {
      icon: Newspaper,
      title: "Campus News",
      description: "Stay updated with academic news, events, and opportunities.",
      href: "/news",
    },
    {
      icon: PenLine,
      title: "Student Blogs",
      description: "Read insights and experiences from students across campuses.",
      href: "/blogs",
    },
    {
      icon: ArrowLeftRight,
      title: "Book Exchange",
      description: "Buy, sell, or exchange textbooks with trusted peers.",
      href: "/books",
    },
  ];

  // Use real leaderboard data
  const leaderboardPreview = leaderboard.length > 0 
    ? leaderboard.map((user, index) => ({
        rank: index + 1,
        name: user.full_name,
        xp: user.total_xp,
        level: user.level,
      }))
    : [
        { rank: 1, name: "Be the first!", xp: 0, level: 1 },
      ];

  const trustPoints = [
    "Admin-reviewed content",
    "Verified student contributors",
    "No spam or outdated materials",
    "Secure and private profiles",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="section-spacing relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-transparent pointer-events-none" />
          <div className="container-wide relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Trusted by students everywhere
              </div>
              <h1 className="font-display text-foreground mb-6 text-balance">
                Where students learn,<br className="hidden sm:block" /> share, and grow together
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                UniVoid is your trusted academic companion—bringing study materials, 
                news, blogs, and peer connections into one clean, organized platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/materials">
                  <Button size="lg" className="w-full sm:w-auto font-medium shadow-premium-md">
                    Explore Resources
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setAuthOpen(true)}
                  className="w-full sm:w-auto font-medium"
                >
                  Join UniVoid — it's free
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why UniVoid */}
        <section className="section-spacing-sm bg-secondary/40">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-foreground mb-6">
                Why UniVoid exists
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Students often struggle with scattered study materials across random groups and drives,
                low-quality resources, and no recognition for contributors. UniVoid solves this by creating
                a single, trusted platform where every contribution is reviewed, and every contributor is recognized.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section-spacing">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="font-display text-foreground mb-4">
                Everything you need, in one place
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Access verified study materials, stay updated with campus news, read student blogs, 
                and exchange books—all in one organized platform.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature) => (
                <Link key={feature.title} to={feature.href} className="group">
                  <Card className="h-full card-premium">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                        <feature.icon className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Gamification Preview */}
        <section className="section-spacing bg-secondary/40">
          <div className="container-wide">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-sm font-medium mb-4">
                  <Trophy className="w-4 h-4" />
                  Recognition system
                </div>
                <h2 className="font-display text-foreground mb-6">
                  Get recognized for your contributions
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                  Every upload, blog post, and helpful contribution earns you XP after admin approval. 
                  Climb the leaderboard, showcase your impact, and build your academic reputation.
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-warning" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">Leaderboard ranks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">XP levels</span>
                  </div>
                </div>
              </div>
              
              <Card className="shadow-premium-lg border-0 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-foreground">Top Contributors</h3>
                    <Link to="/leaderboard" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {leaderboardPreview.map((user, index) => (
                      <div 
                        key={user.rank} 
                        className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors ${
                          index === 0 ? 'bg-warning/5 border border-warning/20' : 'bg-secondary/50'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                          index === 0 ? 'bg-warning/20 text-warning' :
                          index === 1 ? 'bg-muted text-muted-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.rank}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Level {user.level}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">{user.xp.toLocaleString()} XP</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="section-spacing">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
                    <Shield className="w-4 h-4" />
                    Quality assured
                  </div>
                  <h2 className="font-display text-foreground mb-6">
                    Quality you can trust
                  </h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                    Every piece of content goes through admin review before going live. 
                    No spam, no outdated materials—just verified, helpful resources from real students.
                  </p>
                  <ul className="space-y-3">
                    {trustPoints.map((point) => (
                      <li key={point} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-accent to-secondary rounded-3xl flex items-center justify-center shadow-premium-lg">
                      <Shield className="w-20 h-20 text-primary" />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center border border-success/20">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Section */}
        <LiveStatsSection />

        {/* CTA Section */}
        <section className="section-spacing bg-primary">
          <div className="container-wide">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-primary-foreground mb-4">
                Ready to join the community?
              </h2>
              <p className="text-primary-foreground/80 mb-8 text-lg leading-relaxed">
                Start learning, contributing, and building your academic reputation today.
                It's free and takes less than a minute.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setAuthOpen(true)}
                className="font-medium shadow-premium-md"
              >
                Get started — it's free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
      />
    </div>
  );
};

export default Index;
