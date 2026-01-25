import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, IndianRupee, BadgeCheck } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/services/eventsService";
import { getOrganizerProfileByUserId } from "@/services/organizerService";
import { toDisplayUrl } from "@/lib/storageProxy";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  // Fetch organizer profile for the event
  const { data: organizer } = useQuery({
    queryKey: ['organizer-profile', event.organizer_id],
    queryFn: () => getOrganizerProfileByUserId(event.organizer_id),
    enabled: !!event.organizer_id,
    staleTime: 1000 * 60 * 10, // Cache for 10 mins
  });
  const isEventPast = isPast(new Date(event.start_date));
  const daysUntil = differenceInDays(new Date(event.start_date), new Date());
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tech: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      cultural: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      academic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    };
    return colors[category.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  // Use slug for SEO-friendly URLs, fallback to ID
  const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

  return (
    <Link to={eventUrl} className="block h-full">
      <Card className="group h-full overflow-hidden hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col">
        {/* Flyer Image - Respects poster_ratio from DB */}
        <div 
          className="relative overflow-hidden bg-muted"
          style={{ 
            aspectRatio: (event as any).poster_ratio === '1:1' ? '1/1' : 
                         (event as any).poster_ratio === '16:9' ? '16/9' : '4/5'
          }}
        >
          {event.flyer_url ? (
            <img
              src={toDisplayUrl(event.flyer_url, { forceImage: true }) || undefined}
              alt={event.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
              <Calendar className="w-16 h-16 text-primary/50" />
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={event.is_paid ? "default" : "secondary"}
              className="text-sm font-semibold shadow-soft"
            >
              {event.is_paid ? (
                <span className="flex items-center gap-0.5">
                  <IndianRupee className="w-3 h-3" />
                  {event.price}
                </span>
              ) : (
                "Free"
              )}
            </Badge>
          </div>

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isEventPast && (
              <Badge variant="destructive" className="shadow-soft">
                Ended
              </Badge>
            )}
            {!isEventPast && daysUntil <= 3 && daysUntil >= 0 && (
              <Badge className="bg-orange-500 text-white shadow-soft animate-pulse">
                {daysUntil === 0 ? "Today!" : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}
              </Badge>
            )}
          </div>

          {/* Category */}
          <div className="absolute bottom-3 left-3">
            <Badge className={getCategoryColor(event.category)}>
              {event.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Organizer Info */}
          {organizer && (
            <Link 
              to={`/o/${organizer.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group/org"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={organizer.logo_url || undefined} alt={organizer.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {organizer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground group-hover/org:text-primary transition-colors truncate">
                {organizer.name}
              </span>
              {organizer.is_verified && (
                <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
            </Link>
          )}

          {/* Title */}
          <h3 className="font-display font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Event Type */}
          <Badge variant="outline" className="text-xs w-fit">
            {event.event_type}
          </Badge>

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{format(new Date(event.start_date), "EEE, MMM d • h:mm a")}</span>
          </div>

          {/* Location - City, State */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {event.city && event.state 
                ? `${event.city}, ${event.state}`
                : event.is_location_decided 
                  ? event.venue_name || "Venue TBA" 
                  : "Location TBA"}
            </span>
          </div>

          {/* Registration count */}
          {event.max_capacity && (
            <div className="flex items-center gap-2 text-sm mt-auto pt-2">
              <Users className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {event.registrations_count} registered
                  </span>
                  <span className="text-muted-foreground">
                    {event.max_capacity} spots
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((event.registrations_count / event.max_capacity) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default EventCard;
