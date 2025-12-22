import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryResult {
  category: string;
  sub_category?: string;
  confidence: 'high' | 'medium' | 'low';
}

export const useBookCategorization = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<CategoryResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const detectCategory = useCallback(async (title: string, imageBase64?: string) => {
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

    abortControllerRef.current = new AbortController();
    setIsDetecting(true);

    try {
      const { data, error } = await supabase.functions.invoke('categorize-book', {
        body: { 
          title: title.trim(),
          imageBase64: imageBase64 
        }
      });

      if (error) {
        console.error('Category detection error:', error);
        setIsDetecting(false);
        return null;
      }

      const result: CategoryResult = {
        category: data.category || 'Other',
        sub_category: data.sub_category || '',
        confidence: data.confidence || 'low'
      };

      setDetectedCategory(result);
      setIsDetecting(false);
      return result;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Category detection failed:', err);
      }
      setIsDetecting(false);
      return null;
    }
  }, []);

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
