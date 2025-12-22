import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

type ErrorLevel = 'error' | 'warn' | 'info';

interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  pageRoute?: string;
  componentName?: string;
  metadata?: Record<string, unknown>;
}

// Queue for batching errors (prevents flooding the database)
let errorQueue: ErrorLogData[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 2000; // 2 seconds
const MAX_QUEUE_SIZE = 10;

/**
 * Flush the error queue to the database
 */
const flushErrorQueue = async (): Promise<void> => {
  if (errorQueue.length === 0) return;
  
  const errorsToLog = [...errorQueue];
  errorQueue = [];
  flushTimeout = null;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : null;
    
    const records = errorsToLog.map(data => ({
      user_id: userId,
      error_type: data.errorType,
      error_message: data.errorMessage.substring(0, 2000), // Limit message length
      error_stack: data.errorStack?.substring(0, 5000) || null,
      page_route: data.pageRoute || pageRoute,
      component_name: data.componentName || null,
      metadata: (data.metadata as Json) || null,
      user_agent: userAgent,
    }));
    
    await supabase.from('error_logs').insert(records);
  } catch {
    // Silently fail - don't cause additional errors while logging
  }
};

/**
 * Schedule a flush of the error queue
 */
const scheduleFlush = (): void => {
  if (flushTimeout) return;
  
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    flushErrorQueue();
  } else {
    flushTimeout = setTimeout(flushErrorQueue, FLUSH_INTERVAL);
  }
};

/**
 * Log an error to the database (batched)
 */
export const logError = async (data: ErrorLogData): Promise<void> => {
  errorQueue.push(data);
  scheduleFlush();
};

/**
 * Immediately log an error (bypasses queue for critical errors)
 */
export const logErrorImmediate = async (data: ErrorLogData): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase.from('error_logs').insert([{
      user_id: userData?.user?.id || null,
      error_type: data.errorType,
      error_message: data.errorMessage.substring(0, 2000),
      error_stack: data.errorStack?.substring(0, 5000) || null,
      page_route: data.pageRoute || (typeof window !== 'undefined' ? window.location.pathname : null),
      component_name: data.componentName || null,
      metadata: (data.metadata as Json) || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }]);
  } catch {
    // Silently fail
  }
};

/**
 * Create a logger instance for a specific component/service
 */
export const createLogger = (componentName: string) => {
  const log = (level: ErrorLevel, message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => {
    const errorObj = error instanceof Error ? error : null;
    
    logError({
      errorType: `${componentName}_${level}`,
      errorMessage: message,
      errorStack: errorObj?.stack,
      componentName,
      metadata: {
        ...metadata,
        originalError: errorObj ? undefined : String(error),
      },
    });
  };
  
  return {
    error: (message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => 
      log('error', message, error, metadata),
    warn: (message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => 
      log('warn', message, error, metadata),
    info: (message: string, metadata?: Record<string, unknown>) => 
      log('info', message, undefined, metadata),
  };
};

/**
 * Pre-configured loggers for common services
 */
export const authLogger = createLogger('AuthContext');
export const materialsLogger = createLogger('MaterialsService');
export const eventsLogger = createLogger('EventsService');

/**
 * Legacy function for admin page errors
 */
export const logAdminError = async (
  errorMessage: string,
  error?: Error,
  metadata?: Record<string, unknown>
): Promise<void> => {
  await logErrorImmediate({
    errorType: 'admin_page_error',
    errorMessage,
    errorStack: error?.stack,
    pageRoute: '/admin',
    componentName: 'Admin',
    metadata,
  });
};

/**
 * Global error handler for uncaught errors
 */
export const setupGlobalErrorHandler = (): void => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('error', (event) => {
    logError({
      errorType: 'uncaught_error',
      errorMessage: event.message,
      errorStack: event.error?.stack,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    logError({
      errorType: 'unhandled_promise_rejection',
      errorMessage: error?.message || String(error),
      errorStack: error?.stack,
    });
  });
};

// Flush any remaining errors before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (errorQueue.length > 0) {
      // Use sendBeacon for reliability during page unload
      const payload = JSON.stringify(errorQueue);
      navigator.sendBeacon?.('/api/log-errors', payload);
    }
  });
}
