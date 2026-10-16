# PHASE 1.8 — FINAL MIGRATION ASSEMBLY & STATIC GATE

Date: 2026-09-24
Mode: READ-ONLY
Project: AFP SULSEL / Production `xfscfjwapwnkiinkgbjg`
PostgreSQL: 17.6

## Gate

**BLOCKED — FINAL MIGRATION ASSEMBLY NOT YET EXECUTABLE**

No migration, DDL, DML, `apply_migration`, deployment, or production mutation was executed.

## 1. Live Production Verification

| Check | Result |
|---|---|
| SECURITY DEFINER functions | 42 |
| SECURITY DEFINER with anon EXECUTE | 42 |
| SECURITY DEFINER with authenticated EXECUTE | 42 |
| SECURITY DEFINER with `search_path=public` | 42 |
| RLS-enabled tables without policies | 4 |
| Missing-policy tables | `activity_logs`, `auth_attempts`, `event_logs`, `system_settings` |
| PostgreSQL | 17.6 |

## 2. Phase 1.7 Contract Alignment

### PASS

- Public RPC candidates identified.
- Internal helper boundary identified.
- Trigger/internal function boundary identified.
- Notification internal RPC boundary identified.
- Edge Function boundary identified.
- Kirisan webhook authentication model identified.
- Meta webhook authentication model identified.
- Public application settings boundary identified.
- System settings isolation retained.
- Card counter legacy contract retained.
- Historical notification backfill prohibited.

### BLOCKERS

1. All 42 Production SECURITY DEFINER functions currently remain executable by both `anon` and `authenticated`.
2. All 42 currently use `search_path=public`; hardening requires exact body/dependency treatment.
3. `get_referees()` and `count_referees()` still contain the legacy `auth.role()`/public fallback pattern and therefore cannot be accepted as final authenticated-only security contracts without body remediation.
4. `get_referee_event_count()` and `get_referee_income_summary()` accept nullable region parameters and currently have no visible caller authorization in the function body; their final browser caller contract must be frozen before granting authenticated EXECUTE.
5. `has_schedule_conflict()` accepts arbitrary referee and event identifiers and therefore remains an information-oracle risk until its caller authorization is proven or the function is internalized.
6. `get_honor_statistics()` accepts arbitrary referee ID and currently lacks caller authorization in the function body.
7. `get_admin_dashboard_summary()` accepts NULL region scope and currently lacks role authorization in the function body.
8. `get_audit_logs()` returns sensitive old/new data and currently lacks explicit authorization in the function body.
9. Existing high-risk RLS policies remain unresolved: `event_approvals`, `referee_reviews`, `events`, `profiles`, `pengurus`.
10. Four RLS-enabled internal tables have no policies and must remain private/internal with an explicit final access contract.

## 3. Important Discovery

The Phase 1.7 classification is a design contract, not yet an executable ACL prescription for every function.

Several functions classified as “authenticated application RPC” do not themselves establish sufficient authorization. Therefore Phase 1.8 must NOT simply execute:

```sql
REVOKE EXECUTE FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ... TO authenticated;
```

for every candidate.

An authenticated PostgreSQL role is not equivalent to application authorization.

## 4. Final Assembly Rule

A function may enter the final migration only when all are frozen:

- exact signature;
- exact caller;
- browser/server invocation path;
- authorization predicate;
- region/scope behavior;
- output sensitivity;
- SECURITY DEFINER requirement;
- exact search_path;
- schema-qualified dependencies;
- EXECUTE ACL;
- regression contract.

## 5. Required Treatment Before Test Execution

### Public functions

`get_public_referee`, `get_public_referees`, and `verify_referee_card` require final public-output and abuse-boundary verification before anonymous EXECUTE is retained.

### Authenticated functions

`get_referees`, `get_referee_event_count`, `get_referee_income_summary`, `get_my_referee_event_count`, `has_schedule_conflict`, and `transition_event_assignment_status` require exact caller verification.

### Admin functions

`get_admin_dashboard_summary`, `get_audit_logs`, `get_pending_registrations`, `get_registration_history`, `get_honor_statistics`, and `count_referees` remain DENY-by-default until caller authorization is frozen.

### Internal functions

Authorization helpers and trigger functions remain DENY for `anon` and `authenticated`.

## 6. RLS Gate

Do not add permissive policies to the four internal tables merely to satisfy Data API access.

Final intended posture:

- `system_settings`: private;
- `activity_logs`: private/internal;
- `auth_attempts`: private/internal;
- `event_logs`: private/internal.

Existing high-risk public policies require a separate semantic contract before modification.

## 7. Static Gate Criteria

The final migration cannot be marked executable until static validation proves:

- no unintended `PUBLIC EXECUTE` remains;
- no unintended `anon EXECUTE` remains;
- no unintended `authenticated EXECUTE` remains;
- all SECURITY DEFINER functions have safe search_path configuration;
- all required object references are schema-qualified;
- no deprecated `auth.role()` remains in remediated authorization logic;
- no permissive placeholder RLS is introduced;
- all UPDATE policies have both `USING` and `WITH CHECK` where applicable;
- trigger attachments remain enabled;
- card counter baseline assertions match audited Production state;
- historical cancellation exception remains unchanged;
- no historical notification backfill occurs;
- rollback restores exact pre-migration ACL/RLS/function state.

## 8. Safety Counters

Production mutation: **0**

DDL: **0**

DML: **0**

Migration applied: **0**

Deployment: **0**

Secret reads: **0**

## Final Decision

**PHASE 1.8 — BLOCKED / STATIC GATE NOT PASSED**

The correct next action is to complete the remaining caller/authorization and high-risk RLS contracts, then assemble the executable migration. Do not apply the existing Phase 1.3 draft to Production or Test as-is.
