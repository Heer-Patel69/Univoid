import { useState, useCallback, useRef } from 'react';

interface CategoryResult {
  category: string;
  sub_category?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Hook for book categorization using YOUR custom FastAPI backend.
 * This does NOT use Lovable AI - it calls YOUR custom OCR/ML API.
 * 
 * Configure the API URL via VITE_BOOK_SCANNER_API_URL environment variable.
 */
export const useBookCategorization = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<CategoryResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_BOOK_SCANNER_API_URL || '';

  const detectCategory = useCallback(async (title: string, imageBase64?: string): Promise<CategoryResult | null> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Skip if no meaningful input
    if (!title.trim() && !imageBase64) {
      setDetectedCategory(null);
      return null;
    }

    // Skip if title is too short
    if (title.trim().length < 3 && !imageBase64) {
      return null;
    }

    // If API URL is not configured, use local rule-based categorization
    if (!apiUrl) {
      console.warn('Book scanner API URL not configured. Using local categorization.');
      const result = localCategorize(title);
      setDetectedCategory(result);
      return result;
    }

    abortControllerRef.current = new AbortController();
    setIsDetecting(true);

    try {
      // Call YOUR custom categorization endpoint
      const formData = new FormData();
      formData.append('title', title.trim());
      
      if (imageBase64) {
        // Convert base64 to file if provided
        const response = await fetch(imageBase64);
        const blob = await response.blob();
        formData.append('file', new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
      }

      const apiResponse = await fetch(`${apiUrl}/categorize-book`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!apiResponse.ok) {
        throw new Error(`API returned ${apiResponse.status}`);
      }

      const data = await apiResponse.json();

      if (data.success && data.data) {
        const result: CategoryResult = {
          category: data.data.category || 'Other',
          sub_category: data.data.sub_category || '',
          confidence: data.data.confidence || 'low'
        };
        setDetectedCategory(result);
        setIsDetecting(false);
        return result;
      }

      // Fallback to local categorization if API returns no data
      const fallback = localCategorize(title);
      setDetectedCategory(fallback);
      setIsDetecting(false);
      return fallback;

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Category detection failed:', err);
        // Fallback to local categorization on error
        const fallback = localCategorize(title);
        setDetectedCategory(fallback);
        setIsDetecting(false);
        return fallback;
      }
      setIsDetecting(false);
      return null;
    }
  }, [apiUrl]);

  const clearDetection = useCallback(() => {
    setDetectedCategory(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isDetecting,
    detectedCategory,
    detectCategory,
    clearDetection
  };
};

/**
 * Local rule-based categorization fallback.
 * Used when custom API is not configured or fails.
 */
function localCategorize(title: string): CategoryResult {
  const lowerTitle = title.toLowerCase();
  
  // School textbooks
  const schoolKeywords = ['ncert', 'cbse', 'icse', 'class', 'std', 'grade', 'school', 'board'];
  if (schoolKeywords.some(k => lowerTitle.includes(k))) {
    return { category: 'School', confidence: 'medium' };
  }
  
  // Entrance/Competitive
  const entranceKeywords = ['jee', 'neet', 'upsc', 'gate', 'cat', 'ssc', 'bank', 'competitive', 'entrance', 'ias', 'ips', 'railway'];
  if (entranceKeywords.some(k => lowerTitle.includes(k))) {
    return { category: 'Entrance / Competitive', confidence: 'medium' };
  }
  
  // College/University
  const collegeKeywords = ['engineering', 'btech', 'b.tech', 'mba', 'medical', 'law', 'university', 'semester', 'degree', 'diploma', 'pharmacy', 'nursing'];
  if (collegeKeywords.some(k => lowerTitle.includes(k))) {
    return { category: 'College / University', confidence: 'medium' };
  }
  
  // Fiction
  const fictionKeywords = ['novel', 'fiction', 'story', 'stories', 'tale', 'romance', 'mystery', 'thriller', 'fantasy', 'horror'];
  if (fictionKeywords.some(k => lowerTitle.includes(k))) {
    return { category: 'Fiction', confidence: 'medium' };
  }
  
  // Non-Fiction
  const nonFictionKeywords = ['biography', 'autobiography', 'self-help', 'selfhelp', 'history', 'science', 'psychology', 'philosophy', 'business', 'finance', 'leadership'];
  if (nonFictionKeywords.some(k => lowerTitle.includes(k))) {
    return { category: 'Non-Fiction', confidence: 'medium' };
  }
  
  return { category: 'Other', confidence: 'low' };
}
