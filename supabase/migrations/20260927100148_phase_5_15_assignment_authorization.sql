-- DRAFT ONLY: PHASE 5.15 assignment authorization.
-- DO NOT APPLY until application consumers have been cut over and verified.
-- Production was not accessed while preparing this draft.
-- Direct table INSERT/RLS closure is intentionally NOT included because the
-- browser single/batch/template consumers still use direct INSERT paths.
-- The generic service-role importer is a separate operational writer and also
-- requires source integration with approved assignment validation before apply.

BEGIN;

-- Keep the data preconditions stable across checks and unique-index conversion.
LOCK TABLE public.event_assignments IN SHARE ROW EXCLUSIVE MODE;

-- Abort before schema changes if the frozen TEST data invariants do not hold.
DO $preflight$
DECLARE
	v_null_status_count bigint;
	v_null_role_count bigint;
	v_duplicate_all_count bigint;
	v_duplicate_active_count bigint;
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
	) AS duplicates;

	SELECT count(*) INTO v_duplicate_active_count
	FROM (
		SELECT event_id, referee_id
		FROM public.event_assignments
		WHERE status <> 'cancelled'
		GROUP BY event_id, referee_id
		HAVING count(*) > 1
	) AS duplicates;

	IF v_null_status_count <> 0
		OR v_null_role_count <> 0
		OR v_duplicate_all_count <> 0
		OR v_duplicate_active_count <> 0 THEN
		RAISE EXCEPTION USING
			ERRCODE = 'P0001',
			MESSAGE = format(
				'ASSIGNMENT_MIGRATION_PRECONDITION_FAILED: null_status=%s null_role=%s duplicate_all=%s duplicate_non_cancelled=%s; no data repair was attempted',
				v_null_status_count,
				v_null_role_count,
				v_duplicate_all_count,
				v_duplicate_active_count
			);
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_catalog.pg_proc AS p
		JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
		WHERE (n.nspname = 'public' AND p.proname = 'assign_referee_to_event')
			 OR (n.nspname = 'private' AND p.proname IN (
				 'assignment_has_date_range_conflict',
				 'guard_assignment_confirmation_conflict'
			 ))
	) THEN
		RAISE EXCEPTION USING
			ERRCODE = 'P0001',
			MESSAGE = 'ASSIGNMENT_MIGRATION_PRECONDITION_FAILED: a draft target function name already exists; inspect signatures and dependencies';
	END IF;
END;
$preflight$;

-- All existing rows passed the NULL checks above. Keep these columns non-NULL
-- so the partial uniqueness predicate cannot silently omit status=NULL rows.
ALTER TABLE public.event_assignments
	ALTER COLUMN status SET NOT NULL,
	ALTER COLUMN role SET NOT NULL;

-- This index supports the DATE_RANGE query over confirmed, non-deleted rows.
CREATE INDEX IF NOT EXISTS idx_event_assignments_confirmed_referee_event
	ON public.event_assignments (referee_id, event_id)
	WHERE status = 'confirmed' AND deleted_at IS NULL;

-- Establish and verify the replacement invariant before removing the existing
-- unconditional UNIQUE constraint. Discover the constraint by its exact key
-- definition; do not assume its catalog name.
CREATE UNIQUE INDEX IF NOT EXISTS event_assignments_event_referee_non_cancelled_uidx
	ON public.event_assignments (event_id, referee_id)
	WHERE status <> 'cancelled';

DO $unique_conversion$
DECLARE
	v_index_unique boolean;
	v_index_predicate text;
	v_index_definition text;
	v_index_columns text[];
	v_pair_constraints text[];
	v_old_constraint_name text;
	v_unconditional_index_count integer;
