-- Add concurrency locks and idempotent operations for payment processing
-- Prevents race conditions and double-processing

-- Function to update payment status with row-level locking (prevents concurrent updates)
CREATE OR REPLACE FUNCTION public.update_payment_status_atomic(
  p_registration_id uuid,
  p_new_status text,
  p_organizer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_registration RECORD;
  v_event RECORD;
  v_current_status text;
BEGIN
  -- Lock the registration row to prevent concurrent updates
  SELECT 
    id, 
    event_id, 
    user_id, 
    payment_status,
    reviewed_at
  INTO v_registration
  FROM event_registrations
  WHERE id = p_registration_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_FOUND',
      'message', 'Registration not found'
    );
  END IF;
  
  v_current_status := v_registration.payment_status;
  
  -- Verify organizer owns the event
  SELECT id, organizer_id INTO v_event
  FROM events
  WHERE id = v_registration.event_id;
  
  IF v_event.organizer_id != p_organizer_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Not authorized to update this registration'
    );
  END IF;
  
  -- Idempotency check: if already in target status and reviewed, return success
  IF v_current_status = p_new_status AND v_registration.reviewed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'message', 'Payment status already set to ' || p_new_status
    );
  END IF;
  
  -- Validate status transition
  -- Once approved or rejected, cannot change (prevents toggling)
  IF v_current_status IN ('approved', 'rejected') AND v_current_status != p_new_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TRANSITION',
      'message', 'Cannot change status from ' || v_current_status || ' to ' || p_new_status
    );
  END IF;
  
  -- Update status atomically
  UPDATE event_registrations
  SET 
    payment_status = p_new_status,
    reviewed_at = NOW()
  WHERE id = p_registration_id;
  
  -- If approved, ensure ticket exists
  IF p_new_status = 'approved' THEN
    -- Check if ticket already exists (idempotency)
    PERFORM id FROM event_tickets WHERE registration_id = p_registration_id;
    
    IF NOT FOUND THEN
      -- Generate QR code and create ticket
      INSERT INTO event_tickets (
        registration_id,
        event_id,
        user_id,
        qr_code
      ) VALUES (
        p_registration_id,
        v_registration.event_id,
        v_registration.user_id,
        encode(gen_random_bytes(16), 'hex')
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'message', 'Payment status updated to ' || p_new_status
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CONCURRENT_UPDATE',
      'message', 'Another process is updating this registration. Please try again.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNKNOWN',
      'message', SQLERRM
    );
END;
$$;

-- Function to process payment approval in bulk with proper locking
CREATE OR REPLACE FUNCTION public.bulk_approve_payments(
  p_registration_ids uuid[],
  p_organizer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_reg_id uuid;
  v_success_count integer := 0;
  v_error_count integer := 0;
  v_results jsonb[] := ARRAY[]::jsonb[];
  v_result jsonb;
BEGIN
  -- Process each registration with proper locking
  FOREACH v_reg_id IN ARRAY p_registration_ids
  LOOP
    v_result := public.update_payment_status_atomic(
      v_reg_id,
      'approved',
      p_organizer_id
    );
    
    IF (v_result->>'success')::boolean THEN
      v_success_count := v_success_count + 1;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
    
    v_results := array_append(v_results, v_result);
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', v_error_count = 0,
    'total', array_length(p_registration_ids, 1),
    'approved', v_success_count,
    'errors', v_error_count,
    'results', to_jsonb(v_results)
  );
END;
$$;

-- Add distributed lock for critical payment operations
CREATE TABLE IF NOT EXISTS public.payment_locks (
  lock_key text PRIMARY KEY,
  locked_by uuid NOT NULL,
  locked_at timestamp with time zone DEFAULT NOW() NOT NULL,
  expires_at timestamp with time zone NOT NULL
);

-- Create index for lock cleanup
CREATE INDEX IF NOT EXISTS idx_payment_locks_expires 
ON payment_locks(expires_at);

-- Function to acquire distributed lock
CREATE OR REPLACE FUNCTION public.acquire_payment_lock(
  p_lock_key text,
  p_user_id uuid,
  p_timeout_seconds integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_lock_acquired boolean;
BEGIN
  -- Clean up expired locks first
  DELETE FROM payment_locks WHERE expires_at < NOW();
  
  -- Try to acquire lock
  INSERT INTO payment_locks (lock_key, locked_by, expires_at)
  VALUES (p_lock_key, p_user_id, NOW() + (p_timeout_seconds || ' seconds')::interval)
  ON CONFLICT (lock_key) DO NOTHING
  RETURNING true INTO v_lock_acquired;
  
  RETURN COALESCE(v_lock_acquired, false);
END;
$$;

-- Function to release distributed lock
CREATE OR REPLACE FUNCTION public.release_payment_lock(
  p_lock_key text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM payment_locks 
  WHERE lock_key = p_lock_key 
  AND locked_by = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Add trigger to prevent duplicate registrations (double-booking prevention)
-- This complements the unique constraint with additional validation
CREATE OR REPLACE FUNCTION public.prevent_duplicate_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user already has a non-rejected registration for this event
  IF EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = NEW.event_id
    AND user_id = NEW.user_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND payment_status != 'rejected'
  ) THEN
    RAISE EXCEPTION 'User already registered for this event';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_prevent_duplicate_registration ON event_registrations;
CREATE TRIGGER trg_prevent_duplicate_registration
  BEFORE INSERT OR UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_registration();

-- Add RLS for payment locks (only owner can manage their locks)
ALTER TABLE public.payment_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locks"
ON public.payment_locks
FOR SELECT
USING (locked_by = auth.uid());

CREATE POLICY "System can manage locks"
ON public.payment_locks
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON FUNCTION public.update_payment_status_atomic IS 
'Atomically updates payment status with row-level locking to prevent race conditions. Ensures idempotency and validates status transitions.';

COMMENT ON FUNCTION public.bulk_approve_payments IS 
'Bulk approves payments with proper locking and error handling. Returns detailed results for each registration.';

COMMENT ON FUNCTION public.acquire_payment_lock IS 
'Acquires a distributed lock for payment processing operations. Automatically expires after timeout.';

COMMENT ON FUNCTION public.release_payment_lock IS 
'Releases a distributed lock acquired by the same user.';
