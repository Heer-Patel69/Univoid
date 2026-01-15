import { useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import ReportButton from "@/components/reports/ReportButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ExternalLink, User, Newspaper as NewsIcon, ArrowRight, GraduationCap, Briefcase, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";
import { SectionLoader, EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { News as NewsType } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

interface LayoutContext {
  onAuthClick?: () => void;
}

type NewsCategory = "all" | "scholarship" | "job" | "placement" | "general";

const CATEGORY_CONFIG: Record<NewsCategory, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: "All News", icon: <NewsIcon className="w-4 h-4" />, color: "bg-secondary" },
  scholarship: { label: "Scholarships", icon: <GraduationCap className="w-4 h-4" />, color: "bg-green-500/20 text-green-600" },
  job: { label: "Jobs", icon: <Briefcase className="w-4 h-4" />, color: "bg-blue-500/20 text-blue-600" },
  placement: { label: "Placements", icon: <TrendingUp className="w-4 h-4" />, color: "bg-purple-500/20 text-purple-600" },
  general: { label: "General", icon: <NewsIcon className="w-4 h-4" />, color: "bg-secondary" },
};

const News = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const context = useOutletContext<LayoutContext>();
  const [category, setCategory] = useState<NewsCategory>("all");
  const [page, setPage] = useState(0);
  const [allNews, setAllNews] = useState<NewsType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNews = useCallback(async (cat: NewsCategory, pageNum: number, append = false) => {
    try {
      let query = supabase
        .from("news")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(pageNum * 12, (pageNum + 1) * 12 - 1);

      if (cat !== "all") {
        query = query.eq("category", cat);
      }

      const { data, error } = await query;
      if (error) throw error;

      const news = (data || []) as NewsType[];
      
      // Fetch contributor names in batch
      const userIds = [...new Set(news.map(n => n.created_by))];
      const nameMap = new Map<string, string>();
      
      for (const userId of userIds) {
        const { data: nameData } = await supabase.rpc("get_contributor_name", { user_id: userId });
        if (nameData) nameMap.set(userId, nameData);
      }
      
      news.forEach(n => {
        n.contributor_name = nameMap.get(n.created_by) || "Anonymous";
      });

      if (append) {
        setAllNews(prev => [...prev, ...news]);
      } else {
        setAllNews(news);
      }
      
      setHasMore(news.length === 12);
      return news;
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to load news");
      return [];
    }
  }, []);

  // Initial load
  useState(() => {
    fetchNews("all", 0).finally(() => setIsLoading(false));
  });

  const handleCategoryChange = async (newCategory: NewsCategory) => {
    setCategory(newCategory);
    setPage(0);
    setIsLoading(true);
    await fetchNews(newCategory, 0);
    setIsLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchNews(category, nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleSubmitNews = () => {
    if (user) {
      navigate("/submit-news");
    } else {
      context?.onAuthClick?.();
    }
  };

  const handleExternalLink = (link: string | null) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const getExcerpt = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const getCategoryBadge = (newsCategory: string | null) => {
    const cat = (newsCategory || "general") as NewsCategory;
    const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.general;
    return (
      <Badge className={`${config.color} border-0 gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="pb-20 md:pb-0">
      <SEOHead
        title="Campus News - Scholarships, Jobs & Updates"
        description="Stay updated with the latest scholarships, job opportunities, placement news, and campus updates. Never miss important student opportunities."
        url="/news"
        keywords={['campus news', 'scholarships', 'student jobs', 'placements', 'college updates', 'UniVoid']}
      />
      <main className="py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <NewsIcon className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl text-foreground">
                  Campus News
                </h1>
                <p className="text-muted-foreground">
                  Scholarships, jobs, and campus updates
                </p>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={category} onValueChange={(v) => handleCategoryChange(v as NewsCategory)} className="mb-8">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
              {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-full border-2 border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 gap-2"
                >
                  {CATEGORY_CONFIG[cat].icon}
                  <span className="hidden sm:inline">{CATEGORY_CONFIG[cat].label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Content */}
          {isLoading ? (
            <SectionLoader size="lg" className="py-16" />
          ) : allNews.length === 0 ? (
            <EmptyState
              message={
                category === "scholarship"
                  ? "No scholarship news yet. Check back soon for opportunities!"
                  : "No news has been submitted yet. Be the first to share campus updates!"
              }
              action={
                <Button onClick={handleSubmitNews} className="shadow-premium-sm">
                  Submit news <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          ) : (
            <>
              {/* Scholarship Alert Banner */}
              {category === "scholarship" && (
                <Card className="mb-6 border-green-500/30 bg-green-500/5">
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-foreground">Get Scholarship Alerts</p>
                        <p className="text-sm text-muted-foreground">Never miss an opportunity</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!user) {
                          context?.onAuthClick?.();
                        } else {
                          navigate("/dashboard");
                          toast.success("Manage alerts in your dashboard");
                        }
                      }}
                    >
                      Enable Alerts
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* News Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {allNews.map((item) => (
                  <Card key={item.id} className="card-premium overflow-hidden group">
                    {item.image_urls && item.image_urls.length > 0 && (
                      <div className="relative overflow-hidden">
                        <img
                          src={item.image_urls[0]}
                          alt={item.title}
                          className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-4 left-4">
                          {getCategoryBadge((item as any).category)}
                        </div>
                      </div>
                    )}
                    <CardContent className="p-6">
                      {(!item.image_urls || item.image_urls.length === 0) && (
                        <div className="mb-3">{getCategoryBadge((item as any).category)}</div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {item.contributor_name || "Anonymous"}
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

                      <div className="flex items-center justify-between">
                        <ReportButton
                          contentType="news"
                          contentId={item.id}
                          contentOwnerId={item.created_by}
                          contentTitle={item.title}
                        />
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

              {/* Load More */}
              <LoadMoreButton onClick={loadMore} isLoading={loadingMore} hasMore={hasMore} />
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have campus news to share?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Submit scholarships, job openings, or campus achievements.
              </p>
              <Button onClick={handleSubmitNews} className="shadow-premium-sm">
                Submit news
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default News;
