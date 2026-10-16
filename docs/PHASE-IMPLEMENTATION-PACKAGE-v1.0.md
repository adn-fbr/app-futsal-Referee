# PHASE — IMPLEMENTATION PACKAGE v1.0

## 1. Target

```text
TARGET: shorsqyycpptxcutrqrb
PRODUCTION: xfscfjwapwnkiinkgbjg
PRODUCTION CHANGES: NONE
```

This package is for TEST review only.

```text
SQL EXECUTION: NOT AUTHORIZED
MIGRATION APPLICATION: NOT AUTHORIZED
FRONTEND CHANGES: NONE
DEPLOYMENT: NONE
```

## 2. Migration Filename

```text
20260922_event_completion_audit_hardening.sql
```

Required file header:

```sql
-- PHASE: Event Completion Audit Hardening
-- VERSION: Implementation Package v1.0
-- TARGET: TEST ONLY
-- SUPABASE PROJECT REF: shorsqyycpptxcutrqrb
-- PRODUCTION REF: xfscfjwapwnkiinkgbjg
-- EXECUTION: NOT AUTHORIZED BY THIS PACKAGE
```

The migration file itself has not been created. The SQL below is the review package only.

## 3. Preflight SQL

All queries in this section are read-only and must be run against TEST only after the operator has verified the Supabase API target is `shorsqyycpptxcutrqrb`. SQL cannot independently prove the Supabase project ref in every connection, so the operator must compare the connection target with the project ref before execution.

### 3.1 Target Identity

```sql
-- READ ONLY
SELECT
  current_database() AS database_name,
  current_user AS session_user,
  session_user AS login_role,
  inet_server_addr() AS server_address,
  inet_server_port() AS server_port,
  current_setting('server_version') AS server_version,
  current_setting('cluster_name', true) AS cluster_name;
```

Required operator check:

```text
The authenticated connection/API base URL must be the TEST project:
https://shorsqyycpptxcutrqrb.supabase.co

If the connection target cannot be matched to shorsqyycpptxcutrqrb, STOP.
```

### 3.2 Function Inventory

```sql
-- READ ONLY
SELECT
  p.oid,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS argument_types,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration,
  pg_get_functiondef(p.oid) AS definition,
  COALESCE(p.proacl, acldefault('f', p.proowner)) AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname = 'log_event_approval'
    OR (
      p.proname = 'mark_event_completed'
      AND pg_get_function_identity_arguments(p.oid) = 'p_event_id uuid, p_notes text'
    )
  )
ORDER BY p.proname, p.oid;
```

The absence or existence of `mark_event_completed(uuid,text)` must be recorded exactly. Its rollback path depends on that result.

### 3.3 Trigger Inventory

```sql
-- READ ONLY
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_code,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  c.relname AS table_name,
  n.nspname AS table_schema
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'event_approvals'
  AND NOT t.tgisinternal
  AND t.tgname = 'trg_log_event_approval';
```

Expected: exactly one enabled `AFTER INSERT` trigger calling `public.log_event_approval()`.

### 3.4 Activity Logs Security

```sql
-- READ ONLY
SELECT
  c.oid::regclass AS table_name,
  pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS forced_rls,
  array_to_string(c.relacl, E'\n') AS table_acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'activity_logs';

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activity_logs';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'activity_logs'
ORDER BY grantee, privilege_type;
```

### 3.5 Event Approvals Security

```sql
-- READ ONLY
SELECT
  c.oid::regclass AS table_name,
  pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS forced_rls,
  array_to_string(c.relacl, E'\n') AS table_acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'event_approvals';

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'event_approvals';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'event_approvals'
ORDER BY grantee, privilege_type;
```

### 3.6 Schema Trust

```sql
-- READ ONLY
SELECT
  n.oid,
  n.nspname AS schema_name,
  pg_get_userbyid(n.nspowner) AS owner,
  has_schema_privilege('anon', n.oid, 'CREATE') AS anon_can_create,
  has_schema_privilege('authenticated', n.oid, 'CREATE') AS authenticated_can_create,
  has_schema_privilege('service_role', n.oid, 'CREATE') AS service_role_can_create,
  array_to_string(n.nspacl, E'\n') AS schema_acl
FROM pg_namespace n
WHERE n.nspname = 'public';
```

