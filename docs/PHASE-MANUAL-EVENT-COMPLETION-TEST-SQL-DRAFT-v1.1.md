# PHASE — MANUAL EVENT COMPLETION TEST SQL DRAFT v1.1

## 1. Review Status

**DESIGN / REVIEW DRAFT ONLY**

- Target: TEST project `shorsqyycpptxcutrqrb`
- SQL execution: **NOT PERFORMED**
- Migration file: **NOT CREATED**
- Migration application: **NOT PERFORMED**
- TEST database: **UNCHANGED**
- Frontend: **NOT MODIFIED**
- Deployment: **NOT PERFORMED**
- Production: **UNTOUCHED**

This document is complete enough for implementation review. It is not executable migration output and must not be pasted into a SQL console, `supabase db push`, or PostgREST.

The checked-in canonical baseline defines `event_approvals` with both `approver_id` and `approved_by`, plus `status`, `action`, `notes`, and the existing `trg_log_event_approval`. It does not define `from_status` or `to_status`; this draft does not reference those columns.

## 2. Preconditions

Before implementation approval, capture current TEST evidence for:

- `public.events` columns, status constraint, RLS, policies, owner, and grants;
- `public.event_approvals` columns, constraints, RLS, policies, owner, and grants;
- `public.activity_logs` columns, RLS, policies, owner, and grants;
- `public.log_event_approval()` exact definition, owner, security mode, search path, and ACL;
- `public.mark_event_completed(uuid, text)` existence and ACL, including confirmed absence if not present;
- `trg_log_event_approval` name, timing, event, action, and function identity;
- `public` schema CREATE privileges for `anon` and `authenticated`;
- `public.is_admin_provinsi(uuid)`, `public.has_role(uuid, app_role)`, and `public.get_user_kabupaten_kota(uuid)` signatures;
- PostgREST schema-cache visibility after implementation.

The schema-trust checks below are mandatory preconditions. The draft does not change schema privileges.

## 3. Hardened Audit Function

Review-only SQL definition:

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

The existing trigger is preserved and must remain exactly one trigger:

```text
AFTER INSERT ON public.event_approvals
EXECUTE FUNCTION public.log_event_approval()
```

No second trigger is created.

## 4. Completion RPC

Review-only SQL definition:

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

The only client inputs are `p_event_id` and `p_notes`. There is no actor, user, approver, or approved-by parameter.

## 5. Function ACL

Review-only ACL intent:

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.

