import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import ReportButton from "@/components/reports/ReportButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, User, ArrowRight, Images, Filter, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getBooksPaginated } from "@/services/paginatedService";
import { SectionLoader, EmptyState, LoadMoreButton } from "@/components/common/SectionLoader";
import { useOptimizedFetch, CACHE_TTL, clearFetchCache } from "@/hooks/useOptimizedFetch";
import { useSkeletonSync } from "@/hooks/useSkeleton";
import { Book } from "@/types/database";
import { toast } from "sonner";
import { getDisplayCategory } from "@/lib/bookCategorizer";
import { getListingType } from "@/lib/whatsappContact";
import { supabase } from "@/integrations/supabase/client";

const LISTING_LABELS: Record<string, string> = {
  sell: 'For Sale',
  rent: 'For Rent',
  donate: 'Free',
  exchange: 'Exchange',
};

const BOOK_CATEGORIES = [
  "All Categories",
  "Academic",
  "Competitive Exam",
  "Technology",
  "Fiction",
  "Non-Fiction",
  "Self-Help",
  "Biography",
  "Other",
] as const;

const LISTING_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "sell", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "donate", label: "Free (Donate)" },
  { value: "exchange", label: "Exchange" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
] as const;

interface LayoutContext {
  onAuthClick?: () => void;
}

const Books = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const context = useOutletContext<LayoutContext>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedListingType, setSelectedListingType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);

  // Fetch books with caching - data persists across navigation
  const fetchBooks = useCallback(async () => {
    const result = await getBooksPaginated(0, 12);
    setHasMore(result.hasMore);
    return result.data;
  }, []);

  const { data: cachedBooks, isLoading: rawLoading } = useOptimizedFetch({
    fetchFn: fetchBooks,
    defaultValue: [] as Book[],
    timeoutMs: 8000,
    cacheKey: 'books-page-data',
    cacheTtl: CACHE_TTL.LONG,
  });

  // Sync local state with cached data
  useEffect(() => {
    if (cachedBooks.length > 0) {
      setLocalBooks(cachedBooks);
    }
  }, [cachedBooks]);

  // Combined books list (cached + local additions from real-time/load more)
  const allBooks = localBooks.length > 0 ? localBooks : cachedBooks;

  // Use skeleton sync for consistent loading behavior with minimum display time
  const isLoading = useSkeletonSync(rawLoading, { minDisplayTime: 400 });

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('books-page-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'books' },
        (payload: any) => {
          const newData = payload.new as Book;
          
          if (payload.eventType === 'INSERT' && newData?.status === 'approved') {
            setLocalBooks(prev => {
              if (prev.some(b => b.id === newData.id)) return prev;
              return [newData, ...prev];
            });
            clearFetchCache('books-page-data');
          } else if (payload.eventType === 'UPDATE') {
            if (newData?.status === 'approved' && !newData.is_sold) {
              setLocalBooks(prev => {
                if (prev.some(b => b.id === newData.id)) {
                  return prev.map(b => b.id === newData.id ? { ...b, ...newData } : b);
                }
                return [newData, ...prev];
              });
            } else {
              setLocalBooks(prev => prev.filter(b => b.id !== newData.id));
            }
            clearFetchCache('books-page-data');
          } else if (payload.eventType === 'DELETE') {
            setLocalBooks(prev => prev.filter(b => b.id !== payload.old?.id));
            clearFetchCache('books-page-data');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getBooksPaginated(nextPage, 12);
      setLocalBooks(prev => [...prev, ...result.data]);
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
      context?.onAuthClick?.();
    }
  };

  const filteredBooks = useMemo(() => {
    const filtered = allBooks.filter(book => {
      // Hide sold and rented books from buyers
      const bookStatus = (book as any).book_status as string || 'available';
      if (book.is_sold || bookStatus === 'sold' || bookStatus === 'rented') {
        return false;
      }
      
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const bookCategory = getDisplayCategory(book.category);
      const matchesCategory = 
        selectedCategory === "All Categories" || 
        bookCategory === selectedCategory;
      
      const bookListingType = getListingType(book.listing_type, book.price);
      const matchesListingType = 
        selectedListingType === "all" || 
        bookListingType === selectedListingType;
      
      return matchesSearch && matchesCategory && matchesListingType;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price_low":
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case "price_high":
          return (b.price ?? 0) - (a.price ?? 0);
        case "popular":
          return (b.views_count ?? 0) - (a.views_count ?? 0);
        default:
          return 0;
      }
    });
  }, [allBooks, searchQuery, selectedCategory, selectedListingType, sortBy]);

  return (
    <div className="pb-20 md:pb-0">
      <main className="py-10 md:py-14">
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

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedListingType} onValueChange={setSelectedListingType}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_TYPE_FILTERS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <EmptyState message={searchQuery || selectedCategory !== "All Categories" || selectedListingType !== "all" ? "No books found matching your filters." : "No books found."} />
          ) : (
            <>
              {/* Books Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 staggered-grid-fast">
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
                        
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge 
                            variant={book.listing_type === 'donate' ? 'secondary' : book.price ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {LISTING_LABELS[getListingType(book.listing_type, book.price)] || 'For Sale'}
                          </Badge>
                          {book.condition && (
                            <Badge variant="secondary" className="text-xs">{book.condition}</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getDisplayCategory(book.category)}
                          </Badge>
                        </div>
                        
                        {book.price && book.price > 0 && (
                          <p className="text-lg font-semibold text-primary mt-3">
                            ₹{book.price}{book.listing_type === 'rent' ? '/mo' : ''}
                          </p>
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
              {!searchQuery && selectedCategory === "All Categories" && selectedListingType === "all" && (
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

      <BottomNav />
    </div>
  );
};

export default Books;
