-- DRAFT ONLY: PHASE 5.15 assignment authorization migration.
-- This SQL is intentionally NOT applied to TEST or production.
-- It is a static design artifact only.
-- The direct browser assignment INSERT path remains intentionally unclosed here
-- because application consumer cutover and verification are not yet complete.

BEGIN;

-- 1. Precondition assertions.
DO $$
DECLARE
    v_null_status_count bigint;
    v_null_role_count bigint;
    v_duplicate_all_count bigint;
    v_duplicate_non_cancelled_count bigint;
BEGIN
    SELECT count(*) INTO v_null_status_count
    FROM public.event_assignments
    WHERE status IS NULL;

    SELECT count(*) INTO v_null_role_count
    FROM public.event_assignments
    WHERE role IS NULL;

    SELECT count(*) INTO v_duplicate_all_count
    FROM (
        SELECT event_id, referee_id
        FROM public.event_assignments
        GROUP BY event_id, referee_id
        HAVING count(*) > 1
    ) AS d;

    SELECT count(*) INTO v_duplicate_non_cancelled_count
    FROM (
        SELECT event_id, referee_id
        FROM public.event_assignments
        WHERE status <> 'cancelled'
        GROUP BY event_id, referee_id
        HAVING count(*) > 1
    ) AS d;

    IF v_null_status_count <> 0
       OR v_null_role_count <> 0
       OR v_duplicate_all_count <> 0
       OR v_duplicate_non_cancelled_count <> 0 THEN
        RAISE EXCEPTION 'BLOCKED — DATA PRECONDITION FAILURE: null_status=% null_role=% duplicate_all=% duplicate_non_cancelled=%; no data repair attempted',
            v_null_status_count,
            v_null_role_count,
            v_duplicate_all_count,
            v_duplicate_non_cancelled_count;
    END IF;
END;
$$;

-- 2. Supporting index to support conflict checks.
CREATE INDEX IF NOT EXISTS idx_event_assignments_referee_status_event
    ON public.event_assignments (referee_id, status, event_id);

-- 3. Reassignment uniqueness conversion.
-- Replace unconditional UNIQUE(event_id, referee_id) with a partial unique index
-- that allows a cancelled row to coexist with a later pending/confirmed row.
DO $$
DECLARE
    v_constraint_name text;
    v_unique_def text;
