import { useLiveStats } from '@/hooks/useLiveStats';
import { AnimatedCounter } from './AnimatedCounter';
import { Users, FileText, Loader2 } from 'lucide-react';

export function LiveStatsSection() {
  const { totalUsers, totalMaterials, isLoading } = useLiveStats();

  return (
    <section className="section-spacing-sm bg-gradient-to-b from-secondary/60 to-secondary/40">
      <div className="container-wide">
        <div className="text-center">
          <p className="text-lg md:text-xl font-medium text-muted-foreground mb-8">
            Itne students humpe bharosa karte hain
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {/* Total Users */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <AnimatedCounter value={totalUsers} />
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Registered Students</p>
            </div>

            {/* Total Materials */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110">
                <FileText className="w-7 h-7 text-success" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <AnimatedCounter value={totalMaterials} />
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium">Study Materials Shared</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
