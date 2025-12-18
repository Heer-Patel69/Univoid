import { supabase } from '@/integrations/supabase/client';
import { ContentStatus, XP_VALUES } from '@/types/database';

type ContentType = 'materials' | 'blogs' | 'news' | 'books';

// ============ PENDING CONTENT (for approval workflow) ============

export async function getPendingContent(type: ContentType) {
  const { data, error } = await supabase
    .from(type)
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

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
  const { error } = await supabase
    .from(type)
    .update({ status })
    .eq('id', contentId);

  if (error) {
    return { error: error as Error };
  }

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

// ============ ADMIN GOD MODE - ALL CONTENT ACCESS ============

export async function getAllContent(type: ContentType) {
  const { data, error } = await supabase
    .from(type)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const items = data || [];
  for (const item of items) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: item.created_by,
    });
    (item as any).contributor_name = nameData || 'Anonymous';
  }

  return items;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getContentCounts(): Promise<{
  materials: number;
  blogs: number;
  news: number;
  books: number;
  users: number;
}> {
  const [materials, blogs, news, books, users] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }),
    supabase.from('blogs').select('id', { count: 'exact', head: true }),
    supabase.from('news').select('id', { count: 'exact', head: true }),
    supabase.from('books').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  return {
    materials: materials.count || 0,
    blogs: blogs.count || 0,
    news: news.count || 0,
    books: books.count || 0,
    users: users.count || 0,
  };
}

// ============ ADMIN DELETE FUNCTIONS ============

export async function adminDeleteMaterial(materialId: string): Promise<{ error: Error | null }> {
  // First get the material to find the file URL
  const { data: material } = await supabase
    .from('materials')
    .select('file_url')
    .eq('id', materialId)
    .single();

  if (material?.file_url) {
    // Extract file path from URL and delete from storage
    const urlParts = material.file_url.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get last 2 parts as path
    await supabase.storage.from('materials').remove([filePath]);
  }

  const { error } = await supabase.from('materials').delete().eq('id', materialId);
  return { error: error as Error | null };
}

export async function adminDeleteBlog(blogId: string): Promise<{ error: Error | null }> {
  // Get cover image URL
  const { data: blog } = await supabase
    .from('blogs')
    .select('cover_image_url')
    .eq('id', blogId)
    .single();

  if (blog?.cover_image_url) {
    const urlParts = blog.cover_image_url.split('/');
    const filePath = urlParts.slice(-2).join('/');
    await supabase.storage.from('blog-images').remove([filePath]);
  }

  const { error } = await supabase.from('blogs').delete().eq('id', blogId);
  return { error: error as Error | null };
}

export async function adminDeleteNews(newsId: string): Promise<{ error: Error | null }> {
  // Get image URLs
  const { data: news } = await supabase
    .from('news')
    .select('image_urls')
    .eq('id', newsId)
    .single();

  if (news?.image_urls && news.image_urls.length > 0) {
    const filePaths = news.image_urls.map((url: string) => {
      const urlParts = url.split('/');
      return urlParts.slice(-2).join('/');
    });
    await supabase.storage.from('news-images').remove(filePaths);
  }

  const { error } = await supabase.from('news').delete().eq('id', newsId);
  return { error: error as Error | null };
}

export async function adminDeleteBook(bookId: string): Promise<{ error: Error | null }> {
  // Get image URLs
  const { data: book } = await supabase
    .from('books')
    .select('image_urls')
    .eq('id', bookId)
    .single();

  if (book?.image_urls && book.image_urls.length > 0) {
    const filePaths = book.image_urls.map((url: string) => {
      const urlParts = url.split('/');
      return urlParts.slice(-2).join('/');
    });
    await supabase.storage.from('book-images').remove(filePaths);
  }

  const { error } = await supabase.from('books').delete().eq('id', bookId);
  return { error: error as Error | null };
}

export async function adminDeleteUser(userId: string): Promise<{ error: Error | null }> {
  // Delete profile photo if exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_photo_url')
    .eq('id', userId)
    .single();

  if (profile?.profile_photo_url) {
    const urlParts = profile.profile_photo_url.split('/');
    const filePath = urlParts.slice(-2).join('/');
    await supabase.storage.from('profile-photos').remove([filePath]);
  }

  // Delete user's content
  await Promise.all([
    supabase.from('materials').delete().eq('created_by', userId),
    supabase.from('blogs').delete().eq('created_by', userId),
    supabase.from('news').delete().eq('created_by', userId),
    supabase.from('books').delete().eq('created_by', userId),
    supabase.from('reports').delete().eq('reporter_id', userId),
    supabase.from('xp_transactions').delete().eq('user_id', userId),
    supabase.from('user_roles').delete().eq('user_id', userId),
  ]);

  // Delete profile
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  return { error: error as Error | null };
}

// ============ USER ACCOUNT MANAGEMENT ============

export async function toggleUserDisabled(userId: string, disabled: boolean): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_disabled: disabled })
    .eq('id', userId);

  return { error: error as Error | null };
}

export async function sendPasswordResetEmail(email: string): Promise<{ error: Error | null }> {
  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  return { error: error as Error | null };
}

// ============ CONTENT CONTRIBUTION COUNTS ============

export async function getUserContributions(userId: string): Promise<number> {
  const [materials, blogs, news, books] = await Promise.all([
    supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('blogs').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
    supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('status', 'approved'),
  ]);

  return (materials.count || 0) + (blogs.count || 0) + (news.count || 0) + (books.count || 0);
}
