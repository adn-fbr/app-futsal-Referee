# PHASE — TEST MIGRATION SQL DRAFT v1.0

## Review-Only Status

**DO NOT EXECUTE**

- Target: TEST project `shorsqyycpptxcutrqrb`
- SQL execution: prohibited
- Migration application: prohibited
- Frontend modification: prohibited
- Deployment: prohibited
- Production: untouched

This document is the complete SQL draft for line-by-line review. It is not a migration file. The SQL blocks below must not be pasted into `supabase db push`, an SQL console, or a PostgREST endpoint before explicit approval.

## 1. Preconditions Confirmed by Checked-In Canonical Baseline

The canonical baseline contains:

- `public.events.status` with `DIAJUKAN`, `DISETUJUI`, `DITOLAK`, `SELESAI`;
- `public.events.kabupaten_kota_id`;
- `public.events.deleted_at`;
- `public.events.updated_at`;
- `public.event_approvals.approver_id`;
- `public.event_approvals.approved_by`;
- `public.event_approvals.status`;
- `public.event_approvals.action`;
- `public.event_approvals.notes`;
- existing `trg_log_event_approval`;
- existing `public.log_event_approval()`;
- `public.activity_logs(actor_id, entity, entity_id, action, metadata, created_at)`.

The draft does not reference `from_status` or `to_status`, because those columns are not present in the canonical baseline.

## 2. Proposed SQL

### 2.1 Harden the Existing Audit Function

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.

CREATE OR REPLACE FUNCTION public.log_event_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

ALTER FUNCTION public.log_event_approval() OWNER TO postgres;
```

The existing trigger is intentionally not dropped or recreated:

```sql
-- Existing trigger must remain exactly one trigger:
-- public.trg_log_event_approval
-- AFTER INSERT ON public.event_approvals
-- EXECUTE FUNCTION public.log_event_approval()
```

### 2.2 Create the Completion RPC

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.

CREATE OR REPLACE FUNCTION public.mark_event_completed(
  p_event_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS public.events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_event public.events;
  v_result public.events;
  v_event_region uuid;
  v_authorized boolean := false;
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

  v_authorized := public.is_admin_provinsi(v_actor)
    OR (
      public.has_role(v_actor, 'admin_kab_kota'::public.app_role)
      AND v_event_region IS NOT NULL
      AND v_event_region = public.get_user_kabupaten_kota(v_actor)
    );

  IF NOT v_authorized THEN
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
$$;

ALTER FUNCTION public.mark_event_completed(uuid, text) OWNER TO postgres;
```

### 2.3 Function ACL

The migration transaction must configure privileges before the function is exposed through PostgREST:

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.

