# Security Findings

## P1

### SEC-001 — Assignment authorization not integration-proven

Evidence: `useAdminEventAssignments.ts` checks current identity and `user_roles` before/after password reauthentication, then updates `event_assignments` by ID; Phase 8.3E RLS/mutation tests were blocked. Risk is unverified authorization/data integrity, not a proven exploit. Required action: authorized Non-Production identity and fixture test.

### SEC-002 — Duplicate-event contract mismatch

Evidence: `useEvents.ts:556` conflicts with canonical `check_duplicate_event(text,text,text) RETURNS boolean`. Impact is failed duplicate protection or runtime error. Do not create the historical rich RPC.

### SEC-003 — Privileged seed Edge Function remains

Evidence: `supabase/functions/seed-database` remains and uses privileged server-side capability; F-007 UI/bundle exposure was resolved. Risk is residual capability if independently callable without sufficient environment/function authorization. Required action: separately governed Edge Function exposure review.

### SEC-004 — Broad direct data access

Evidence: 233 `.from` occurrences across 49 current files and 33 direct-access files in Phase 8.1. Distributed authorization/error handling raises the chance of contract drift. Architecture risk, not a demonstrated exploit.

## P2

- `public_system_settings` and `increment_view_count` can fail against canonical schema.
- Browser/runtime integration, direct URL, and RLS regression evidence is absent.
- Static/demo organization data can diverge from persisted data.

## Positive controls

- No service-role client exposure found.
- Client rejects service-role-shaped key; Vite build scans browser bundle.
- Password step-up is masked, not persisted/logged in inspected implementation, and does not itself prove role.
- ProtectedRoute and Edge Function shared authorization exist.

**Security conclusion: NO NEW CONFIRMED EXPLOIT FOUND.** Prioritize authorization/RLS proof and contract reconciliation before feature expansion.
