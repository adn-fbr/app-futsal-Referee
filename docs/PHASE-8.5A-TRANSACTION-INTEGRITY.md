# Phase 8.5A Transaction Integrity

## Finding

`useCreateEvent` in `src/hooks/useEvents.ts` performs:

1. `events.insert(...).select().single()` with status `DIAJUKAN`.
2. Independent `event_approvals.insert(...)` with `pending` status.
3. Approval insertion errors are logged, but the event mutation still returns success.

No existing repository, Edge Function, RPC, or transaction boundary owns both writes. Search found no existing create-event transactional mechanism.

## Invariant violation risk

The current sequence can leave:

`events row exists + required approval row absent`

This is not atomic. A compensating client delete would also be non-atomic and could be denied by RLS or fail independently. It is not an acceptable transaction guarantee.

## Decision

**SCHEMA / TRANSACTION GAP — BLOCKED**

No new RPC, SECURITY DEFINER function, Edge Function, migration, trigger, or speculative rollback was created. The phase stops before Option C because the required backend transaction mechanism is not available and creating one requires separate governance/security/RLS approval.

## Required architecture decision

Choose one separately authorized mechanism:

- existing approved transactional backend function, if discovered;
- existing authorized Edge Function extended with an atomic transaction boundary;
- new reviewed backend transaction mechanism with explicit Auth/RLS/audit/rollback design.

The mechanism must return failure unless both event and approval state commit, preserve Admin Provinsi authorization, prevent duplicate retry creation, and be covered by Non-Production tests.
