export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif', 'bmp', 'tif', 'tiff'];

export function validateFileUpload(file: File, type: 'image' | 'document' | 'any' = 'any'): string | null {
  if (!file) return 'No file provided';

  const ext = file.name.split('.').pop()?.toLowerCase();

  if (type === 'image') {
    // Accept if the browser reported an image mime, OR the file extension is a known image ext.
    // Many mobile browsers (iOS Safari, some Android) send an empty file.type — extension is our fallback.
    const mimeIsImage = file.type?.startsWith('image/') || ALLOWED_IMAGE_TYPES.includes(file.type);
    const extIsImage = !!ext && IMAGE_EXTENSIONS.includes(ext);
    if (!mimeIsImage && !extIsImage) {
      return 'Only image files are allowed';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return `Image must be smaller than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`;
    }

  } else if (type === 'document') {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type) && !['pdf', 'doc', 'docx'].includes(ext || '')) {
      return 'Only PDF and Word documents are allowed';
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return `Document must be smaller than ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`;
    }
  } else {
    // any (but block dangerous executables)
    const blockedExtensions = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'html', 'htm', 'msi', 'vbs', 'scr', 'svg'];
    if (blockedExtensions.includes(ext || '')) {
      return 'This file type is not allowed for security reasons';
    }
  }

  return null;
}
