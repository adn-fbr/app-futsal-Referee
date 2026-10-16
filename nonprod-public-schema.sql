


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_role" AS ENUM (
    'admin_provinsi',
    'admin_kab_kota',
    'panitia',
    'wasit',
    'evaluator'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."pengurus_level" AS ENUM (
    'PROVINSI',
    'KAB_KOTA'
);


ALTER TYPE "public"."pengurus_level" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_mark_expired_cards"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update cards that are active but past expiry
  UPDATE referee_cards
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND expires_at < now()
    AND expires_at IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'cards_marked_expired', updated_count,
    'executed_at', now()
  );
END;
$$;


ALTER FUNCTION "public"."auto_mark_expired_cards"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    is_admin_provinsi(_user_id)
    OR (has_role(_user_id, 'admin_kab_kota') AND get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
    OR (get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
$$;


ALTER FUNCTION "public"."can_access_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_approve_registration"("_admin_id" "uuid", "_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    is_admin_provinsi(_admin_id)
    OR (
      has_role(_admin_id, 'admin_kab_kota') 
      AND (
        SELECT kabupaten_kota_id FROM public.profiles WHERE id = _user_id
      ) = get_user_kabupaten_kota(_admin_id)
    )
$$;


ALTER FUNCTION "public"."can_approve_registration"("_admin_id" "uuid", "_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_duplicate_event"("p_kota_id" "text", "p_location" "text", "p_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
	SELECT
		p_kota_id IS NOT NULL
		AND p_location IS NOT NULL
		AND p_name IS NOT NULL
		AND EXISTS (
			SELECT 1
			FROM public.events AS e
			WHERE e.kabupaten_kota_id::text = p_kota_id
				AND e.location = p_location
				AND e.name = p_name
		);
$$;


ALTER FUNCTION "public"."check_duplicate_event"("p_kota_id" "text", "p_location" "text", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_referee_cards"("p_search" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "sql" STABLE
    AS $$
  select count(*)
  from referee_cards rc
  join profiles p on p.id = rc.referee_id
  where
    (p_search is null
      or rc.card_number ilike '%' || p_search || '%'
      or p.full_name ilike '%' || p_search || '%'
    )
    and (p_status is null or rc.status = p_status);
$$;


ALTER FUNCTION "public"."count_referee_cards"("p_search" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_referees"("_license_level" "text" DEFAULT NULL::"text", "_is_active" boolean DEFAULT NULL::boolean, "_kabupaten_kota_id" "uuid" DEFAULT NULL::"uuid", "_search" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)
  from profiles p
  join user_roles ur
    on ur.user_id = p.id
   and ur.role = 'wasit'
  where
    (
      auth.role() = 'authenticated'
      or p.is_active = true
    )
    and (_license_level is null or p.license_level = _license_level)
    and (_is_active is null or p.is_active = _is_active)
    and (_kabupaten_kota_id is null or p.kabupaten_kota_id = _kabupaten_kota_id)
    and (
      _search is null
      or p.full_name ilike '%' || _search || '%'
      or p.license_level ilike '%' || _search || '%'
      or p.afk_origin ilike '%' || _search || '%'
    );
$$;


ALTER FUNCTION "public"."count_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_card_number"("p_referee_id" "uuid") RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_year INTEGER;
  v_region_code VARCHAR(10);
  v_sequence INTEGER;
  v_card_number VARCHAR(30);
BEGIN
  v_year := EXTRACT(YEAR FROM now());
  
  -- Get region code from kabupaten_kota
  SELECT COALESCE(UPPER(SUBSTRING(kk.code FROM 1 FOR 3)), 'XXX')
  INTO v_region_code
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON p.kabupaten_kota_id = kk.id
  WHERE p.id = p_referee_id;
  
  IF v_region_code IS NULL THEN
    v_region_code := 'XXX';
  END IF;
  
  -- Get next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(card_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.referee_cards
  WHERE card_number LIKE 'AFP SULSEL-' || v_year || '-' || v_region_code || '-%';
  
  v_card_number := 'AFP SULSEL-' || v_year || '-' || v_region_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_card_number;
END;
$_$;


ALTER FUNCTION "public"."generate_card_number"("p_referee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accessible_regions"("_user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT CASE 
    WHEN is_admin_provinsi(_user_id) THEN 
      (SELECT id FROM public.kabupaten_kota)
    ELSE 
      (SELECT get_user_kabupaten_kota(_user_id))
  END
$$;


ALTER FUNCTION "public"."get_accessible_regions"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_summary"("_kabupaten_kota_id" "uuid" DEFAULT NULL::"uuid", "_start_date" "date" DEFAULT NULL::"date", "_end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("total_referees" bigint, "active_referees" bigint, "total_events" bigint, "completed_events" bigint, "total_verified_income" bigint, "total_pending_income" bigint, "avg_income_per_referee" numeric)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH referee_stats AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_referees,
      COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) as active_referees
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
    WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  ),
  event_stats AS (
    SELECT 
      COUNT(DISTINCT e.id) as total_events,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'SELESAI') as completed_events
    FROM public.events e
    WHERE (_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.date >= _start_date)
      AND (_end_date IS NULL OR e.date <= _end_date)
  ),
  income_stats AS (
    SELECT 
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_verified_income,
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as total_pending_income
    FROM public.honors h
    LEFT JOIN public.events e ON e.id = h.event_id
    LEFT JOIN public.profiles p ON p.id = h.referee_id
    WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.date >= _start_date OR h.event_id IS NULL)
      AND (_end_date IS NULL OR e.date <= _end_date OR h.event_id IS NULL)
  )
  SELECT 
    rs.total_referees,
    rs.active_referees,
    es.total_events,
    es.completed_events,
    ins.total_verified_income::bigint,
    ins.total_pending_income::bigint,
    CASE WHEN rs.total_referees > 0 
      THEN ROUND(ins.total_verified_income::numeric / rs.total_referees, 2)
      ELSE 0 
    END as avg_income_per_referee
  FROM referee_stats rs, event_stats es, income_stats ins;
$$;


ALTER FUNCTION "public"."get_admin_dashboard_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_audit_logs"("_entity_type" "text" DEFAULT NULL::"text", "_entity_id" "uuid" DEFAULT NULL::"uuid", "_action" "text" DEFAULT NULL::"text", "_actor_id" "uuid" DEFAULT NULL::"uuid", "_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "_limit" integer DEFAULT 100, "_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "action" "text", "entity_type" "text", "entity_id" "uuid", "actor_id" "uuid", "actor_name" "text", "old_data" "jsonb", "new_data" "jsonb", "metadata" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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
  LEFT JOIN public.profiles p ON p.id = al.actor_id
  WHERE (_entity_type IS NULL OR al.entity_type = _entity_type)
    AND (_entity_id IS NULL OR al.entity_id = _entity_id)
    AND (_action IS NULL OR al.action = _action)
    AND (_actor_id IS NULL OR al.actor_id = _actor_id)
    AND (_start_date IS NULL OR al.created_at >= _start_date)
    AND (_end_date IS NULL OR al.created_at <= _end_date)
  ORDER BY al.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;


ALTER FUNCTION "public"."get_audit_logs"("_entity_type" "text", "_entity_id" "uuid", "_action" "text", "_actor_id" "uuid", "_start_date" timestamp with time zone, "_end_date" timestamp with time zone, "_limit" integer, "_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_honor_statistics"("_referee_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("referee_id" "uuid", "total_verified" bigint, "total_pending" bigint, "total_rejected" bigint, "total_earned" bigint, "pending_amount" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    h.referee_id,
    COUNT(*) FILTER (WHERE h.status = 'verified') as total_verified,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as total_pending,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as total_rejected,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_earned,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as pending_amount
  FROM public.honors h
  WHERE (_referee_id IS NULL OR h.referee_id = _referee_id)
  GROUP BY h.referee_id
$$;


ALTER FUNCTION "public"."get_honor_statistics"("_referee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_referee_event_count"("_start_date" "date" DEFAULT NULL::"date", "_end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("referee_id" "uuid", "referee_name" "text", "total_events" bigint, "completed_events" bigint, "pending_events" bigint, "cancelled_events" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    p.id AS referee_id,
    p.full_name AS referee_name,

    COUNT(DISTINCT e.id) AS total_events,

    COUNT(DISTINCT e.id)
      FILTER (WHERE ea.status = 'completed') AS completed_events,

    COUNT(DISTINCT e.id)
      FILTER (WHERE ea.status IN ('pending', 'confirmed')) AS pending_events,

    COUNT(DISTINCT e.id)
      FILTER (WHERE ea.status = 'cancelled') AS cancelled_events

  FROM profiles p
  JOIN user_roles ur
    ON ur.user_id = p.id
   AND ur.role = 'wasit'

  LEFT JOIN event_assignments ea
    ON ea.referee_id = p.id

  LEFT JOIN events e
    ON e.id = ea.event_id
   AND (_start_date IS NULL OR e.start_date >= _start_date)
   AND (_end_date IS NULL OR e.start_date <= _end_date)

  WHERE p.id = auth.uid()

  GROUP BY
    p.id,
    p.full_name;
$$;


ALTER FUNCTION "public"."get_my_referee_event_count"("_start_date" "date", "_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_registrations"() RETURNS TABLE("id" "uuid", "full_name" "text", "kabupaten_kota_id" "uuid", "kabupaten_kota_name" "text", "requested_role" "text", "registration_status" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    p.id,
    p.full_name,
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
$$;


ALTER FUNCTION "public"."get_pending_registrations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_referee"("_referee_id" "uuid") RETURNS TABLE("id" "uuid", "full_name" "text", "profile_photo_url" "text", "license_level" "text", "afk_origin" "text", "kabupaten_kota_name" "text", "is_active" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.afk_origin,
    kk.name as kabupaten_kota_name,
    coalesce(p.is_active, true) as is_active
  from public.profiles p
  left join public.kabupaten_kota kk on p.kabupaten_kota_id = kk.id
  inner join public.user_roles ur on p.id = ur.user_id and ur.role = 'wasit'
  where
    p.id = _referee_id
    and p.deleted_at is null
    and p.registration_status = 'approved'
    and coalesce(p.is_profile_complete, false) = true
  limit 1;
$$;


ALTER FUNCTION "public"."get_public_referee"("_referee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_referees"("_search" "text" DEFAULT NULL::"text", "_is_active" boolean DEFAULT true) RETURNS TABLE("id" "uuid", "full_name" "text", "profile_photo_url" "text", "license_level" "text", "afk_origin" "text", "kabupaten_kota_name" "text", "is_active" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.afk_origin,
    kk.name as kabupaten_kota_name,
    coalesce(p.is_active, true) as is_active
  from public.profiles p
  left join public.kabupaten_kota kk on p.kabupaten_kota_id = kk.id
  inner join public.user_roles ur on p.id = ur.user_id and ur.role = 'wasit'
  where
    p.deleted_at is null
    and p.registration_status = 'approved'
    and coalesce(p.is_profile_complete, false) = true
    and (_is_active is null or coalesce(p.is_active, true) = _is_active)
    and (_search is null or p.full_name ilike '%' || _search || '%')
  order by p.full_name;
$$;


ALTER FUNCTION "public"."get_public_referees"("_search" "text", "_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_referee_event_count"("_kabupaten_kota_id" "uuid" DEFAULT NULL::"uuid", "_start_date" "date" DEFAULT NULL::"date", "_end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("referee_id" "uuid", "referee_name" "text", "kabupaten_kota_id" "uuid", "kabupaten_kota_name" "text", "total_events" bigint, "completed_events" bigint, "pending_events" bigint, "cancelled_events" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    p.id as referee_id,
    p.full_name as referee_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    COUNT(DISTINCT ea.event_id) as total_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'completed') as completed_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'pending' OR ea.status = 'confirmed') as pending_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'cancelled') as cancelled_events
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
  LEFT JOIN public.event_assignments ea ON ea.referee_id = p.id
  LEFT JOIN public.events e ON e.id = ea.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.date >= _start_date OR ea.event_id IS NULL)
    AND (_end_date IS NULL OR e.date <= _end_date OR ea.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_events DESC;
$$;


ALTER FUNCTION "public"."get_referee_event_count"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_referee_income_summary"("_kabupaten_kota_id" "uuid" DEFAULT NULL::"uuid", "_start_date" "date" DEFAULT NULL::"date", "_end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("referee_id" "uuid", "referee_name" "text", "kabupaten_kota_id" "uuid", "kabupaten_kota_name" "text", "total_verified_income" bigint, "total_pending_income" bigint, "verified_count" bigint, "pending_count" bigint, "rejected_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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
  LEFT JOIN public.honors h ON h.referee_id = p.id
  LEFT JOIN public.events e ON e.id = h.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.date >= _start_date OR h.event_id IS NULL)
    AND (_end_date IS NULL OR e.date <= _end_date OR h.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_verified_income DESC;
$$;


ALTER FUNCTION "public"."get_referee_income_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_referees"("_license_level" "text" DEFAULT NULL::"text", "_is_active" boolean DEFAULT NULL::boolean, "_kabupaten_kota_id" "uuid" DEFAULT NULL::"uuid", "_search" "text" DEFAULT NULL::"text", "_limit" integer DEFAULT NULL::integer, "_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "full_name" "text", "birth_date" "date", "kabupaten_kota_id" "uuid", "license_level" "text", "license_expiry" "date", "profile_photo_url" "text", "is_active" boolean, "is_profile_complete" boolean, "afk_origin" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id,
    p.full_name,
    p.birth_date,
    p.kabupaten_kota_id,
    p.license_level,
    p.license_expiry,
    p.profile_photo_url,
    p.is_active,
    p.is_profile_complete,
    p.afk_origin,
    p.created_at
  from profiles p
  join user_roles ur
    on ur.user_id = p.id
   and ur.role = 'wasit'
  where
    -- 🔐 public vs authenticated
    (
      auth.role() = 'authenticated'
      or p.is_active = true
    )
    -- filters
    and (_license_level is null or p.license_level = _license_level)
    and (_is_active is null or p.is_active = _is_active)
    and (_kabupaten_kota_id is null or p.kabupaten_kota_id = _kabupaten_kota_id)
    and (
      _search is null
      or p.full_name ilike '%' || _search || '%'
      or p.license_level ilike '%' || _search || '%'
      or p.afk_origin ilike '%' || _search || '%'
    )
  order by p.created_at desc
  limit _limit
  offset _offset;
$$;


ALTER FUNCTION "public"."get_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text", "_limit" integer, "_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_registration_history"() RETURNS TABLE("id" "uuid", "full_name" "text", "kabupaten_kota_id" "uuid", "kabupaten_kota_name" "text", "requested_role" "text", "registration_status" "text", "rejected_reason" "text", "approved_at" timestamp with time zone, "approved_by" "uuid", "approver_name" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    p.id,
    p.full_name,
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
$$;


ALTER FUNCTION "public"."get_registration_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_kabupaten_kota"("_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT kabupaten_kota_id
  FROM public.profiles
  WHERE id = _user_id
$$;


ALTER FUNCTION "public"."get_user_kabupaten_kota"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_kabupaten_kota_id"("_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT kabupaten_kota_id
  FROM public.profiles
  WHERE id = _user_id
$$;


ALTER FUNCTION "public"."get_user_kabupaten_kota_id"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_honor_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.status IN ('verified', 'rejected') AND OLD.status != NEW.status THEN
    NEW.verified_at = now();
  END IF;
  
  IF NEW.status = 'draft' AND OLD.status != 'draft' THEN
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_honor_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    kabupaten_kota_id,
    requested_role,
    registration_status,
    is_profile_complete,
    is_active
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    (new.raw_user_meta_data->>'kabupaten_kota_id')::uuid,
    new.raw_user_meta_data->>'requested_role',
    'pending',
    false,
    true
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_schedule_conflict"("_referee_id" "uuid", "_event_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_assignments ea
    INNER JOIN public.events e ON e.id = ea.event_id
    WHERE ea.referee_id = _referee_id
      AND ea.event_id != _event_id
      AND e.date = (SELECT date FROM public.events WHERE id = _event_id)
      AND ea.status != 'cancelled'
  )
$$;


ALTER FUNCTION "public"."has_schedule_conflict"("_referee_id" "uuid", "_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin_provinsi'::app_role, 'admin_kab_kota'::app_role)
  )
$$;


ALTER FUNCTION "public"."is_admin"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_kab_kota"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_kab_kota'
  )
$$;


ALTER FUNCTION "public"."is_admin_kab_kota"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_provinsi"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_provinsi'::app_role
  )
$$;


ALTER FUNCTION "public"."is_admin_provinsi"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_event_approved"("_event_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND status = 'DISETUJUI'
  )
$$;


ALTER FUNCTION "public"."is_event_approved"("_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_referee_active"("_referee_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _referee_id
      AND ur.role = 'wasit'
      AND p.is_active = true
  )
$$;


ALTER FUNCTION "public"."is_referee_active"("_referee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_same_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id 
    AND kabupaten_kota_id = _kabupaten_kota_id
  )
$$;


ALTER FUNCTION "public"."is_same_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_event_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_action text;
begin
  -- Fallback action jika NULL
  v_action := coalesce(new.action, new.status, 'approval');

  insert into public.activity_logs (
    actor_id,
    entity,
    entity_id,
    action,
    metadata,
    created_at
  )
  values (
    new.approved_by,
    'event',
    new.event_id,
    v_action,
    jsonb_build_object(
      'status', new.status,
      'notes', new.notes
    ),
    now()
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."log_event_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_honor_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
    VALUES (
      CASE 
        WHEN NEW.status = 'submitted' THEN 'HONOR_SUBMITTED'
        WHEN NEW.status = 'verified' THEN 'HONOR_VERIFIED'
        WHEN NEW.status = 'rejected' THEN 'HONOR_REJECTED'
        ELSE 'HONOR_STATUS_CHANGED'
      END,
      'honors',
      NEW.id,
      COALESCE(NEW.verified_by, auth.uid()),
      jsonb_build_object('status', OLD.status, 'amount', OLD.amount),
      jsonb_build_object('status', NEW.status, 'amount', NEW.amount),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'notes', NEW.notes)
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_honor_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_referee_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, new_data, metadata)
    VALUES (
      'REFEREE_ASSIGNED',
      'event_assignments',
      NEW.id,
      auth.uid(),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'role', NEW.role, 'status', NEW.status),
      jsonb_build_object('event_id', NEW.event_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
      VALUES (
        'REFEREE_ASSIGNMENT_UPDATED',
        'event_assignments',
        NEW.id,
        auth.uid(),
        jsonb_build_object('status', OLD.status, 'role', OLD.role),
        jsonb_build_object('status', NEW.status, 'role', NEW.role),
        jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, metadata)
    VALUES (
      'REFEREE_UNASSIGNED',
      'event_assignments',
      OLD.id,
      auth.uid(),
      jsonb_build_object('referee_id', OLD.referee_id, 'event_id', OLD.event_id, 'role', OLD.role, 'status', OLD.status),
      jsonb_build_object('event_id', OLD.event_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_referee_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_registration_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.registration_status IS DISTINCT FROM NEW.registration_status 
     AND NEW.registration_status IN ('approved', 'rejected') THEN
    INSERT INTO public.audit_logs (
      action, 
      entity_type, 
      entity_id, 
      actor_id, 
      old_data, 
      new_data, 
      metadata
    )
    VALUES (
      CASE 
        WHEN NEW.registration_status = 'approved' THEN 'REGISTRATION_APPROVED'
        WHEN NEW.registration_status = 'rejected' THEN 'REGISTRATION_REJECTED'
        ELSE 'REGISTRATION_STATUS_CHANGED'
      END,
      'profiles',
      NEW.id,
      COALESCE(NEW.approved_by, auth.uid()),
      jsonb_build_object('status', OLD.registration_status),
      jsonb_build_object(
        'status', NEW.registration_status, 
        'rejected_reason', NEW.rejected_reason
      ),
      jsonb_build_object(
        'full_name', NEW.full_name, 
        'requested_role', NEW.requested_role,
        'kabupaten_kota_id', NEW.kabupaten_kota_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_registration_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_hard_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  EXECUTE format('UPDATE %I.%I SET deleted_at = now() WHERE id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
  USING OLD.id;
  
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data)
  VALUES (
    'SOFT_DELETE',
    TG_TABLE_NAME,
    OLD.id,
    auth.uid(),
    to_jsonb(OLD)
  );
  
  RETURN NULL;
END;
$_$;


ALTER FUNCTION "public"."prevent_hard_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_issued_annual_report_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF OLD.lifecycle_status IN ('issued', 'revoked') THEN
        IF NEW.document_number IS DISTINCT FROM OLD.document_number
           OR NEW.report_year IS DISTINCT FROM OLD.report_year
           OR NEW.scope_type IS DISTINCT FROM OLD.scope_type
           OR NEW.scope_id IS DISTINCT FROM OLD.scope_id
           OR NEW.snapshot_payload IS DISTINCT FROM OLD.snapshot_payload
           OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
           OR NEW.validation_token IS DISTINCT FROM OLD.validation_token
           OR NEW.created_by IS DISTINCT FROM OLD.created_by
           OR NEW.created_at IS DISTINCT FROM OLD.created_at
           OR NEW.issued_at IS DISTINCT FROM OLD.issued_at THEN
            RAISE EXCEPTION 'Issued annual reports are immutable';
        END IF;
    END IF;

    IF OLD.lifecycle_status = 'revoked' AND NEW.lifecycle_status IS DISTINCT FROM 'revoked' THEN
        RAISE EXCEPTION 'Revoked annual reports cannot leave revoked state';
    END IF;

    IF OLD.lifecycle_status = 'draft' AND NEW.lifecycle_status NOT IN ('draft', 'generated') THEN
        RAISE EXCEPTION 'Draft annual report can only transition to generated';
    END IF;

    IF OLD.lifecycle_status = 'generated' AND NEW.lifecycle_status NOT IN ('generated', 'issued') THEN
        RAISE EXCEPTION 'Generated annual report can only remain generated or transition to issued';
    END IF;

    IF OLD.lifecycle_status = 'issued' AND NEW.lifecycle_status NOT IN ('issued', 'revoked') THEN
        RAISE EXCEPTION 'Issued annual report can only remain issued or transition to revoked';
    END IF;

    IF NEW.lifecycle_status = 'issued' AND NEW.issued_at IS NULL THEN
        RAISE EXCEPTION 'Issued annual report requires issued_at';
    END IF;

    IF NEW.lifecycle_status = 'revoked' AND (NEW.revoked_at IS NULL OR NEW.revoked_by IS NULL) THEN
        RAISE EXCEPTION 'Revoked annual report requires revoked_at and revoked_by';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_issued_annual_report_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_referee_cards"("p_search" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "referee_id" "uuid", "card_number" "text", "issued_at" timestamp with time zone, "expires_at" timestamp with time zone, "status" "text", "last_verified_at" timestamp with time zone, "verification_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "full_name" "text", "profile_photo_url" "text", "license_level" "text", "license_expiry" "date", "afk_origin" "text", "is_active" boolean, "kabupaten_kota_name" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select
    rc.id,
    rc.referee_id,
    rc.card_number,
    rc.issued_at,
    rc.expires_at,
    rc.status,
    rc.last_verified_at,
    rc.verification_count,
    rc.created_at,
    rc.updated_at,

    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.license_expiry,
    p.afk_origin,
    p.is_active,
    kk.name as kabupaten_kota_name
  from referee_cards rc
  join profiles p on p.id = rc.referee_id
  left join kabupaten_kota kk on kk.id = p.kabupaten_kota_id
  where
    (p_search is null
      or rc.card_number ilike '%' || p_search || '%'
      or p.full_name ilike '%' || p_search || '%'
    )
    and (p_status is null or rc.status = p_status)
  order by rc.created_at desc
  limit p_limit
  offset p_offset;
$$;


ALTER FUNCTION "public"."search_referee_cards"("p_search" "text", "p_status" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_referee_cards"("search" "text" DEFAULT NULL::"text", "is_active" boolean DEFAULT NULL::boolean, "license_level" "text" DEFAULT NULL::"text", "page" integer DEFAULT 1, "page_size" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "full_name" "text", "license_level" "text", "is_active" boolean, "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with base as (
    select
      p.id,
      p.full_name,
      p.license_level,
      p.is_active,
      p.created_at
    from profiles p
    join user_roles ur on ur.user_id = p.id
    where ur.role = 'wasit'
      and (search is null or p.full_name ilike '%' || search || '%')
      and (is_active is null or p.is_active = is_active)
      and (license_level is null or p.license_level = license_level)
  )
  select
    *,
    count(*) over() as total_count
  from base
  order by created_at desc
  limit page_size
  offset (page - 1) * page_size;
$$;


ALTER FUNCTION "public"."search_referee_cards"("search" "text", "is_active" boolean, "license_level" "text", "page" integer, "page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_record"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."soft_delete_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_card_expiry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only update if license_expiry actually changed
  IF OLD.license_expiry IS DISTINCT FROM NEW.license_expiry THEN
    UPDATE referee_cards
    SET expires_at = NEW.license_expiry,
        updated_at = now()
    WHERE referee_id = NEW.id
      AND status != 'revoked'; -- Don't update revoked cards
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_card_expiry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_topic_reply_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussion_topics 
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussion_topics 
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.topic_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_topic_reply_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_honor_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.event_assignments
        WHERE event_id = NEW.event_id
          AND referee_id = NEW.referee_id
          AND status != 'cancelled'
      ) THEN
        RAISE EXCEPTION 'Wasit tidak ditugaskan ke event ini';
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'draft' AND NEW.amount != OLD.amount THEN
      RAISE EXCEPTION 'Tidak dapat mengubah jumlah honor setelah disubmit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_honor_submission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_referee_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_event_approved(NEW.event_id) THEN
    RAISE EXCEPTION 'Cannot assign referee to unapproved event';
  END IF;
  
  IF NOT is_referee_active(NEW.referee_id) THEN
    RAISE EXCEPTION 'Cannot assign inactive referee';
  END IF;
  
  IF has_schedule_conflict(NEW.referee_id, NEW.event_id) THEN
    RAISE EXCEPTION 'Referee has schedule conflict on this date';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_referee_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_regional_access"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  _user_id uuid := auth.uid();
  _target_region uuid;
BEGIN
  _target_region := COALESCE(NEW.kabupaten_kota_id, OLD.kabupaten_kota_id);
  
  IF is_admin_provinsi(_user_id) THEN
    RETURN NEW;
  END IF;
  
  IF has_role(_user_id, 'admin_kab_kota') THEN
    IF _target_region IS NOT NULL AND _target_region != get_user_kabupaten_kota(_user_id) THEN
      RAISE EXCEPTION 'Tidak dapat mengakses data wilayah lain';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_regional_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_referee_card"("p_code" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_card record;
  v_is_expired boolean := false;
  v_message text := null;
  v_valid boolean := true;
  v_payload jsonb;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valid', false, 'message', 'Kode verifikasi kosong');
  end if;

  select
    rc.id,
    rc.referee_id,
    rc.card_number,
    rc.issued_at,
    rc.expires_at,
    rc.status,
    rc.last_verified_at,
    rc.verification_count,
    rc.created_at,
    rc.updated_at,
    p.full_name,
    p.profile_photo_url,
    p.license_level,
    p.license_expiry,
    p.afk_origin,
    coalesce(p.is_active, true) as referee_is_active,
    kk.name as kabupaten_kota_name
  into v_card
  from public.referee_cards rc
  join public.profiles p on p.id = rc.referee_id
  left join public.kabupaten_kota kk on kk.id = p.kabupaten_kota_id
  where rc.verification_code = p_code
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Kartu tidak ditemukan');
  end if;

  -- status checks
  if v_card.status = 'revoked' then
    v_valid := false;
    v_message := 'Kartu ini telah dicabut';
  elsif v_card.status = 'suspended' then
    v_valid := false;
    v_message := 'Kartu ini sedang disuspend';
  elsif v_card.status = 'expired' then
    v_valid := false;
    v_message := 'Kartu ini sudah kadaluarsa';
  end if;

  -- expiry check
  if v_valid and v_card.expires_at is not null and v_card.expires_at < now() then
    v_valid := false;
    v_message := 'Kartu ini sudah kadaluarsa';
  end if;

  -- Always log the verification attempt (even if invalid)
  insert into public.card_verification_logs (card_id)
  values (v_card.id);

  -- Update counters regardless (still useful for monitoring), but keep it simple
  update public.referee_cards
  set
    verification_count = coalesce(v_card.verification_count, 0) + 1,
    last_verified_at = now(),
    updated_at = now()
  where id = v_card.id;

  v_payload := jsonb_build_object(
    'id', v_card.id,
    'referee_id', v_card.referee_id,
    'card_number', v_card.card_number,
    'issued_at', v_card.issued_at,
    'expires_at', v_card.expires_at,
    'status', v_card.status,
    'last_verified_at', v_card.last_verified_at,
    'verification_count', coalesce(v_card.verification_count, 0) + 1,
    'created_at', v_card.created_at,
    'updated_at', v_card.updated_at,
    'referee', jsonb_build_object(
      'id', v_card.referee_id,
      'full_name', v_card.full_name,
      'profile_photo_url', v_card.profile_photo_url,
      'license_level', v_card.license_level,
      'license_expiry', v_card.license_expiry,
      'afk_origin', v_card.afk_origin,
      'is_active', v_card.referee_is_active,
      'kabupaten_kota', jsonb_build_object('name', v_card.kabupaten_kota_name)
    )
  );

  return jsonb_build_object(
    'valid', v_valid,
    'message', v_message,
    'card', v_payload
  );
end;
$$;


ALTER FUNCTION "public"."verify_referee_card"("p_code" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "date" "date" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "location" "text",
    "category" "text",
    "description" "text",
    "status" "text" DEFAULT 'DIAJUKAN'::"text",
    "kabupaten_kota_id" "uuid",
    "created_by" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['DIAJUKAN'::"text", 'DISETUJUI'::"text", 'DITOLAK'::"text", 'SELESAI'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_events" WITH ("security_invoker"='on') AS
 SELECT "id",
    "name",
    "date",
    "start_date",
    "end_date",
    "location",
    "category",
    "description",
    "status",
    "kabupaten_kota_id",
    "created_by",
    "deleted_at",
    "created_at",
    "updated_at"
   FROM "public"."events"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "public"."active_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."honors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "amount" integer NOT NULL,
    "status" "text",
    "notes" "text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."honors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_honors" WITH ("security_invoker"='on') AS
 SELECT "id",
    "referee_id",
    "event_id",
    "amount",
    "status",
    "notes",
    "verified_by",
    "verified_at",
    "deleted_at",
    "created_at",
    "updated_at"
   FROM "public"."honors"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "public"."active_honors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "entity" "text" NOT NULL,
    "entity_id" "uuid",
    "action" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annual_report_public_validations" (
    "report_id" "uuid" NOT NULL,
    "validation_token" "text" NOT NULL,
    "document_number" "text" NOT NULL,
    "report_year" integer NOT NULL,
    "scope_type" "text" NOT NULL,
    "scope_id" "uuid" NOT NULL,
    "lifecycle_status" "text" NOT NULL,
    "content_hash" "text" NOT NULL,
    "issued_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "annual_report_public_validations_content_hash_check" CHECK (("content_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "annual_report_public_validations_lifecycle_status_check" CHECK (("lifecycle_status" = ANY (ARRAY['issued'::"text", 'revoked'::"text"]))),
    CONSTRAINT "annual_report_public_validations_report_year_check" CHECK ((("report_year" >= 2000) AND ("report_year" <= 2100))),
    CONSTRAINT "annual_report_public_validations_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['province'::"text", 'kabupaten_kota'::"text"])))
);


ALTER TABLE "public"."annual_report_public_validations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annual_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_number" "text" NOT NULL,
    "report_year" integer NOT NULL,
    "scope_type" "text" NOT NULL,
    "scope_id" "uuid" NOT NULL,
    "lifecycle_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "snapshot_payload" "jsonb" NOT NULL,
    "content_hash" "text" NOT NULL,
    "validation_token" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "issued_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    CONSTRAINT "annual_reports_content_hash_check" CHECK (("content_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "annual_reports_issue_consistency" CHECK (((("lifecycle_status" = ANY (ARRAY['draft'::"text", 'generated'::"text"])) AND ("issued_at" IS NULL) AND ("revoked_at" IS NULL) AND ("revoked_by" IS NULL)) OR (("lifecycle_status" = 'issued'::"text") AND ("issued_at" IS NOT NULL) AND ("revoked_at" IS NULL) AND ("revoked_by" IS NULL)) OR (("lifecycle_status" = 'revoked'::"text") AND ("issued_at" IS NOT NULL) AND ("revoked_at" IS NOT NULL) AND ("revoked_by" IS NOT NULL)))),
    CONSTRAINT "annual_reports_lifecycle_status_check" CHECK (("lifecycle_status" = ANY (ARRAY['draft'::"text", 'generated'::"text", 'issued'::"text", 'revoked'::"text"]))),
    CONSTRAINT "annual_reports_report_year_check" CHECK ((("report_year" >= 2000) AND ("report_year" <= 2100))),
    CONSTRAINT "annual_reports_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['province'::"text", 'kabupaten_kota'::"text"])))
);


ALTER TABLE "public"."annual_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "actor_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "ip_address" "inet",
    "attempt_type" "text" NOT NULL,
    "success" boolean NOT NULL,
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_event_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event" "text" NOT NULL,
    "success" boolean NOT NULL,
    "user_id" "uuid",
    "identifier_hash" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."auth_event_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_verification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "card_id" "uuid" NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" character varying(45),
    "user_agent" "text",
    "location" "text"
);


ALTER TABLE "public"."card_verification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussion_replies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "topic_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "parent_reply_id" "uuid",
    "content" "text" NOT NULL,
    "is_solution" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."discussion_replies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discussion_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" NOT NULL,
    "law_reference" "text",
    "views_count" integer DEFAULT 0,
    "replies_count" integer DEFAULT 0,
    "is_pinned" boolean DEFAULT false,
    "is_locked" boolean DEFAULT false,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."discussion_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_criteria" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "weight" integer DEFAULT 1 NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."evaluation_criteria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evaluation_id" "uuid" NOT NULL,
    "criteria_id" "uuid" NOT NULL,
    "score" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."evaluation_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "evaluator_id" "uuid",
    "total_score" numeric,
    "notes" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "approver_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "action" "text",
    "approved_by" "uuid"
);


ALTER TABLE "public"."event_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'referee'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "cancelled_by" "uuid",
    "cancellation_reason" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "action" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "from_status" "text",
    "to_status" "text",
    "performed_by" "uuid"
);


ALTER TABLE "public"."event_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kabupaten_kota" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provinsi_id" "uuid",
    "name" "text" NOT NULL,
    "code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kabupaten_kota" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "content" "text",
    "content_type" "text" DEFAULT 'document'::"text" NOT NULL,
    "content_url" "text",
    "pdf_url" "text",
    "video_url" "text",
    "thumbnail_url" "text",
    "law_number" "text",
    "difficulty_level" "text" DEFAULT 'basic'::"text",
    "duration_minutes" integer,
    "sort_order" integer DEFAULT 0,
    "is_published" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."learning_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "material_id" "uuid" NOT NULL,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."learning_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_enabled" boolean DEFAULT true,
    "assignment_enabled" boolean DEFAULT true,
    "honor_enabled" boolean DEFAULT true,
    "evaluation_enabled" boolean DEFAULT true,
    "discussion_enabled" boolean DEFAULT true,
    "learning_enabled" boolean DEFAULT true,
    "registration_enabled" boolean DEFAULT true,
    "pengurus_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pengurus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "level" "public"."pengurus_level" NOT NULL,
    "jabatan" "text" NOT NULL,
    "provinsi_id" "uuid",
    "kabupaten_kota_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pengurus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "birth_date" "date",
    "occupation" "text",
    "kabupaten_kota_id" "uuid",
    "afk_origin" "text",
    "license_level" "text",
    "license_expiry" "date",
    "profile_photo_url" "text",
    "license_photo_url" "text",
    "ktp_photo_url" "text",
    "is_active" boolean DEFAULT true,
    "is_profile_complete" boolean DEFAULT false,
    "registration_status" "text" DEFAULT 'approved'::"text",
    "requested_role" "text",
    "rejected_reason" "text",
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provinsi" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provinsi" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referee_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "card_number" character varying(30) NOT NULL,
    "verification_code" character varying(64) NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "last_verified_at" timestamp with time zone,
    "verification_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referee_cards_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('suspended'::character varying)::"text", ('revoked'::character varying)::"text", ('expired'::character varying)::"text"])))
);


ALTER TABLE "public"."referee_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referee_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "reviewer_name" "text",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referee_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."referee_reviews" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."referee_review_stats" WITH ("security_invoker"='on') AS
 SELECT "referee_id",
    "avg"("rating") AS "avg_rating",
    ("count"(*))::integer AS "total_reviews"
   FROM "public"."referee_reviews"
  GROUP BY "referee_id";


ALTER VIEW "public"."referee_review_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text",
    "description" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text",
    "role" "public"."app_role"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."annual_report_public_validations"
    ADD CONSTRAINT "annual_report_public_validations_pkey" PRIMARY KEY ("report_id");



ALTER TABLE ONLY "public"."annual_report_public_validations"
    ADD CONSTRAINT "annual_report_public_validations_validation_token_key" UNIQUE ("validation_token");



ALTER TABLE ONLY "public"."annual_reports"
    ADD CONSTRAINT "annual_reports_document_number_key" UNIQUE ("document_number");



ALTER TABLE ONLY "public"."annual_reports"
    ADD CONSTRAINT "annual_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."annual_reports"
    ADD CONSTRAINT "annual_reports_validation_token_key" UNIQUE ("validation_token");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_attempts"
    ADD CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_event_logs"
    ADD CONSTRAINT "auth_event_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_verification_logs"
    ADD CONSTRAINT "card_verification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_replies"
    ADD CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_topics"
    ADD CONSTRAINT "discussion_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_criteria"
    ADD CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_scores"
    ADD CONSTRAINT "evaluation_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_event_id_referee_id_key" UNIQUE ("event_id", "referee_id");



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_logs"
    ADD CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kabupaten_kota"
    ADD CONSTRAINT "kabupaten_kota_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_materials"
    ADD CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_user_id_material_id_key" UNIQUE ("user_id", "material_id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pengurus"
    ADD CONSTRAINT "pengurus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provinsi"
    ADD CONSTRAINT "provinsi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referee_cards"
    ADD CONSTRAINT "referee_cards_card_number_key" UNIQUE ("card_number");



ALTER TABLE ONLY "public"."referee_cards"
    ADD CONSTRAINT "referee_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referee_cards"
    ADD CONSTRAINT "referee_cards_referee_id_key" UNIQUE ("referee_id");



ALTER TABLE ONLY "public"."referee_cards"
    ADD CONSTRAINT "referee_cards_verification_code_key" UNIQUE ("verification_code");



ALTER TABLE ONLY "public"."referee_reviews"
    ADD CONSTRAINT "referee_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



CREATE INDEX "event_approvals_approved_by_idx" ON "public"."event_approvals" USING "btree" ("approved_by");



CREATE INDEX "idx_annual_report_public_validations_scope" ON "public"."annual_report_public_validations" USING "btree" ("scope_type", "scope_id");



CREATE INDEX "idx_annual_reports_created_by" ON "public"."annual_reports" USING "btree" ("created_by");



CREATE INDEX "idx_annual_reports_scope" ON "public"."annual_reports" USING "btree" ("scope_type", "scope_id");



CREATE INDEX "idx_annual_reports_status" ON "public"."annual_reports" USING "btree" ("lifecycle_status");



CREATE INDEX "idx_annual_reports_year" ON "public"."annual_reports" USING "btree" ("report_year");



CREATE INDEX "idx_audit_logs_actor_id" ON "public"."audit_logs" USING "btree" ("actor_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_entity_id" ON "public"."audit_logs" USING "btree" ("entity_id");



CREATE INDEX "idx_audit_logs_entity_type" ON "public"."audit_logs" USING "btree" ("entity_type");



CREATE INDEX "idx_card_verification_logs_card_id" ON "public"."card_verification_logs" USING "btree" ("card_id");



CREATE INDEX "idx_discussion_replies_author_id" ON "public"."discussion_replies" USING "btree" ("author_id");



CREATE INDEX "idx_discussion_replies_topic_id" ON "public"."discussion_replies" USING "btree" ("topic_id");



CREATE INDEX "idx_discussion_topics_author_id" ON "public"."discussion_topics" USING "btree" ("author_id");



CREATE INDEX "idx_discussion_topics_category" ON "public"."discussion_topics" USING "btree" ("category");



CREATE INDEX "idx_evaluations_evaluator_id" ON "public"."evaluations" USING "btree" ("evaluator_id");



CREATE INDEX "idx_evaluations_event_id" ON "public"."evaluations" USING "btree" ("event_id");



CREATE INDEX "idx_evaluations_referee_id" ON "public"."evaluations" USING "btree" ("referee_id");



CREATE INDEX "idx_evaluations_status" ON "public"."evaluations" USING "btree" ("status");



CREATE INDEX "idx_event_assignments_deleted_at" ON "public"."event_assignments" USING "btree" ("deleted_at");



CREATE INDEX "idx_event_assignments_event_id" ON "public"."event_assignments" USING "btree" ("event_id");



CREATE INDEX "idx_event_assignments_referee_id" ON "public"."event_assignments" USING "btree" ("referee_id");



CREATE INDEX "idx_event_assignments_status" ON "public"."event_assignments" USING "btree" ("status");



CREATE INDEX "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX "idx_events_date" ON "public"."events" USING "btree" ("date");



CREATE INDEX "idx_events_deleted_at" ON "public"."events" USING "btree" ("deleted_at");



CREATE INDEX "idx_events_kabupaten_kota_id" ON "public"."events" USING "btree" ("kabupaten_kota_id");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_honors_deleted_at" ON "public"."honors" USING "btree" ("deleted_at");



CREATE INDEX "idx_honors_event_id" ON "public"."honors" USING "btree" ("event_id");



CREATE INDEX "idx_honors_referee_id" ON "public"."honors" USING "btree" ("referee_id");



CREATE INDEX "idx_honors_status" ON "public"."honors" USING "btree" ("status");



CREATE INDEX "idx_learning_materials_category" ON "public"."learning_materials" USING "btree" ("category");



CREATE INDEX "idx_learning_materials_is_published" ON "public"."learning_materials" USING "btree" ("is_published");



CREATE INDEX "idx_learning_progress_material_id" ON "public"."learning_progress" USING "btree" ("material_id");



CREATE INDEX "idx_learning_progress_user_id" ON "public"."learning_progress" USING "btree" ("user_id");



CREATE INDEX "idx_notification_preferences_user" ON "public"."notification_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC) WHERE ("is_read" = false);



CREATE INDEX "idx_profiles_deleted_at" ON "public"."profiles" USING "btree" ("deleted_at");



CREATE INDEX "idx_profiles_is_active" ON "public"."profiles" USING "btree" ("is_active");



CREATE INDEX "idx_profiles_kabupaten_kota_id" ON "public"."profiles" USING "btree" ("kabupaten_kota_id");



CREATE INDEX "idx_profiles_registration_status" ON "public"."profiles" USING "btree" ("registration_status");



CREATE INDEX "idx_profiles_search" ON "public"."profiles" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_profiles_search_afk" ON "public"."profiles" USING "gin" ("afk_origin" "public"."gin_trgm_ops");



CREATE INDEX "idx_profiles_search_name" ON "public"."profiles" USING "gin" ("full_name" "public"."gin_trgm_ops");



CREATE INDEX "idx_referee_cards_card_number" ON "public"."referee_cards" USING "btree" ("card_number");



CREATE INDEX "idx_referee_cards_status" ON "public"."referee_cards" USING "btree" ("status");



CREATE INDEX "idx_referee_cards_verification_code" ON "public"."referee_cards" USING "btree" ("verification_code");



CREATE INDEX "idx_referee_reviews_referee_id" ON "public"."referee_reviews" USING "btree" ("referee_id");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "handle_honor_verification_trigger" BEFORE UPDATE ON "public"."honors" FOR EACH ROW EXECUTE FUNCTION "public"."handle_honor_verification"();



CREATE OR REPLACE TRIGGER "log_honor_verification_trigger" AFTER UPDATE ON "public"."honors" FOR EACH ROW EXECUTE FUNCTION "public"."log_honor_verification"();



CREATE OR REPLACE TRIGGER "log_referee_assignment_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."event_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."log_referee_assignment"();



CREATE OR REPLACE TRIGGER "log_registration_approval_trigger" AFTER UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_registration_approval"();



CREATE OR REPLACE TRIGGER "on_license_expiry_update" AFTER UPDATE OF "license_expiry" ON "public"."profiles" FOR EACH ROW WHEN (("old"."license_expiry" IS DISTINCT FROM "new"."license_expiry")) EXECUTE FUNCTION "public"."sync_card_expiry"();



CREATE OR REPLACE TRIGGER "set_updated_at_discussion_replies" BEFORE UPDATE ON "public"."discussion_replies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_discussion_topics" BEFORE UPDATE ON "public"."discussion_topics" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_evaluation_criteria" BEFORE UPDATE ON "public"."evaluation_criteria" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_evaluations" BEFORE UPDATE ON "public"."evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_event_assignments" BEFORE UPDATE ON "public"."event_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_events" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_honors" BEFORE UPDATE ON "public"."honors" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_kabupaten_kota" BEFORE UPDATE ON "public"."kabupaten_kota" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_learning_materials" BEFORE UPDATE ON "public"."learning_materials" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_pengurus" BEFORE UPDATE ON "public"."pengurus" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_provinsi" BEFORE UPDATE ON "public"."provinsi" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_annual_reports_immutable_lifecycle" BEFORE UPDATE ON "public"."annual_reports" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_issued_annual_report_mutation"();



CREATE OR REPLACE TRIGGER "trg_log_event_approval" AFTER INSERT ON "public"."event_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."log_event_approval"();



CREATE OR REPLACE TRIGGER "update_notification_preferences_updated_at" BEFORE UPDATE ON "public"."notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_referee_cards_updated_at" BEFORE UPDATE ON "public"."referee_cards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_topic_reply_count_trigger" AFTER INSERT OR DELETE ON "public"."discussion_replies" FOR EACH ROW EXECUTE FUNCTION "public"."update_topic_reply_count"();



CREATE OR REPLACE TRIGGER "validate_honor_submission_trigger" BEFORE INSERT OR UPDATE ON "public"."honors" FOR EACH ROW EXECUTE FUNCTION "public"."validate_honor_submission"();



ALTER TABLE ONLY "public"."annual_report_public_validations"
    ADD CONSTRAINT "annual_report_public_validations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."annual_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annual_reports"
    ADD CONSTRAINT "annual_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."annual_reports"
    ADD CONSTRAINT "annual_reports_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."card_verification_logs"
    ADD CONSTRAINT "card_verification_logs_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."referee_cards"("id");



ALTER TABLE ONLY "public"."discussion_replies"
    ADD CONSTRAINT "discussion_replies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_replies"
    ADD CONSTRAINT "discussion_replies_parent_reply_id_fkey" FOREIGN KEY ("parent_reply_id") REFERENCES "public"."discussion_replies"("id");



ALTER TABLE ONLY "public"."discussion_replies"
    ADD CONSTRAINT "discussion_replies_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."discussion_topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_topics"
    ADD CONSTRAINT "discussion_topics_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_scores"
    ADD CONSTRAINT "evaluation_scores_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "public"."evaluation_criteria"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_scores"
    ADD CONSTRAINT "evaluation_scores_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_approvals"
    ADD CONSTRAINT "event_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_assignments"
    ADD CONSTRAINT "event_assignments_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_kabupaten_kota_id_fkey" FOREIGN KEY ("kabupaten_kota_id") REFERENCES "public"."kabupaten_kota"("id");



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."honors"
    ADD CONSTRAINT "honors_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."kabupaten_kota"
    ADD CONSTRAINT "kabupaten_kota_provinsi_id_fkey" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinsi"("id");



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."learning_materials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_progress"
    ADD CONSTRAINT "learning_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pengurus"
    ADD CONSTRAINT "pengurus_kabupaten_kota_id_fkey" FOREIGN KEY ("kabupaten_kota_id") REFERENCES "public"."kabupaten_kota"("id");



ALTER TABLE ONLY "public"."pengurus"
    ADD CONSTRAINT "pengurus_provinsi_id_fkey" FOREIGN KEY ("provinsi_id") REFERENCES "public"."provinsi"("id");



ALTER TABLE ONLY "public"."pengurus"
    ADD CONSTRAINT "pengurus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_kabupaten_kota_id_fkey" FOREIGN KEY ("kabupaten_kota_id") REFERENCES "public"."kabupaten_kota"("id");



ALTER TABLE ONLY "public"."referee_cards"
    ADD CONSTRAINT "referee_cards_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."referee_reviews"
    ADD CONSTRAINT "referee_reviews_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can insert approvals" ON "public"."event_approvals" FOR INSERT WITH CHECK (("public"."is_admin"("auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'panitia'::"public"."app_role")));



CREATE POLICY "Admin can manage all materials" ON "public"."learning_materials" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admin can manage all scores" ON "public"."evaluation_scores" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admin can manage criteria" ON "public"."evaluation_criteria" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admin can update all evaluations" ON "public"."evaluations" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admin kab kota can manage own pengurus" ON "public"."pengurus" USING (("public"."is_admin_kab_kota"("auth"."uid"()) AND ("kabupaten_kota_id" = "public"."get_user_kabupaten_kota_id"("auth"."uid"())) AND ("level" = 'KAB_KOTA'::"public"."pengurus_level")));



CREATE POLICY "Admin kab_kota can manage pengurus in their region" ON "public"."pengurus" USING (("public"."has_role"("auth"."uid"(), 'admin_kab_kota'::"public"."app_role") AND ("level" = 'KAB_KOTA'::"public"."pengurus_level") AND ("kabupaten_kota_id" = "public"."get_user_kabupaten_kota"("auth"."uid"()))));



CREATE POLICY "Admin kab_kota can update profiles in their region" ON "public"."profiles" FOR UPDATE USING (("public"."has_role"("auth"."uid"(), 'admin_kab_kota'::"public"."app_role") AND ("kabupaten_kota_id" = "public"."get_user_kabupaten_kota"("auth"."uid"()))));



CREATE POLICY "Admin kab_kota can view profiles in their region" ON "public"."profiles" FOR SELECT USING (("public"."has_role"("auth"."uid"(), 'admin_kab_kota'::"public"."app_role") AND ("kabupaten_kota_id" = "public"."get_user_kabupaten_kota"("auth"."uid"()))));



CREATE POLICY "Admin provinsi can insert profiles" ON "public"."profiles" FOR INSERT WITH CHECK ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admin provinsi can manage all pengurus" ON "public"."pengurus" USING ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admin provinsi can manage kabupaten_kota" ON "public"."kabupaten_kota" USING ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admin provinsi can manage provinsi" ON "public"."provinsi" USING ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admin provinsi can manage user_roles" ON "public"."user_roles" USING ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admin provinsi can update all profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admin provinsi can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin_provinsi"("auth"."uid"()));



CREATE POLICY "Admins can create events" ON "public"."events" FOR INSERT WITH CHECK (("public"."is_admin"("auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'panitia'::"public"."app_role")));



CREATE POLICY "Admins can delete events" ON "public"."events" FOR DELETE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all cards" ON "public"."referee_cards" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage assignments" ON "public"."event_assignments" TO "authenticated" USING (("public"."is_admin_provinsi"("auth"."uid"()) OR ("public"."has_role"("auth"."uid"(), 'admin_kab_kota'::"public"."app_role") AND (EXISTS ( SELECT 1
   FROM "public"."events" "scoped_event"
  WHERE (("scoped_event"."id" = "event_assignments"."event_id") AND ("scoped_event"."kabupaten_kota_id" = "public"."get_user_kabupaten_kota"("auth"."uid"())))))) OR "public"."has_role"("auth"."uid"(), 'panitia'::"public"."app_role"))) WITH CHECK (("public"."is_admin_provinsi"("auth"."uid"()) OR ("public"."has_role"("auth"."uid"(), 'admin_kab_kota'::"public"."app_role") AND (EXISTS ( SELECT 1
   FROM "public"."events" "scoped_event"
  WHERE (("scoped_event"."id" = "event_assignments"."event_id") AND ("scoped_event"."kabupaten_kota_id" = "public"."get_user_kabupaten_kota"("auth"."uid"())))))) OR "public"."has_role"("auth"."uid"(), 'panitia'::"public"."app_role")));



CREATE POLICY "Admins can manage event approvals" ON "public"."event_approvals" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all honors" ON "public"."honors" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update events" ON "public"."events" FOR UPDATE USING (("public"."is_admin"("auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'panitia'::"public"."app_role")));



CREATE POLICY "Admins can view all assignments" ON "public"."event_assignments" FOR SELECT TO "authenticated" USING (("public"."is_admin_provinsi"("auth"."uid"()) OR ("public"."has_role"("auth"."uid"(), 'admin_kab_kota'::"public"."app_role") AND (EXISTS ( SELECT 1
   FROM "public"."events" "scoped_event"
  WHERE (("scoped_event"."id" = "event_assignments"."event_id") AND ("scoped_event"."kabupaten_kota_id" = "public"."get_user_kabupaten_kota"("auth"."uid"())))))) OR ("referee_id" = "auth"."uid"())));



CREATE POLICY "Admins can view all cards" ON "public"."referee_cards" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all evaluations" ON "public"."evaluations" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all honors" ON "public"."honors" FOR SELECT USING ((("deleted_at" IS NULL) AND "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all verification logs" ON "public"."card_verification_logs" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view audit logs" ON "public"."audit_logs" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view auth event logs" ON "public"."auth_event_logs" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view event approvals" ON "public"."event_approvals" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Annual reports are readable within canonical scope" ON "public"."annual_reports" FOR SELECT TO "authenticated" USING (("public"."is_admin_provinsi"(( SELECT "auth"."uid"() AS "uid")) OR ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin_kab_kota'::"public"."app_role") AND ("scope_type" = 'kabupaten_kota'::"text") AND ("scope_id" = "public"."get_user_kabupaten_kota"(( SELECT "auth"."uid"() AS "uid")))) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Annual reports can be created within canonical scope" ON "public"."annual_reports" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND (("public"."is_admin_provinsi"(( SELECT "auth"."uid"() AS "uid")) AND ("scope_type" = 'province'::"text")) OR ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin_kab_kota'::"public"."app_role") AND ("scope_type" = 'kabupaten_kota'::"text") AND ("scope_id" = "public"."get_user_kabupaten_kota"(( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Annual reports can be updated within canonical scope" ON "public"."annual_reports" FOR UPDATE TO "authenticated" USING (("public"."is_admin_provinsi"(( SELECT "auth"."uid"() AS "uid")) OR ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin_kab_kota'::"public"."app_role") AND ("scope_type" = 'kabupaten_kota'::"text") AND ("scope_id" = "public"."get_user_kabupaten_kota"(( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK (("public"."is_admin_provinsi"(( SELECT "auth"."uid"() AS "uid")) OR ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin_kab_kota'::"public"."app_role") AND ("scope_type" = 'kabupaten_kota'::"text") AND ("scope_id" = "public"."get_user_kabupaten_kota"(( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Anyone authenticated can view pengurus" ON "public"."pengurus" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Anyone can insert verification logs" ON "public"."card_verification_logs" FOR INSERT WITH CHECK (("card_id" IS NOT NULL));



CREATE POLICY "Anyone can submit reviews" ON "public"."referee_reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view reviews" ON "public"."referee_reviews" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can create replies" ON "public"."discussion_replies" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can create topics" ON "public"."discussion_topics" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view replies" ON "public"."discussion_replies" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view topics" ON "public"."discussion_topics" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authors can delete their own replies" ON "public"."discussion_replies" FOR DELETE USING ((("auth"."uid"() = "author_id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Authors can delete their own topics" ON "public"."discussion_topics" FOR DELETE USING ((("auth"."uid"() = "author_id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Authors can update their own replies" ON "public"."discussion_replies" FOR UPDATE USING ((("auth"."uid"() = "author_id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Authors can update their own topics" ON "public"."discussion_topics" FOR UPDATE USING ((("auth"."uid"() = "author_id") OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "Evaluators can create evaluations" ON "public"."evaluations" FOR INSERT WITH CHECK (("auth"."uid"() = "evaluator_id"));



CREATE POLICY "Evaluators can manage scores for their evaluations" ON "public"."evaluation_scores" USING ((EXISTS ( SELECT 1
   FROM "public"."evaluations" "e"
  WHERE (("e"."id" = "evaluation_scores"."evaluation_id") AND ("e"."evaluator_id" = "auth"."uid"()) AND ("e"."status" = 'draft'::"text")))));



CREATE POLICY "Evaluators can update their draft evaluations" ON "public"."evaluations" FOR UPDATE USING ((("auth"."uid"() = "evaluator_id") AND ("status" = 'draft'::"text")));



CREATE POLICY "Evaluators can view their own evaluations" ON "public"."evaluations" FOR SELECT USING (("auth"."uid"() = "evaluator_id"));



CREATE POLICY "Everyone can view active criteria" ON "public"."evaluation_criteria" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Everyone can view event approvals" ON "public"."event_approvals" FOR SELECT USING (true);



CREATE POLICY "Everyone can view events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Everyone can view kabupaten_kota" ON "public"."kabupaten_kota" FOR SELECT USING (true);



CREATE POLICY "Everyone can view pengurus" ON "public"."pengurus" FOR SELECT USING (true);



CREATE POLICY "Everyone can view provinsi" ON "public"."provinsi" FOR SELECT USING (true);



CREATE POLICY "Everyone can view published materials" ON "public"."learning_materials" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can insert auth event logs (restricted)" ON "public"."auth_event_logs" FOR INSERT WITH CHECK ((("event" = ANY (ARRAY['AUTH_LOGIN'::"text", 'AUTH_LOGOUT'::"text", 'AUTH_PASSWORD_RESET'::"text", 'AUTH_LOGIN_FAILED'::"text"])) AND ("success" = ANY (ARRAY[true, false])) AND ((("user_id" IS NOT NULL) AND ("auth"."uid"() = "user_id")) OR (("user_id" IS NULL) AND ("identifier_hash" IS NOT NULL)))));



CREATE POLICY "Public can validate issued reports" ON "public"."annual_report_public_validations" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can view referee profiles" ON "public"."profiles" FOR SELECT USING (("deleted_at" IS NULL));



CREATE POLICY "Referees can create their own honors" ON "public"."honors" FOR INSERT WITH CHECK (("auth"."uid"() = "referee_id"));



CREATE POLICY "Referees can delete their own draft honors" ON "public"."honors" FOR UPDATE USING ((("deleted_at" IS NULL) AND ("auth"."uid"() = "referee_id") AND ("status" = 'draft'::"text")));



CREATE POLICY "Referees can insert own card" ON "public"."referee_cards" FOR INSERT TO "authenticated" WITH CHECK (("referee_id" = "auth"."uid"()));



CREATE POLICY "Referees can update their own assignment status" ON "public"."event_assignments" FOR UPDATE USING ((("referee_id" = "auth"."uid"()) AND ("deleted_at" IS NULL))) WITH CHECK ((("referee_id" = "auth"."uid"()) AND ("status" = ANY (ARRAY['confirmed'::"text", 'declined'::"text"]))));



CREATE POLICY "Referees can update their own draft honors" ON "public"."honors" FOR UPDATE USING ((("auth"."uid"() = "referee_id") AND ("status" = 'draft'::"text")));



CREATE POLICY "Referees can view their own assignments" ON "public"."event_assignments" FOR SELECT USING (("auth"."uid"() = "referee_id"));



CREATE POLICY "Referees can view their own card" ON "public"."referee_cards" FOR SELECT USING (("auth"."uid"() = "referee_id"));



CREATE POLICY "Referees can view their own card logs" ON "public"."card_verification_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."referee_cards" "rc"
  WHERE (("rc"."id" = "card_verification_logs"."card_id") AND ("rc"."referee_id" = "auth"."uid"())))));



CREATE POLICY "Referees can view their own evaluations" ON "public"."evaluations" FOR SELECT USING ((("auth"."uid"() = "referee_id") AND ("status" = 'submitted'::"text")));



CREATE POLICY "Referees can view their own honors" ON "public"."honors" FOR SELECT USING ((("deleted_at" IS NULL) AND ("auth"."uid"() = "referee_id")));



CREATE POLICY "System can insert audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert own preferences" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile during signup" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own progress" ON "public"."learning_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own preferences" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own progress" ON "public"."learning_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own progress" ON "public"."learning_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "View scores for accessible evaluations" ON "public"."evaluation_scores" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."evaluations" "e"
  WHERE (("e"."id" = "evaluation_scores"."evaluation_id") AND ("public"."is_admin"("auth"."uid"()) OR ("e"."evaluator_id" = "auth"."uid"()) OR (("e"."referee_id" = "auth"."uid"()) AND ("e"."status" = 'submitted'::"text")))))));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."annual_report_public_validations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."annual_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_event_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_verification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_replies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluation_criteria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluation_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."honors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kabupaten_kota" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pengurus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provinsi" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referee_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referee_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "postgres";



GRANT ALL ON FUNCTION "public"."auto_mark_expired_cards"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_mark_expired_cards"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_mark_expired_cards"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_approve_registration"("_admin_id" "uuid", "_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_approve_registration"("_admin_id" "uuid", "_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_approve_registration"("_admin_id" "uuid", "_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_duplicate_event"("p_kota_id" "text", "p_location" "text", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_duplicate_event"("p_kota_id" "text", "p_location" "text", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_duplicate_event"("p_kota_id" "text", "p_location" "text", "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_referee_cards"("p_search" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."count_referee_cards"("p_search" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_referee_cards"("p_search" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."count_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_card_number"("p_referee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_card_number"("p_referee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_card_number"("p_referee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_accessible_regions"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accessible_regions"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accessible_regions"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_dashboard_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_audit_logs"("_entity_type" "text", "_entity_id" "uuid", "_action" "text", "_actor_id" "uuid", "_start_date" timestamp with time zone, "_end_date" timestamp with time zone, "_limit" integer, "_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_audit_logs"("_entity_type" "text", "_entity_id" "uuid", "_action" "text", "_actor_id" "uuid", "_start_date" timestamp with time zone, "_end_date" timestamp with time zone, "_limit" integer, "_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_audit_logs"("_entity_type" "text", "_entity_id" "uuid", "_action" "text", "_actor_id" "uuid", "_start_date" timestamp with time zone, "_end_date" timestamp with time zone, "_limit" integer, "_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_honor_statistics"("_referee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_honor_statistics"("_referee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_honor_statistics"("_referee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_referee_event_count"("_start_date" "date", "_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_referee_event_count"("_start_date" "date", "_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_referee_event_count"("_start_date" "date", "_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_registrations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_registrations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_registrations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_referee"("_referee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_referee"("_referee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_referee"("_referee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_referees"("_search" "text", "_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_referees"("_search" "text", "_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_referees"("_search" "text", "_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_referee_event_count"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_referee_event_count"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_referee_event_count"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_referee_income_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_referee_income_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_referee_income_summary"("_kabupaten_kota_id" "uuid", "_start_date" "date", "_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text", "_limit" integer, "_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text", "_limit" integer, "_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_referees"("_license_level" "text", "_is_active" boolean, "_kabupaten_kota_id" "uuid", "_search" "text", "_limit" integer, "_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_registration_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_registration_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_registration_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_kabupaten_kota"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_kabupaten_kota"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_kabupaten_kota"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_kabupaten_kota_id"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_kabupaten_kota_id"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_kabupaten_kota_id"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_honor_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_honor_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_honor_verification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_schedule_conflict"("_referee_id" "uuid", "_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_schedule_conflict"("_referee_id" "uuid", "_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_schedule_conflict"("_referee_id" "uuid", "_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_kab_kota"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_kab_kota"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_kab_kota"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_provinsi"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_provinsi"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_provinsi"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_event_approved"("_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_event_approved"("_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_event_approved"("_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_referee_active"("_referee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_referee_active"("_referee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_referee_active"("_referee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_same_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_same_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_same_region"("_user_id" "uuid", "_kabupaten_kota_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_event_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_event_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_event_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_honor_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_honor_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_honor_verification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_referee_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_referee_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_referee_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_registration_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_registration_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_registration_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_hard_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_hard_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_hard_delete"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prevent_issued_annual_report_mutation"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_issued_annual_report_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_issued_annual_report_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_issued_annual_report_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_referee_cards"("p_search" "text", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_referee_cards"("p_search" "text", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_referee_cards"("p_search" "text", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_referee_cards"("search" "text", "is_active" boolean, "license_level" "text", "page" integer, "page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_referee_cards"("search" "text", "is_active" boolean, "license_level" "text", "page" integer, "page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_referee_cards"("search" "text", "is_active" boolean, "license_level" "text", "page" integer, "page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_record"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_card_expiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_card_expiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_card_expiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_topic_reply_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_topic_reply_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_topic_reply_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_honor_submission"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_honor_submission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_honor_submission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_referee_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_referee_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_referee_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_regional_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_regional_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_regional_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_referee_card"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_referee_card"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_referee_card"("p_code" "text") TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."active_events" TO "anon";
GRANT ALL ON TABLE "public"."active_events" TO "authenticated";
GRANT ALL ON TABLE "public"."active_events" TO "service_role";



GRANT ALL ON TABLE "public"."honors" TO "anon";
GRANT ALL ON TABLE "public"."honors" TO "authenticated";
GRANT ALL ON TABLE "public"."honors" TO "service_role";



GRANT ALL ON TABLE "public"."active_honors" TO "anon";
GRANT ALL ON TABLE "public"."active_honors" TO "authenticated";
GRANT ALL ON TABLE "public"."active_honors" TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."annual_report_public_validations" TO "service_role";
GRANT SELECT ON TABLE "public"."annual_report_public_validations" TO "anon";
GRANT SELECT ON TABLE "public"."annual_report_public_validations" TO "authenticated";



GRANT ALL ON TABLE "public"."annual_reports" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."annual_reports" TO "authenticated";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."auth_attempts" TO "anon";
GRANT ALL ON TABLE "public"."auth_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_attempts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."auth_event_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."auth_event_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_event_logs" TO "service_role";



GRANT ALL ON TABLE "public"."card_verification_logs" TO "anon";
GRANT ALL ON TABLE "public"."card_verification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."card_verification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_replies" TO "anon";
GRANT ALL ON TABLE "public"."discussion_replies" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_replies" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_topics" TO "anon";
GRANT ALL ON TABLE "public"."discussion_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_topics" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_criteria" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_criteria" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_scores" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_scores" TO "service_role";



GRANT ALL ON TABLE "public"."evaluations" TO "anon";
GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."event_approvals" TO "anon";
GRANT ALL ON TABLE "public"."event_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."event_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."event_assignments" TO "anon";
GRANT ALL ON TABLE "public"."event_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."event_logs" TO "anon";
GRANT ALL ON TABLE "public"."event_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."event_logs" TO "service_role";



GRANT ALL ON TABLE "public"."kabupaten_kota" TO "anon";
GRANT ALL ON TABLE "public"."kabupaten_kota" TO "authenticated";
GRANT ALL ON TABLE "public"."kabupaten_kota" TO "service_role";



GRANT ALL ON TABLE "public"."learning_materials" TO "anon";
GRANT ALL ON TABLE "public"."learning_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_materials" TO "service_role";



GRANT ALL ON TABLE "public"."learning_progress" TO "anon";
GRANT ALL ON TABLE "public"."learning_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_progress" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."pengurus" TO "anon";
GRANT ALL ON TABLE "public"."pengurus" TO "authenticated";
GRANT ALL ON TABLE "public"."pengurus" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."provinsi" TO "anon";
GRANT ALL ON TABLE "public"."provinsi" TO "authenticated";
GRANT ALL ON TABLE "public"."provinsi" TO "service_role";



GRANT ALL ON TABLE "public"."referee_cards" TO "anon";
GRANT ALL ON TABLE "public"."referee_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."referee_cards" TO "service_role";



GRANT ALL ON TABLE "public"."referee_reviews" TO "anon";
GRANT ALL ON TABLE "public"."referee_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."referee_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."referee_review_stats" TO "anon";
GRANT ALL ON TABLE "public"."referee_review_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."referee_review_stats" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




