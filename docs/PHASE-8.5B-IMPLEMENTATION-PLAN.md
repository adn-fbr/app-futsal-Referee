# Phase 8.5B Implementation Plan

## Phase 8.5C scope

1. Obtain approved canonical type source and regenerate `src/integrations/supabase/types.ts`; verify diff only.
2. Adapt `useCheckDuplicateEvent` to three canonical text arguments and boolean result.
3. Adapt `EventEdit` duplicate UX to a boolean warning; remove fabricated duplicate record/similarity/date claims.
4. Obtain approval for exact transaction function/RPC identity, input/output, and idempotency semantics.
5. Implement the PostgreSQL transaction mechanism only after security/RLS review; no Production deployment.
6. Replace `useCreateEvent` dual mutation with one atomic call while preserving `DIAJUKAN` and pending approval.
7. Add positive/negative Auth/RLS, transaction failure, retry, double-submit, audit, notification, and historical-date tests.
8. Run typecheck/tests/build/lint comparison and browser validation in Non-Production.

## Stop conditions

Stop if canonical type source cannot be proven, transaction function requires unapproved schema/RLS changes, idempotency cannot be defined, or fixtures/identities are unavailable. Do not compensate with client delete or service-role bypass.