BEGIN
	SELECT i.indisunique,
				 pg_catalog.pg_get_expr(i.indpred, i.indrelid),
				 pg_catalog.pg_get_indexdef(i.indexrelid),
				 (
					 SELECT array_agg(a.attname::text ORDER BY k.ordinality)
					 FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ordinality)
					 JOIN pg_catalog.pg_attribute AS a
						 ON a.attrelid = i.indrelid
						AND a.attnum = k.attnum
					 WHERE k.ordinality <= i.indnkeyatts
				 )
		INTO v_index_unique, v_index_predicate, v_index_definition, v_index_columns
	FROM pg_catalog.pg_index AS i
	WHERE i.indexrelid = pg_catalog.to_regclass(
		'public.event_assignments_event_referee_non_cancelled_uidx'
	);

	IF NOT FOUND
		OR v_index_unique IS DISTINCT FROM true
		OR v_index_predicate IS DISTINCT FROM '(status <> ''cancelled''::text)'
		OR v_index_columns IS DISTINCT FROM ARRAY['event_id', 'referee_id']::text[] THEN
		RAISE EXCEPTION USING
			ERRCODE = 'P0001',
			MESSAGE = 'ASSIGNMENT_MIGRATION_ABORT: replacement partial unique index is absent or has an unexpected definition';
	END IF;

	SELECT array_agg(c.conname::text ORDER BY c.conname)
		INTO v_pair_constraints
	FROM pg_catalog.pg_constraint AS c
	WHERE c.conrelid = 'public.event_assignments'::regclass
		AND c.contype = 'u'
		AND (
			SELECT array_agg(a.attname::text ORDER BY k.ordinality)
			FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality)
			JOIN pg_catalog.pg_attribute AS a
				ON a.attrelid = c.conrelid
			 AND a.attnum = k.attnum
		) = ARRAY['event_id', 'referee_id']::text[];

	IF cardinality(v_pair_constraints) > 1 THEN
		RAISE EXCEPTION USING
			ERRCODE = 'P0001',
			MESSAGE = 'ASSIGNMENT_MIGRATION_ABORT: multiple unique constraints cover (event_id, referee_id); inspect manually';
	END IF;

	IF cardinality(v_pair_constraints) = 1 THEN
		v_old_constraint_name := v_pair_constraints[1];

		IF (
			SELECT pg_catalog.pg_get_constraintdef(c.oid)
			FROM pg_catalog.pg_constraint AS c
			WHERE c.conrelid = 'public.event_assignments'::regclass
				AND c.conname = v_old_constraint_name
		) IS DISTINCT FROM 'UNIQUE (event_id, referee_id)' THEN
			RAISE EXCEPTION USING
				ERRCODE = 'P0001',
				MESSAGE = 'ASSIGNMENT_MIGRATION_ABORT: the discovered unique constraint is not the expected unconditional pair constraint';
		END IF;

		EXECUTE format(
			'ALTER TABLE public.event_assignments DROP CONSTRAINT %I',
			v_old_constraint_name
		);
	END IF;

	SELECT count(*) INTO v_unconditional_index_count
	FROM pg_catalog.pg_index AS i
	WHERE i.indrelid = 'public.event_assignments'::regclass
		AND i.indisunique
		AND NOT i.indisprimary
		AND i.indpred IS NULL
		AND (
			SELECT array_agg(a.attname::text ORDER BY k.ordinality)
			FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ordinality)
			JOIN pg_catalog.pg_attribute AS a
				ON a.attrelid = i.indrelid
			 AND a.attnum = k.attnum
			WHERE k.ordinality <= i.indnkeyatts
		) = ARRAY['event_id', 'referee_id']::text[];

	IF v_unconditional_index_count <> 0 THEN
		RAISE EXCEPTION USING
			ERRCODE = 'P0001',
			MESSAGE = 'ASSIGNMENT_MIGRATION_ABORT: an unconditional unique event/referee index remains';
	END IF;
END;
$unique_conversion$;

-- Internal DATE_RANGE conflict primitive. Missing ranges on an existing
-- confirmed, otherwise in-scope event fail closed as a conflict.
CREATE FUNCTION private.assignment_has_date_range_conflict(
	p_referee_id uuid,
	p_event_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
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
			AND (
				existing_event.start_date IS NULL
				OR existing_event.end_date IS NULL
				OR (
					existing_event.start_date <= target_event.end_date
					AND existing_event.end_date >= target_event.start_date
				)
			)
	);
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION private.assignment_has_date_range_conflict(uuid, uuid)
	FROM PUBLIC, anon, authenticated, service_role;
		  -- Also detect a standalone unconditional unique index (not backed by a
		  -- constraint) that would continue blocking NEW_ROW_AFTER_CANCEL.

-- Serialize transition-to-confirmed against the write RPC's profile-row lock.
-- The `zz_` prefix makes this trigger run after the existing
-- validate_event_assignment_transition trigger alphabetically.
CREATE FUNCTION private.guard_assignment_confirmation_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
	v_locked_referee_id uuid;
	v_event_start_date date;
	v_event_end_date date;
BEGIN
	IF TG_OP = 'UPDATE'
		AND NEW.status IS DISTINCT FROM OLD.status
		AND NEW.status = 'confirmed' THEN
		SELECT p.id
			INTO v_locked_referee_id
		FROM public.profiles AS p
		WHERE p.id = NEW.referee_id
		FOR UPDATE;
		SELECT e.start_date, e.end_date
			INTO v_event_start_date, v_event_end_date
		FROM public.events AS e
		WHERE e.id = NEW.event_id;

		IF NOT FOUND OR v_event_start_date IS NULL OR v_event_end_date IS NULL THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TARGET';
		END IF;

		IF private.assignment_has_date_range_conflict(NEW.referee_id, NEW.event_id) THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ASSIGNMENT_CONFLICT';
		END IF;
	END IF;

	RETURN NEW;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION private.guard_assignment_confirmation_conflict()
	FROM PUBLIC, anon, authenticated, service_role;

