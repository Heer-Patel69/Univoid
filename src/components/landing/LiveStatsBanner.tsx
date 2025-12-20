import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HomepageStats {
  active_students: number;
  notes_shared: number;
  average_rating: number;
}

// Format large numbers with K+ or M+ suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M+`;
  }
  if (num >= 1000) {
    return `${Math.floor(num / 1000)}K+`;
  }
  return `${num}+`;
}

// Animated counter component
function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{formatNumber(displayValue)}</>;
}

export function LiveStatsBanner() {
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_homepage_stats');
        
        if (error) throw error;
        
        const statsData = data as unknown as HomepageStats;
        setStats(statsData);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch homepage stats:', err);
        setHasError(true);
        setIsLoading(false);
        // Fallback values
        setStats({
          active_students: 5000,
          notes_shared: 1200,
          average_rating: 4.9
        });
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      icon: Users,
      value: stats?.active_students ?? 0,
      label: 'Active Students',
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: FileText,
      value: stats?.notes_shared ?? 0,
      label: 'Notes Shared',
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Star,
      value: stats?.average_rating ?? 0,
      label: 'App Rating',
      isRating: true,
      color: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    }
  ];

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-4 md:gap-8"
        >
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mb-3 shadow-sm`}
              >
                <item.icon className={`w-6 h-6 md:w-7 md:h-7 ${item.iconColor}`} />
              </motion.div>

              {/* Value */}
              <div className="text-2xl md:text-4xl font-extrabold text-foreground mb-1">
                {isLoading ? (
                  <Skeleton className="h-8 md:h-10 w-16 md:w-24 rounded-lg" />
                ) : item.isRating ? (
                  <motion.span 
                    className="flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {stats?.average_rating?.toFixed(1)}
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 fill-yellow-500" />
                  </motion.span>
                ) : (
                  <AnimatedNumber value={item.value} />
                )}
              </div>

              {/* Label */}
              <p className="text-xs md:text-sm text-muted-foreground font-medium">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}