# PHASE — MANUAL EVENT COMPLETION TEST MIGRATION DRAFT

## Review Status

**NON-EXECUTABLE REVIEW DRAFT**

- Target: TEST project `shorsqyycpptxcutrqrb`
- Production: untouched
- SQL execution: prohibited at this stage
- Migration file: not created
- Frontend changes: not applied

This document contains the proposed database definitions for line-by-line review. It is not a migration and must not be copied into a SQL execution channel without explicit approval.

## Canonical Contract Used

The checked-in canonical runtime baseline defines `public.event_approvals` with these relevant columns:

```text
id
 event_id
approver_id
status
notes
created_at
updated_at
action
approved_by
```

The existing `trg_log_event_approval` trigger calls `public.log_event_approval()` after insert. The canonical logging function reads `NEW.approved_by`, `NEW.status`, `NEW.action`, `NEW.notes`, and `NEW.event_id`.

The baseline does **not** define `from_status` or `to_status` on `event_approvals`; this draft intentionally does not reference those columns.

## Proposed Completion RPC

The following is a review-only body sketch. It is intentionally not wrapped in migration statements.

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.
-- Proposed public.mark_event_completed(p_event_id uuid, p_notes text DEFAULT NULL)
-- RETURNS public.events
-- SECURITY DEFINER
-- SET search_path = public, pg_temp

DECLARE
  v_actor uuid := auth.uid();
  v_event public.events;
  v_result public.events;
  v_event_region uuid;
  v_is_authorized boolean := false;
  v_updated integer := 0;
  v_notes text := NULLIF(left(trim(COALESCE(p_notes, '')), 2000), '');
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACTOR';
  END IF;

  SELECT *
    INTO v_event
  FROM public.events
  WHERE id = p_event_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;

  v_event_region := v_event.kabupaten_kota_id;

  v_is_authorized := public.is_admin_provinsi(v_actor)
    OR (
      public.has_role(v_actor, 'admin_kab_kota'::public.app_role)
      AND v_event_region IS NOT NULL
      AND v_event_region = public.get_user_kabupaten_kota(v_actor)
    );

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'FORBIDDEN_EVENT_SCOPE';
  END IF;

  UPDATE public.events
  SET status = 'SELESAI',
      updated_at = now()
  WHERE id = p_event_id
    AND status = 'DISETUJUI'
    AND deleted_at IS NULL
  RETURNING * INTO v_result;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'EVENT_NOT_COMPLETABLE';
  END IF;

  INSERT INTO public.event_approvals (
    event_id,
    approver_id,
    status,
    notes,
    action,
    approved_by
  )
  VALUES (
    p_event_id,
    v_actor,
    'completed',
    COALESCE(v_notes, 'Event selesai'),
    'COMPLETE',
    v_actor
  );

  RETURN v_result;
END;
```

### Signature and return type decision

The final SQL must use the actual `public.events` row type only after TEST schema inspection confirms the table shape. Two acceptable reviewed forms are:

```text
RETURNS public.events
```

or a small explicit result record containing `event_id` and `status`. Returning the full row is not required by the frontend and should be avoided if the project prefers a narrow RPC response.

The final SQL would wrap this body in a `CREATE OR REPLACE FUNCTION` declaration with `RETURNS public.events`. The block above is a body-level review artifact, not executable SQL.

## Proposed Function ACL

Review-only intent:

```sql
-- REVOKE EXECUTE FROM PUBLIC and anon.
-- GRANT EXECUTE to authenticated.
-- GRANT EXECUTE to service_role if internal verification requires it.
```

Authorization remains inside the function. The RPC has no `p_user_id`, `p_actor_id`, `p_approver_id`, or `p_approved_by` parameter.

## Proposed Audit Function Hardening

The existing trigger name and trigger attachment must remain unchanged.

Review-only replacement body:

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.
-- CREATE OR REPLACE FUNCTION public.log_event_approval()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public, pg_temp

DECLARE
  v_action text;
BEGIN
  v_action := COALESCE(NEW.action, NEW.status, 'approval');

  INSERT INTO public.activity_logs (
    actor_id,
    entity,
    entity_id,
    action,
    metadata,
    created_at
  )
  VALUES (
    NEW.approved_by,
    'event',
    NEW.event_id,
    v_action,
    jsonb_build_object(
      'status', NEW.status,
      'notes', NEW.notes,
      'approval_id', NEW.id
    ),
    now()
  );

  RETURN NEW;
END;
```

No second trigger is proposed. No direct `activity_logs` insert policy is proposed. The trigger remains the only audit path for completion approvals.

## Atomicity

The RPC must execute the conditional event update and approval insert in one PostgreSQL function invocation. PostgreSQL will roll back the entire function transaction if the approval insert or trigger audit insert fails.

Concurrency behavior:

- the first caller that updates `DISETUJUI` to `SELESAI` affects one row and continues;
- the concurrent caller affects zero rows and raises `EVENT_NOT_COMPLETABLE`;
- only one completion approval is inserted;
- only one audit trigger execution occurs.

A client disconnect after commit does not roll back the committed completion. The database remains authoritative.

## Rollback Design

Rollback requires explicit review of the deployed TEST definitions first.

Conceptually:

1. Revoke EXECUTE on `mark_event_completed`.
2. Drop `mark_event_completed` only after all callers stop using it.
3. Restore the previous `log_event_approval()` definition from the verified TEST baseline.
4. Preserve `trg_log_event_approval`; do not drop the trigger as part of ordinary rollback.
5. Restore the previous function ACL exactly from TEST metadata.
6. Do not reverse event rows or delete completion approvals automatically; data rollback requires a separate approved operational procedure.

No rollback SQL is included because the current TEST schema and deployed function ACL have not yet been independently verified.

## Required Pre-Execution Verification

Before converting this draft into an executable TEST migration:

- confirm `events.updated_at` exists;
- confirm `events.deleted_at` exists and the intended soft-delete predicate is valid;
- confirm `events.kabupaten_kota_id` is the authoritative scope field;
- confirm `event_approvals.approver_id` and `approved_by` both exist;
- confirm `event_approvals.action` accepts `COMPLETE`;
- confirm `event_approvals.status` accepts `completed`;
- confirm `activity_logs` exact columns and RLS;
- confirm the deployed trigger still calls `log_event_approval()`;
- confirm current ACLs for both functions;
- confirm `public.get_user_kabupaten_kota(uuid)` exists with the expected signature;
- confirm the current TEST PostgREST schema cache can expose the approved RPC;
- run authenticated, anonymous, cross-region, invalid-state, concurrency, and rollback atomicity tests.

## Explicit Non-Changes

This draft does not modify:

- Phase 8.9 assignment state machine;
- notification or webhook architecture;
- `assignment_notifications`;
- `notification_channel_claims`;
- `send-whatsapp`;
- `meta-whatsapp-webhook`;
- profiles, roles, authentication, or secrets;
- production database or functions.
