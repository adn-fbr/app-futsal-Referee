# PHASE 1.8O — Independent SQL Candidate Review & Pre-Apply Checklist

Date: 2026-09-24
Mode: READ-ONLY / PRE-APPLY
Production: `xfscfjwapwnkiinkgbjg`

## Gate

**BLOCKED — candidate is not authorized for Production apply.**

This phase performs a final independent review of the migration boundary and preconditions. No SQL mutation, DDL, DML, migration application, or deployment is executed.

## 1. Security boundary

Target browser-callable SECURITY DEFINER functions remain exactly:

### Public
- `get_public_referee(uuid)`
- `get_public_referees(text, boolean)`
- `verify_referee_card(text)`

### Authenticated
- `get_my_referee_event_count(date, date)`
- `transition_event_assignment_status(uuid, text, text)`

All other SECURITY DEFINER functions remain deny-by-default for `anon` and `authenticated` until their exact caller contract is proven.

## 2. Private RLS tables

The following Production tables remain intentionally RLS-enabled with zero policies:

- `activity_logs`
- `auth_attempts`
- `event_logs`
- `system_settings`

This is consistent with the private/internal contract. No permissive placeholder policy is permitted.

## 3. Historical data assertions

The live Production check confirms **6** cancelled assignments remain active and have no cancellation reason. These are historical exceptions and must be preserved.

The migration must not introduce a CHECK constraint that rejects these existing rows.

The known referee-card sequence gap `2026/737/0040` must remain absent. It must never be filled or renumbered.

## 4. Critical function blockers

### `verify_referee_card`
Must be rewritten before apply so that:
- public response contains only bounded verification data;
- internal UUIDs/counters/timestamps are not exposed unless explicitly part of the public contract;
- verification counter increment is atomic;
- matched-card-only mutation is preserved;
- verification logging remains bounded.

### `soft_delete_record`
No non-internal trigger attachment has been proven. It must remain non-browser-callable and must not be deleted or assumed trigger-only without further lineage evidence.

### Privileged reporting RPCs
Remain deny-by-default:
- `get_referees`
- `count_referees`
- `get_referee_event_count`
- `get_referee_income_summary`
- `get_admin_dashboard_summary`
- `get_audit_logs`
- `get_honor_statistics`
- `get_pending_registrations`
- `get_registration_history`

## 5. Required pre-apply assertions

The executable candidate must abort if any assertion fails:

1. Expected function identities exist exactly once.
2. No unexpected duplicate identities exist.
3. Canonical SECURITY DEFINER functions have `search_path=''`.
4. No canonical function body contains `auth.role()`.
5. Only the three public functions retain anonymous EXECUTE.
6. Only the two approved authenticated RPCs retain authenticated EXECUTE.
7. Internal/trigger functions have browser EXECUTE denied.
8. Privileged reporting functions have browser EXECUTE denied.
9. Existing trigger attachments remain enabled.
10. `transition_event_assignment_status` signature remains unchanged.
11. `system_settings`, `activity_logs`, `auth_attempts`, and `event_logs` remain private.
12. Notification canonical tables remain internal-only.
13. `public_application_settings` remains authenticated-read/service-managed.
14. Card `2026/737/0040` remains absent.
15. Six historical cancellation exceptions remain preserved.
16. No historical notification backfill occurs.
17. No blanket `GRANT ... TO PUBLIC` is introduced.
18. Migration is transactional and abort-first.

## 6. Independent review conclusion

The candidate boundary is internally consistent with the frozen Phase 1.7 contract, but **not yet executable as a Production change** because exact replacement bodies and unresolved contracts are not fully closed.

The correct next action is not Production apply. The next controlled step is to produce a complete executable migration candidate and run its static SQL/security assertions against the isolated Test project, without applying it to Production.

## Safety counters

- Production mutation: 0
- Test mutation: 0
- DDL: 0
- DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## Next phase

**PHASE 1.8P — Test-Project Dry-Run / Candidate Validation Plan**

Production remains untouched.