DO $trigger_install$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_catalog.pg_trigger AS t
		WHERE t.tgrelid = 'public.event_assignments'::regclass
			AND t.tgname = 'zz_assignment_confirmation_conflict_guard'
			AND NOT t.tgisinternal
	) THEN
		RAISE EXCEPTION USING
			ERRCODE = 'P0001',
			MESSAGE = 'ASSIGNMENT_MIGRATION_ABORT: confirmation conflict trigger name already exists';
	END IF;

	EXECUTE 'CREATE TRIGGER zz_assignment_confirmation_conflict_guard '
			 || 'BEFORE UPDATE ON public.event_assignments '
			 || 'FOR EACH ROW EXECUTE FUNCTION private.guard_assignment_confirmation_conflict()';
END;
$trigger_install$;

CREATE FUNCTION public.assign_referee_to_event(
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
	created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
	v_actor_id uuid := auth.uid();
	v_is_admin_provinsi boolean;
	v_is_admin_kab_kota boolean;
	v_is_panitia boolean;
	v_actor_provinsi_id uuid;
	v_actor_kabupaten_kota_id uuid;
	v_event_id uuid;
	v_event_created_by uuid;
	v_event_kabupaten_kota_id uuid;
	v_event_provinsi_id uuid;
	v_event_status text;
	v_event_deleted_at timestamp with time zone;
	v_event_start_date date;
	v_event_end_date date;
	v_referee_id uuid;
	v_referee_kabupaten_kota_id uuid;
	v_referee_provinsi_id uuid;
	v_referee_is_active boolean;
	v_referee_registration_status text;
	v_referee_deleted_at timestamp with time zone;
	v_referee_is_profile_complete boolean;
	v_referee_has_wasit_role boolean;
	v_new_assignment_id uuid;
	v_new_created_at timestamp with time zone;
	v_constraint_name text;
BEGIN
	IF v_actor_id IS NULL THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'UNAUTHORIZED_ACTOR';
	END IF;

	IF p_event_id IS NULL OR p_referee_id IS NULL THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TARGET';
	END IF;

	IF p_role IS DISTINCT FROM 'CADANGAN' THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_ASSIGNMENT_ROLE';
	END IF;

	SELECT
		EXISTS (
			SELECT 1 FROM public.user_roles AS ur
			WHERE ur.user_id = v_actor_id
				AND ur.role = 'admin_provinsi'::public.app_role
		),
		EXISTS (
			SELECT 1 FROM public.user_roles AS ur
			WHERE ur.user_id = v_actor_id
				AND ur.role = 'admin_kab_kota'::public.app_role
		),
		EXISTS (
			SELECT 1 FROM public.user_roles AS ur
			WHERE ur.user_id = v_actor_id
				AND ur.role = 'panitia'::public.app_role
		)
	INTO v_is_admin_provinsi, v_is_admin_kab_kota, v_is_panitia;

	IF NOT v_is_admin_provinsi AND NOT v_is_admin_kab_kota AND NOT v_is_panitia THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
	END IF;

	-- Province role takes precedence for multi-role actors; a missing binding
	-- fails closed and never falls back to the actor's city.
	IF v_is_admin_provinsi THEN
		v_actor_provinsi_id := private.get_actor_provinsi_id();
	ELSIF v_is_admin_kab_kota THEN
		v_actor_kabupaten_kota_id := private.get_actor_kabupaten_kota_id();
	END IF;

	SELECT
		e.id,
		e.created_by,
		e.kabupaten_kota_id,
		event_city.provinsi_id,
		e.status,
		e.deleted_at,
		e.start_date,
		e.end_date
	INTO
		v_event_id,
		v_event_created_by,
		v_event_kabupaten_kota_id,
		v_event_provinsi_id,
		v_event_status,
		v_event_deleted_at,
		v_event_start_date,
		v_event_end_date
	FROM public.events AS e
	LEFT JOIN public.kabupaten_kota AS event_city
		ON event_city.id = e.kabupaten_kota_id
	WHERE e.id = p_event_id
	FOR SHARE OF e;

	IF NOT FOUND THEN
		IF v_is_admin_provinsi OR v_is_admin_kab_kota THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN_SCOPE';
		END IF;
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
	END IF;

	IF v_is_admin_provinsi THEN
		IF v_event_provinsi_id IS NULL
			OR v_event_provinsi_id IS DISTINCT FROM v_actor_provinsi_id THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN_SCOPE';
		END IF;
	ELSIF v_is_admin_kab_kota THEN
		IF v_event_kabupaten_kota_id IS NULL
			OR v_event_kabupaten_kota_id IS DISTINCT FROM v_actor_kabupaten_kota_id THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN_SCOPE';
		END IF;
	ELSIF v_is_panitia AND v_event_created_by IS DISTINCT FROM v_actor_id THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
	END IF;

	IF v_event_status IS DISTINCT FROM 'DISETUJUI'
		OR v_event_deleted_at IS NOT NULL
		OR v_event_start_date IS NULL
		OR v_event_end_date IS NULL
		OR v_event_end_date < v_event_start_date THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TARGET';
	END IF;

	-- Lock the referee row so two create/confirm paths for the same referee
	-- serialize around eligibility, conflict, duplicate checks, and insertion.
	SELECT
		p.id,
		p.kabupaten_kota_id,
		referee_city.provinsi_id,
		p.is_active,
		p.registration_status,
		p.deleted_at,
		p.is_profile_complete
	INTO
		v_referee_id,
		v_referee_kabupaten_kota_id,
		v_referee_provinsi_id,
		v_referee_is_active,
		v_referee_registration_status,
		v_referee_deleted_at,
		v_referee_is_profile_complete
	FROM public.profiles AS p
	LEFT JOIN public.kabupaten_kota AS referee_city
		ON referee_city.id = p.kabupaten_kota_id
	WHERE p.id = p_referee_id
	FOR UPDATE OF p;

	IF NOT FOUND THEN
		IF v_is_admin_provinsi OR v_is_admin_kab_kota THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN_SCOPE';
		END IF;
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INELIGIBLE_REFEREE';
	END IF;

	IF v_is_admin_provinsi THEN
		IF v_referee_provinsi_id IS NULL
			OR v_referee_provinsi_id IS DISTINCT FROM v_actor_provinsi_id THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN_SCOPE';
		END IF;
	ELSIF v_is_admin_kab_kota THEN
		IF v_referee_kabupaten_kota_id IS NULL
			OR v_referee_kabupaten_kota_id IS DISTINCT FROM v_actor_kabupaten_kota_id THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN_SCOPE';
		END IF;
	END IF;

	SELECT EXISTS (
		SELECT 1 FROM public.user_roles AS ur
		WHERE ur.user_id = p_referee_id
			AND ur.role = 'wasit'::public.app_role
	) INTO v_referee_has_wasit_role;

	IF NOT v_referee_has_wasit_role
		OR v_referee_is_active IS DISTINCT FROM true
		OR v_referee_registration_status IS DISTINCT FROM 'approved'
		OR v_referee_deleted_at IS NOT NULL
		OR v_referee_is_profile_complete IS DISTINCT FROM true THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INELIGIBLE_REFEREE';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM public.event_assignments AS existing_assignment
		WHERE existing_assignment.event_id = p_event_id
			AND existing_assignment.referee_id = p_referee_id
			AND existing_assignment.status <> 'cancelled'
	) THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DUPLICATE_ASSIGNMENT';
	END IF;

	IF private.assignment_has_date_range_conflict(p_referee_id, p_event_id) THEN
		RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ASSIGNMENT_CONFLICT';
	END IF;

	BEGIN
		INSERT INTO public.event_assignments (event_id, referee_id, role, status)
		VALUES (p_event_id, p_referee_id, p_role, 'pending')
		RETURNING id, created_at INTO v_new_assignment_id, v_new_created_at;
	EXCEPTION WHEN unique_violation THEN
		GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
		IF v_constraint_name = 'event_assignments_event_referee_non_cancelled_uidx' THEN
			RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DUPLICATE_ASSIGNMENT';
		END IF;
		RAISE;
	END;

	RETURN QUERY
	SELECT v_new_assignment_id, p_event_id, p_referee_id, p_role, 'pending'::text, v_new_created_at;
END;
$function$;

REVOKE ALL PRIVILEGES ON FUNCTION public.assign_referee_to_event(uuid, uuid, text)
	FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_referee_to_event(uuid, uuid, text)
	TO authenticated;

COMMENT ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) IS
	'DRAFT: atomically authorizes and creates one referee assignment; apply only after application/import consumer cutover and verification.';

COMMENT ON FUNCTION private.assignment_has_date_range_conflict(uuid, uuid) IS
	'DRAFT internal predicate: confirmed, non-cancelled, non-deleted assignment overlap; no browser EXECUTE.';

-- GATED FOLLOW-UP NOT INCLUDED:
-- Revoke direct browser INSERT / alter assignment RLS only after useAssignReferee,
-- useBatchAssignReferees, useApplyTemplate, and the production-operational
-- import path are cut over and verified. Do not apply this draft while the old
-- direct INSERT consumers remain active.

COMMIT;
