
-- =====================================================
-- Migration Part 5: Add Missing Columns and Functions
-- =====================================================

-- Add missing columns to learning_materials
ALTER TABLE public.learning_materials 
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add missing columns to events (start_date, end_date)
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- Update existing events: copy date to start_date if start_date is null
UPDATE public.events SET start_date = date WHERE start_date IS NULL;
UPDATE public.events SET end_date = date WHERE end_date IS NULL;

-- Add missing columns to event_assignments
ALTER TABLE public.event_assignments 
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Create learning_progress table
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.learning_materials(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, material_id)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON public.learning_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON public.learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_material ON public.learning_progress(material_id);

-- =====================================================
-- Create get_referees function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_referees(
  _license_level text DEFAULT NULL,
  _is_active boolean DEFAULT NULL,
  _kabupaten_kota_id uuid DEFAULT NULL,
  _search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  birth_date date,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  license_level text,
  license_expiry date,
  profile_photo_url text,
  is_active boolean,
  is_profile_complete boolean,
  afk_origin text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.birth_date,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.license_level,
    p.license_expiry,
    p.profile_photo_url,
    COALESCE(p.is_active, true) as is_active,
    COALESCE(p.is_profile_complete, false) as is_profile_complete,
    p.afk_origin,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  INNER JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'wasit'
  WHERE 
    (p.deleted_at IS NULL)
    AND (_license_level IS NULL OR p.license_level = _license_level)
    AND (_is_active IS NULL OR COALESCE(p.is_active, true) = _is_active)
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_search IS NULL OR p.full_name ILIKE '%' || _search || '%')
  ORDER BY p.full_name;
$$;

-- =====================================================
-- Create get_audit_logs function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _action text DEFAULT NULL,
  _actor_id uuid DEFAULT NULL,
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  actor_id uuid,
  actor_name text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.actor_id,
    p.full_name as actor_name,
    al.old_data,
    al.new_data,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON al.actor_id = p.id
  WHERE 
    (_entity_type IS NULL OR al.entity_type = _entity_type)
    AND (_entity_id IS NULL OR al.entity_id = _entity_id)
    AND (_action IS NULL OR al.action = _action)
    AND (_actor_id IS NULL OR al.actor_id = _actor_id)
    AND (_start_date IS NULL OR al.created_at >= _start_date)
    AND (_end_date IS NULL OR al.created_at <= _end_date)
  ORDER BY al.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;

-- =====================================================
-- Create get_pending_registrations function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  requested_role text,
  registration_status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    u.email,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  WHERE p.registration_status = 'pending'
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC;
$$;

-- =====================================================
-- Create get_registration_history function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_registration_history()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  requested_role text,
  registration_status text,
  rejected_reason text,
  approved_at timestamptz,
  approved_by uuid,
  approver_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    u.email,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.rejected_reason,
    p.approved_at,
    p.approved_by,
    approver.full_name as approver_name,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  LEFT JOIN public.profiles approver ON p.approved_by = approver.id
  WHERE p.registration_status IN ('approved', 'rejected')
    AND p.deleted_at IS NULL
  ORDER BY p.approved_at DESC NULLS LAST, p.created_at DESC;
$$;

-- =====================================================
-- Create get_admin_dashboard_summary function
-- =====================================================
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH referee_counts AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE COALESCE(p.is_active, true) = true) as active_count
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'wasit'
    WHERE p.deleted_at IS NULL
      AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  ),
  event_counts AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE e.status = 'SELESAI') as completed_count
    FROM public.events e
    WHERE e.deleted_at IS NULL
      AND (_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.start_date >= _start_date)
      AND (_end_date IS NULL OR e.start_date <= _end_date)
  ),
  honor_sums AS (
    SELECT 
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as verified_sum,
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'pending'), 0) as pending_sum
    FROM public.honors h
    INNER JOIN public.profiles p ON h.referee_id = p.id
    WHERE h.deleted_at IS NULL
      AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  )
  SELECT 
    rc.total as total_referees,
    rc.active_count as active_referees,
    ec.total as total_events,
    ec.completed_count as completed_events,
    hs.verified_sum as total_verified_income,
    hs.pending_sum as total_pending_income,
    CASE WHEN rc.active_count > 0 THEN hs.verified_sum / rc.active_count ELSE 0 END as avg_income_per_referee
  FROM referee_counts rc, event_counts ec, honor_sums hs;
$$;

-- =====================================================
-- Create get_referee_income_summary function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_referee_income_summary(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE (
  referee_id uuid,
  referee_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  total_verified_income numeric,
  total_pending_income numeric,
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
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_verified_income,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'pending'), 0) as total_pending_income,
    COUNT(*) FILTER (WHERE h.status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE h.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as rejected_count
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'wasit'
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  LEFT JOIN public.honors h ON p.id = h.referee_id AND h.deleted_at IS NULL
  WHERE p.deleted_at IS NULL
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_verified_income DESC;
$$;

-- =====================================================
-- Create get_referee_event_count function
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_referee_event_count(
  _kabupaten_kota_id uuid DEFAULT NULL,
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE (
  referee_id uuid,
  referee_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  total_events bigint,
  completed_events bigint,
  pending_events bigint,
  cancelled_events bigint
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
    COUNT(ea.id) as total_events,
    COUNT(*) FILTER (WHERE e.status = 'SELESAI') as completed_events,
    COUNT(*) FILTER (WHERE ea.status = 'pending') as pending_events,
    COUNT(*) FILTER (WHERE ea.status = 'cancelled') as cancelled_events
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id AND ur.role = 'wasit'
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  LEFT JOIN public.event_assignments ea ON p.id = ea.referee_id AND ea.deleted_at IS NULL
  LEFT JOIN public.events e ON ea.event_id = e.id AND e.deleted_at IS NULL
  WHERE p.deleted_at IS NULL
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.start_date >= _start_date OR e.start_date IS NULL)
    AND (_end_date IS NULL OR e.start_date <= _end_date OR e.start_date IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_events DESC;
$$;

-- =====================================================
-- Create increment_view_count function for discussions
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_view_count(topic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discussion_topics
  SET views_count = views_count + 1
  WHERE id = topic_id;
END;
$$;
