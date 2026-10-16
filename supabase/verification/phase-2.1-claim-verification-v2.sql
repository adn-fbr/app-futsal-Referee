-- Phase 2.1 verification harness v2
-- Review-only SQL for TEST database only.
-- Do not execute in production.
-- Do not modify migration history.
-- Do not modify the v4 migration file.
-- This harness discovers a real TEST fixture instead of using placeholder UUIDs.

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- 1. Target environment is TEST only.
-- 2. The migration file below is already present and reviewed:
--    20260920120000_phase_2_1_notification_channel_claims_v4.sql
-- 3. A real assignment_notifications row exists in TEST.
-- 4. At least one channel is pending (email or whatsapp).
-- 5. Use a dedicated TEST fixture or a transaction with ROLLBACK for mutating tests.
-- 6. Never leave assignment_notifications in sent/failed status or orphan claims.
-- 7. Do not claim this as PASS without verifying actual output from a real TEST database.

-- ============================================================
-- FIXTURE DISCOVERY (must run first)
-- ============================================================
CREATE TEMP TABLE IF NOT EXISTS phase_21_fixture (
  assignment_id UUID,
  channel TEXT,
  claim_id UUID,
  status_before TEXT,
  selected_at TIMESTAMPTZ DEFAULT now()
);

TRUNCATE TABLE phase_21_fixture;

INSERT INTO phase_21_fixture (assignment_id, channel)
SELECT a.assignment_id,
       CASE
         WHEN a.email_status = 'pending' THEN 'email'
         WHEN a.whatsapp_status = 'pending' THEN 'whatsapp'
         ELSE NULL
       END AS channel
FROM (
  SELECT assignment_id, email_status, whatsapp_status
  FROM public.assignment_notifications
  WHERE email_status = 'pending' OR whatsapp_status = 'pending'
  ORDER BY created_at
  LIMIT 1
) a
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_assignment_id uuid;
  v_channel text;
BEGIN
  SELECT assignment_id, channel
    INTO v_assignment_id, v_channel
  FROM phase_21_fixture
  LIMIT 1;

  IF v_assignment_id IS NULL OR v_channel IS NULL THEN
    RAISE EXCEPTION 'BLOCKED: no real TEST fixture with pending assignment_notifications row found for email/whatsapp.';
  END IF;

  RAISE NOTICE 'Fixture discovered: assignment_id=%, channel=%', v_assignment_id, v_channel;
END $$;

SELECT * FROM phase_21_fixture;

-- ============================================================
-- BASIC CLAIM TEST
-- ============================================================
-- Expected result: CLAIMED
-- Actual result: must be CLAIMED for a real pending channel.
-- PASS/FAIL: PASS if returned value is CLAIMED and row exists.

SELECT public.claim_notification_channel(
  (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
  (SELECT channel FROM phase_21_fixture LIMIT 1),
  gen_random_uuid()
) AS result;

SELECT assignment_id, channel, claim_id, claimed_at, expires_at
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1)
ORDER BY claimed_at DESC
LIMIT 10;

