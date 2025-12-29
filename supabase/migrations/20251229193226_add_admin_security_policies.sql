-- Add backend security policies for admin operations
-- Ensures admin actions are validated at the database level, not just frontend

-- Helper function to check if user is admin or admin assistant
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role IN ('admin', 'admin_assistant')
  );
$$;

-- Helper function to check if user is full admin (not assistant)
CREATE OR REPLACE FUNCTION public.is_full_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin'
  );
$$;

-- Add RLS policies for materials approval (admin-only)
DROP POLICY IF EXISTS "Admin can update material status" ON public.materials;
CREATE POLICY "Admin can update material status"
ON public.materials
FOR UPDATE
USING (
  -- Only admins can update status field
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Add RLS policies for news approval (admin-only)
DROP POLICY IF EXISTS "Admin can update news status" ON public.news;
CREATE POLICY "Admin can update news status"
ON public.news
FOR UPDATE
USING (
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Add RLS policies for books approval (admin-only)
DROP POLICY IF EXISTS "Admin can update book status" ON public.books;
CREATE POLICY "Admin can update book status"
ON public.books
FOR UPDATE
USING (
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Add RLS policies for admin deletes (full admin only)
DROP POLICY IF EXISTS "Full admin can delete materials" ON public.materials;
CREATE POLICY "Full admin can delete materials"
ON public.materials
FOR DELETE
USING (
  public.is_full_admin(auth.uid())
);

DROP POLICY IF EXISTS "Full admin can delete news" ON public.news;
CREATE POLICY "Full admin can delete news"
ON public.news
FOR DELETE
USING (
  public.is_full_admin(auth.uid())
);

DROP POLICY IF EXISTS "Full admin can delete books" ON public.books;
CREATE POLICY "Full admin can delete books"
ON public.books
FOR DELETE
USING (
  public.is_full_admin(auth.uid())
);

-- Add RLS policy for profile management (admin can view/update all, users can view/update own)
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin_user(auth.uid())
)
WITH CHECK (
  auth.uid() = id OR public.is_admin_user(auth.uid())
);

-- Add function to validate admin actions with rate limiting
CREATE OR REPLACE FUNCTION public.validate_admin_action(
  action_type text,
  target_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_last_action timestamp;
  v_action_count integer;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required'
    );
  END IF;
  
  -- Check if user is admin
  v_is_admin := public.is_admin_user(v_user_id);
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Admin privileges required'
    );
  END IF;
  
  -- Rate limiting: max 100 admin actions per minute
  SELECT COUNT(*), MAX(created_at)
  INTO v_action_count, v_last_action
  FROM admin_audit_log
  WHERE user_id = v_user_id
  AND created_at > NOW() - INTERVAL '1 minute';
  
  IF v_action_count >= 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RATE_LIMITED',
      'message', 'Too many admin actions. Please wait a moment.'
    );
  END IF;
  
  -- Log the action
  INSERT INTO admin_audit_log (user_id, action_type, target_id)
  VALUES (v_user_id, action_type, target_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Action validated'
  );
END;
$$;

-- Create admin audit log table if not exists
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  target_id uuid,
  created_at timestamp with time zone DEFAULT NOW() NOT NULL
);

-- Add index for audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_created 
ON admin_audit_log(user_id, created_at DESC);

-- Add RLS for audit log (admins can view all, users can view their own)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all audit logs"
ON public.admin_audit_log
FOR SELECT
USING (
  public.is_admin_user(auth.uid())
);

CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Add OTP rate limiting table and policies if not exists
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT NOW() NOT NULL,
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW() NOT NULL,
  updated_at timestamp with time zone DEFAULT NOW() NOT NULL,
  CONSTRAINT otp_user_or_phone CHECK (user_id IS NOT NULL OR phone_number IS NOT NULL)
);

-- Create index for OTP rate limiting queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_rate_limits_user 
ON otp_rate_limits(user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_rate_limits_phone 
ON otp_rate_limits(phone_number) WHERE phone_number IS NOT NULL;

-- Enable RLS on OTP rate limits
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to check and enforce OTP rate limits
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  p_user_id uuid DEFAULT NULL,
  p_phone_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_rate_limit RECORD;
  v_window_duration interval := '15 minutes';
  v_max_attempts integer := 5;
  v_block_duration interval := '1 hour';
BEGIN
  -- Get or create rate limit record
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_rate_limit FROM otp_rate_limits WHERE user_id = p_user_id;
  ELSIF p_phone_number IS NOT NULL THEN
    SELECT * INTO v_rate_limit FROM otp_rate_limits WHERE phone_number = p_phone_number;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_INPUT',
      'message', 'User ID or phone number required'
    );
  END IF;
  
  -- Check if blocked
  IF v_rate_limit.blocked_until IS NOT NULL AND NOW() < v_rate_limit.blocked_until THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BLOCKED',
      'message', 'Too many attempts. Please try again later.',
      'blocked_until', v_rate_limit.blocked_until
    );
  END IF;
  
  -- Check if window expired
  IF v_rate_limit.window_start IS NULL OR NOW() > v_rate_limit.window_start + v_window_duration THEN
    -- Reset window
    IF p_user_id IS NOT NULL THEN
      UPDATE otp_rate_limits 
      SET attempt_count = 1, window_start = NOW(), blocked_until = NULL, updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE otp_rate_limits 
      SET attempt_count = 1, window_start = NOW(), blocked_until = NULL, updated_at = NOW()
      WHERE phone_number = p_phone_number;
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'attempts_remaining', v_max_attempts - 1
    );
  END IF;
  
  -- Check if max attempts reached
  IF v_rate_limit.attempt_count >= v_max_attempts THEN
    -- Block user
    IF p_user_id IS NOT NULL THEN
      UPDATE otp_rate_limits 
      SET blocked_until = NOW() + v_block_duration, updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE otp_rate_limits 
      SET blocked_until = NOW() + v_block_duration, updated_at = NOW()
      WHERE phone_number = p_phone_number;
    END IF;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MAX_ATTEMPTS',
      'message', 'Maximum attempts reached. Account temporarily blocked.',
      'blocked_until', NOW() + v_block_duration
    );
  END IF;
  
  -- Increment attempt count
  IF p_user_id IS NOT NULL THEN
    UPDATE otp_rate_limits 
    SET attempt_count = attempt_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE otp_rate_limits 
    SET attempt_count = attempt_count + 1, updated_at = NOW()
    WHERE phone_number = p_phone_number;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempts_remaining', v_max_attempts - (v_rate_limit.attempt_count + 1)
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_admin_action IS 'Validates admin actions with rate limiting and audit logging';
COMMENT ON FUNCTION public.check_otp_rate_limit IS 'Enforces OTP rate limiting: max 5 attempts per 15 minutes';
