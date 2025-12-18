import { supabase } from '@/integrations/supabase/client';
import { Material, BLOCKED_VIDEO_FORMATS } from '@/types/database';

export async function getMaterials(status: 'approved' | 'all' = 'approved'): Promise<Material[]> {
  let query = supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (status === 'approved') {
    query = query.eq('status', 'approved');
  }

  const { data, error } = await query;

  if (error) throw error;

  // Fetch contributor names
  const materials = data as Material[];
  for (const material of materials) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: material.created_by,
    });
    material.contributor_name = nameData || 'Anonymous';
  }

  return materials;
}

export async function getMaterialById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  const material = data as Material;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: material.created_by,
  });
  material.contributor_name = nameData || 'Anonymous';

  return material;
}

export async function uploadMaterial(
  file: File,
  title: string,
  description: string,
  userId: string
): Promise<{ id: string | null; error: Error | null }> {
  // Check for blocked video formats
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (BLOCKED_VIDEO_FORMATS.includes(fileExt)) {
    return { id: null, error: new Error('Video files are not allowed') };
  }

  // Upload file to storage
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, file);

  if (uploadError) {
    return { id: null, error: uploadError as Error };
  }

  // Get file URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from('materials')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  const fileUrl = urlData?.signedUrl || '';

  // Create material record
  const { data, error } = await supabase
    .from('materials')
    .insert({
      title,
      description,
      file_url: fileUrl,
      file_type: fileExt,
      file_size: file.size,
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

export async function getMyMaterials(userId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Material[];
}

export async function getDownloadUrl(materialId: string): Promise<string | null> {
  const material = await getMaterialById(materialId);
  if (!material) return null;
  
  // The file_url already contains a signed URL
  return material.file_url;
}
