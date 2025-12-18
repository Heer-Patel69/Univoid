import { supabase } from '@/integrations/supabase/client';
import { PublicProfile, calculateLevel } from '@/types/database';

export async function getGlobalLeaderboard(limit = 100): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, profile_photo_url, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const profiles: PublicProfile[] = [];
  let rank = 1;

  for (const profile of data || []) {
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, profile_photo_url, total_xp')
    .eq('college_name', collegeName)
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const profiles: PublicProfile[] = [];
  let rank = 1;

  for (const profile of data || []) {
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .order('total_xp', { ascending: false });

  if (error || !data) return 0;

  const index = data.findIndex(p => p.id === userId);
  return index >= 0 ? index + 1 : 0;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, profile_photo_url, total_xp')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const [materials, blogs, news, books, rank] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    getUserRank(userId),
  ]);

  return {
    id: data.id,
    full_name: data.full_name,
    profile_photo_url: data.profile_photo_url,
    total_xp: data.total_xp,
    level: calculateLevel(data.total_xp),
    rank,
    materials_count: materials.count || 0,
    blogs_count: blogs.count || 0,
    news_count: news.count || 0,
    books_count: books.count || 0,
  };
}
