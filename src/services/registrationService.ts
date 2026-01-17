import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { allowRequest } from "@/lib/rateLimiter";

/**
 * User-friendly error messages mapping
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Registration errors
  EVENT_NOT_FOUND: "This event doesn't exist or has been removed.",
  EVENT_NOT_PUBLISHED: "This event is not accepting registrations yet.",
  EVENT_FULL: "Sorry, this event is full. No spots available.",
  CONCURRENT_REQUEST: "High traffic detected. Please try again in a moment.",
  ALREADY_REGISTERED: "You're already registered for this event!",

  // Network errors
  NETWORK_ERROR: "Connection lost. Please check your internet and try again.",
  TIMEOUT: "Request timed out. Your registration may still be processing.",

  // Generic errors
  UNKNOWN: "Something went wrong. Please try again in a moment.",

  // Rate limiting
  RATE_LIMITED: "Too many attempts. Please wait a minute before trying again.",
};

export interface RegistrationResult {
  success: boolean;
  registration_id?: string;
  already_registered?: boolean;
  payment_status?: string;
  message: string;
  error?: string;
}

export interface RegistrationRequest {
  event_id: string;
  user_id: string;
  custom_data?: Record<string, unknown>;
  payment_screenshot_url?: string;
}

/**
 * Rate limiting tracker (client-side)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= MAX_ATTEMPTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Retry with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 50
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on these errors
      const errorMessage = lastError.message.toLowerCase();
      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('full') ||
        errorMessage.includes('not found')
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Upload payment screenshot with retry
 */
export async function uploadPaymentScreenshot(
  file: File,
  userId: string,
  eventId: string
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/payments/${eventId}/${Date.now()}.${fileExt}`;

  return withRetry(async () => {
    const { error: uploadError } = await supabase.storage
      .from("event-assets")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("event-assets")
      .getPublicUrl(fileName);

    return publicUrl;
  });
}

/**
 * Register for event with atomic operation (race-condition safe)
 * Uses database function for atomic seat check + registration
 */
export async function registerForEventAtomic(
  request: RegistrationRequest
): Promise<RegistrationResult> {
  // Server-side rate limiting using in-memory token bucket

  if (!allowRequest(request.user_id, 10, 60000)) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: ERROR_MESSAGES.RATE_LIMITED,
    };
  }

  try {
    const result = await withRetry(async () => {
      const { data, error } = await supabase.rpc('register_for_event_atomic', {
        p_event_id: request.event_id,
        p_user_id: request.user_id,
        p_custom_data: request.custom_data as Json || null,
        p_payment_screenshot_url: request.payment_screenshot_url || null,
      });

      if (error) {
        // Handle network/timeout errors
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error('NETWORK_ERROR');
        }
        throw error;
      }

      return data as unknown as RegistrationResult;
    });

    // Map error codes to user-friendly messages
    if (!result.success && result.error) {
      result.message = ERROR_MESSAGES[result.error] || ERROR_MESSAGES.UNKNOWN;
    }

    return result;
  } catch (error) {
    const err = error as Error;
    const errorCode = err.message in ERROR_MESSAGES ? err.message : 'UNKNOWN';

    return {
      success: false,
      error: errorCode,
      message: ERROR_MESSAGES[errorCode],
    };
  }
}

/**
 * Check existing registration (with caching hints for React Query)
 */
export async function checkExistingRegistration(
  eventId: string,
  userId: string
): Promise<{ registered: boolean; status?: string; registrationId?: string }> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, payment_status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      registered: true,
      status: data.payment_status,
      registrationId: data.id,
    };
  }

  return { registered: false };
}

/**
 * Get real-time seat availability
 */
export async function getEventCapacity(eventId: string): Promise<{
  currentCount: number;
  maxCapacity: number | null;
  isFull: boolean;
  spotsRemaining: number | null;
}> {
  const { data, error } = await supabase
    .from('events')
    .select('registrations_count, max_capacity')
    .eq('id', eventId)
    .single();

  if (error) throw error;

  const currentCount = data.registrations_count;
  const maxCapacity = data.max_capacity;
  const isFull = maxCapacity !== null && currentCount >= maxCapacity;
  const spotsRemaining = maxCapacity !== null ? maxCapacity - currentCount : null;

  return { currentCount, maxCapacity, isFull, spotsRemaining };
}

/**
 * Get user-friendly error message for any error
 */
export function getUserFriendlyError(error: unknown): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT;
    }
    if (message.includes('unique') || message.includes('already registered')) {
      return ERROR_MESSAGES.ALREADY_REGISTERED;
    }
    if (message.includes('full') || message.includes('capacity')) {
      return ERROR_MESSAGES.EVENT_FULL;
    }

    // Check if message matches an error code
    const upperMessage = error.message.toUpperCase();
    if (upperMessage in ERROR_MESSAGES) {
      return ERROR_MESSAGES[upperMessage];
    }

    return error.message;
  }

  return ERROR_MESSAGES.UNKNOWN;
}
