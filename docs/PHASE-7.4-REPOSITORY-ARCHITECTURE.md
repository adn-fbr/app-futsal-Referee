# PHASE-7.4 Repository Architecture

Version: v1.0.0
Status: BATCH-01 BLOCKED at pre-migration gate

## Boundary

Target flow:

`UI -> Hook/Application Service -> Domain Repository Interface -> Supabase Repository -> Immutable Canonical Runtime Baseline`

The current repository layer contains Auth, Profile, and Role implementations only. No Events repository was created because the Events contract has not passed pre-migration validation.

## BATCH-01 scope

The Events batch contains these direct business access surfaces:

- `src/hooks/useEvents.ts`: 26 operations over `events`, `event_approvals`, `audit_logs`, and `check_duplicate_event`.
- `src/pages/EventSubmission.tsx`: 5 operations over the `documents` Storage bucket and `send-event-notification` Edge Function.
- `src/hooks/useAutoCompleteEvents.ts`: 2 operations over `auto-complete-events` Edge Function.

Total planned operations: 33. Event assignment, referee-event, and honor-eligibility hooks remain for later batches.

## Repository destination

One domain-level `EventRepository` should eventually own verified event reads, event lifecycle writes, approvals, audit coordination, duplicate checking, document storage coordination, and event notification application-service calls. The exact interface must be extracted from existing consumers during an authorized implementation pass; no speculative methods are added in this blocked pass.

## Contract boundary

Only baseline-verified public objects may be used. `public.increment_view_count(uuid)` and the historical `public.public_system_settings` view remain schema gaps and are outside this batch. The Events batch has an additional unresolved contract mismatch: the source call to `check_duplicate_event` uses five named arguments, while the immutable baseline function identity is `public.check_duplicate_event(text,text,text)`.

No application source, SQL, migration, baseline, generated type, or dependency graph was modified.