REVOKE ALL ON FUNCTION public.mark_event_completed(uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mark_event_completed(uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.log_event_approval()
  FROM PUBLIC, anon, authenticated;
```

No `service_role` grant is proposed because no documented internal caller currently requires it.

`log_event_approval()` is trigger infrastructure, not a client API. Post-migration verification must prove that trigger execution still succeeds after direct API EXECUTE is revoked.

## 6. Security-Definer Schema Trust

No schema privilege is changed by this draft.

Before implementation, verify that untrusted API roles cannot create objects in the trusted `public` schema:

```sql
-- REVIEW / VERIFICATION ONLY. DO NOT EXECUTE DURING DRAFT REVIEW.

SELECT
  n.nspname AS schema_name,
  has_schema_privilege('anon', n.oid, 'CREATE') AS anon_can_create,
  has_schema_privilege('authenticated', n.oid, 'CREATE') AS authenticated_can_create,
  has_schema_privilege('service_role', n.oid, 'CREATE') AS service_role_can_create,
  pg_get_userbyid(n.nspowner) AS owner
FROM pg_namespace n
WHERE n.nspname = 'public';
```

Required evidence:

```text
anon CREATE = false
authenticated CREATE = false
postgres/owner = current TEST configuration
service_role = observed and unchanged
```

The draft does not automatically revoke or grant schema privileges.

## 7. Required Verification Queries

### 7.1 Function Definition, Owner, Security Mode, Search Path

```sql
-- REVIEW / POST-IMPLEMENTATION VERIFICATION ONLY.

SELECT
  p.oid::regprocedure AS function_signature,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.oid::regprocedure::text = 'public.mark_event_completed(uuid,text)'
    OR p.oid::regprocedure::text = 'public.log_event_approval()'
  );
```

Expected:

```text
mark_event_completed: owner postgres, SECURITY DEFINER, search_path public, pg_temp
log_event_approval: owner postgres, SECURITY DEFINER, search_path public, pg_temp
```

### 7.2 Function ACL

```sql
-- REVIEW / POST-IMPLEMENTATION VERIFICATION ONLY.

SELECT
  routine_schema,
  routine_name,
  specific_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('mark_event_completed', 'log_event_approval')
ORDER BY routine_name, grantee, privilege_type;
```

Expected:

```text
mark_event_completed: authenticated EXECUTE only among API roles
log_event_approval: no PUBLIC, anon, or authenticated EXECUTE
```

### 7.3 Trigger Exactness

```sql
-- REVIEW / POST-IMPLEMENTATION VERIFICATION ONLY.

SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'event_approvals'
  AND trigger_name = 'trg_log_event_approval';
```

Expected: exactly one `AFTER INSERT` trigger using `public.log_event_approval()`.

### 7.4 Activity Logs RLS and Grants

```sql
-- REVIEW / POST-IMPLEMENTATION VERIFICATION ONLY.

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS forced_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'activity_logs';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'activity_logs'
ORDER BY grantee, privilege_type;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activity_logs';
```

Required result: authenticated and anon cannot directly insert into `activity_logs`; no generic authenticated INSERT policy exists.

### 7.5 RPC Payload Contract

The authenticated client request must contain only:

```json
{
  "p_event_id": "<uuid>",
  "p_notes": "<optional text>"
}
```

It must not contain `userId`, `actorId`, `approverId`, or `approvedBy`.

## 8. BYPASS-01 — Direct Events Update

After explicit TEST implementation approval, use an authenticated actor and disposable `DISETUJUI` event:

```sql
-- REVIEW TEST PROCEDURE. DO NOT EXECUTE DURING DRAFT REVIEW.

UPDATE public.events
SET status = 'SELESAI'
WHERE id = '<TEST_EVENT_ID>'
  AND status = 'DISETUJUI';
```

Record exactly one result:

```text
BLOCKED
```

if the direct transition is denied, or:

```text
SECURITY DEBT
```

if it succeeds.

This phase intentionally does not revoke broad `events` UPDATE capability because approval, rejection, and editing workflows still use that surface. If direct completion succeeds, do not claim the RPC is the only completion enforcement boundary.

## 9. BYPASS-02 — Direct Approval Spoof Test

After explicit TEST implementation approval, attempt:

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

1. whether INSERT is allowed;
2. whether the event status changes;
3. whether `activity_logs` is created;
4. `activity_logs.actor_id` value;
5. whether the actor can be spoofed.

If `activity_logs.actor_id = OTHER_USER_ID`, record:

```text
DIRECT APPROVAL WRITE / AUDIT ACTOR SPOOFING = SECURITY DEBT
```

This draft does not fix that separate direct-write problem.

## 10. PostgREST Test Matrix

After migration approval and application, test through the actual authenticated Supabase/PostgREST path:

```typescript
const { data, error } = await supabase.rpc("mark_event_completed", {
  p_event_id: eventId,
  p_notes: notes ?? null,
});
```

| Case | Expected |
|---|---|
| authorized `admin_provinsi` | success |
| same-region `admin_kab_kota` | success |
| anonymous | denied |
| unauthorized role | denied |
| wrong-region `admin_kab_kota` | denied |
| missing event | denied |
| `DIAJUKAN` | denied |
| `DITOLAK` | denied |
| `SELESAI` | denied |
| deleted event | denied |
| concurrent second call | denied with `EVENT_NOT_COMPLETABLE` |

Success verification:

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

Expected success record:

```text
events.status = SELESAI
event_approvals.status = completed
event_approvals.action = COMPLETE
event_approvals.approver_id = authenticated actor
event_approvals.approved_by = authenticated actor
activity_logs.actor_id = authenticated actor
activity_logs.entity = event
activity_logs.entity_id = event.id
metadata contains approval_id = event_approvals.id
```

## 11. Concurrency Test

Use two genuinely overlapping authenticated RPC calls against one disposable `DISETUJUI` event:

```text
Request A -> mark_event_completed(event_id)
Request B -> mark_event_completed(event_id)
```

Expected:

```text
exactly 1 success
exactly 1 EVENT_NOT_COMPLETABLE rejection
exactly 1 event transition
exactly 1 completion approval
exactly 1 corresponding activity log
```

Never accept two successful completions.

## 12. Transaction Atomicity Test

Use disposable TEST-only fault injection approved separately. Do not create a permanent production fault-injection function in this draft.

Force the approval or audit operation to fail after the internal event update and verify:

```text
events.status remains DISETUJUI
no completed event_approvals row exists
no corresponding activity_logs row exists
```

This proves that event update, approval insert, and trigger audit are one transaction.

## 13. Exact Rollback Snapshot

The snapshot must be captured before implementation. The following queries define the required evidence; the draft does not execute them.

### 13.1 Existing Audit Function

```sql
-- REVIEW / PRE-IMPLEMENTATION SNAPSHOT ONLY.

SELECT
  p.oid::regprocedure AS function_signature,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration,
  pg_get_functiondef(p.oid) AS exact_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.oid::regprocedure::text = 'public.log_event_approval()';

SELECT routine_schema, routine_name, specific_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'log_event_approval';
```

### 13.2 Completion RPC Existing State

```sql
-- REVIEW / PRE-IMPLEMENTATION SNAPSHOT ONLY.

SELECT
  p.oid::regprocedure AS function_signature,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration,
  pg_get_functiondef(p.oid) AS exact_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.oid::regprocedure::text = 'public.mark_event_completed(uuid,text)';

SELECT routine_schema, routine_name, specific_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'mark_event_completed';
```

Expected current state is absence; absence must be recorded rather than assumed.

### 13.3 Trigger State

```sql
-- REVIEW / PRE-IMPLEMENTATION SNAPSHOT ONLY.

SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'event_approvals'
  AND trigger_name = 'trg_log_event_approval';
```

### 13.4 Activity Logs State

```sql
-- REVIEW / PRE-IMPLEMENTATION SNAPSHOT ONLY.

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS forced_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'activity_logs';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'activity_logs';

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activity_logs';
```

### 13.5 Public Schema Trust State

```sql
-- REVIEW / PRE-IMPLEMENTATION SNAPSHOT ONLY.

SELECT
  n.nspname AS schema_name,
  has_schema_privilege('anon', n.oid, 'CREATE') AS anon_can_create,
  has_schema_privilege('authenticated', n.oid, 'CREATE') AS authenticated_can_create,
  has_schema_privilege('service_role', n.oid, 'CREATE') AS service_role_can_create,
  pg_get_userbyid(n.nspowner) AS owner
FROM pg_namespace n
WHERE n.nspname = 'public';
```

Required evidence:

```text
anon CREATE = false
authenticated CREATE = false
postgres/owner = current TEST configuration
service_role = observed and unchanged
```

## 14. Rollback Procedure

Rollback must restore the exact captured TEST state, not a guessed historical definition.

### 14.1 Completion RPC

```sql
-- REVIEW DRAFT ONLY. DO NOT EXECUTE.

REVOKE ALL ON FUNCTION public.mark_event_completed(uuid, text)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.mark_event_completed(uuid, text);
```

If the pre-implementation snapshot proves that the function existed, restore its exact captured definition, owner, security mode, search path, and ACL instead of dropping it.

### 14.2 Audit Function

Restore the exact captured `log_event_approval()` definition, owner, `SECURITY INVOKER`/`SECURITY DEFINER` mode, search path, and ACL. The checked-in baseline shows a prior invoker-style definition without a fixed search path, but the TEST snapshot is authoritative.

### 14.3 Trigger

Do not drop or recreate the trigger during normal rollback. Verify that the exact captured trigger remains:

```text
trg_log_event_approval
AFTER INSERT ON public.event_approvals
EXECUTE FUNCTION public.log_event_approval()
```

### 14.4 Data

Rollback must not automatically delete:

- `events` rows;
- `event_approvals` rows;
- `activity_logs` rows.

Data cleanup requires a separate approved operational procedure.

## 15. Known Security Debt

The following remain explicitly open unless post-implementation tests prove otherwise:

1. **Direct events completion bypass**: broad `events` UPDATE capability is not changed. If direct `status = 'SELESAI'` succeeds, record `SECURITY DEBT` and do not describe the RPC as the sole database enforcement boundary.
2. **Direct approval write**: existing direct `event_approvals` INSERT may remain for approval/rejection workflows. If a caller can forge `approved_by` and create `activity_logs.actor_id` for another user, record `DIRECT APPROVAL WRITE / AUDIT ACTOR SPOOFING = SECURITY DEBT`.
3. **Schema trust**: implementation cannot be considered complete until `anon CREATE = false` and `authenticated CREATE = false` are evidenced for `public`.
4. **Trigger ACL behavior**: revoking direct EXECUTE from API roles must be verified against actual trigger execution; it must not be assumed.

No debt is silently closed by creating the completion RPC.

## 16. Explicit Non-Changes

This draft does not modify:

- broad `events` UPDATE policies;
- direct `event_approvals` INSERT policies;
- `activity_logs` RLS or client INSERT privileges;
- Phase 8.9 assignment state machine;
- notifications, webhooks, providers, or message delivery;
- profiles, roles, authentication, or secrets;
- production database, functions, or ACLs;
- frontend completion caller.

## 17. Failure-Window Interpretation

### A. Normal RPC transaction

```text
event update
→ event_approvals insert
→ existing trigger audit
→ commit
```

Result: `SELESAI` plus one completion approval and one corresponding audit row.

### B. Process crash during the database transaction

Result: PostgreSQL rolls back the uncommitted event update, approval, and audit work.

### C. Provider or network issue

Not applicable. This RPC performs no external provider or network call.

### D. Database failure during approval or audit

Result: the entire RPC transaction rolls back; the event remains `DISETUJUI` and no partial completion record remains.

The design does not claim exactly-once semantics beyond the database transaction boundary.

## 18. Gate

# PHASE — TEST MIGRATION SQL DRAFT v1.1: READY FOR IMPLEMENTATION REVIEW

This gate means only that the revised draft includes the requested security review corrections and is ready for implementation review. It does not authorize SQL execution, migration application, deployment, frontend changes, or production access.