Required evidence before implementation:

```text
anon_can_create = false
authenticated_can_create = false
schema owner = current trusted TEST owner
```

This package does not alter schema privileges.

### 3.7 Existing Data Counts

```sql
-- READ ONLY
SELECT 'activity_logs' AS table_name, count(*) AS row_count
FROM public.activity_logs
UNION ALL
SELECT 'event_approvals', count(*)
FROM public.event_approvals;

SELECT status, count(*) AS row_count
FROM public.events
GROUP BY status
ORDER BY status;
```

### 3.8 Helper Function Signatures

```sql
-- READ ONLY
SELECT
  p.oid::regprocedure AS function_signature,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname = 'is_admin_provinsi'
    OR p.proname = 'has_role'
    OR p.proname = 'get_user_kabupaten_kota'
  )
ORDER BY p.proname, p.oid;
```

## 4. Migration SQL

The following is the complete executable migration body for review. It must not be executed by this package.

```sql
-- PHASE: Event Completion Audit Hardening
-- VERSION: Implementation Package v1.0
-- TARGET: TEST ONLY
-- SUPABASE PROJECT REF: shorsqyycpptxcutrqrb
-- PRODUCTION REF: xfscfjwapwnkiinkgbjg
-- EXECUTION: NOT AUTHORIZED BY THIS PACKAGE

BEGIN;

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

-- Owner must match the preflight-verified trusted TEST owner.
ALTER FUNCTION public.log_event_approval() OWNER TO postgres;

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

-- Apply function ACL changes before COMMIT, with no transaction window between definition and ACL hardening.
REVOKE ALL ON FUNCTION public.mark_event_completed(uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mark_event_completed(uuid, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.log_event_approval()
  FROM PUBLIC, anon, authenticated;

-- Preserve the existing trigger; do not create or replace a second trigger.

COMMIT;
```

The migration intentionally does not revoke broad direct `events` UPDATE or `event_approvals` INSERT privileges. Those are separate security debt surfaces and must be tested after implementation.

## 5. Postflight SQL

### 5.1 Completion RPC Definition

```sql
-- READ ONLY
SELECT
  p.oid,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS argument_types,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'mark_event_completed'
  AND pg_get_function_identity_arguments(p.oid) = 'p_event_id uuid, p_notes text';
```

Expected:

```text
owner = postgres
security_definer = true
configuration contains search_path=public, pg_temp
return_type = public.events
```

### 5.2 Function ACL

```sql
-- READ ONLY
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  p.oid::regprocedure AS function_signature,
  grantee,
  privilege_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
JOIN pg_roles r ON r.oid = a.grantee
WHERE n.nspname = 'public'
  AND (
    p.proname = 'log_event_approval'
    OR p.proname = 'mark_event_completed'
  )
ORDER BY p.proname, grantee, privilege_type;
```

Expected API-role outcomes:

```text
mark_event_completed: authenticated EXECUTE only
log_event_approval: no PUBLIC, anon, or authenticated EXECUTE
```

### 5.3 Trigger

```sql
-- READ ONLY
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled_code,
  pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'event_approvals'
  AND t.tgname = 'trg_log_event_approval'
  AND NOT t.tgisinternal;
```

Expected: exactly one enabled `AFTER INSERT` trigger calling `public.log_event_approval()`.

### 5.4 Activity Logs and Schema Trust

```sql
-- READ ONLY
SELECT
  c.oid::regclass AS table_name,
  pg_get_userbyid(c.relowner) AS owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS forced_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'activity_logs';

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activity_logs';

SELECT
  n.nspname AS schema_name,
  pg_get_userbyid(n.nspowner) AS owner,
  has_schema_privilege('anon', n.oid, 'CREATE') AS anon_can_create,
  has_schema_privilege('authenticated', n.oid, 'CREATE') AS authenticated_can_create,
  has_schema_privilege('service_role', n.oid, 'CREATE') AS service_role_can_create
FROM pg_namespace n
WHERE n.nspname = 'public';
```

Required: RLS remains enabled, no generic authenticated INSERT policy exists, and both untrusted API roles have `CREATE = false`.

## 6. Rollback SQL

Exact rollback depends on the preflight snapshot. The package cannot honestly provide a universal exact restore body before that snapshot is captured.

