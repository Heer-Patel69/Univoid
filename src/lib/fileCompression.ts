// Enhanced file compression utility for study materials (100MB support)

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionProgress {
  stage: 'analyzing' | 'compressing' | 'optimizing' | 'complete';
  progress: number;
  message: string;
}

// Maximum upload size: 100MB
export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  documents: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
  archives: ['zip', 'rar', '7z'],
  ebooks: ['epub', 'mobi'],
};

export const BLOCKED_FILE_TYPES = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'exe', 'bat', 'sh', 'dll', 'apk', 'js', 'html', 'htm', 'jar', 'msi', 'cmd', 'vbs', 'ps1'];

// Whitelist of safe MIME types based on file content
export const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/rtf',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // eBooks
  'application/epub+zip',
  'application/x-mobipocket-ebook',
];

// Dangerous MIME types to explicitly block
export const BLOCKED_MIME_TYPES = [
  'application/x-msdownload', // .exe
  'application/x-msdos-program',
  'application/x-sh', // shell scripts
  'application/x-bat',
  'application/javascript',
  'text/javascript',
  'application/x-java-archive', // .jar
  'text/html',
  'application/x-httpd-php',
  'application/x-executable',
];

// Validate file before upload with MIME type checking from file headers
export async function validateMaterialFile(file: File): Promise<string | null> {
  // Check size (100MB limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File size must be less than ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Check blocked extensions
  if (BLOCKED_FILE_TYPES.includes(ext)) {
    return `${ext.toUpperCase()} files are not allowed for security reasons`;
  }
  
  // Validate MIME type from file content (not just extension)
  const mimeType = file.type;
  
  // Block dangerous MIME types
  if (BLOCKED_MIME_TYPES.includes(mimeType)) {
    return `This file type is not allowed for security reasons`;
  }
  
  // Check if MIME type is in whitelist (if browser provides it)
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    // If mime type doesn't match, read file header to verify
    const isValidHeader = await validateFileHeader(file);
    if (!isValidHeader) {
      return `Invalid or unsafe file type. File appears to be: ${mimeType || 'unknown'}`;
    }
  }
  
  // Check if extension is allowed
  const allAllowed = [
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.archives,
    ...ALLOWED_FILE_TYPES.ebooks,
  ];
  
  if (!allAllowed.includes(ext)) {
    return `${ext.toUpperCase()} files are not supported. Allowed: PDF, DOC, PPT, images, ZIP`;
  }
  
  return null;
}

// Validate file header (magic bytes) to prevent MIME type spoofing
async function validateFileHeader(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const blob = file.slice(0, 8); // Read first 8 bytes for magic number
    
    reader.onload = (e) => {
      if (!e.target?.result) {
        resolve(false);
        return;
      }
      
      const arr = new Uint8Array(e.target.result as ArrayBuffer);
      const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Check for common safe file types by magic bytes
      const safeHeaders = [
        '25504446', // PDF (%PDF)
        '504b0304', // ZIP, DOCX, XLSX, PPTX (PK..)
        'd0cf11e0', // DOC, XLS, PPT (legacy Office)
        'ffd8ff', // JPEG
        '89504e47', // PNG
        '47494638', // GIF
        '52494646', // WEBP (RIFF)
      ];
      
      // Check for dangerous executable headers
      const dangerousHeaders = [
        '4d5a', // EXE, DLL (MZ)
        '7f454c46', // ELF (Linux executable)
        'cafebabe', // Java class file
        '213c617263683e', // Unix archive
      ];
      
      // Block if dangerous header detected
      for (const dangerous of dangerousHeaders) {
        if (header.startsWith(dangerous)) {
          resolve(false);
          return;
        }
      }
      
      // Allow if safe header detected or if we can't determine (text files, etc.)
      const isSafe = safeHeaders.some(safe => header.startsWith(safe));
      resolve(isSafe || header.length < 4); // Allow small headers (likely text)
    };
    
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(blob);
  });
}

// Determine if file is a book/ebook
export function isBookFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'epub', 'mobi'].includes(ext);
}

// Compress image with quality reduction
async function compressImage(
  file: File, 
  targetSizeMB: number = 5,
  onProgress?: (p: CompressionProgress) => void
): Promise<File> {
  return new Promise((resolve) => {
    onProgress?.({ stage: 'analyzing', progress: 10, message: 'Analyzing image...' });
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        onProgress?.({ stage: 'compressing', progress: 30, message: 'Compressing image...' });
        
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down large images
        const maxDimension = 2400;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        onProgress?.({ stage: 'optimizing', progress: 60, message: 'Optimizing quality...' });
        
        // Try different quality levels
        let quality = 0.85;
        const targetSize = targetSizeMB * 1024 * 1024;
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              
              if (blob.size > targetSize && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
                return;
              }
              
              onProgress?.({ stage: 'complete', progress: 100, message: 'Compression complete!' });
              
              // Use WebP for better compression if possible
              const outputType = 'image/webp';
              const ext = file.name.includes('.') ? file.name.split('.').pop() : 'webp';
              const newName = file.name.replace(`.${ext}`, '.webp');
              
              const compressedFile = new File([blob], newName, {
                type: outputType,
                lastModified: Date.now(),
              });
              
              resolve(compressedFile);
            },
            'image/webp',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => resolve(file);
    };
    
    reader.onerror = () => resolve(file);
  });
}

// Main compression function
export async function compressFile(
  file: File,
  onProgress?: (p: CompressionProgress) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  onProgress?.({ stage: 'analyzing', progress: 5, message: 'Analyzing file...' });
  
  // Compress images
  if (ALLOWED_FILE_TYPES.images.includes(ext)) {
    const compressed = await compressImage(file, 5, onProgress);
    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
      compressionRatio: ((originalSize - compressed.size) / originalSize) * 100,
    };
  }
  
  // For PDFs, documents, and other files - return as-is
  // Server-side compression would handle these
  onProgress?.({ stage: 'complete', progress: 100, message: 'Ready for upload' });
  
  return {
    file,
    originalSize,
    compressedSize: file.size,
    compressionRatio: 0,
  };
}

// Generate preview pages info for books/PDFs
export function getPreviewPagesCount(totalPages: number): number {
  // Allow preview of first 10-15% of pages, minimum 3, maximum 20
  const previewPercent = 0.15;
  const calculated = Math.ceil(totalPages * previewPercent);
  return Math.max(3, Math.min(20, calculated));
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
