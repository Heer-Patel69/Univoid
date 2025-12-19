import { supabase } from '@/integrations/supabase/client';
import { PublicProfile, calculateLevel } from '@/types/database';

// Interface for leaderboard view data (non-sensitive fields only)
interface LeaderboardProfileRow {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  college_name: string | null;
  total_xp: number;
}

export async function getGlobalLeaderboard(limit = 100): Promise<PublicProfile[]> {
  // Use the leaderboard_profiles view which only exposes non-sensitive fields
  const { data, error } = await supabase
    .from('leaderboard_profiles' as any)
    .select('id, full_name, profile_photo_url, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const profiles: PublicProfile[] = [];
  let rank = 1;
  const rows = (data || []) as unknown as LeaderboardProfileRow[];

  for (const profile of rows) {
    // Get contribution counts
    const [materials, blogs, news, books] = await Promise.all([
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
      supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
      supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
      supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
    ]);

    profiles.push({
      id: profile.id,
      full_name: profile.full_name,
      profile_photo_url: profile.profile_photo_url,
      total_xp: profile.total_xp,
      level: calculateLevel(profile.total_xp),
      rank,
      materials_count: materials.count || 0,
      blogs_count: blogs.count || 0,
      news_count: news.count || 0,
      books_count: books.count || 0,
    });

    rank++;
  }

  return profiles;
}

export async function getCollegeLeaderboard(collegeName: string, limit = 100): Promise<PublicProfile[]> {
  // Use the leaderboard_profiles view which only exposes non-sensitive fields
  const { data, error } = await supabase
    .from('leaderboard_profiles' as any)
    .select('id, full_name, profile_photo_url, college_name, total_xp')
    .eq('college_name', collegeName)
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const profiles: PublicProfile[] = [];
  let rank = 1;
  const rows = (data || []) as unknown as LeaderboardProfileRow[];

  for (const profile of rows) {
    const [materials, blogs, news, books] = await Promise.all([
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
      supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
      supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
      supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'approved'),
    ]);

    profiles.push({
      id: profile.id,
      full_name: profile.full_name,
      profile_photo_url: profile.profile_photo_url,
      total_xp: profile.total_xp,
      level: calculateLevel(profile.total_xp),
      rank,
      materials_count: materials.count || 0,
      blogs_count: blogs.count || 0,
      news_count: news.count || 0,
      books_count: books.count || 0,
    });

    rank++;
  }

  return profiles;
}

export async function getUserRank(userId: string): Promise<number> {
  // Use the leaderboard_profiles view for ranking
  const { data, error } = await supabase
    .from('leaderboard_profiles' as any)
    .select('id')
    .order('total_xp', { ascending: false });

  if (error || !data) return 0;

  const rows = data as unknown as { id: string }[];
  const index = rows.findIndex(p => p.id === userId);
  return index >= 0 ? index + 1 : 0;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  // Use the leaderboard_profiles view which only exposes non-sensitive fields
  const { data, error } = await supabase
    .from('leaderboard_profiles' as any)
    .select('id, full_name, profile_photo_url, total_xp')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const profile = data as unknown as LeaderboardProfileRow;

  const [materials, blogs, news, books, rank] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    getUserRank(userId),
  ]);

  return {
    id: profile.id,
    full_name: profile.full_name,
    profile_photo_url: profile.profile_photo_url,
    total_xp: profile.total_xp,
    level: calculateLevel(profile.total_xp),
    rank,
    materials_count: materials.count || 0,
    blogs_count: blogs.count || 0,
    news_count: news.count || 0,
    books_count: books.count || 0,
  };
}