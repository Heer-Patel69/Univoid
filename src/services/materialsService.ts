import { supabase } from '@/integrations/supabase/client';
import { Material, BLOCKED_VIDEO_FORMATS } from '@/types/database';
import { compressFile, MAX_FILE_SIZE_BYTES, validateMaterialFile } from '@/lib/fileCompression';
import type { CursorPage, CursorPageParam } from '@/hooks/useCursorPagination';

export interface MaterialFilters {
  status?: 'approved' | 'all';
  branch?: string;
  course?: string;
  subject?: string;
  search?: string;
}

/**
 * Fetch materials with cursor-based pagination
 * Uses created_at as the cursor for consistent ordering
 */
export async function getMaterialsWithCursor(
  params: CursorPageParam,
  filters: MaterialFilters = {}
): Promise<CursorPage<Material>> {
  const { cursor, limit } = params;
  const { status = 'approved', branch, course, subject, search } = filters;

  let query = supabase
    .from('materials')
    .select('id, title, description, file_type, file_size, subject, branch, course, college, language, downloads_count, views_count, likes_count, shares_count, status, created_at, created_by, thumbnail_url', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there's more

  // Apply cursor filter
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Apply filters
  if (status === 'approved') {
    query = query.eq('status', 'approved');
  }
  if (branch) {
    query = query.eq('branch', branch);
  }
  if (course) {
    query = query.eq('course', course);
  }
  if (subject) {
    query = query.ilike('subject', `%${subject}%`);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const materials = (data || []) as Material[];
  
  // Check if there are more items
  const hasMore = materials.length > limit;
  const items = hasMore ? materials.slice(0, limit) : materials;
  
  // Get next cursor from the last item
  const nextCursor = hasMore && items.length > 0 
    ? items[items.length - 1].created_at 
    : null;

  // Batch fetch contributor names in a single query
  const userIds = [...new Set(items.map(m => m.created_by))];
  const contributorNames: Record<string, string> = {};
  
  if (userIds.length > 0) {
    const { data: namesData } = await supabase.rpc('get_contributor_names', {
      user_ids: userIds,
    });
    
    if (namesData) {
      for (const row of namesData) {
        contributorNames[row.user_id] = row.full_name || 'Anonymous';
      }
    }
  }

  for (const material of items) {
    material.contributor_name = contributorNames[material.created_by] || 'Anonymous';
  }

  return {
    data: items,
    nextCursor,
    hasMore,
    totalCount: count ?? undefined,
  };
}

// Legacy function for backward compatibility
export async function getMaterials(status: 'approved' | 'all' = 'approved'): Promise<Material[]> {
  const result = await getMaterialsWithCursor({ cursor: null, limit: 50 }, { status });
  return result.data;
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
  onCompressionProgress?: (stage: string, progress: number) => void;
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
  // Validate file
  const validationError = validateMaterialFile(file);
  if (validationError) {
    return { id: null, error: new Error(validationError) };
  }

  // Check for blocked video formats
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (BLOCKED_VIDEO_FORMATS.includes(fileExt)) {
    return { id: null, error: new Error('Video files are not allowed') };
  }

  // Check file size (100MB limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { id: null, error: new Error('File size must be less than 100MB') };
  }

  options?.onProgress?.(5);

  // Compress file if possible (images)
  let uploadFile = file;
  try {
    const compressionResult = await compressFile(file, (p) => {
      options?.onCompressionProgress?.(p.stage, p.progress);
    });
    uploadFile = compressionResult.file;
    
    if (compressionResult.compressionRatio > 0) {
      console.log(`File compressed: ${compressionResult.compressionRatio.toFixed(1)}% reduction`);
    }
  } catch (e) {
    console.warn('Compression failed, using original file:', e);
  }

  options?.onProgress?.(15);

  // Upload file to storage
  const filePath = `${userId}/${Date.now()}-${uploadFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from('materials')
    .upload(filePath, uploadFile, {
      cacheControl: '3600',
      upsert: false,
    });

  options?.onProgress?.(60);

  if (uploadError) {
    return { id: null, error: uploadError as Error };
  }

  // Server-side PDF compression via edge function
  let finalFilePath = filePath;
  if (fileExt === 'pdf') {
    options?.onCompressionProgress?.('Compressing PDF on server...', 50);
    try {
      const { data: compressionResult, error: compressionError } = await supabase.functions.invoke('compress-pdf', {
        body: { filePath, bucket: 'materials' },
      });
      
      if (!compressionError && compressionResult?.success) {
        finalFilePath = compressionResult.newFilePath;
        console.log(`Server-side PDF compression: ${compressionResult.compressionRatio}% reduction`);
      }
    } catch (err) {
      console.warn('Server-side PDF compression failed, using original:', err);
    }
  }

  options?.onProgress?.(70);

  // Get file URL (signed URL for private bucket)
  const { data: urlData } = await supabase.storage
    .from('materials')
    .createSignedUrl(finalFilePath, 60 * 60 * 24 * 365); // 1 year

  const fileUrl = urlData?.signedUrl || '';

  // Determine preview URL based on file type
  // For images: use the same URL as file_url (no conversion needed)
  // For PDFs/docs: would need separate preview generation (future enhancement)
  const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExt.toLowerCase());
  const previewFileUrl = isImageFile ? fileUrl : null;
  const previewPageLimit = isImageFile ? 1 : 5;

  options?.onProgress?.(80);

  // Create material record - pending review
  const { data, error } = await supabase
    .from('materials')
    .insert({
      title,
      description,
      file_url: fileUrl,
      file_type: fileExt,
      file_size: uploadFile.size,
      created_by: userId,
      status: 'pending', // Requires admin approval
      course: options?.course || null,
      branch: options?.branch || null,
      subject: options?.subject || null,
      language: options?.language || null,
      college: options?.college || null,
      preview_file_url: previewFileUrl,
      preview_page_limit: previewPageLimit,
      preview_ready: isImageFile, // Images are ready immediately
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

export async function getPendingMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const materials = data as Material[];
  
  // Batch fetch contributor names
  const userIds = [...new Set(materials.map(m => m.created_by))];
  if (userIds.length > 0) {
    const { data: namesData } = await supabase.rpc('get_contributor_names', {
      user_ids: userIds,
    });
    
    const contributorNames: Record<string, string> = {};
    if (namesData) {
      for (const row of namesData) {
        contributorNames[row.user_id] = row.full_name || 'Anonymous';
      }
    }
    
    for (const material of materials) {
      material.contributor_name = contributorNames[material.created_by] || 'Anonymous';
    }
  }

  return materials;
}
