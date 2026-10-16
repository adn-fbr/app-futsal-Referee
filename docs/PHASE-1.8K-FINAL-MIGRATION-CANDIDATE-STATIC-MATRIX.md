# PHASE 1.8K — Final Migration Candidate Assembly & Static Security Test Matrix

Date: 2026-09-24  
Mode: READ-ONLY  
Environment: Production `xfscfjwapwnkiinkgbjg`  
Status: **BLOCKED — candidate assembled; NOT APPLIED**

## 1. Scope

This phase converts the frozen Phase 1.8J rewrite specification into an abort-first migration candidate and static verification matrix.

No migration, DDL, DML, ACL mutation, RLS mutation, deployment, provider call, or secret read was executed.

## 2. Live precondition

The current Production catalog still exposes all 42 SECURITY DEFINER functions to both `anon` and `authenticated`, and all 42 currently use `search_path=public`.

This confirms the pre-remediation condition remains present.

## 3. Browser EXECUTE target

### PUBLIC-SAFE

- `public.get_public_referee(uuid)`
- `public.get_public_referees(text, boolean)`
- `public.verify_referee_card(text)`

### AUTHENTICATED APPLICATION

- `public.get_my_referee_event_count(date, date)`
- `public.transition_event_assignment_status(uuid, text, text)`

### DENY-BY-DEFAULT

All remaining SECURITY DEFINER functions must not retain direct browser EXECUTE until their contracts are explicitly authorized.

This includes reporting functions, authorization helpers, trigger functions, business-rule helpers, `generate_card_number`, and unresolved `soft_delete_record`.

## 4. Abort-first assertions

The candidate migration must abort before any security mutation if any assertion fails:

1. Expected SECURITY DEFINER signatures are present exactly once.
2. No unexpected duplicate identity signatures exist.
3. Required trigger associations remain present and enabled.
4. `transition_event_assignment_status` retains its exact identity signature.
5. `soft_delete_record()` remains explicitly classified and is not assumed trigger-only.
6. Canonical rewritten functions contain no `auth.role()`.
7. Canonical rewritten functions use hardened `search_path=''` where specified.
8. Only the three public-safe functions retain `anon` EXECUTE.
9. Only the two approved authenticated application RPCs retain `authenticated` EXECUTE.
10. Internal helpers and trigger functions have browser EXECUTE denied.
11. `system_settings`, `activity_logs`, `auth_attempts`, and `event_logs` remain private/internal.
12. Notification canonical tables remain internal-only.
13. `public_application_settings` remains authenticated-read/service-managed.
14. Card sequence `2026/737/0040` remains absent; no renumbering/reuse.
15. The six historical cancelled assignments without reasons remain preserved.
16. No historical notification backfill occurs.
17. Existing trigger enablement remains `O`.
18. `verify_referee_card()` remains bounded to its approved public response contract.
19. No blanket `GRANT ... TO PUBLIC` is introduced.
20. Migration executes transactionally and aborts on failed preconditions.

## 5. Static function-body assertions

For every rewritten SECURITY DEFINER function:

- `SECURITY DEFINER` is explicit.
- `SET search_path = ''` is explicit unless a documented exception exists.
- Public object references are schema-qualified.
- `auth.role()` is absent.
- Authorization is based on `auth.uid()` and stored role/region data.
- Arbitrary user identifiers are not trusted as caller identity.
- Sensitive aggregates are not exposed to arbitrary authenticated users.
- Public functions return only public-safe projections.
- Trigger functions preserve trigger semantics.
- Internal helper functions are not browser APIs.

## 6. Function groups

### Public

`get_public_referee`, `get_public_referees`, `verify_referee_card`

### Authenticated

`get_my_referee_event_count`, `transition_event_assignment_status`

### Privileged held

`get_referees`, `count_referees`, `get_referee_event_count`, `get_referee_income_summary`, `get_admin_dashboard_summary`, `get_audit_logs`, `get_honor_statistics`, `get_pending_registrations`, `get_registration_history`

### Internal authorization/business rules

`has_role`, `is_admin`, `is_admin_kab_kota`, `is_admin_provinsi`, `is_same_region`, `can_access_region`, `get_user_kabupaten_kota`, `get_user_kabupaten_kota_id`, `get_accessible_regions`, `validate_regional_access`, `has_schedule_conflict`, `is_event_approved`, `is_referee_active`, `can_approve_registration`

### Trigger/internal

`auto_mark_expired_cards`, `enforce_referee_assignment_update_scope`, `handle_honor_verification`, `handle_new_user`, `log_honor_verification`, `log_referee_assignment`, `log_registration_approval`, `prevent_hard_delete`, `sync_card_expiry`, `update_topic_reply_count`, `validate_honor_submission`, `validate_referee_assignment`

### Legacy internal

`generate_card_number`

### Unresolved

`soft_delete_record`

## 7. Static security test matrix

| Test | Expected |
|---|---|
| Anonymous call to `get_public_referee` | ALLOW |
| Anonymous call to `get_public_referees` | ALLOW |
| Anonymous call to `verify_referee_card` | ALLOW, bounded response |
| Anonymous call to `get_my_referee_event_count` | DENY |
| Authenticated self call to `get_my_referee_event_count` | ALLOW |
| Authenticated cross-referee attempt | DENY by body contract |
| Anonymous call to `transition_event_assignment_status` | DENY |
| Authenticated unauthorized-role transition | DENY |
| Authenticated cross-region admin-kab-kota transition | DENY |
| Authenticated valid authorized transition | ALLOW |
| Anonymous call to internal helper | DENY |
| Authenticated call to internal helper | DENY |
| Anonymous call to privileged reporting RPC | DENY |
| Authenticated arbitrary referee/region financial query | DENY |
| Anonymous direct access to notification tables | DENY |
| Authenticated direct access to notification tables | DENY |
| Anonymous direct access to `system_settings` | DENY |
| Authenticated direct access to `system_settings` | DENY |
| Anonymous direct write to `public_application_settings` | DENY |
| Authenticated direct write to `public_application_settings` | DENY |
| Authenticated read of allowed public settings | ALLOW |
| Trigger execution after assignment mutation | PRESERVED |
| Card gap `737/0040` | PRESERVED |
| Historical six cancelled assignments | PRESERVED |
| Historical notification rows | NO BACKFILL |

## 8. Important implementation constraint

The migration candidate must **not** simply revoke all browser EXECUTE first and then recreate functions blindly.

Function body replacement, ACL cutover, trigger preservation, and postconditions must be assembled so a failed assertion aborts the transaction before an incomplete security boundary can be committed.

## 9. Current gate

**PHASE 1.8K — BLOCKED**

Reason: the static candidate and test matrix are defined, but the exact replacement bodies for every function are not yet executable as one safe migration. Privileged reporting contracts and `soft_delete_record()` remain unresolved, while public `verify_referee_card()` requires bounded-output finalization.

### Safety counters

- Production mutation: 0
- Test mutation: 0
- DDL executed: 0
- DML executed: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 10. Next phase

**PHASE 1.8L — Exact Replacement Function Bodies & Abort-First Migration Draft**

Objective:

1. Freeze exact SQL bodies for the five browser-approved RPCs.
2. Finalize bounded `verify_referee_card()`.
3. Define the exact deny ACL transition.
4. Explicitly retire or quarantine `soft_delete_record()`.
5. Keep unresolved privileged reporting functions denied.
6. Assemble the migration candidate without applying it.
7. Run static syntax and contract assertions only.
