import { useState, useMemo } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/layout/BottomNav";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventFilters } from "@/components/events/EventFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchEvents, Event } from "@/services/eventsService";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Calendar } from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
import AuthModal from "@/components/auth/AuthModal";
import { useDebounce } from "@/hooks/useDebounce";

interface LayoutContext {
  onAuthClick?: () => void;
}

const Events = () => {
  const { user } = useAuth();
  const context = useOutletContext<LayoutContext>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(urlCategory || "all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // Debounce search to prevent fetching on every keystroke
  const debouncedSearch = useDebounce(search, 400);

  // Dynamic SEO based on category filter
  const seoData = useMemo(() => {
    if (urlCategory && urlCategory !== 'all') {
      return {
        title: `${urlCategory} Events for Students | UniVoid`,
        description: `Discover ${urlCategory.toLowerCase()} events, workshops, and hackathons for students. Register now and participate in exciting opportunities.`,
        keywords: [urlCategory, 'student events', 'hackathons', 'workshops', 'college events', 'UniVoid'],
      };
    }
    return {
      title: 'Student Events - Hackathons, Workshops & Fests | UniVoid',
      description: 'Discover hackathons, workshops, cultural fests, and student events. Register for tech events, coding competitions, and more.',
      keywords: ['student events', 'hackathons', 'workshops', 'college fests', 'tech events', 'UniVoid'],
    };
  }, [urlCategory]);

  // Use React Query for caching + deduplication
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events-list", category, priceFilter, debouncedSearch, stateFilter, cityFilter],
    queryFn: () => fetchEvents({
      category: category !== "all" ? category : undefined,
      is_paid: priceFilter === "all" ? undefined : priceFilter === "paid",
      search: debouncedSearch || undefined,
      state: stateFilter !== "all" ? stateFilter : undefined,
      city: cityFilter !== "all" ? cityFilter : undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPriceFilter("all");
    setStateFilter("all");
    setCityFilter("all");
  };

  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!events) return { upcomingEvents: [], pastEvents: [] };
    const now = new Date();
    return {
      upcomingEvents: events.filter(e => new Date(e.start_date) >= now),
      pastEvents: events.filter(e => new Date(e.start_date) < now),
    };
  }, [events]);

  return (
    <div className="pb-24 md:pb-8 w-full overflow-x-hidden">
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        url="/events"
        keywords={seoData.keywords}
      />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                Events
              </h1>
              <p className="text-muted-foreground">
                Discover hackathons, workshops, cultural fests & more
              </p>
            </div>

            {user ? (
              <Link to="/organizer/create-event">
                <Button className="rounded-full gap-2">
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </Link>
            ) : (
              <Button className="rounded-full gap-2" onClick={() => {
                if (context?.onAuthClick) {
                  context.onAuthClick();
                } else {
                  setShowAuthModal(true);
                }
              }}>
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            )}
          </div>

          <EventFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            priceFilter={priceFilter}
            onPriceFilterChange={setPriceFilter}
            state={stateFilter}
            onStateChange={setStateFilter}
            city={cityFilter}
            onCityChange={setCityFilter}
            onClear={clearFilters}
          />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && upcomingEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="font-display text-xl font-semibold">Upcoming Events</h2>
              <Badge variant="secondary">{upcomingEvents.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && events?.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-16 h-16 text-muted-foreground/50" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">Check back later for upcoming events!</p>
          </div>
        )}
      </main>

      <BottomNav />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Events;
