-- Drop and recreate the function with correct column names
DROP FUNCTION IF EXISTS get_referee_income_summary(uuid, date, date);

CREATE OR REPLACE FUNCTION get_referee_income_summary(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE (
  referee_id uuid,
  referee_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  total_verified_income bigint,
  total_pending_income bigint,
  verified_count bigint,
  pending_count bigint,
  rejected_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as referee_id,
    p.full_name as referee_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0)::bigint as total_verified_income,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0)::bigint as total_pending_income,
    COUNT(*) FILTER (WHERE h.status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as pending_count,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as rejected_count
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
  LEFT JOIN public.honors h ON h.referee_id = p.id AND h.deleted_at IS NULL
  LEFT JOIN public.events e ON e.id = h.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.start_date >= _start_date OR h.event_id IS NULL)
    AND (_end_date IS NULL OR e.start_date <= _end_date OR h.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_verified_income DESC;
$$;