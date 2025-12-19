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

interface UploadOptions {
  onProgress?: (progress: number) => void;
  course?: string;
  branch?: string;
  subject?: string;
  language?: string;
  college?: string;
}

export async function uploadMaterial(
  file: File,
  title: string,
  description: string,
  userId: string,
  options?: UploadOptions
): Promise<{ id: string | null; error: Error | null }> {
  // Check for blocked video formats
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (BLOCKED_VIDEO_FORMATS.includes(fileExt)) {
    return { id: null, error: new Error('Video files are not allowed') };
  }

  // Check file size (10MB limit for cloud optimization)
  if (file.size > 10 * 1024 * 1024) {
    return { id: null, error: new Error('File size must be less than 10MB') };
  }

  options?.onProgress?.(10);

  // Upload file to storage
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, file);

  options?.onProgress?.(60);

  if (uploadError) {
    return { id: null, error: uploadError as Error };
  }

  options?.onProgress?.(70);

  // Get file URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from('materials')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  const fileUrl = urlData?.signedUrl || '';

  options?.onProgress?.(80);

  // Create material record - pending review
  const { data, error } = await supabase
    .from('materials')
    .insert({
      title,
      description,
      file_url: fileUrl,
      file_type: fileExt,
      file_size: file.size,
      created_by: userId,
      status: 'pending', // Requires admin approval
      course: options?.course || null,
      branch: options?.branch || null,
      subject: options?.subject || null,
      language: options?.language || null,
      college: options?.college || null,
    })
    .select('id')
    .single();

  options?.onProgress?.(100);

  if (error) {
    return { id: null, error: error as Error };
  }

  // Get uploader name for notification
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  // Notify admins about new pending content (async, don't await)
  supabase.functions.invoke('notify-pending-review', {
    body: {
      materialId: data.id,
      title,
      uploaderName: profile?.full_name || 'A user',
      contentType: 'material',
    },
  }).catch((err) => console.error('Failed to send notification:', err));

  // XP is awarded on APPROVAL, not on upload
  // See adminService.ts updateContentStatus for XP award

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