REVOKE ALL ON FUNCTION public.mark_event_completed(uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mark_event_completed(uuid, text)
  TO authenticated;

-- No service_role grant is included unless an existing internal operational path
-- is proven to require it. service_role is not needed by the current frontend path.

REVOKE ALL ON FUNCTION public.log_event_approval()
  FROM PUBLIC, anon, authenticated;
```

`log_event_approval()` is trigger infrastructure, not a client RPC surface. The trigger owner/function execution path remains privileged without granting direct execution to API roles.

## 3. Required Verification Queries

These queries are for review and post-approval verification only. They must not be executed during this draft phase.

### 3.1 Function Definition and ACL

```sql
-- REVIEW ONLY
SELECT
  p.oid::regprocedure AS function_signature,
  p.prosecdef AS security_definer,
  pg_get_functiondef(p.oid) AS definition,
  pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('mark_event_completed', 'log_event_approval');

-- REVIEW ONLY
SELECT
  routine_schema,
  routine_name,
  privilege_type,
  grantee
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('mark_event_completed', 'log_event_approval')
ORDER BY routine_name, grantee, privilege_type;
```

### 3.2 Trigger Preservation

```sql
-- REVIEW ONLY
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'event_approvals'
  AND trigger_name = 'trg_log_event_approval';
```

Expected: exactly one existing `AFTER INSERT` trigger using `public.log_event_approval()`.

### 3.3 Activity Logs RLS and Grants

```sql
-- REVIEW ONLY
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'activity_logs';

-- REVIEW ONLY
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'activity_logs'
ORDER BY grantee, privilege_type;
```

Expected: `anon` and `authenticated` do not have INSERT, and no generic authenticated INSERT policy is introduced.

## 4. Required Bypass Tests

These are verification procedures, not migration statements.

### BYPASS-01 — Direct Completion UPDATE

Using an authenticated TEST actor and a disposable `DISETUJUI` event, attempt the existing direct client path:

```sql
-- REVIEW TEST PROCEDURE. DO NOT EXECUTE DURING DRAFT REVIEW.
UPDATE public.events
SET status = 'SELESAI'
WHERE id = '<TEST_EVENT_ID>'
  AND status = 'DISETUJUI';
```

Record one explicit result:

```text
BLOCKED
```

if RLS/policy/trigger blocks the direct transition, or:

```text
SECURITY DEBT
```

if the direct transition succeeds. This migration does not revoke the broader `events` UPDATE path.

### BYPASS-02 — Direct Approval INSERT

Using an authenticated TEST actor, attempt a direct forged approval insert:

```sql
-- REVIEW TEST PROCEDURE. DO NOT EXECUTE DURING DRAFT REVIEW.
INSERT INTO public.event_approvals (
  event_id,
  approver_id,
  status,
  notes,
  action,
  approved_by
)
VALUES (
  '<TEST_EVENT_ID>',
  '<OTHER_USER_ID>',
  'completed',
  'direct forged test',
  'COMPLETE',
  '<OTHER_USER_ID>'
);
```

Record:

- whether direct INSERT is allowed;
- whether it changes the event state;
- whether it creates an audit log;
- which actor is recorded;
- whether the result is a separate `DIRECT APPROVAL WRITE HARDENING` security debt.

This draft does not claim that direct approval INSERT is eliminated.

## 5. PostgREST RPC Verification

After explicit TEST migration approval and application only:

```typescript
const { data, error } = await supabase.rpc("mark_event_completed", {
  p_event_id: eventId,
  p_notes: notes ?? null,
});
```

Required authenticated cases:

```text
authorized admin provinsi       -> success
same-region admin kab/kota      -> success
anonymous                        -> denied
unauthorized role                -> denied
wrong-region admin kab/kota     -> denied
missing event                    -> denied
DIAJUKAN                        -> denied
DITOLAK                         -> denied
SELESAI                         -> denied
concurrent second call          -> denied
```

After success, verify:

```sql
-- REVIEW TEST PROCEDURE. DO NOT EXECUTE DURING DRAFT REVIEW.
SELECT id, status
FROM public.events
WHERE id = '<TEST_EVENT_ID>';

SELECT event_id, approver_id, approved_by, status, action, notes
FROM public.event_approvals
WHERE event_id = '<TEST_EVENT_ID>'
ORDER BY created_at DESC;

SELECT actor_id, entity, entity_id, action, metadata
FROM public.activity_logs
WHERE entity = 'event'
  AND entity_id = '<TEST_EVENT_ID>'
ORDER BY created_at DESC;
```

Expected completion record:

```text
events.status = SELESAI
event_approvals.status = completed
event_approvals.action = COMPLETE
event_approvals.approver_id = auth.uid()
event_approvals.approved_by = auth.uid()
activity_logs.actor_id = auth.uid()
activity_logs.entity = event
activity_logs.entity_id = event.id
```

## 6. Concurrency Test

Use two genuinely concurrent authenticated RPC requests against the same disposable `DISETUJUI` event:

```text
Request A -> mark_event_completed(event_id)
Request B -> mark_event_completed(event_id)
```

Expected:

```text
one success
one EVENT_NOT_COMPLETABLE rejection
one event transition to SELESAI
one completion approval
one corresponding activity log
```

Never accept two successful completions.

## 7. Transaction Atomicity Test

A TEST-only fault-injection procedure must force the approval/audit insert to fail after the conditional event update and verify:

```text
events.status remains DISETUJUI
no completed event_approvals row exists
no corresponding activity_logs row exists
```

Do not add a production fault-injection function as part of this migration. The failure can be induced using a disposable TEST-only constraint/fixture only after separate approval.

## 8. Rollback Design

Rollback must be reviewed against the actual TEST ACL snapshot before execution.

### 8.1 Remove Completion RPC

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.
REVOKE ALL ON FUNCTION public.mark_event_completed(uuid, text)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.mark_event_completed(uuid, text);
```

### 8.2 Restore Audit Function

The exact previous TEST definition must be captured before applying the migration. The checked-in baseline prior body is conceptually:

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.
-- Restore only after confirming this matches TEST:
CREATE OR REPLACE FUNCTION public.log_event_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
      'notes', NEW.notes
    ),
    now()
  );

  RETURN NEW;
END;
$$;
```

The existing trigger must remain attached. Rollback must not delete event rows, approvals, or audit logs automatically.

## 9. Explicit Non-Changes

This SQL draft does not modify:

- `events` UPDATE policies or broad event mutation privileges;
- `event_approvals` direct INSERT policies;
- `activity_logs` RLS to open client INSERT;
- Phase 8.9 assignment state machine;
- notification or webhook architecture;
- profile, role, or authentication contracts;
- production database or functions.

## 10. Gate

**PHASE — TEST MIGRATION SQL DRAFT v1.0: READY FOR LINE-BY-LINE REVIEW**

SQL has not been executed. The TEST database is unchanged. Frontend remains unmodified. Production remains untouched.
