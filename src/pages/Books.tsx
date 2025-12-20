import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import AuthModal from "@/components/auth/AuthModal";
import ReportButton from "@/components/reports/ReportButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, User, ArrowRight, Images } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBooksPaginated } from "@/services/paginatedService";
import { SectionLoader, EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { useOptimizedFetch, CACHE_TTL } from "@/hooks/useOptimizedFetch";
import { Book } from "@/types/database";
import { toast } from "sonner";

const Books = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBooks = useCallback(async () => {
    const result = await getBooksPaginated(0, 12);
    setAllBooks(result.data);
    setHasMore(result.hasMore);
    return result.data;
  }, []);

  const { isLoading } = useOptimizedFetch({
    fetchFn: fetchBooks,
    defaultValue: [] as Book[],
    timeoutMs: 8000,
    cacheKey: 'books-page-0',
    cacheTtl: CACHE_TTL.LONG, // 5 minutes cache for books
  });

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getBooksPaginated(nextPage, 12);
      setAllBooks(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (error) {
      toast.error('Failed to load more books');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleListBook = () => {
    if (user) {
      navigate("/sell-book");
    } else {
      setAuthMessage("Login to list your books");
      setAuthOpen(true);
    }
  };

  const filteredBooks = allBooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl text-foreground">
                  Book Exchange
                </h1>
                <p className="text-muted-foreground">
                  Buy, sell, or exchange textbooks with other students
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <SectionLoader size="lg" className="py-16" />
          ) : allBooks.length === 0 ? (
            <EmptyState 
              message="No books have been listed yet. Be the first to list one!"
              action={
                <Button onClick={handleListBook} className="shadow-premium-sm">
                  List a book <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <EmptyState message="No books found matching your search." />
          ) : (
            <>
              {/* Books Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <Link key={book.id} to={`/books/${book.id}`}>
                    <Card className="card-premium overflow-hidden group cursor-pointer h-full">
                      {book.image_urls && book.image_urls.length > 0 ? (
                        <div className="relative overflow-hidden">
                          <img
                            src={book.image_urls[0]}
                            alt={book.title}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          {book.image_urls.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Images className="w-3 h-3" />
                              {book.image_urls.length}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-accent flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-primary" />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {book.title}
                          </h3>
                          {book.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{book.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant={book.price ? "default" : "outline"} className="text-xs">
                            {book.price ? 'For Sale' : 'Exchange'}
                          </Badge>
                          {book.condition && (
                            <Badge variant="secondary" className="text-xs">{book.condition}</Badge>
                          )}
                        </div>
                        
                        {book.price && book.price > 0 && (
                          <p className="text-lg font-semibold text-primary mt-3">₹{book.price}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{book.contributor_name || 'Anonymous'}</span>
                          </div>
                          <ReportButton
                            contentType="books"
                            contentId={book.id}
                            contentOwnerId={book.created_by}
                            contentTitle={book.title}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {!searchQuery && (
                <LoadMoreButton 
                  onClick={loadMore}
                  isLoading={loadingMore}
                  hasMore={hasMore}
                />
              )}
            </>
          )}

          {/* CTA */}
          <Card className="mt-12 border-0 bg-secondary/50">
            <CardContent className="p-8 text-center">
              <h3 className="font-display text-xl text-foreground mb-3">Have textbooks to sell or exchange?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                List your books and connect with fellow students looking for study materials.
              </p>
              <Button onClick={handleListBook} className="shadow-premium-sm">
                List a book
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <BottomNav />
      
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        message={authMessage}
      />
    </div>
  );
};

export default Books;