BEGIN
    SELECT c.conname, pg_get_constraintdef(c.oid)
      INTO v_constraint_name, v_unique_def
    FROM pg_constraint c
    WHERE c.conrelid = 'public.event_assignments'::regclass
      AND c.contype = 'u'
      AND c.conkey = ARRAY[
          (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.event_assignments'::regclass AND attname = 'event_id'),
          (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.event_assignments'::regclass AND attname = 'referee_id')
      ];

    IF v_constraint_name IS NOT NULL AND v_unique_def = 'UNIQUE (event_id, referee_id)' THEN
        EXECUTE format('ALTER TABLE public.event_assignments DROP CONSTRAINT %I', v_constraint_name);
    ELSIF v_constraint_name IS NOT NULL THEN
        RAISE EXCEPTION 'ASSIGNMENT_MIGRATION_ABORT: expected unconditional uniqueness on (event_id, referee_id); discovered %', v_unique_def;
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS event_assignments_event_referee_non_cancelled_uidx
    ON public.event_assignments (event_id, referee_id)
    WHERE status <> 'cancelled';

-- 4. Secure conflict primitive.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.assignment_has_date_range_conflict(
    p_referee_id uuid,
    p_event_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.event_assignments AS existing_assignment
        JOIN public.events AS existing_event
          ON existing_event.id = existing_assignment.event_id
        JOIN public.events AS target_event
          ON target_event.id = p_event_id
        WHERE existing_assignment.referee_id = p_referee_id
          AND existing_assignment.event_id <> p_event_id
          AND existing_assignment.status = 'confirmed'
          AND existing_assignment.deleted_at IS NULL
          AND existing_event.deleted_at IS NULL
          AND existing_event.status NOT IN ('DITOLAK', 'SELESAI')
          AND existing_event.start_date IS NOT NULL
          AND existing_event.end_date IS NOT NULL
          AND target_event.start_date IS NOT NULL
          AND target_event.end_date IS NOT NULL
          AND existing_event.start_date <= target_event.end_date
          AND existing_event.end_date >= target_event.start_date
    );
$$;

REVOKE ALL ON FUNCTION private.assignment_has_date_range_conflict(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.assignment_has_date_range_conflict(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION private.assignment_has_date_range_conflict(uuid, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION private.assignment_has_date_range_conflict(uuid, uuid) FROM service_role;

-- 5. Secure assignment authorization / write RPC.
CREATE OR REPLACE FUNCTION public.assign_referee_to_event(
    p_event_id uuid,
    p_referee_id uuid,
    p_role text
)
RETURNS TABLE (
    assignment_id uuid,
    event_id uuid,
    referee_id uuid,
    role text,
    status text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_id uuid;
    v_is_admin_provinsi boolean := false;
    v_is_admin_kab_kota boolean := false;
    v_is_panitia boolean := false;
    v_actor_provinsi_id uuid;
    v_actor_kabupaten_kota_id uuid;
    v_event_created_by uuid;
    v_event_kabupaten_kota_id uuid;
    v_event_provinsi_id uuid;
    v_event_status text;
    v_event_deleted_at timestamptz;
    v_event_start_date date;
    v_event_end_date date;
    v_referee_kabupaten_kota_id uuid;
    v_referee_provinsi_id uuid;
    v_referee_is_active boolean;
    v_referee_registration_status text;
    v_referee_deleted_at timestamptz;
    v_referee_is_profile_complete boolean;
    v_referee_has_wasit_role boolean;
    v_assignment_id uuid;
    v_created_at timestamptz;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACTOR';
    END IF;

    IF p_event_id IS NULL OR p_referee_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_TARGET';
    END IF;

    IF p_role IS DISTINCT FROM 'CADANGAN' THEN
        RAISE EXCEPTION 'INVALID_ASSIGNMENT_ROLE';
    END IF;

    SELECT EXISTS (
            SELECT 1 FROM public.user_roles AS ur
            WHERE ur.user_id = v_actor_id
              AND ur.role = 'admin_provinsi'
        ),
        EXISTS (
            SELECT 1 FROM public.user_roles AS ur
            WHERE ur.user_id = v_actor_id
              AND ur.role = 'admin_kab_kota'
        ),
        EXISTS (
            SELECT 1 FROM public.user_roles AS ur
            WHERE ur.user_id = v_actor_id
              AND ur.role = 'panitia'
        )
    INTO v_is_admin_provinsi, v_is_admin_kab_kota, v_is_panitia;

    IF NOT v_is_admin_provinsi AND NOT v_is_admin_kab_kota AND NOT v_is_panitia THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF v_is_admin_provinsi THEN
        v_actor_provinsi_id := private.get_actor_provinsi_id();
        IF v_actor_provinsi_id IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN_SCOPE';
        END IF;
    ELSIF v_is_admin_kab_kota THEN
        v_actor_kabupaten_kota_id := private.get_actor_kabupaten_kota_id();
        IF v_actor_kabupaten_kota_id IS NULL THEN
            RAISE EXCEPTION 'FORBIDDEN_SCOPE';
        END IF;
    END IF;

    SELECT e.created_by,
           e.kabupaten_kota_id,
           kk.provinsi_id,
           e.status,
           e.deleted_at,
           e.start_date,
           e.end_date
      INTO v_event_created_by,
           v_event_kabupaten_kota_id,
           v_event_provinsi_id,
           v_event_status,
           v_event_deleted_at,
           v_event_start_date,
           v_event_end_date
    FROM public.events AS e
    LEFT JOIN public.kabupaten_kota AS kk
      ON kk.id = e.kabupaten_kota_id
    WHERE e.id = p_event_id
    FOR SHARE OF e;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_TARGET';
    END IF;

    IF v_is_admin_provinsi THEN
        IF v_event_provinsi_id IS NULL OR v_event_provinsi_id <> v_actor_provinsi_id THEN
            RAISE EXCEPTION 'FORBIDDEN_SCOPE';
        END IF;
    ELSIF v_is_admin_kab_kota THEN
        IF v_event_kabupaten_kota_id IS NULL OR v_event_kabupaten_kota_id <> v_actor_kabupaten_kota_id THEN
            RAISE EXCEPTION 'FORBIDDEN_SCOPE';
        END IF;
    ELSIF v_is_panitia THEN
        IF v_event_created_by IS DISTINCT FROM v_actor_id THEN
            RAISE EXCEPTION 'FORBIDDEN';
        END IF;
    END IF;

    IF v_event_status <> 'DISETUJUI' OR v_event_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'INVALID_TARGET';
    END IF;

    -- Lock the referee identity row to serialize eligibility, conflict, duplicate and insert.
    SELECT p.kabupaten_kota_id,
           kk.provinsi_id,
           p.is_active,
           p.registration_status,
           p.deleted_at,
           p.is_profile_complete
      INTO v_referee_kabupaten_kota_id,
           v_referee_provinsi_id,
           v_referee_is_active,
           v_referee_registration_status,
           v_referee_deleted_at,
           v_referee_is_profile_complete
    FROM public.profiles AS p
    LEFT JOIN public.kabupaten_kota AS kk
      ON kk.id = p.kabupaten_kota_id
    WHERE p.id = p_referee_id
    FOR UPDATE OF p;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INELIGIBLE_REFEREE';
    END IF;

    IF v_is_admin_provinsi THEN
        IF v_referee_provinsi_id IS NULL OR v_referee_provinsi_id <> v_actor_provinsi_id THEN
            RAISE EXCEPTION 'FORBIDDEN_SCOPE';
        END IF;
    ELSIF v_is_admin_kab_kota THEN
        IF v_referee_kabupaten_kota_id IS NULL OR v_referee_kabupaten_kota_id <> v_actor_kabupaten_kota_id THEN
            RAISE EXCEPTION 'FORBIDDEN_SCOPE';
        END IF;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles AS ur
        WHERE ur.user_id = p_referee_id
          AND ur.role = 'wasit'
    ) INTO v_referee_has_wasit_role;

    IF NOT v_referee_has_wasit_role
       OR v_referee_is_active IS DISTINCT FROM true
       OR v_referee_registration_status IS DISTINCT FROM 'approved'
       OR v_referee_deleted_at IS NOT NULL
       OR v_referee_is_profile_complete IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'INELIGIBLE_REFEREE';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.event_assignments AS ea
        WHERE ea.event_id = p_event_id
          AND ea.referee_id = p_referee_id
          AND ea.status <> 'cancelled'
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_ASSIGNMENT';
    END IF;

    IF private.assignment_has_date_range_conflict(p_referee_id, p_event_id) THEN
        RAISE EXCEPTION 'ASSIGNMENT_CONFLICT';
    END IF;

    INSERT INTO public.event_assignments (event_id, referee_id, role, status)
    VALUES (p_event_id, p_referee_id, p_role, 'pending')
    RETURNING id, created_at INTO v_assignment_id, v_created_at;

    RETURN QUERY
    SELECT v_assignment_id,
           p_event_id,
           p_referee_id,
           p_role,
           'pending'::text,
           v_created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) IS
    'DRAFT: authorized creation of a pending assignment after event/referee/audit invariants are validated; do not use as a direct browser insert fallback until consumer cutover is verified.';

-- 6. Defer direct browser INSERT closure until consumer cutover is complete.
-- This migration intentionally leaves browser assignment INSERT policy logic unchanged.
-- The future direct-write closure must be a separate, gated migration step after the
-- RPC consumer is deployed and verified.

COMMIT;
