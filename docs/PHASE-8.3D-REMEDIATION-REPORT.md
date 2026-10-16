# PHASE 8.3D — P0/P1 CORE WORKFLOW REMEDIATION

## Status

**BLOCKED — P0/P1 REMEDIATION INCOMPLETE**

This authorized implementation phase applied minimal changes for F-007, F-001, F-002, F-003, F-004, F-005, F-006, F-008, and F-011. Production Supabase, Production database, migrations, RLS, roles, and deployments were not accessed or modified.

## Scope

Implemented changes:

- Removed the production-route Seed Data tab, seed state, seed handler, seed summary, and seed result UI from `DatabaseExport`.
- Kept legitimate Export and Import functionality.
- Aligned the EventDetail assignment CTA with the existing admin-only assignment route.
- Fixed the mobile export path from `/database-export` to `/export`.
- Removed the forbidden Event Approval item from the non-Admin-Provinsi mobile menu branch.
- Added event, assignment, smart-suggestion, and referee-event error/retry states.
- Restricted the Admin Event Assignments step-up mutation to `pending -> confirmed` and added a pending-row predicate.
- Disabled assignment role/remove/confirmation controls while mutations are pending.
- Added the `npm run typecheck` script without changing lint configuration or dependencies.
- Added five focused static contract test files.

`supabase/config.toml` was already modified before this phase and was not touched by this work.

## P0 Forensic Result — F-007

Before: `/export` rendered a third Seed Data tab. `DatabaseExport` imported `useSeedDatabase`, exposed `Generate Seed Data`, and the hook invoked `supabase.functions.invoke('seed-database', { method: 'POST' })`.

Change: The production `DatabaseExport` page no longer imports or references the seed hook, seed function, seed summary, seed handler, or seed result UI. The page retains the legitimate `useExportDatabase` and `useImportDatabase` flows. The isolated hook remains in source for controlled tooling but is not reachable from the `/export` page.

After: The route remains protected by `requireRole="admin_provinsi"`; the production page has no seed-generation entry point; the built `dist` bundle contains none of `seed-database`, `Generate Seed Data`, `SEED_DATA_SUMMARY`, `useSeedDatabase`, or `/database-export`.

Validation: F007 focused contract tests 5/5 PASS, TypeScript PASS, production build PASS, bundle scan PASS. No seed function was invoked. F-007 is **RESOLVED at the application route/bundle boundary**. Deployment/environment policy still needs to preserve this boundary.

## P1 Results

### F-001 — RESOLVED

The CTA now requires `isAdmin()` and `event.status === "DISETUJUI"`, matching the route's existing `requireAdmin` guard. Focused route capability tests pass 2/2.

Residual validation: browser direct-role navigation is still required.

### F-002 — RESOLVED

Mobile navigation now targets the registered `/export` path. Focused navigation tests pass.

Residual validation: runtime mobile navigation was not exercised.

### F-003 — RESOLVED

The `admin_kab_kota` branch no longer renders `/approvals`, which remains visible only in the Admin Provinsi branch. Focused navigation tests pass.

Residual validation: direct URL forbidden behavior remains a browser/non-production validation item.

### F-004 — PARTIALLY_RESOLVED

RefereeAssignment now distinguishes event errors, assignment/suggestion errors, and exposes retry controls. EventDetail distinguishes assignment failure from an empty assignment list and exposes retry.

TypeScript and async-state contract tests pass. Browser query-failure and offline behavior were not run, so this remains a UAT blocker.

### F-005 — PARTIALLY_RESOLVED

The direct Admin Event Assignments mutation now rejects any `nextStatus` other than `confirmed` and updates only rows whose current status is `pending`. The UI offers only confirmation for pending rows; terminal/cancellation status changes are not sent through this direct mutation. Existing canonical cancellation flow remains separate and includes reason, audit, and notification behavior.

TypeScript and assignment contract tests pass 3/3. No authorized Non-Production mutation, RLS, audit, or notification test was executed. This remains a UAT blocker.

### F-006 — PARTIALLY_RESOLVED

Role selection, remove, and confirmation controls are disabled while their relevant mutations are pending. Role changes also return early while update mutation is pending.

