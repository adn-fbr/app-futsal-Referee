-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_pending_registrations();
DROP FUNCTION IF EXISTS public.get_registration_history();

-- Recreate get_pending_registrations with email
CREATE FUNCTION public.get_pending_registrations()
 RETURNS TABLE(id uuid, full_name text, email text, kabupaten_kota_id uuid, kabupaten_kota_name text, requested_role text, registration_status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE p.registration_status = 'pending'
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.created_at ASC;
$function$;

-- Recreate get_registration_history with email
CREATE FUNCTION public.get_registration_history()
 RETURNS TABLE(id uuid, full_name text, email text, kabupaten_kota_id uuid, kabupaten_kota_name text, requested_role text, registration_status text, rejected_reason text, approved_at timestamp with time zone, approved_by uuid, approver_name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.full_name,
    p.email,
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
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  LEFT JOIN public.profiles approver ON approver.id = p.approved_by
  WHERE p.registration_status IN ('approved', 'rejected')
    AND p.approved_at IS NOT NULL
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.approved_at DESC;
$function$;