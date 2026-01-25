import { memo } from "react";
import { Card } from "@/components/ui/card";

/**
 * Premium event card skeleton matching Locality-style layout
 */
export const EventCardSkeleton = memo(function EventCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/50 bg-card/80">
      {/* Large poster skeleton - 4:5 aspect ratio */}
      <div className="aspect-[4/5] w-full bg-muted skeleton-optimized relative">
        {/* Price badge skeleton */}
        <div className="absolute top-3 right-3 h-7 w-14 rounded-full bg-muted-foreground/20 skeleton-optimized" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-2.5">
        {/* Title */}
        <div className="h-5 w-full rounded bg-muted skeleton-optimized" />
        <div className="h-5 w-2/3 rounded bg-muted skeleton-optimized" />
        
        {/* Details */}
        <div className="space-y-1.5 pt-1">
          {/* Location */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted skeleton-optimized" />
            <div className="h-4 w-32 rounded bg-muted skeleton-optimized" />
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted skeleton-optimized" />
            <div className="h-4 w-24 rounded bg-muted skeleton-optimized" />
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-4 w-4 rounded bg-muted skeleton-optimized" />
            <div className="h-4 w-20 rounded bg-muted skeleton-optimized" />
          </div>
        </div>
      </div>
    </Card>
  );
});

export default EventCardSkeleton;
