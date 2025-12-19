import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MaterialCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Top Section */}
        <div className="p-6 pb-0 flex-1 flex flex-col">
          <div className="flex gap-4">
            {/* Thumbnail skeleton */}
            <Skeleton className="w-20 h-24 flex-shrink-0 rounded-lg" />
            
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Title skeleton */}
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              
              {/* Tags skeleton */}
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[40px] content-start">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              
              {/* Uploader info skeleton */}
              <div className="flex items-center gap-3 mt-auto">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          
          {/* Description toggle skeleton */}
          <div className="mt-3">
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="px-6 pb-6 pt-4 mt-auto border-t-2 border-foreground/10">
          {/* Stats skeleton */}
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialCardSkeleton;
