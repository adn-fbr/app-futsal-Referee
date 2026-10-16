-- Review-only verification SQL for Phase 2.1
-- Do not execute in production.
-- Use in a review or staging environment only.

-- Test A: simultaneous claim on the same channel
-- Session 1
BEGIN;
SELECT public.claim_notification_channel(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'email',
  gen_random_uuid()
);
COMMIT;

-- Session 2
BEGIN;
SELECT public.claim_notification_channel(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'email',
  gen_random_uuid()
);
COMMIT;

SELECT *
FROM public.notification_channel_claims
WHERE assignment_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND channel = 'email';

-- Test B: terminal status race
UPDATE public.assignment_notifications
SET email_status = 'sent', updated_at = now()
WHERE assignment_id = '11111111-1111-1111-1111-111111111111'::uuid;

SELECT public.claim_notification_channel(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'email',
  gen_random_uuid()
);

-- Test C: stale fencing after reclaim
-- Setup: A claims, A expires, B reclaims
-- A finalizes using the old claim id
-- Expected: affected_rows = 0 and B remains authoritative.
SELECT public.claim_notification_channel(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'email',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
);

UPDATE public.notification_channel_claims
SET expires_at = now() - interval '1 minute'
WHERE assignment_id = '22222222-2222-2222-2222-222222222222'::uuid
  AND channel = 'email';

SELECT public.claim_notification_channel(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'email',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
);

SELECT public.finalize_notification_channel(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'email',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'sent',
  'meta',
  NULL,
  NULL
);

SELECT *
FROM public.notification_channel_claims
WHERE assignment_id = '22222222-2222-2222-2222-222222222222'::uuid
  AND channel = 'email';

-- Test D: independent channels
SELECT public.claim_notification_channel(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'email',
  gen_random_uuid()
);

SELECT public.claim_notification_channel(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'whatsapp',
  gen_random_uuid()
);

SELECT *
FROM public.notification_channel_claims
WHERE assignment_id = '33333333-3333-3333-3333-333333333333'::uuid;

-- Structural checks
SELECT c.assignment_id, c.channel, c.claim_id, c.expires_at
FROM public.notification_channel_claims c
ORDER BY c.assignment_id, c.channel;

-- Expected: one row per assignment/channel pair.
SELECT assignment_id, channel, COUNT(*) AS row_count
FROM public.notification_channel_claims
GROUP BY assignment_id, channel
HAVING COUNT(*) > 1;

-- Finalize verification with exact fencing predicate
SELECT public.finalize_notification_channel(
  '44444444-4444-4444-4444-444444444444'::uuid,
  'whatsapp',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  'sent',
  'kirisan',
  12345,
  NULL
);

-- Privilege review (review-only):
-- REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION ... TO service_role;