### 6.1 If `mark_event_completed(uuid,text)` Was Absent Before Migration

```sql
-- REVIEW ONLY. Execute only after preflight proves prior absence.
BEGIN;

REVOKE ALL ON FUNCTION public.mark_event_completed(uuid, text)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION public.mark_event_completed(uuid, text);

-- Restore the exact preflight definition, owner, security mode,
-- search_path, and ACL of public.log_event_approval() here.
-- Do not guess these values.

COMMIT;
```

### 6.2 If `mark_event_completed(uuid,text)` Existed Before Migration

```text
Do not run the DROP rollback above.
Restore the exact captured definition, owner, security mode, search_path,
ACL, and prior existence state from the preflight snapshot.
```

### 6.3 Data Safety

Rollback must not delete or mutate:

- `events`;
- `event_approvals`;
- `activity_logs`.

The trigger remains in place unless the preflight snapshot proves a different prior state.

## 7. Test Matrix

### Authorization

| Test | Expected |
|---|---|
| admin_provinsi completes `DISETUJUI` event | PASS |
| admin_kab_kota same region | PASS |
| admin_kab_kota wrong region | DENY |
| wasit | DENY |
| panitia | DENY unless separately approved contract exists |
| anonymous | DENY |
| invalid/expired session | DENY |

### Status

| Test | Expected |
|---|---|
| `DISETUJUI → SELESAI` | PASS |
| `DIAJUKAN → SELESAI` | DENY |
| `DITOLAK → SELESAI` | DENY |
| `SELESAI → SELESAI` | DENY |
| deleted event | DENY |
| nonexistent event | DENY |

### Audit

After successful completion:

```text
events.status = SELESAI
exactly one new event_approvals row
status = completed
action = COMPLETE
approver_id = auth.uid()
approved_by = auth.uid()
exactly one corresponding activity_logs row
actor_id = auth.uid()
entity = event
entity_id = event.id
metadata.approval_id = event_approvals.id
```

### Actor Spoofing

Send client payloads containing `userId`, `actorId`, `approverId`, or `approvedBy`. The RPC signature must reject unknown parameters at the API boundary or ignore them at the caller layer; actor attribution must remain `auth.uid()`.

### Concurrency

Two genuinely overlapping authenticated RPC requests against the same event must produce:

```text
one success
one EVENT_NOT_COMPLETABLE rejection
one event transition
one completion approval
one completion activity log
```

### Transaction Atomicity

Force approval/audit failure in disposable TEST infrastructure. Expected:

```text
event remains DISETUJUI
no completed approval
no completion audit
```

### Bypass Tests

**BYPASS-01:** direct client update to `events.status = 'SELESAI'`; record `BLOCKED` or `SECURITY DEBT`.

**BYPASS-02:** direct `event_approvals` insert with forged `approved_by`; record whether insert succeeds, whether event changes, whether an audit row is created, and whether actor spoofing occurs.

### PostgREST HTTP Verification

Use actual authenticated clients/API calls, not only privileged SQL:

```text
authenticated admin_provinsi -> success
authenticated same-region admin_kab_kota -> success
wrong-region admin_kab_kota -> denied
wasit -> denied
panitia -> denied
anonymous -> denied
repeated/concurrent invocation -> one success only
```

## 8. Security Notes

- The completion RPC is `SECURITY DEFINER` and derives actor identity exclusively from `auth.uid()`.
- `public, pg_temp` is the fixed search path; `pg_temp` is last.
- `activity_logs` remains trusted-write-only; no client INSERT policy is added.
- Function ACL changes are inside the same transaction as function replacement.
- Existing approval trigger remains the only completion audit trigger.
- `FOR UPDATE` is used only inside the completion database transaction; it is not a provider ownership mechanism.
- The RPC makes no external provider or network call.
- Direct `events` UPDATE and direct `event_approvals` INSERT are intentionally not broadly revoked. Their outcomes are separate security-debt test results.
- The database transaction provides atomicity for event update, approval insertion, and audit logging; it does not claim exactly-once semantics outside that transaction.

## 9. Gate

# IMPLEMENTATION PACKAGE v1.0: READY FOR REVIEW

This package is ready for human review only. It does not authorize SQL execution, migration creation/application, frontend changes, deployment, TEST mutation, or production access.
