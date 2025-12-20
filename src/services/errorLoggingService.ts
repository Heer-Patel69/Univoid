import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  pageRoute?: string;
  componentName?: string;
  metadata?: Record<string, unknown>;
}

export const logError = async (data: ErrorLogData): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase.from('error_logs').insert([{
      user_id: userData?.user?.id || null,
      error_type: data.errorType,
      error_message: data.errorMessage,
      error_stack: data.errorStack || null,
      page_route: data.pageRoute || window.location.pathname,
      component_name: data.componentName || null,
      metadata: (data.metadata as Json) || null,
      user_agent: navigator.userAgent,
    }]);
  } catch (logError) {
    // Silently fail - don't cause additional errors while logging
    console.error('Failed to log error to database:', logError);
  }
};

export const logAdminError = async (
  errorMessage: string,
  error?: Error,
  metadata?: Record<string, unknown>
): Promise<void> => {
  await logError({
    errorType: 'admin_page_error',
    errorMessage,
    errorStack: error?.stack,
    pageRoute: '/admin',
    componentName: 'Admin',
    metadata,
  });
};
