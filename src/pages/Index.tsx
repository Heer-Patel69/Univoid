import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, 
  Newspaper, 
  PenLine, 
  ArrowLeftRight, 
  Trophy, 
  Star, 
  Shield, 
  Users,
  ArrowRight
} from "lucide-react";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);

  const features = [
    {
      icon: BookOpen,
      title: "Study Materials",
      description: "Access notes, past papers, and resources shared by fellow students.",
      href: "/materials",
    },
    {
      icon: Newspaper,
      title: "Campus News",
      description: "Stay updated with university news and announcements.",
      href: "/news",
    },
    {
      icon: PenLine,
      title: "Student Blogs",
      description: "Read and write about student experiences and insights.",
      href: "/blogs",
    },
    {
      icon: ArrowLeftRight,
      title: "Book Exchange",
      description: "Buy, sell, or exchange textbooks with other students.",
      href: "/books",
    },
  ];

  const leaderboardPreview = [
    { rank: 1, name: "Alex Chen", xp: 2450, level: 12 },
    { rank: 2, name: "Sarah Kim", xp: 2180, level: 11 },
    { rank: 3, name: "Mike Johnson", xp: 1950, level: 10 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Student-powered learning,<br />made simple
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                UniVoid connects students to share study materials, news, and knowledge. 
                No clutter, no noise—just what you need to succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => setAuthOpen(true)}>
                  Join to contribute
                </Button>
                <Link to="/materials">
                  <Button variant="outline" size="lg">
                    Browse materials
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why UniVoid */}
        <section className="py-16 bg-secondary/30">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                Why UniVoid?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Students often struggle to find reliable study materials scattered across groups and drives. 
                UniVoid brings everything together in one clean, organized place. Every contribution is 
                reviewed to ensure quality, and contributors earn recognition through our simple reward system.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container-wide">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-12">
              Everything you need
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Link key={feature.title} to={feature.href}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <feature.icon className="w-10 h-10 text-primary mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Gamification Preview */}
        <section className="py-16 bg-secondary/30">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                  Earn recognition for your contributions
                </h2>
                <p className="text-muted-foreground mb-6">
                  Every upload, blog post, and helpful contribution earns you XP. 
                  Climb the leaderboard, unlock badges, and showcase your impact.
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-warning" />
                    <span className="text-sm text-muted-foreground">Top contributors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Earn badges</span>
                  </div>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Top Contributors</h3>
                    <Link to="/leaderboard" className="text-sm text-primary hover:underline flex items-center gap-1">
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {leaderboardPreview.map((user) => (
                      <div key={user.rank} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                          {user.rank}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Level {user.level}</p>
                        </div>
                        <span className="text-sm font-medium text-primary">{user.xp.toLocaleString()} XP</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Quality you can trust
              </h2>
              <p className="text-muted-foreground mb-8">
                Every piece of content is reviewed by our admin team before going live. 
                No spam, no outdated materials—just verified, helpful resources.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Trusted by thousands of students</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container-wide">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-primary-foreground mb-4">
                Ready to contribute?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                Join UniVoid today and help build the best student resource platform.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setAuthOpen(true)}
              >
                Get started — it's free
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