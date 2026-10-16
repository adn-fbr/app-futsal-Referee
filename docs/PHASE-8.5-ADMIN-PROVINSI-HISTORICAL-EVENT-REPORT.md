# PHASE 8.5 — ADMIN PROVINSI HISTORICAL EVENT, VALIDATION & REFEREE ASSIGNMENT

## Final Gate

**PARTIAL — core historical-date UI implemented; controlled Non-Production validation incomplete**

**PRODUCTION UAT: NOT READY**

## Implemented

- `EventSubmission.tsx` now resolves the canonical `admin_provinsi` role through `AuthContext`.
- Admin Provinsi can select past start/end dates.
- Other roles retain the existing future/today date restriction.
- Historical Event indicator and validation guidance are displayed for past dates.
- Existing canonical create path remains unchanged: `events` insert with `DIAJUKAN`, then existing `event_approvals` pending record.
- Existing approval/detail/assignment routes and `event_assignments` workflow were reused; no duplicate implementation was created.
- Focused static contract test added.

## Existing functionality reused

- `useCreateEvent` and existing event schema fields.
- `AuthContext.isAdminProvinsi()` and `ProtectedRoute`.
- Existing Admin Provinsi event approval flow.
- Existing `RefereeAssignment`/`AdminEventAssignments` pages.
- Existing `pending -> confirmed` assignment mutation and step-up path.
- Existing audit/notification mechanisms where already present.

## Files changed

- `src/pages/EventSubmission.tsx`
- `src/test/phase-8-5-historical-event.test.ts`

No database, Auth, RLS, Supabase configuration, migration, RPC, or Production file was changed.

## Validation

- TypeScript: PASS.
- Focused tests: PASS, 2 tests.
- Full tests: PASS, 10 files / 28 tests.
- Build: PASS.
- Lint: pre-existing 66 errors / 11 warnings.
- Non-Production database operations: 0.
- Auth fixture operations: 0.
- RLS tests: not executed.
- Browser tests: not executed.
- Audit/notification mutation tests: not executed.

## Remaining blockers

1. Synthetic Non-Production identities and event/assignment fixture unavailable.
2. Live RLS/server authorization for historical creation and assignment unverified.
3. Canonical duplicate RPC mismatch remains unresolved; generated Supabase types still describe the historical contract.
4. Existing `useCreateEvent` can leave an event row if approval insertion fails because approval failure is logged rather than rolled back.
5. Live audit, notification, duplicate-assignment, and status persistence evidence is missing.

## Final Answer

What was implemented: Admin Provinsi-only historical date selection and explicit Historical Event UX.

What was reused: existing event creation/status/approval, AuthContext, ProtectedRoute, assignment, step-up, audit, and notification mechanisms.

Database operations: none in this phase.

Auth operations: none; no fixtures/users created.

RLS tests: none; blocked by fixture capability.

Tests: TypeScript PASS, 10 files/28 tests PASS, build PASS, lint baseline unchanged.

Production UAT: NOT READY.

**PARTIAL — core functionality implemented but validation areas remain incomplete**
