import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  totalUsers: number;
  totalMaterials: number;
}

// Lightweight count queries for home page (using RPC for accurate user count)
export async function getPlatformStats(): Promise<PlatformStats> {
  const [usersResult, materialsResult] = await Promise.all([
    supabase.rpc('get_registered_users_count'),
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);

  return {
    totalUsers: usersResult.data ?? 0,
    totalMaterials: materialsResult.count ?? 0,
  };
}
