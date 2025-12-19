import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventFilters } from "@/components/events/EventFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchEvents } from "@/services/eventsService";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Calendar, Sparkles } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";

const Events = () => {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", category, priceFilter, search],
    queryFn: () =>
      fetchEvents({
        category: category !== "all" ? category : undefined,
        is_paid: priceFilter === "all" ? undefined : priceFilter === "paid",
        search: search || undefined,
      }),
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPriceFilter("all");
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
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
          </div>

          <EventFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            priceFilter={priceFilter}
            onPriceFilterChange={setPriceFilter}
            onClear={clearFilters}
          />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {Array.from({ length: 8 }).map((_, i) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
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

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Events;
