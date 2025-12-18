import { supabase } from '@/integrations/supabase/client';
import { Material, Blog, News, Book } from '@/types/database';

const DEFAULT_PAGE_SIZE = 20;

interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

// Generic batch contributor name fetch - much faster than individual RPC calls
async function fetchContributorNames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)];
  const nameMap = new Map<string, string>();
  
  if (uniqueIds.length === 0) return nameMap;

  // Fetch all names in parallel batches
  const batchSize = 10;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    const promises = batch.map(async (id) => {
      try {
        const { data } = await supabase.rpc('get_contributor_name', { user_id: id });
        return { id, name: data || 'Anonymous' };
      } catch {
        return { id, name: 'Anonymous' };
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ id, name }) => nameMap.set(id, name));
  }

  return nameMap;
}

// Material filters interface
export interface MaterialFilters {
  search?: string;
  course?: string;
  branch?: string;
  subject?: string;
  language?: string;
  college?: string;
}

// Materials with filters
export async function getMaterialsPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: MaterialFilters
): Promise<PaginatedResult<Material>> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('materials')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.course) {
    query = query.eq('course', filters.course);
  }
  if (filters?.branch) {
    query = query.eq('branch', filters.branch);
  }
  if (filters?.language) {
    query = query.eq('language', filters.language);
  }
  if (filters?.subject) {
    query = query.ilike('subject', `%${filters.subject}%`);
  }
  if (filters?.college) {
    query = query.ilike('college', `%${filters.college}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const materials = data as Material[];
  
  // Batch fetch contributor names
  const userIds = materials.map(m => m.created_by);
  const nameMap = await fetchContributorNames(userIds);
  materials.forEach(m => {
    m.contributor_name = nameMap.get(m.created_by) || 'Anonymous';
  });

  return {
    data: materials,
    hasMore: (count ?? 0) > from + materials.length,
    total: count ?? 0,
  };
}

// Blogs
export async function getBlogsPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Blog>> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('blogs')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const blogs = data as Blog[];
  
  const userIds = blogs.map(b => b.created_by);
  const nameMap = await fetchContributorNames(userIds);
  blogs.forEach(b => {
    b.contributor_name = nameMap.get(b.created_by) || 'Anonymous';
  });

  return {
    data: blogs,
    hasMore: (count ?? 0) > from + blogs.length,
    total: count ?? 0,
  };
}

// News
export async function getNewsPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<News>> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('news')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const news = data as News[];
  
  const userIds = news.map(n => n.created_by);
  const nameMap = await fetchContributorNames(userIds);
  news.forEach(n => {
    n.contributor_name = nameMap.get(n.created_by) || 'Anonymous';
  });

  return {
    data: news,
    hasMore: (count ?? 0) > from + news.length,
    total: count ?? 0,
  };
}

// Books
const BOOK_EXPIRY_DAYS = 15;

function isBookExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > BOOK_EXPIRY_DAYS;
}

export async function getBooksPaginated(
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Book>> {
  const from = page * pageSize;
  // Fetch extra to account for filtering
  const to = from + pageSize + 10;

  const { data, error, count } = await supabase
    .from('books')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .eq('is_sold', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  // Filter expired books and limit
  const books = (data as Book[])
    .filter(book => !isBookExpired(book.created_at))
    .slice(0, pageSize);
  
  const userIds = books.map(b => b.created_by);
  const nameMap = await fetchContributorNames(userIds);
  books.forEach(b => {
    b.contributor_name = nameMap.get(b.created_by) || 'Anonymous';
  });

  return {
    data: books,
    hasMore: (count ?? 0) > from + pageSize,
    total: count ?? 0,
  };
}

// Leaderboard - optimized to only fetch top users
export async function getLeaderboardPaginated(
  limit = 20
): Promise<{ data: Array<{ id: string; full_name: string; total_xp: number; profile_photo_url: string | null; rank: number; level: number; materials_count: number; blogs_count: number }>; }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, total_xp, profile_photo_url')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Calculate stats in parallel for each user
  const enrichedData = await Promise.all(
    (data || []).map(async (profile, index) => {
      // Fetch material and blog counts in parallel
      const [materialsRes, blogsRes] = await Promise.all([
        supabase
          .from('materials')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', profile.id)
          .eq('status', 'approved'),
        supabase
          .from('blogs')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', profile.id)
          .eq('status', 'approved'),
      ]);

      return {
        ...profile,
        rank: index + 1,
        level: Math.floor(profile.total_xp / 250) + 1,
        materials_count: materialsRes.count ?? 0,
        blogs_count: blogsRes.count ?? 0,
      };
    })
  );

  return { data: enrichedData };
}
