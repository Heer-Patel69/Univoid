import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  materialsCount: number;
  blogsCount: number;
  newsCount: number;
  booksCount: number;
  globalRank: number | null;
}

export function useDashboardStats(userId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    materialsCount: 0,
    blogsCount: 0,
    newsCount: 0,
    booksCount: 0,
    globalRank: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all counts in parallel
        const [materialsRes, blogsRes, newsRes, booksRes, rankRes] = await Promise.all([
          supabase
            .from('materials')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', userId),
          supabase
            .from('blogs')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', userId),
          supabase
            .from('news')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', userId),
          supabase
            .from('books')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', userId),
          // Get user's rank by counting profiles with higher XP
          supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single()
            .then(async ({ data: userProfile }) => {
              if (!userProfile) return { count: null };
              const { count } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .gt('total_xp', userProfile.total_xp);
              return { count: (count ?? 0) + 1 };
            }),
        ]);

        setStats({
          materialsCount: materialsRes.count ?? 0,
          blogsCount: blogsRes.count ?? 0,
          newsCount: newsRes.count ?? 0,
          booksCount: booksRes.count ?? 0,
          globalRank: rankRes.count ?? null,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Subscribe to real-time updates for user's content
    const materialsChannel = supabase
      .channel('dashboard-materials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `created_by=eq.${userId}` }, fetchStats)
      .subscribe();

    const blogsChannel = supabase
      .channel('dashboard-blogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blogs', filter: `created_by=eq.${userId}` }, fetchStats)
      .subscribe();

    const newsChannel = supabase
      .channel('dashboard-news')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news', filter: `created_by=eq.${userId}` }, fetchStats)
      .subscribe();

    const booksChannel = supabase
      .channel('dashboard-books')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books', filter: `created_by=eq.${userId}` }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(materialsChannel);
      supabase.removeChannel(blogsChannel);
      supabase.removeChannel(newsChannel);
      supabase.removeChannel(booksChannel);
    };
  }, [userId]);

  return { stats, isLoading };
}
