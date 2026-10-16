# Phase 8.5 Gap Report

## Gaps that block full PASS

### GAP-85-001 — Non-Production fixture capability

Synthetic Admin Provinsi, non-admin, referee, event, and pending assignment fixtures are unavailable. No remote mutation was attempted.

### GAP-85-002 — Duplicate-event contract

Canonical `check_duplicate_event(p_kota_id,p_location,p_name) RETURNS boolean` conflicts with generated types and the five-argument application caller. No speculative RPC or generated-type edit was performed.

### GAP-85-003 — Server-side historical-event authorization proof

The UI now permits past dates only for `isAdminProvinsi()`, but live RLS/server authorization has not been tested. UI gating is not the security boundary.

### GAP-85-004 — Audit/notification proof

Existing audit and notification mechanisms were reused by existing workflows, but historical creation/validation/assignment/status transitions were not executed against Non-Production.

### GAP-85-005 — Event creation transaction boundary

`useCreateEvent` inserts an event then an approval record; approval insertion errors are logged but do not fail/rollback the event. This is an existing data-integrity risk relevant to historical creation.

## No schema changes proposed

Canonical `events`, `event_approvals`, `event_assignments`, `profiles`, `user_roles`, and existing statuses are sufficient for the static historical-date UI change. Do not add a Historical status/field without separate contract proof.

## Required next action

Prepare approved Non-Production identities and a reversible fixture, then run the 28-case matrix. Resolve generated canonical types/caller contract before enabling duplicate validation as a reliable gate.
