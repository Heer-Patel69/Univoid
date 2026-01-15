import { supabase } from '@/integrations/supabase/client';
import { News } from '@/types/database';

// Explicit column selection for news
const NEWS_COLUMNS = 'id, title, content, image_urls, external_link, category, status, created_at, created_by, updated_at';

export async function getNews(status: 'approved' | 'all' = 'approved'): Promise<News[]> {
  let query = supabase
    .from('news')
    .select(NEWS_COLUMNS)
    .order('created_at', { ascending: false });

  if (status === 'approved') {
    query = query.eq('status', 'approved');
  }

  const { data, error } = await query;

  if (error) throw error;

  const news = data as News[];
  for (const item of news) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: item.created_by,
    });
    item.contributor_name = nameData || 'Anonymous';
  }

  return news;
}

export async function getNewsById(id: string): Promise<News | null> {
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_COLUMNS)
    .eq('id', id)
    .single();

  if (error) return null;

  const news = data as News;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: news.created_by,
  });
  news.contributor_name = nameData || 'Anonymous';

  return news;
}

export async function createNews(
  title: string,
  content: string,
  userId: string,
  externalLink?: string,
  images?: File[]
): Promise<{ id: string | null; error: Error | null }> {
  const imageUrls: string[] = [];

  // Upload up to 3 images
  if (images && images.length > 0) {
    const imagesToUpload = images.slice(0, 3);
    for (const image of imagesToUpload) {
      const fileExt = image.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(filePath, image);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('news-images')
          .getPublicUrl(filePath);
        imageUrls.push(publicUrl);
      }
    }
  }

  // Instant publish
  const { data, error } = await supabase
    .from('news')
    .insert({
      title,
      content,
      image_urls: imageUrls,
      external_link: externalLink || null,
      created_by: userId,
      status: 'approved',
    })
    .select('id')
    .single();

  if (error) {
    return { id: null, error: error as Error };
  }

  // Award XP for news publish (+10 XP)
  try {
    await supabase.rpc('award_xp', {
      _user_id: userId,
      _amount: 10,
      _reason: 'news_publish',
      _content_type: 'news',
      _content_id: data.id,
    });
  } catch (xpError) {
    console.error('Failed to award XP:', xpError);
  }

  return { id: data.id, error: null };
}

export async function getMyNews(userId: string): Promise<News[]> {
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_COLUMNS)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as News[];
}
