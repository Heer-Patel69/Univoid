import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/database';

export async function getBooks(status: 'approved' | 'all' = 'approved'): Promise<Book[]> {
  let query = supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (status === 'approved') {
    query = query.eq('status', 'approved');
  }

  const { data, error } = await query;

  if (error) throw error;

  const books = data as Book[];
  for (const book of books) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: book.created_by,
    });
    book.contributor_name = nameData || 'Anonymous';
  }

  return books;
}

export async function getBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  const book = data as Book;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: book.created_by,
  });
  book.contributor_name = nameData || 'Anonymous';

  return book;
}

// Get seller contact info (only for authenticated users)
export async function getSellerContact(bookId: string): Promise<{
  mobile: string;
  email: string;
  address: string;
} | null> {
  const { data, error } = await supabase
    .from('books')
    .select('seller_mobile, seller_email, seller_address')
    .eq('id', bookId)
    .single();

  if (error || !data) return null;

  return {
    mobile: data.seller_mobile,
    email: data.seller_email,
    address: data.seller_address,
  };
}

export async function createBook(
  title: string,
  description: string,
  price: number | null,
  condition: string,
  images: File[],
  sellerMobile: string,
  sellerAddress: string,
  sellerEmail: string,
  userId: string
): Promise<{ id: string | null; error: Error | null }> {
  const imageUrls: string[] = [];

  // Upload up to 3 images
  const imagesToUpload = images.slice(0, 3);
  for (const image of imagesToUpload) {
    const fileExt = image.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('book-images')
      .upload(filePath, image);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('book-images')
        .getPublicUrl(filePath);
      imageUrls.push(publicUrl);
    }
  }

  const { data, error } = await supabase
    .from('books')
    .insert({
      title,
      description,
      price,
      condition,
      image_urls: imageUrls,
      seller_mobile: sellerMobile,
      seller_address: sellerAddress,
      seller_email: sellerEmail,
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

export async function markBookAsSold(bookId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('books')
    .update({ is_sold: true })
    .eq('id', bookId);

  return { error: error as Error | null };
}

export async function getMyBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Book[];
}
