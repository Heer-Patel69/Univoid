import { supabase } from '@/integrations/supabase/client';
import { Material, BLOCKED_VIDEO_FORMATS } from '@/types/database';
import { compressFile, MAX_FILE_SIZE_BYTES, validateMaterialFile } from '@/lib/fileCompression';
import { materialsLogger } from '@/services/errorLoggingService';
import type { CursorPage, CursorPageParam } from '@/hooks/useCursorPagination';

/**
 * Get proper user-friendly error message for upload failures
 * NEVER show "Network error" unless user is actually offline
 */
function getUploadErrorMessage(error: any): string {
  // Only show network error if actually offline
  if (!navigator.onLine) {
    return 'You are offline. Please check your internet connection.';
  }

  const message = error?.message || '';
  const statusCode = error?.statusCode || error?.status;

  // Storage-specific errors
  if (message.includes('Invalid key') || message.includes('invalid key')) {
    return 'Upload failed due to file path issue. Please try again.';
  }

  if (message.includes('exceeded') || message.includes('size') || statusCode === 413) {
    return 'File is too large. Please try a smaller file (max 16MB).';
  }

  if (statusCode === 403 || message.includes('permission') || message.includes('not authorized')) {
    return 'You do not have permission to upload. Please log in again.';
  }

  if (statusCode === 401 || message.includes('unauthorized') || message.includes('JWT')) {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'Upload timed out. Please try again with a stable connection.';
  }

  if (message.includes('bucket') || message.includes('Bucket')) {
    return 'Storage configuration error. Please contact support.';
  }

  // Generic fetch failures - could be CORS, policy, or actual network
  if (message.includes('fetch') || message.includes('network')) {
    // But we already checked navigator.onLine, so it's likely a backend issue
    return 'Upload failed. Please try again or contact support if the issue persists.';
  }

  // Default: show the actual error for debugging
  return message || 'Upload failed. Please try again.';
}

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
  // Debug logging for upload tracking
  const uploadId = crypto.randomUUID().slice(0, 8);
  const logPrefix = `[Upload ${uploadId}]`;
  
  console.log(`${logPrefix} Starting upload:`, {
    originalFileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    fileType: file.type,
    userId: userId.slice(0, 8) + '...',
    online: navigator.onLine,
  });

  try {
    // Validate file
    const validationError = validateMaterialFile(file);
    if (validationError) {
      console.error(`${logPrefix} Validation failed:`, validationError);
      return { id: null, error: new Error(validationError) };
    }

    // Check for blocked video formats
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (BLOCKED_VIDEO_FORMATS.includes(fileExt)) {
      console.error(`${logPrefix} Blocked format:`, fileExt);
      return { id: null, error: new Error('Video files are not allowed') };
    }

    // Check file size (100MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      console.error(`${logPrefix} File too large:`, file.size);
      return { id: null, error: new Error('File size must be less than 100MB') };
    }

    options?.onProgress?.(5);

    // Compress file if possible (images)
    let uploadFile = file;
    try {
      console.log(`${logPrefix} Starting compression...`);
      const compressionResult = await compressFile(file, (p) => {
        options?.onCompressionProgress?.(p.stage, p.progress);
      });
      uploadFile = compressionResult.file;
      console.log(`${logPrefix} Compression done:`, {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        compressedSize: `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`,
      });
    } catch (error) {
      console.warn(`${logPrefix} Compression failed, using original:`, error);
      materialsLogger.warn('File compression failed, using original', error, { fileName: file.name });
    }

    options?.onProgress?.(15);

    // Generate safe storage filename using UUID (original filename may contain invalid characters like [ ] ( ))
    const safeStorageFileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${userId}/${safeStorageFileName}`;
    
    console.log(`${logPrefix} Uploading to storage:`, {
      originalName: file.name,
      storagePath: filePath,
      bucket: 'materials',
    });

    const uploadStartTime = Date.now();
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('materials')
      .upload(filePath, uploadFile, {
        cacheControl: '3600',
        upsert: false,
      });
    
    const uploadDuration = Date.now() - uploadStartTime;
    console.log(`${logPrefix} Storage upload completed in ${uploadDuration}ms`);

    options?.onProgress?.(60);

    if (uploadError) {
      // Detailed error logging
      console.error(`${logPrefix} UPLOAD FAILED:`, {
        errorMessage: uploadError.message,
        errorName: (uploadError as any).name,
        statusCode: (uploadError as any).statusCode || (uploadError as any).status,
        cause: (uploadError as any).cause,
        fullError: JSON.stringify(uploadError, null, 2),
        filePath,
        fileSize: uploadFile.size,
        online: navigator.onLine,
      });
      
      const errorMessage = getUploadErrorMessage(uploadError);
      return { id: null, error: new Error(errorMessage) };
    }
    
    console.log(`${logPrefix} Upload successful:`, { path: uploadData?.path || filePath });

    // Server-side PDF compression via edge function (non-blocking, with timeout)
    let finalFilePath = filePath;
    if (fileExt === 'pdf') {
      options?.onCompressionProgress?.('Compressing PDF on server...', 50);
      try {
        const compressionPromise = supabase.functions.invoke('compress-pdf', {
          body: { filePath, bucket: 'materials' },
        });
        
        // 30 second timeout for PDF compression
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF compression timeout')), 30000)
        );
        
        const result = await Promise.race([compressionPromise, timeoutPromise]) as { data: any; error: any };
        
        if (!result.error && result.data?.success) {
          finalFilePath = result.data.newFilePath;
        }
      } catch (error) {
        // PDF compression failure is non-critical, continue with original file
        materialsLogger.warn('Server-side PDF compression failed or timed out', error, { filePath });
      }
    }

    options?.onProgress?.(70);

    // Get file URL (signed URL for private bucket)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('materials')
      .createSignedUrl(finalFilePath, 60 * 60 * 24 * 365); // 1 year

    if (urlError) {
      console.error(`${logPrefix} Signed URL error:`, urlError);
      return { id: null, error: new Error('Failed to generate file URL. Please try again.') };
    }

    console.log(`${logPrefix} Signed URL generated successfully`);

    const fileUrl = urlData?.signedUrl || '';

    // Determine preview URL based on file type
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

    console.log(`${logPrefix} Inserting into database...`);

    if (error) {
      console.error(`${logPrefix} Database insert error:`, {
        errorMessage: error.message,
        errorCode: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { id: null, error: new Error('Failed to save material. Please try again.') };
    }
    
    console.log(`${logPrefix} Material created successfully:`, { materialId: data.id });

    // Get uploader name for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

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
  } catch (error: any) {
    // Catch-all for any unexpected errors
    console.error(`[Upload] UNEXPECTED ERROR:`, {
      message: error?.message,
      name: error?.name,
      stack: error?.stack?.slice(0, 500),
      online: navigator.onLine,
      cause: error?.cause,
    });
    
    // Use proper error detection
    const errorMessage = getUploadErrorMessage(error);
    return { id: null, error: new Error(errorMessage) };
  }
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
