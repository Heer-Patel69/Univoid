/**
 * Universal Share Utilities for UniVoid
 * Generates OG-friendly share URLs that work on WhatsApp, LinkedIn, etc.
 */

const SITE_URL = "https://univoid.tech";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type ShareContentType = 'events' | 'materials' | 'books' | 'projects' | 'tasks' | 'news';

interface ShareOptions {
  type: ShareContentType;
  id: string;
  title: string;
  description?: string;
}

/**
 * Get the OG-optimized share URL for social media platforms
 * This URL goes through an Edge Function that serves proper OG meta tags
 */
export function getShareUrl(type: ShareContentType, id: string): string {
  // Use Edge Function URL for OG-optimized sharing
  return `${SUPABASE_URL}/functions/v1/og-share?type=${type}&id=${id}`;
}

/**
 * Get the direct canonical URL (for users already on the site)
 */
export function getCanonicalUrl(type: ShareContentType, id: string): string {
  return `${SITE_URL}/${type}/${id}`;
}

/**
 * Universal share function that uses Web Share API with OG-optimized URLs
 */
export async function shareContent(options: ShareOptions): Promise<boolean> {
  const { type, id, title, description } = options;
  const shareUrl = getShareUrl(type, id);
  
  const shareData: ShareData = {
    title: `${title} | UniVoid`,
    text: description || title,
    url: shareUrl,
  };

  // Try native share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      // User cancelled or error - fall through to clipboard
      if ((error as Error).name === 'AbortError') {
        return false;
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch {
    // Final fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Generate share links for specific platforms
 */
export function getPlatformShareLinks(type: ShareContentType, id: string, title: string) {
  const shareUrl = encodeURIComponent(getShareUrl(type, id));
  const encodedTitle = encodeURIComponent(`${title} | UniVoid`);
  
  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${encodedTitle}`,
  };
}
