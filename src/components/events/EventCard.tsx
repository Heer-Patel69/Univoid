import { Card } from "@/components/ui/card";
import { Calendar, MapPin, IndianRupee } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import type { Event } from "@/services/eventsService";
import { toDisplayUrl } from "@/lib/storageProxy";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const isEventPast = isPast(new Date(event.start_date));
  const daysUntil = differenceInDays(new Date(event.start_date), new Date());

  // Use slug for SEO-friendly URLs, fallback to ID
  const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

  // Format location string
  const locationText = event.city && event.state 
    ? `${event.city}, ${event.state}`
    : event.is_location_decided 
      ? event.venue_name || "Venue TBA" 
      : "Location TBA";

  return (
    <Link to={eventUrl} className="block h-full group">
      <Card className={cn(
        "h-full overflow-hidden transition-all duration-300 cursor-pointer flex flex-col",
        "bg-card/80 backdrop-blur-sm border-border/50",
        "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1",
        "dark:bg-card/60 dark:hover:bg-card/80"
      )}>
        {/* Large Poster Image - Full Width, Clean Focus */}
        <div className="relative w-full overflow-hidden">
          {/* Aspect Ratio Container - 4:5 for posters like Locality */}
          <div 
            className="relative w-full"
            style={{ 
              aspectRatio: (event as any).poster_ratio === '1:1' ? '1/1' : 
                           (event as any).poster_ratio === '16:9' ? '16/9' : '4/5'
            }}
          >
            {event.flyer_url ? (
              <img
                src={toDisplayUrl(event.flyer_url, { forceImage: true }) || undefined}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-muted">
                <Calendar className="w-20 h-20 text-primary/30" />
              </div>
            )}

            {/* Subtle gradient overlay at bottom for text readability if needed */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

            {/* Status Badge - Top Left, Minimal */}
            {isEventPast ? (
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive/90 text-destructive-foreground backdrop-blur-sm">
                  Ended
                </span>
              </div>
            ) : daysUntil <= 3 && daysUntil >= 0 && (
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/90 text-white backdrop-blur-sm animate-pulse">
                  {daysUntil === 0 ? "Today!" : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}
                </span>
              </div>
            )}

            {/* Price Badge - Top Right, Premium Look */}
            <div className="absolute top-3 right-3">
              <span className={cn(
                "px-3 py-1.5 text-sm font-bold rounded-full backdrop-blur-md shadow-lg",
                event.is_paid 
                  ? "bg-white/95 text-foreground dark:bg-black/80 dark:text-white" 
                  : "bg-emerald-500/90 text-white"
              )}>
                {event.is_paid ? (
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {event.price}
                  </span>
                ) : (
                  "Free"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Event Details - Clean, Minimal, Hierarchy-focused */}
        <div className="p-4 space-y-2.5 flex-1 flex flex-col">
          {/* Title - Bold, Prominent */}
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Compact Details Row */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
              <span className="truncate">{locationText}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
              <span>{format(new Date(event.start_date), "dd MMM yyyy")}</span>
            </div>

            {/* Price Line - Like Locality "From ₹XXX" */}
            <div className="flex items-center gap-2 pt-1">
              <IndianRupee className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
              <span className="font-semibold text-foreground">
                {event.is_paid ? `From ₹${event.price}` : "Free Entry"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;
