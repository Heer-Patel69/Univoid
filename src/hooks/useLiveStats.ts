import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveStats {
  totalUsers: number;
  totalMaterials: number;
  isLoading: boolean;
}

export function useLiveStats(): LiveStats {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    isMounted.current = true;

    const fetchStats = async () => {
      try {
        // Use RPC function to count users (bypasses RLS for accurate count)
        const [usersResult, materialsResult] = await Promise.all([
          supabase.rpc('get_registered_users_count'),
          supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        ]);

        if (isMounted.current) {
          setTotalUsers(usersResult.data || 0);
          setTotalMaterials(materialsResult.count || 0);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchStats();

    // Real-time updates (debounced)
    let debounceTimer: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchStats, 2000);
    };

    channelRef.current = supabase
      .channel('live-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, debouncedFetch)
      .subscribe();

    // Safety timeout - never block
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      clearTimeout(debounceTimer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return { totalUsers, totalMaterials, isLoading };
}
