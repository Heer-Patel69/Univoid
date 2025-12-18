import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, ArrowRight, PenLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBlogsPaginated } from "@/services/paginatedService";
import { SectionLoader, EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { useOptimizedFetch } from "@/hooks/useOptimizedFetch";
import { Blog } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

const Blogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBlogs = useCallback(async () => {
    const result = await getBlogsPaginated(0, 12);
    setAllBlogs(result.data);
    setHasMore(result.hasMore);
    return result.data;
  }, []);

  const { isLoading } = useOptimizedFetch({
    fetchFn: fetchBlogs,
    defaultValue: [] as Blog[],
    timeoutMs: 8000,
    cacheKey: 'blogs-page-0',
  });

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getBlogsPaginated(nextPage, 12);
      setAllBlogs(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (error) {
      toast.error('Failed to load more blogs');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleWriteBlog = () => {
    if (user) {
      navigate("/submit-blog");
    } else {
      setAuthOpen(true);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const getExcerpt = (content: string, maxLength = 150) => {
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
                <PenLine className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl text-foreground">
                  Student Blogs
                </h1>
                <p className="text-muted-foreground">
                  Insights, experiences, and tips from fellow students
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <SectionLoader size="lg" className="py-16" />
          ) : allBlogs.length === 0 ? (
            <EmptyState 
              message="No blogs have been published yet. Be the first to write one!"
              action={
                <Button onClick={handleWriteBlog} className="shadow-premium-sm">
                  Write a blog post <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          ) : (
            <>
              {/* Blog List */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBlogs.map((blog) => (
                  <Card key={blog.id} className="card-premium overflow-hidden group">
                    {blog.cover_image_url && (
                      <div className="relative overflow-hidden">
                        <img
                          src={blog.cover_image_url}
                          alt={blog.title}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">Blog</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getReadTime(blog.content)}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {getExcerpt(blog.content)}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{blog.contributor_name || 'Anonymous'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(blog.created_at)}
                        </span>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="w-full mt-4 flex items-center justify-center gap-1">
                        Read article <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More */}
              <LoadMoreButton 
                onClick={loadMore}
                isLoading={loadingMore}
                hasMore={hasMore}
              />
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have something to share?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Share your insights, experiences, and tips with fellow students.
              </p>
              <Button onClick={handleWriteBlog} className="shadow-premium-sm">
                Write a blog post
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
        message="Login to write blog posts"
      />
    </div>
  );
};

export default Blogs;