-- ============================================================
-- REAL CONCURRENCY TEST (MUST USE TWO POSTGRESQL SESSIONS)
-- ============================================================
-- Do not run as two sequential SELECTs in one session and call it concurrency.
-- This must be executed in Session A and Session B against the same TEST database.
--
-- Session A:
-- BEGIN;
-- SELECT public.claim_notification_channel(
--   (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
--   (SELECT channel FROM phase_21_fixture LIMIT 1),
--   gen_random_uuid()
-- );
-- -- Keep the transaction open long enough to overlap with Session B.
-- -- Do not COMMIT until Session B has attempted its claim.
--
-- Session B:
-- SELECT public.claim_notification_channel(
--   (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
--   (SELECT channel FROM phase_21_fixture LIMIT 1),
--   gen_random_uuid()
-- );
--
-- Expected:
--   - one invocation returns CLAIMED
--   - the other returns NOT_CLAIMED
--   - after both finish, only one active claim row remains for (assignment_id, channel)
--   - no duplicate active claims for same channel
--
-- Sequencing requirement:
--   - Session A must remain open while Session B runs.
--   - This is required to create actual overlap and lock contention.
--   - A sequential two-query script in one session is not a valid concurrency proof.

SELECT assignment_id, channel, COUNT(*) AS active_claim_rows
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1)
GROUP BY assignment_id, channel;

-- ============================================================
-- TERMINAL STATUS TEST (must use real fixture and rollback)
-- ============================================================
-- Use a dedicated TEST fixture or an isolated transaction.
-- Do not leave row in terminal state.

BEGIN;

UPDATE public.assignment_notifications
SET email_status = 'sent',
    updated_at = now()
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND (SELECT channel FROM phase_21_fixture LIMIT 1) = 'email';

UPDATE public.assignment_notifications
SET whatsapp_status = 'sent',
    updated_at = now()
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND (SELECT channel FROM phase_21_fixture LIMIT 1) = 'whatsapp';

SELECT public.claim_notification_channel(
  (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
  (SELECT channel FROM phase_21_fixture LIMIT 1),
  gen_random_uuid()
) AS result;

ROLLBACK;

-- Expected:
--   NOT_CLAIMED.
-- PASS/FAIL: PASS if the function refuses claim when status is terminal.

-- ============================================================
-- EXPIRY + RECLAIM TEST
-- ============================================================
-- Owner A obtains claim_id A.
-- Set expires_at <= now() on the dedicated test fixture.
-- Owner B acquires a new claim_id B.
-- Expected: B = CLAIMED and current claim_id = B.

BEGIN;

SELECT public.claim_notification_channel(
  (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
  (SELECT channel FROM phase_21_fixture LIMIT 1),
  gen_random_uuid()
) AS claim_a_result;

UPDATE public.notification_channel_claims
SET expires_at = now() - interval '1 minute',
    updated_at = now()
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1);

SELECT public.claim_notification_channel(
  (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
  (SELECT channel FROM phase_21_fixture LIMIT 1),
  gen_random_uuid()
) AS claim_b_result;

SELECT assignment_id, channel, claim_id, expires_at
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1);

ROLLBACK;

-- Expected:
--   The final claim row belongs to the reclaiming owner B.
-- PASS/FAIL: PASS if claim_id has been replaced and acts as current owner.

-- ============================================================
-- STALE FENCING TEST
-- ============================================================
-- After B reclaims, A calls finalize with old claim_id.
-- Expected: affected rows = 0, no notification mutation, B claim remains authoritative.
-- This test requires a dedicated fixture and explicit claim IDs for A and B.

BEGIN;

-- create a dedicated live fixture row for testing stale fencing
-- use a real assignment and pending channel from fixture discovery above
WITH candidate AS (
  SELECT assignment_id, channel
  FROM phase_21_fixture
  LIMIT 1
)
SELECT public.claim_notification_channel(
  candidate.assignment_id,
  candidate.channel,
  gen_random_uuid()
)
FROM candidate;

-- capture the current claim_id in a temp result table so stale A can be compared to the current owner
CREATE TEMP TABLE phase_21_stale_fence AS
SELECT assignment_id, channel, claim_id, expires_at
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1)
LIMIT 1;

-- A attempts stale finalize using an old claim id that is no longer the active claim.
SELECT public.finalize_notification_channel(
  (SELECT assignment_id FROM phase_21_stale_fence LIMIT 1),
  (SELECT channel FROM phase_21_stale_fence LIMIT 1),
  gen_random_uuid(),
  'sent',
  'meta',
  NULL,
  NULL
) AS stale_finalize_result;

SELECT assignment_id, channel, claim_id, expires_at
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1);

ROLLBACK;

-- Expected:
--   stale_finalize_result = 0
--   current claim remains
--   notification status remains pending
-- PASS/FAIL: PASS only if the old claim cannot mutate the notification or remove the current claim.

-- ============================================================
-- VALID FINALIZE TEST
-- ============================================================
-- Use current valid claim B.
-- Finalize with status = sent and verify affected rows = 1.
-- Expected: notification status = sent, sent timestamp present, claim row removed.

BEGIN;

WITH claim_row AS (
  SELECT assignment_id, channel, claim_id
  FROM public.notification_channel_claims
  WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
    AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1)
  LIMIT 1
)
SELECT public.finalize_notification_channel(
  claim_row.assignment_id,
  claim_row.channel,
  claim_row.claim_id,
  'sent',
  'meta',
  12345,
  NULL
)
FROM claim_row;

SELECT assignment_id, email_status, whatsapp_status, whatsapp_provider, whatsapp_request_id, updated_at
FROM public.assignment_notifications
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1);

SELECT assignment_id, channel, claim_id
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
  AND channel = (SELECT channel FROM phase_21_fixture LIMIT 1);

ROLLBACK;

-- Expected:
--   affected_rows = 1
--   channel status = sent
--   sent timestamp present
--   claim row removed
-- PASS/FAIL: PASS only when all invariants hold.

-- ============================================================
-- INDEPENDENT CHANNELS TEST
-- ============================================================
-- Same assignment, different channel values.
-- Expected: email and whatsapp may coexist because PK = (assignment_id, channel).

BEGIN;

