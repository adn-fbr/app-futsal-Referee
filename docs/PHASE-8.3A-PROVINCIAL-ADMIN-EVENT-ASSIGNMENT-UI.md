# PHASE 8.3A — PROVINCIAL ADMIN EVENT ASSIGNMENT UI

## Mission
Implemented a role-aware Admin Provinsi event-assignment management page using the canonical `public.event_assignments` table and existing authenticated identity architecture.

## Authorization chain
`ProtectedRoute(requireRole="admin_provinsi")` -> current `supabase.auth.getUser()` -> `user_roles.user_id` check -> current-user password re-authentication -> post-auth user/role re-check -> RLS-respecting `event_assignments.id` update.

## UI
- Route: `/administration/event-assignments`
- Mobile navigation item is visible only for `admin_provinsi`.
- Desktop/tablet data table and mobile card layout.
- Search by event/referee and status filter.
- Detail dialog shows event, referee, date, status, created, and updated timestamps.
- Status dialog shows current and next status.
- Password step-up dialog uses `type="password"`, no persistence, no logging, and clears the value.
- Loading, empty, error, unauthorized, mutation-loading, success, and failure feedback are represented.

## Canonical contract
The implementation uses existing statuses `pending`, `confirmed`, `declined`, and `cancelled`; no new enum/status was introduced. It updates by canonical `event_assignments.id` and joins `events` and `profiles` through existing relationships. No table, migration, audit table, RLS policy, organization, club, or membership object was created.

## Security
Password validity never substitutes for role authorization. The current authenticated account is checked before and after re-authentication, and `user_roles` is checked both times. The browser publishable client is used; no service-role key or Production endpoint is introduced. RLS remains the final database boundary.

## Validation
- TypeScript: PASS
- Full tests: PASS, 11/11
- Build: PASS
- Feature-scoped lint: PASS
- Full repository lint: known Phase 8.2 baseline failure, 66 errors and 11 warnings outside this feature
- Security scan: PASS, only existing defensive service-role detection strings
- Database inspection/mutation: not performed
- Production access: none

## Remaining gaps
No Non-Production mutation test or synthetic Auth user was performed. Full repository lint debt remains. Server-side/RLS integration behavior should be exercised in an authorized Non-Production test phase.

## Decision
PASS — PROVINCIAL ADMIN EVENT ASSIGNMENT UI IMPLEMENTED