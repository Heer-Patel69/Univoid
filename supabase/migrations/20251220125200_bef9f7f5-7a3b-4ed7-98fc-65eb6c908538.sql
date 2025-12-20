-- Create efficient homepage stats function
CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_active_students integer;
  v_notes_shared integer;
  v_average_rating numeric;
BEGIN
  -- Get active students count (non-disabled profiles, excluding system accounts)
  SELECT COUNT(*)::integer INTO v_active_students
  FROM profiles
  WHERE is_disabled = false
    AND email NOT LIKE '%system%univoid%';
  
  -- Get approved materials count
  SELECT COUNT(*)::integer INTO v_notes_shared
  FROM materials
  WHERE status = 'approved';
  
  -- Fixed rating for now (can be replaced with actual feedback table later)
  v_average_rating := 4.9;
  
  RETURN jsonb_build_object(
    'active_students', v_active_students,
    'notes_shared', v_notes_shared,
    'average_rating', v_average_rating
  );
END;
$$;