TypeScript and static contract validation pass. Browser double-click and mutation-failure revalidation were not executed. This remains a UAT blocker.

### F-008 — PARTIALLY_RESOLVED

RefereeEvents now combines upcoming, past, and pending query errors into an explicit error state with retry controls instead of rendering normal empty tabs.

TypeScript and async-state contract tests pass. Runtime network/offline testing was not performed. This remains a UAT blocker.

### F-011 — PARTIALLY_RESOLVED

Added a reproducible `npm run typecheck` script. `npm run typecheck` passes. The repository lint baseline remains unchanged: `npm run lint` exits 1 with 66 errors, 11 warnings, 77 total problems, and 41 affected files. None of the modified remediation files appears in the post-change lint list.

Classification: PRE_EXISTING, not introduced by Phase 8.3D. This remains a UAT quality-gate blocker unless formally dispositioned.

## Validation Record

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run typecheck` | PASS |
| `npm test -- --run` | PASS, 9 files / 26 tests |
| Focused P0/P1 tests | PASS, including 5 F007, 2 route, 2 navigation, 3 async, and 3 assignment assertions |
| `npm run lint` | FAIL, unchanged baseline: 66 errors / 11 warnings |
| `npm run build` | PASS, local non-production build |
| Production bundle seed scan | PASS, all forbidden seed strings absent |
| Production database/Supabase mutation | Not performed |
| Non-Production Supabase mutation/RLS test | Not performed |
| Browser/manual workflow | Not performed |
| Responsive viewport validation | Not performed |
| Accessibility runtime validation | Not performed |

Build warnings were limited to stale Browserslist data and one JavaScript chunk above 500 kB. Build PASS means local bundling succeeded; it does not mean deployed or Production UAT READY.

## Event Assignment Chain

Static implementation now preserves this chain:

`Admin Provinsi -> authenticated session -> user_roles re-check -> /administration/event-assignments -> canonical event_assignments list -> search/filter/detail -> pending-to-confirmed status dialog -> masked password step-up -> current identity and role re-check -> update by assignment id with pending predicate -> React Query invalidation`.

No event ID, referee ID, or unrelated assignment field is updated by the constrained admin status mutation. Password handling was not weakened: it remains masked, not logged, not persisted, and is not used as role proof.

The chain is not fully UAT-validated because the database mutation, RLS, audit, notification, direct URL, and browser steps were intentionally not exercised.

## Regression Review

No new critical regression was detected in static checks, TypeScript, tests, or build. Legitimate export/import remain present. The only unrelated modified path visible in `git status` is the pre-existing `supabase/config.toml` change, which was not made or reverted by this phase.

All Phase 8.3D implementation files are attributable to the authorized findings:

- `src/pages/DatabaseExport.tsx` — F-007
- `src/pages/EventDetail.tsx` — F-001 and F-004
- `src/components/layout/MobileNav.tsx` — F-002 and F-003
- `src/pages/RefereeAssignment.tsx` — F-004 and F-006
- `src/pages/RefereeEvents.tsx` — F-008
- `src/hooks/useAdminEventAssignments.ts` — F-005
- `package.json` — F-011
- five focused test files — validation for F-001 through F-008

Detailed machine-readable evidence is in the six companion JSON artifacts.

## Safety Counters

See [PHASE-8.3D-SAFETY-COUNTERS.json](PHASE-8.3D-SAFETY-COUNTERS.json). Actual counters include zero Production queries, zero Production mutations, zero schema changes, zero migrations, zero user/role changes, zero service-role exposure, zero password logging/persistence, zero deployments, and zero Supabase mutations.

## Readiness Decision

Code-level remediation is materially improved and the local build passes. However:

- F-004, F-005, F-006, and F-008 remain only partially validated.
- F-011 lint gate still fails.
- Non-Production database/RLS/audit/notification validation was not executed.
- Browser, responsive, keyboard, and accessibility workflows were not executed.

Therefore:

`CODE READY` is not the same as `UAT READY`.

`BUILD PASS` is not the same as `PRODUCTION DEPLOYED`.

The final gate remains:

**BLOCKED — P0/P1 REMEDIATION INCOMPLETE**
