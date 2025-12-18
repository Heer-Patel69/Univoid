import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, User, Newspaper as NewsIcon, ArrowRight } from "lucide-react";

const mockNews = [
  {
    id: 1,
    title: "University Announces New Engineering Building",
    excerpt: "The new state-of-the-art facility will house advanced laboratories and collaborative spaces for engineering students.",
    content: "The university administration has approved plans for a new $50 million engineering building...",
    author: "Campus Editorial",
    date: "2024-01-18",
    category: "Campus",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=250&fit=crop",
    hasExternalLink: true,
  },
  {
    id: 2,
    title: "Spring Semester Registration Opens Next Week",
    excerpt: "Important dates and deadlines for course registration. Early bird slots available for final year students.",
    content: "Registration for the upcoming spring semester will begin on Monday...",
    author: "Admin Office",
    date: "2024-01-16",
    category: "Academic",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=250&fit=crop",
    hasExternalLink: false,
  },
  {
    id: 3,
    title: "Research Team Wins International Competition",
    excerpt: "Computer Science students secure first place at the Global Hackathon with their innovative AI solution.",
    content: "A team of four students from the Computer Science department...",
    author: "Sarah Kim",
    date: "2024-01-14",
    category: "Achievement",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=250&fit=crop",
    hasExternalLink: true,
  },
  {
    id: 4,
    title: "Library Hours Extended During Exam Period",
    excerpt: "The main library will remain open 24/7 starting next week to support students during finals.",
    content: "In response to student feedback, the university library will extend its operating hours...",
    author: "Library Services",
    date: "2024-01-12",
    category: "Services",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=250&fit=crop",
    hasExternalLink: false,
  },
];

const News = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const handleExternalLink = () => {
    setAuthMessage("Sign in to access external news links");
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <NewsIcon className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl text-foreground">
                  Campus News
                </h1>
                <p className="text-muted-foreground">
                  Latest updates from your university
                </p>
              </div>
            </div>
          </div>

          {/* News Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {mockNews.map((news) => (
              <Card key={news.id} className="card-premium overflow-hidden group">
                <div className="relative overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Badge className="absolute top-4 left-4 bg-background/90 text-foreground border-0">
                    {news.category}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {news.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {news.date}
                    </span>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed">
                    {news.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-end">
                    {news.hasExternalLink ? (
                      <Button variant="outline" size="sm" onClick={handleExternalLink} className="flex items-center gap-1.5">
                        Read more <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        Read more <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have campus news to share?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Submit academic updates, event announcements, or achievement stories. All submissions are reviewed by our admin team.
              </p>
              <Button onClick={() => { setAuthMessage("Sign in to submit news"); setAuthOpen(true); }} className="shadow-premium-sm">
                Submit news
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message={authMessage}
      />
    </div>
  );
};

export default News;
