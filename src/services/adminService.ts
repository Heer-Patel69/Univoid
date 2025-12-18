import { supabase } from '@/integrations/supabase/client';
import { ContentStatus, XP_VALUES } from '@/types/database';

type ContentType = 'materials' | 'blogs' | 'news' | 'books';

export async function getPendingContent(type: ContentType) {
  const { data, error } = await supabase
    .from(type)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch contributor names
  const items = data || [];
  for (const item of items) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: item.created_by,
    });
    (item as any).contributor_name = nameData || 'Anonymous';
  }

  return items;
}

export async function updateContentStatus(
  type: ContentType,
  contentId: string,
  status: ContentStatus,
  createdBy: string
): Promise<{ error: Error | null }> {
  // Update the content status
  const { error } = await supabase
    .from(type)
    .update({ status })
    .eq('id', contentId);

  if (error) {
    return { error: error as Error };
  }

  // If approved, award XP
  if (status === 'approved') {
    const xpAmount = getXPAmount(type);
    if (xpAmount > 0) {
      await supabase.rpc('award_xp', {
        _user_id: createdBy,
        _amount: xpAmount,
        _reason: `${type.slice(0, -1)} approved`,
        _content_type: type,
        _content_id: contentId,
      });
    }
  }

  return { error: null };
}

export async function awardBookSoldXP(userId: string, bookId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc('award_xp', {
    _user_id: userId,
    _amount: XP_VALUES.book_sold,
    _reason: 'Book sold',
    _content_type: 'books',
    _content_id: bookId,
  });

  return { error: error as Error | null };
}

function getXPAmount(type: ContentType): number {
  switch (type) {
    case 'materials':
      return XP_VALUES.material_approved;
    case 'blogs':
      return XP_VALUES.blog_approved;
    case 'news':
      return XP_VALUES.news_approved;
    case 'books':
      return XP_VALUES.book_listed;
    default:
      return 0;
  }
}

export async function getAllPendingCounts(): Promise<{
  materials: number;
  blogs: number;
  news: number;
  books: number;
}> {
  const [materials, blogs, news, books] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return {
    materials: materials.count || 0,
    blogs: blogs.count || 0,
    news: news.count || 0,
    books: books.count || 0,
  };
}
