import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, User } from "lucide-react";

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
    setAuthMessage("Login to access external news links");
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Campus News
            </h1>
            <p className="text-muted-foreground">
              Stay updated with the latest from your university
            </p>
          </div>

          {/* News Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {mockNews.map((news) => (
              <Card key={news.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{news.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {news.date}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                    {news.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {news.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {news.author}
                    </span>
                    
                    {news.hasExternalLink ? (
                      <Button variant="outline" size="sm" onClick={handleExternalLink} className="flex items-center gap-1">
                        Read more <ExternalLink className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm">Read more</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center p-8 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground mb-4">
              Have campus news to share?
            </p>
            <Button onClick={() => { setAuthMessage("Login to submit news"); setAuthOpen(true); }}>
              Join to contribute
            </Button>
          </div>
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