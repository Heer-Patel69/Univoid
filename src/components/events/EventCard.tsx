import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, IndianRupee, Clock } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import type { Event } from "@/services/eventsService";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
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

  return (
    <Link to={`/events/${event.id}`} className="block h-full">
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
              src={event.flyer_url}
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
          {/* Title */}
          <h3 className="font-display font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Event Type */}
          <Badge variant="outline" className="text-xs">
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
