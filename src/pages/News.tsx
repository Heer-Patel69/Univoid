import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, User, Newspaper as NewsIcon, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getNews } from "@/services/newsService";
import { News as NewsType } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

const News = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [news, setNews] = useState<NewsType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        setNews(data);
      } catch (error) {
        console.error('Error fetching news:', error);
        toast.error('Failed to load news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleSubmitNews = () => {
    if (user) {
      navigate("/submit-news");
    } else {
      setAuthMessage("Sign in to submit news");
      setAuthOpen(true);
    }
  };

  const handleExternalLink = (link: string | null) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getExcerpt = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
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

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* News Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {news.map((item) => (
                  <Card key={item.id} className="card-premium overflow-hidden group">
                    {item.image_urls && item.image_urls.length > 0 && (
                      <div className="relative overflow-hidden">
                        <img
                          src={item.image_urls[0]}
                          alt={item.title}
                          className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <Badge className="absolute top-4 left-4 bg-background/90 text-foreground border-0">
                          News
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {item.contributor_name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="font-display font-semibold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed">
                        {getExcerpt(item.content)}
                      </p>
                      
                      <div className="flex items-center justify-end">
                        {item.external_link ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleExternalLink(item.external_link)} 
                            className="flex items-center gap-1.5"
                          >
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

              {news.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    No news has been submitted yet. Be the first to share campus updates!
                  </p>
                </div>
              )}
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have campus news to share?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Submit academic updates, event announcements, or achievement stories.
              </p>
              <Button onClick={handleSubmitNews} className="shadow-premium-sm">
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