import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventFilters } from "@/components/events/EventFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchEvents, Event } from "@/services/eventsService";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Calendar } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { supabase } from "@/integrations/supabase/client";

const Events = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events with filters
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEvents({
          category: category !== "all" ? category : undefined,
          is_paid: priceFilter === "all" ? undefined : priceFilter === "paid",
          search: search || undefined,
        });
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [category, priceFilter, search]);

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('events-page-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'events' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new?.status === 'published') {
            setEvents(prev => {
              if (prev.some(e => e.id === payload.new.id)) return prev;
              const newEvent = payload.new as Event;
              return [...prev, newEvent].sort((a, b) => 
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Event;
            setEvents(prev => {
              // If status changed to published, add it
              if (updated.status === 'published' && !prev.some(e => e.id === updated.id)) {
                return [...prev, updated].sort((a, b) => 
                  new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                );
              }
              // If no longer published, remove
              if (updated.status !== 'published') {
                return prev.filter(e => e.id !== updated.id);
              }
              // Otherwise update
              return prev.map(e => e.id === updated.id ? { ...e, ...updated } : e);
            });
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    <div className="min-h-screen flex flex-col bg-background paper-texture">
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

            {user && (
              <Link to="/organizer/create-event">
                <Button className="rounded-full gap-2">
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </Link>
            )}
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
