import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MaterialCardSkeletonProps {
  className?: string;
}

/**
 * Optimized skeleton with GPU-accelerated pulse animation
 * Uses opacity only (not transform) for skeleton pulse
 */
const MaterialCardSkeleton = memo(function MaterialCardSkeleton({ className }: MaterialCardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden h-full flex flex-col border-border-strong/10", className)}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Top Section */}
        <div className="p-6 pb-0 flex-1 flex flex-col">
          <div className="flex gap-4">
            {/* Thumbnail skeleton */}
            <div className="w-20 h-24 flex-shrink-0 rounded-2xl bg-muted skeleton-optimized" />
            
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Title skeleton */}
              <div className="h-4 w-full mb-1 rounded-full bg-muted skeleton-optimized" />
              <div className="h-4 w-3/4 mb-3 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '75ms' }} />
              
              {/* Tags skeleton */}
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[40px] content-start">
                <div className="h-5 w-16 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '100ms' }} />
                <div className="h-5 w-20 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '125ms' }} />
                <div className="h-5 w-14 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '150ms' }} />
              </div>
              
              {/* Uploader info skeleton */}
              <div className="flex items-center gap-3 mt-auto">
                <div className="h-3 w-20 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '175ms' }} />
                <div className="h-3 w-24 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '200ms' }} />
              </div>
            </div>
          </div>
          
          {/* Description toggle skeleton */}
          <div className="mt-3">
            <div className="h-3 w-28 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '225ms' }} />
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="px-6 pb-6 pt-4 mt-auto border-t border-border">
          {/* Stats skeleton */}
          <div className="flex items-center gap-4 mb-3">
            <div className="h-4 w-12 rounded-full bg-muted skeleton-optimized" />
            <div className="h-4 w-12 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '50ms' }} />
            <div className="h-4 w-12 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '100ms' }} />
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-muted skeleton-optimized" />
            <div className="h-9 w-9 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '50ms' }} />
            <div className="flex-1" />
            <div className="h-9 w-9 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '100ms' }} />
            <div className="h-9 w-20 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '150ms' }} />
            <div className="h-9 w-24 rounded-full bg-muted skeleton-optimized" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default MaterialCardSkeleton;