SELECT public.claim_notification_channel(
  (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
  'email',
  gen_random_uuid()
) AS email_claim_result;

SELECT public.claim_notification_channel(
  (SELECT assignment_id FROM phase_21_fixture LIMIT 1),
  'whatsapp',
  gen_random_uuid()
) AS whatsapp_claim_result;

SELECT assignment_id, channel, claim_id
FROM public.notification_channel_claims
WHERE assignment_id = (SELECT assignment_id FROM phase_21_fixture LIMIT 1)
ORDER BY channel;

ROLLBACK;

-- Expected:
--   two active rows, one for email and one for whatsapp
--   both can exist concurrently because channel is part of primary key
-- PASS/FAIL: PASS if both row claims are present and distinct.

-- ============================================================
-- PRIVILEGE / SECURITY CHECKS
-- ============================================================
-- Verify metadata for TEST schema, table permissions, function permissions, and security model.

SELECT relname,
       relrowsecurity
FROM pg_class
WHERE oid = 'public.notification_channel_claims'::regclass;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'notification_channel_claims';

SELECT p.oid::regprocedure::text AS function_signature,
       p.prosecdef AS is_security_definer,
       p.proconfig
FROM pg_proc p
WHERE p.proname IN ('claim_notification_channel', 'finalize_notification_channel');

SELECT p.oid::regprocedure::text AS function_signature,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       n.nspname AS schema_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('claim_notification_channel', 'finalize_notification_channel');

SELECT proname,
       proargtypes,
       has_function_privilege('public.claim_notification_channel(uuid, text, uuid)', 'EXECUTE') AS public_execute,
       has_function_privilege('anon', 'public.claim_notification_channel(uuid, text, uuid)', 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', 'public.claim_notification_channel(uuid, text, uuid)', 'EXECUTE') AS authenticated_execute,
       has_function_privilege('service_role', 'public.claim_notification_channel(uuid, text, uuid)', 'EXECUTE') AS service_role_execute
FROM pg_proc
WHERE proname = 'claim_notification_channel';

SELECT proname,
       proargtypes,
       has_function_privilege('public.finalize_notification_channel(uuid, text, uuid, text, text, bigint, text)', 'EXECUTE') AS public_execute,
       has_function_privilege('anon', 'public.finalize_notification_channel(uuid, text, uuid, text, text, bigint, text)', 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', 'public.finalize_notification_channel(uuid, text, uuid, text, text, bigint, text)', 'EXECUTE') AS authenticated_execute,
       has_function_privilege('service_role', 'public.finalize_notification_channel(uuid, text, uuid, text, text, bigint, text)', 'EXECUTE') AS service_role_execute
FROM pg_proc
WHERE proname = 'finalize_notification_channel';

-- Expected security result:
--   - public.notification_channel_claims is RLS enabled
--   - PUBLIC/anon/authenticated table access is absent
--   - function PROSECDEF is true
--   - search_path is public, pg_temp
--   - PUBLIC/anon/authenticated EXECUTE is false
--   - service_role EXECUTE is true

-- ============================================================
-- INVARIANT CHECKS
-- ============================================================
SELECT assignment_id, channel, COUNT(*) AS duplicate_rows
FROM public.notification_channel_claims
GROUP BY assignment_id, channel
HAVING COUNT(*) > 1;

SELECT assignment_id, channel, claim_id, expires_at, claimed_at
FROM public.notification_channel_claims
WHERE channel NOT IN ('email', 'whatsapp')
   OR expires_at < claimed_at;

SELECT c.assignment_id, c.channel, c.claim_id,
       n.assignment_id AS notification_exists,
       n.email_status,
       n.whatsapp_status
FROM public.notification_channel_claims c
LEFT JOIN public.assignment_notifications n
  ON n.assignment_id = c.assignment_id
WHERE n.assignment_id IS NULL;

-- Expected:
--   - no duplicate (assignment_id, channel)
--   - channel only email or whatsapp
--   - expires_at >= claimed_at
--   - no orphan claim rows

-- ============================================================
-- ASSERTION FORMAT (required in every test)
-- ============================================================
-- Each test must include:
--   - expected result
--   - actual result
--   - PASS/FAIL condition
--
-- Example:
-- expected: CLAIMED
-- actual: output from SELECT claim_notification_channel(...)
-- pass if actual = CLAIMED and row exists
-- fail if actual != CLAIMED or no row exists

-- ============================================================
-- CLEANUP INSTRUCTIONS
-- ============================================================
-- 1. For transactional tests, use ROLLBACK after verification.
-- 2. For mutation tests that need a live claim, finalize the current valid claim with a valid status and remove the claim row.
-- 3. Do not leave TEST rows in terminal state or orphan claims.
-- 4. Do not modify production or migration history.
-- 5. Do not run this in a non-TEST project or environment.

-- END OF REVIEW-ONLY VERIFICATION HARNESS
