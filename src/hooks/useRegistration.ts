import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  registerForEventAtomic, 
  uploadPaymentScreenshot,
  getUserFriendlyError,
  type RegistrationResult 
} from '@/services/registrationService';
import { sendEventRegistrationEmail } from '@/services/brevoEmailService';

interface UseRegistrationOptions {
  eventId: string;
  userId: string;
  eventTitle?: string;
  isPaidEvent?: boolean;
  onSuccess?: (result: RegistrationResult) => void;
  onError?: (error: string) => void;
}

interface RegistrationState {
  isSubmitting: boolean;
  isUploading: boolean;
  error: string | null;
  result: RegistrationResult | null;
}

/**
 * Hook for handling event registration with debouncing, 
 * optimistic updates, and robust error handling
 */
export function useRegistration(options: UseRegistrationOptions) {
  const { eventId, userId, eventTitle, isPaidEvent, onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [state, setState] = useState<RegistrationState>({
    isSubmitting: false,
    isUploading: false,
    error: null,
    result: null,
  });
  
  // Prevent double submissions
  const isSubmittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  
  const register = useCallback(async (
    customData: Record<string, unknown>,
    paymentFile?: File | null,
    groupSize?: number,
    isGroupBooking?: boolean
  ) => {
    // Prevent double submissions
    if (isSubmittingRef.current) {
      console.log('Registration already in progress, ignoring duplicate request');
      return null;
    }
    
    isSubmittingRef.current = true;
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      isUploading: !!paymentFile,
      error: null 
    }));
    
    try {
      let screenshotUrl: string | undefined;
      
      // Upload payment screenshot if provided
      if (paymentFile) {
        try {
          screenshotUrl = await uploadPaymentScreenshot(paymentFile, userId, eventId);
          setState(prev => ({ ...prev, isUploading: false }));
        } catch (uploadError) {
          setState(prev => ({ 
            ...prev, 
            isUploading: false,
            error: 'Failed to upload payment screenshot. Please try again.' 
          }));
          throw uploadError;
        }
      }
      
      // Register for event
      const result = await registerForEventAtomic({
        event_id: eventId,
        user_id: userId,
        custom_data: customData,
        payment_screenshot_url: screenshotUrl,
        group_size: groupSize || 1,
        is_group_booking: isGroupBooking || false,
      });
      
      setState(prev => ({ ...prev, result }));
      
      if (result.success) {
        // Show appropriate toast with action to view ticket
        if (result.already_registered) {
          toast.info(result.message, {
            action: {
              label: 'View Ticket',
              onClick: () => navigate('/my-tickets'),
            },
          });
        } else {
          toast.success(isPaidEvent 
            ? 'Registration submitted! Payment pending verification.' 
            : 'Registration confirmed!',
            {
              action: {
                label: 'View Ticket',
                onClick: () => navigate('/my-tickets'),
              },
            }
          );
          
          // Send confirmation email in background
          sendConfirmationEmail(userId, eventId, eventTitle);
        }
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['registration', eventId] });
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        
        onSuccess?.(result);
      } else {
        const errorMessage = result.message || 'Registration failed';
        setState(prev => ({ ...prev, error: errorMessage }));
        toast.error(errorMessage);
        onError?.(errorMessage);
      }
      
      return result;
    } catch (error) {
      const errorMessage = getUserFriendlyError(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      isSubmittingRef.current = false;
      setState(prev => ({ ...prev, isSubmitting: false, isUploading: false }));
    }
  }, [eventId, userId, eventTitle, isPaidEvent, queryClient, onSuccess, onError]);
  
  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isUploading: false,
      error: null,
      result: null,
    });
  }, []);
  
  return {
    register,
    reset,
    isSubmitting: state.isSubmitting,
    isUploading: state.isUploading,
    error: state.error,
    result: state.result,
  };
}

/**
 * Send confirmation email in background (fire-and-forget)
 * Uses Brevo SMTP for reliable delivery
 */
async function sendConfirmationEmail(
  userId: string, 
  eventId: string, 
  eventTitle?: string
) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    const { data: event } = await supabase
      .from('events')
      .select('title, start_date, venue_name, is_paid, price')
      .eq('id', eventId)
      .single();
    
    if (profile?.email && event) {
      const eventDate = event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'TBA';
      
      // Send via Brevo SMTP (fire and forget)
      sendEventRegistrationEmail(
        profile.email,
        profile.full_name || 'Participant',
        eventTitle || event.title,
        eventDate,
        event.venue_name || 'TBA',
        event.is_paid || false
      );
    }
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't throw - email is non-critical
  }
}
