import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  totalUsers: number;
  totalMaterials: number;
}

// Lightweight count queries for home page
export async function getPlatformStats(): Promise<PlatformStats> {
  const [usersResult, materialsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);

  return {
    totalUsers: usersResult.count ?? 0,
    totalMaterials: materialsResult.count ?? 0,
  };
}
