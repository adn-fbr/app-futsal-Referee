-- Canonical event assignment status contract.
-- Business evidence from the application: pending -> confirmed/declined by referee/admin,
-- pending/cancelled and confirmed -> cancelled by admin, while invalid transitions are rejected.
-- This contract is enforced in PostgreSQL so direct client-side status writes cannot bypass the state machine.

ALTER TABLE public.event_assignments
DROP CONSTRAINT IF EXISTS event_assignments_status_check;

ALTER TABLE public.event_assignments
ADD CONSTRAINT event_assignments_status_check
CHECK (
  status = ANY (
    ARRAY[
      'pending'::text,
      'confirmed'::text,
      'declined'::text,
      'cancelled'::text
    ]
  )
);

CREATE OR REPLACE FUNCTION public.validate_event_assignment_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_role text := 'unauthorized';
  v_event_region uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF v_actor IS NULL THEN
      RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: authenticated user required';
    END IF;

    IF NEW.status NOT IN ('pending', 'confirmed', 'declined', 'cancelled') THEN
      RAISE EXCEPTION 'INVALID_STATUS: %', NEW.status;
    END IF;

    SELECT kabupaten_kota_id INTO v_event_region
    FROM public.events
    WHERE id = NEW.event_id;

    IF public.is_admin_provinsi(v_actor) THEN
      v_actor_role := 'admin_provinsi';
    ELSIF public.has_role(v_actor, 'admin_kab_kota'::public.app_role)
      AND v_event_region IS NOT NULL
      AND v_event_region = public.get_user_kabupaten_kota(v_actor) THEN
      v_actor_role := 'admin_kab_kota';
    ELSIF NEW.referee_id = v_actor AND OLD.status = 'pending' AND NEW.status IN ('confirmed', 'declined') THEN
      v_actor_role := 'referee';
    END IF;

    IF v_actor_role = 'admin_provinsi' THEN
      IF (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled'))
        OR (OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', OLD.status, NEW.status;
    ELSIF v_actor_role = 'admin_kab_kota' THEN
      IF (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled'))
        OR (OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', OLD.status, NEW.status;
    ELSIF v_actor_role = 'referee' THEN
      IF OLD.status = 'pending' AND NEW.status IN ('confirmed', 'declined') THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', OLD.status, NEW.status;
    END IF;

    IF v_event_region IS NOT NULL THEN
      IF public.has_role(v_actor, 'admin_kab_kota'::public.app_role)
        AND v_event_region != public.get_user_kabupaten_kota(v_actor) THEN
        RAISE EXCEPTION 'CROSS_REGION_ACCESS';
      END IF;
    END IF;

    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: % cannot mutate assignment status', v_actor;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.validate_event_assignment_transition() OWNER TO postgres;

DROP TRIGGER IF EXISTS validate_event_assignment_transition ON public.event_assignments;
CREATE TRIGGER validate_event_assignment_transition
BEFORE UPDATE ON public.event_assignments
FOR EACH ROW
EXECUTE FUNCTION public.validate_event_assignment_transition();

CREATE OR REPLACE FUNCTION public.transition_event_assignment_status(
  p_assignment_id uuid,
  p_target_status text,
  p_reason text DEFAULT NULL
)
RETURNS public.event_assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_assignment public.event_assignments;
  v_old_status text;
  v_event_region uuid;
  v_actor_role text := 'unauthorized';
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: authenticated user required';
  END IF;

  SELECT * INTO v_assignment
  FROM public.event_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF v_assignment.id IS NULL OR v_assignment.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'ASSIGNMENT_NOT_FOUND';
  END IF;

  v_old_status := v_assignment.status;

  IF p_target_status IS NULL OR p_target_status NOT IN ('pending', 'confirmed', 'declined', 'cancelled') THEN
    RAISE EXCEPTION 'INVALID_STATUS: %', p_target_status;
  END IF;

  SELECT kabupaten_kota_id INTO v_event_region
  FROM public.events
  WHERE id = v_assignment.event_id;

  IF public.is_admin_provinsi(v_actor) THEN
    v_actor_role := 'admin_provinsi';
  ELSIF public.has_role(v_actor, 'admin_kab_kota'::public.app_role)
    AND v_event_region IS NOT NULL
    AND v_event_region = public.get_user_kabupaten_kota(v_actor) THEN
    v_actor_role := 'admin_kab_kota';
  ELSIF v_assignment.referee_id = v_actor AND v_assignment.status = 'pending' AND p_target_status IN ('confirmed', 'declined') THEN
    v_actor_role := 'referee';
  END IF;

  IF v_actor_role = 'admin_provinsi' THEN
    IF (v_assignment.status = 'pending' AND p_target_status IN ('confirmed', 'cancelled'))
      OR (v_assignment.status = 'confirmed' AND p_target_status = 'cancelled') THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', v_assignment.status, p_target_status;
    END IF;
  ELSIF v_actor_role = 'admin_kab_kota' THEN
    IF (v_assignment.status = 'pending' AND p_target_status IN ('confirmed', 'cancelled'))
      OR (v_assignment.status = 'confirmed' AND p_target_status = 'cancelled') THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', v_assignment.status, p_target_status;
    END IF;
  ELSIF v_actor_role = 'referee' THEN
    IF v_assignment.status = 'pending' AND p_target_status IN ('confirmed', 'declined') THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'INVALID_TRANSITION: % -> %', v_assignment.status, p_target_status;
    END IF;
  ELSE
    IF public.has_role(v_actor, 'admin_kab_kota'::public.app_role)
      AND v_event_region IS NOT NULL
      AND v_event_region != public.get_user_kabupaten_kota(v_actor) THEN
      RAISE EXCEPTION 'CROSS_REGION_ACCESS';
    END IF;
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR: % cannot mutate assignment status', v_actor;
  END IF;

  UPDATE public.event_assignments
  SET status = p_target_status,
      cancellation_reason = CASE
        WHEN p_target_status = 'cancelled' THEN COALESCE(p_reason, cancellation_reason)
        ELSE NULL
      END,
      cancelled_by = CASE
        WHEN p_target_status = 'cancelled' THEN v_actor
        ELSE cancelled_by
      END,
      updated_at = now()
  WHERE id = v_assignment.id
    AND status = v_old_status
  RETURNING * INTO v_assignment;

  IF v_assignment.id IS NULL THEN
    RAISE EXCEPTION 'CONCURRENT_STATUS_CHANGE';
  END IF;

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
    'EVENT_ASSIGNMENT_STATUS_CHANGED',
    'event_assignments',
    v_assignment.id,
    v_actor,
    jsonb_build_object(
      'status', v_old_status,
      'referee_id', v_assignment.referee_id,
      'event_id', v_assignment.event_id,
      'reason', p_reason
    ),
    jsonb_build_object(
      'status', p_target_status,
      'referee_id', v_assignment.referee_id,
      'event_id', v_assignment.event_id,
      'reason', p_reason,
      'cancelled_by', CASE WHEN p_target_status = 'cancelled' THEN v_actor ELSE NULL END
    ),
    jsonb_build_object(
      'actor_role', v_actor_role,
      'event_region', v_event_region,
      'assignment_id', v_assignment.id,
      'event_id', v_assignment.event_id,
      'referee_id', v_assignment.referee_id
    )
  );

  RETURN v_assignment;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_event_assignment_status(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.transition_event_assignment_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_event_assignment_status(uuid, text, text) TO service_role;
ALTER FUNCTION public.transition_event_assignment_status(uuid, text, text) OWNER TO postgres;
