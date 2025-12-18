import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/types/database';

export async function getBlogs(status: 'approved' | 'all' = 'approved'): Promise<Blog[]> {
  let query = supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (status === 'approved') {
    query = query.eq('status', 'approved');
  }

  const { data, error } = await query;

  if (error) throw error;

  const blogs = data as Blog[];
  for (const blog of blogs) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: blog.created_by,
    });
    blog.contributor_name = nameData || 'Anonymous';
  }

  return blogs;
}

export async function getBlogById(id: string): Promise<Blog | null> {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  const blog = data as Blog;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: blog.created_by,
  });
  blog.contributor_name = nameData || 'Anonymous';

  return blog;
}

export async function createBlog(
  title: string,
  content: string,
  userId: string,
  coverImage?: File | null
): Promise<{ id: string | null; error: Error | null }> {
  let coverImageUrl: string | null = null;

  if (coverImage) {
    const fileExt = coverImage.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, coverImage);

    if (uploadError) {
      return { id: null, error: uploadError as Error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    coverImageUrl = publicUrl;
  }

  const { data, error } = await supabase
    .from('blogs')
    .insert({
      title,
      content,
      cover_image_url: coverImageUrl,
      created_by: userId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    return { id: null, error: error as Error };
  }

  return { id: data.id, error: null };
}

export async function getMyBlogs(userId: string): Promise<Blog[]> {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Blog[];
}
