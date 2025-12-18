// File compression utility for study materials

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

// Compress PDF-like files by converting to blob with reduced quality for images
export async function compressFile(file: File, maxSizeMB: number = 10): Promise<CompressionResult> {
  const originalSize = file.size;
  
  // If file is already under the limit, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return { file, originalSize, compressedSize: file.size };
  }

  // For images, we can compress them
  if (file.type.startsWith('image/')) {
    const compressed = await compressImage(file, maxSizeMB);
    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
    };
  }

  // For other files, we can't compress effectively, just return original
  return { file, originalSize, compressedSize: file.size };
}

async function compressImage(file: File, maxSizeMB: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down if too large
        const maxDimension = 2000;
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
        
        // Start with high quality and reduce until under size limit
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              
              if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              resolve(compressedFile);
            },
            'image/jpeg',
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

// Validate file before upload
export function validateMaterialFile(file: File): string | null {
  const maxSize = 10 * 1024 * 1024; // 10MB limit for cloud optimization
  
  if (file.size > maxSize) {
    return `File size must be less than 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  
  const blockedExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'exe', 'bat', 'sh'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  if (blockedExtensions.includes(ext)) {
    return `${ext.toUpperCase()} files are not allowed`;
  }
  
  return null;
}
