-- Drop and recreate get_admin_dashboard_summary to use start_date instead of date
DROP FUNCTION IF EXISTS public.get_admin_dashboard_summary(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE (
  total_referees bigint,
  active_referees bigint,
  total_events bigint,
  completed_events bigint,
  total_verified_income numeric,
  total_pending_income numeric,
  avg_income_per_referee numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles p 
     WHERE p.deleted_at IS NULL 
     AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id))::bigint as total_referees,
    
    (SELECT COUNT(*) FROM profiles p 
     WHERE p.deleted_at IS NULL 
     AND p.is_active = true
     AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id))::bigint as active_referees,
    
    (SELECT COUNT(*) FROM events e 
     WHERE e.deleted_at IS NULL
     AND (_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = _kabupaten_kota_id)
     AND (_start_date IS NULL OR e.start_date >= _start_date)
     AND (_end_date IS NULL OR e.start_date <= _end_date))::bigint as total_events,
    
    (SELECT COUNT(*) FROM events e 
     WHERE e.deleted_at IS NULL 
     AND e.status = 'SELESAI'
     AND (_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = _kabupaten_kota_id)
     AND (_start_date IS NULL OR e.start_date >= _start_date)
     AND (_end_date IS NULL OR e.start_date <= _end_date))::bigint as completed_events,
    
    COALESCE((SELECT SUM(h.amount) FROM honors h
     JOIN profiles p ON h.referee_id = p.id
     WHERE h.deleted_at IS NULL 
     AND h.status = 'verified'
     AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
     AND (_start_date IS NULL OR h.created_at::date >= _start_date)
     AND (_end_date IS NULL OR h.created_at::date <= _end_date)), 0)::numeric as total_verified_income,
    
    COALESCE((SELECT SUM(h.amount) FROM honors h
     JOIN profiles p ON h.referee_id = p.id
     WHERE h.deleted_at IS NULL 
     AND h.status = 'pending'
     AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
     AND (_start_date IS NULL OR h.created_at::date >= _start_date)
     AND (_end_date IS NULL OR h.created_at::date <= _end_date)), 0)::numeric as total_pending_income,
    
    COALESCE((SELECT AVG(total) FROM (
      SELECT SUM(h.amount) as total FROM honors h
      JOIN profiles p ON h.referee_id = p.id
      WHERE h.deleted_at IS NULL 
      AND h.status = 'verified'
      AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR h.created_at::date >= _start_date)
      AND (_end_date IS NULL OR h.created_at::date <= _end_date)
      GROUP BY h.referee_id
    ) sub), 0)::numeric as avg_income_per_referee;
END;
$$;