# PHASE 1.2 SECURITY REMEDIATION REPORT

## Status

PARTIAL.

The first production security slice is implemented and verified locally, but the complete gate cannot pass until all remaining Edge Functions receive handler-level authorization and RLS tests run against a real non-production Supabase database.

## Implemented

### P0-01 JWT

- Removed every explicit `verify_jwt = false` entry from [supabase/config.toml](../../supabase/config.toml).
- Platform-level JWT verification is now enabled for all configured functions.

### P0-02 Server authorization

Added [supabase/functions/_shared/authorization.ts](../../supabase/functions/_shared/authorization.ts), which:

- parses a strict bearer token
- resolves the authenticated user through Supabase Auth
- resolves canonical roles from `user_roles`
- resolves tenant scope from `profiles.kabupaten_kota_id`
- rejects unknown roles and failed profile/role resolution

Applied to:

- [supabase/functions/auto-complete-events/index.ts](../../supabase/functions/auto-complete-events/index.ts)
- [supabase/functions/admin-reports/index.ts](../../supabase/functions/admin-reports/index.ts)
- [supabase/functions/seed-database/index.ts](../../supabase/functions/seed-database/index.ts)
- [supabase/functions/send-event-reminders/index.ts](../../supabase/functions/send-event-reminders/index.ts)
- [supabase/functions/send-assignment-notification/index.ts](../../supabase/functions/send-assignment-notification/index.ts)

### P0-04 tenant controls

- Admin reports reject `admin_kab_kota` queries outside the caller's region.
- Reminder processing is scoped to the caller's region or owned events.
- Assignment notifications reject region-mismatched events and non-owner panitia callers.
- Nested reminder-to-notification calls forward the authenticated bearer token.

### Executable tests

Added [supabase/functions/_shared/authorization_test.ts](../../supabase/functions/_shared/authorization_test.ts) covering:

- missing and malformed bearer tokens
- valid bearer extraction
- canonical role checks

## Verification evidence

- Deno type-check passed for all touched Edge Functions.
- Authorization regression tests passed: 3 passed, 0 failed.
- Production build passed.
- No explicit `verify_jwt = false` remains in `supabase/config.toml`.

## Verification blockers

- Local Supabase status cannot be checked because Docker Desktop is unavailable.
- Real RLS and cross-tenant integration tests therefore were not executed.
- Application typecheck currently fails on existing missing `framer-motion` and `vitest` modules plus unrelated existing hook typing errors.
- Repository lint currently fails on existing `any`, empty-interface, and import-style errors.

## Remaining P0

- Apply the shared authorization contract to every remaining privileged function.
- Validate tenant ownership for all resource mutation paths.
- Run real cross-tenant SELECT, INSERT, UPDATE, and DELETE tests against local or dedicated Supabase.
- Resolve legacy role data and policy dependencies before removing compatibility behavior.

## Remaining P1

- Move SMTP/API credentials out of browser-readable `system_settings` queries and client state.
- Tighten remaining permissive RLS policies.
- Document or replace scheduled/system function caller authentication where JWT user auth is not the correct caller model.

## Rollback plan

- Revert only the new config, shared resolver, and function patches if a production compatibility issue is found.
- No historical migration or production data was modified.
- Do not restore `verify_jwt = false` as a workaround; use an explicitly documented secret-key/system caller contract for genuine non-user functions.

## Gate result

This phase remains PARTIAL. The implemented slice is materially safer, but a PASS would require real database authorization evidence and complete function coverage.
