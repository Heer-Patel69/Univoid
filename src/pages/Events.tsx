import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search,
  Plus,
  Ticket,
  Filter,
  ChevronRight
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionLoader } from '@/components/common/SectionLoader';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedFetch } from '@/hooks/useOptimizedFetch';
import { getEvents, isUserOrganizer } from '@/services/eventsService';
import type { Event, EventCategory } from '@/types/events';
import { EVENT_CATEGORIES } from '@/types/events';

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | ''>('');
  const [selectedCity, setSelectedCity] = useState('');

  const fetchEvents = useCallback(async () => {
    const result = await getEvents(1, 12, {
      category: selectedCategory || undefined,
      city: selectedCity || undefined,
      search: searchQuery || undefined,
    });
    setEvents(result.data);
    setHasMore(result.hasMore);
    setPage(1);
    return result.data;
  }, [selectedCategory, selectedCity, searchQuery]);

  const { isLoading, refetch } = useOptimizedFetch({
    fetchFn: fetchEvents,
    defaultValue: [] as Event[],
    cacheKey: `events-${selectedCategory}-${selectedCity}-${searchQuery}`,
  });

  // Check if user is organizer
  useEffect(() => {
    if (user) {
      isUserOrganizer(user.id).then(setIsOrganizer);
    }
  }, [user]);

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [selectedCategory, selectedCity, searchQuery, refetch]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await getEvents(page + 1, 12, {
        category: selectedCategory || undefined,
        city: selectedCity || undefined,
        search: searchQuery || undefined,
      });
      setEvents((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreateEvent = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (isOrganizer) {
      navigate('/events/create');
    } else {
      navigate('/become-organizer');
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    const colors: Record<EventCategory, string> = {
      technology: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      cultural: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      sports: 'bg-green-500/10 text-green-500 border-green-500/20',
      placement: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      workshop: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      seminar: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      meetup: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      entrepreneurship: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      social: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[category];
  };

  const formatEventDate = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return format(startDate, 'MMM d, yyyy');
    }
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAuthClick={() => setAuthOpen(true)} />
      
      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Discover Events
              </h1>
              <p className="text-muted-foreground">
                Find hackathons, workshops, seminars, and more happening near you
              </p>
            </div>
            <Button 
              onClick={handleCreateEvent}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isOrganizer ? 'Create Event' : 'Become Organizer'}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select 
              value={selectedCategory} 
              onValueChange={(v) => setSelectedCategory(v as EventCategory | '')}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="City or District"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full md:w-48"
            />
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <SectionLoader />
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Events Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory || selectedCity
                ? 'Try adjusting your filters'
                : 'Be the first to create an event!'}
            </p>
            <Button onClick={handleCreateEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card 
                  key={event.id} 
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={event.banner_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <Badge 
                      variant="outline"
                      className={`absolute top-3 left-3 ${getCategoryColor(event.category)}`}
                    >
                      {EVENT_CATEGORIES.find((c) => c.value === event.category)?.label}
                    </Badge>
                    {event.is_paid && (
                      <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                        ₹{event.ticket_price}
                      </Badge>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {event.organizer_name}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatEventDate(event.start_datetime, event.end_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(event.start_datetime), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {event.location_finalized ? event.venue_name : event.city}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.registrations_count} registered</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Events'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* My Tickets CTA */}
        {user && (
          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">My Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    View your registered events and tickets
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/my-tickets')}>
                View Tickets
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
      <BottomNav />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
