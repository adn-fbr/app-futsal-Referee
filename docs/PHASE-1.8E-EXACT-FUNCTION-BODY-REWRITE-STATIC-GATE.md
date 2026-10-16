# PHASE 1.8E — Exact Function Body Rewrite & Static Security Assertions

Date: 2026-09-24
Mode: READ-ONLY
Project: AFP SULSEL (`xfscfjwapwnkiinkgbjg`)

## Gate

**BLOCKED — BODY REWRITE SPECIFICATION NOT YET EXECUTABLE**

No DDL, DML, migration application, deployment, or ACL mutation was performed.

## 1. Live baseline

Production currently has 42 SECURITY DEFINER functions. The live catalog confirms all 42 use `SET search_path = public` and the preceding Phase 1.8 verification confirmed `anon EXECUTE = true` and `authenticated EXECUTE = true` for the full set.

## 2. Body-level findings

### Critical application RPC findings

- `get_referees(...)`: contains `auth.role() = 'authenticated' OR p.is_active = true`. This is an unacceptable public fallback and must be removed. The function also contains unqualified `profiles` and `user_roles` references.
- `count_referees(...)`: contains the same `auth.role()` public fallback and unqualified table references.
- `get_referee_event_count(...)`: accepts arbitrary `_kabupaten_kota_id` and currently has no caller authorization in the body.
- `get_referee_income_summary(...)`: accepts arbitrary `_kabupaten_kota_id` and exposes honor aggregates without caller authorization.
- `get_admin_dashboard_summary(...)`: accepts `_kabupaten_kota_id = NULL`, which currently permits an unqualified all-region aggregate. Authorization must explicitly define whether this is permitted.
- `get_audit_logs(...)`: returns `old_data`, `new_data`, `metadata`, actor information, and therefore requires explicit administrative authorization.
- `get_honor_statistics(...)`: accepts arbitrary `_referee_id`, including NULL for all referees. It must not be directly exposed without a self/admin scope contract.
- `has_schedule_conflict(...)`: accepts arbitrary referee and event identifiers. It is an internal business-rule helper used by `validate_referee_assignment`; it must not be exposed as a browser RPC without an explicit authorization contract.

### Existing body authorization that can be preserved and hardened

- `get_my_referee_event_count(...)`: explicitly binds `p.id = auth.uid()`.
- `get_pending_registrations()`: checks `is_admin_provinsi(auth.uid())` or regional `admin_kab_kota` scope.
- `get_registration_history()`: checks the same administrative/regional scope.
- `get_public_referee(...)`: returns an explicit public projection and checks approved/profile-complete/non-deleted referee state.
- `get_public_referees(...)`: returns the same explicit public projection with public-safe filters.
- `transition_event_assignment_status(...)`: checks `auth.uid()`, role, assignment existence, region for `admin_kab_kota`, valid status, cancellation reason, and row locking. Its security contract must be preserved while references are schema-qualified.

### Internal helper findings

- `has_role`, `is_admin`, `is_admin_kab_kota`, `is_admin_provinsi`, `is_same_region`, `get_user_kabupaten_kota`, and `get_user_kabupaten_kota_id` are parameterized by arbitrary user IDs. They must remain internal or be refactored to current-user semantics before any browser EXECUTE grant.
- `get_accessible_regions(_user_id)` returns all regions for provincial admins and the user's region otherwise; it is an authorization helper, not a public API.
- `can_access_region(...)` relies on other authorization helpers and must remain internal.
- `validate_regional_access()` is trigger-oriented and must preserve its trigger semantics.

### Trigger/internal findings

The following are trigger-associated and should remain executable by the trigger owner while direct browser EXECUTE is denied:

- `enforce_referee_assignment_update_scope`
- `handle_honor_verification`
- `handle_new_user`
- `log_honor_verification`
- `log_referee_assignment`
- `log_registration_approval`
- `prevent_hard_delete`
- `sync_card_expiry`
- `update_topic_reply_count`
- `validate_honor_submission`
- `validate_referee_assignment`

`soft_delete_record()` returns `trigger` but has **no current trigger association in the inspected catalog**. It therefore remains **UNRESOLVED** and must not be assumed trigger-only until a caller/trigger source is identified.

## 3. Search-path rewrite contract

Target for canonical SECURITY DEFINER functions:

`SET search_path = ''`

All object references must be schema-qualified, for example:

- `public.profiles`
- `public.user_roles`
- `public.events`
- `public.event_assignments`
- `public.referee_cards`
- `public.audit_logs`
- `public.card_verification_logs`
- `public.has_role(...)`

`auth.role()` must not appear in canonical authorization logic.

## 4. Special cases

### `verify_referee_card(text)`

This remains a deliberately public mutating RPC. Before finalization it requires assertions for:

- bounded input
- bounded public output
- no secret/private fields
- bounded verification logging
- safe counter update semantics
- no arbitrary table mutation

The current body updates `referee_cards.verification_count` and `last_verified_at` and inserts into `card_verification_logs`; therefore it must be reviewed as a controlled public write boundary, not treated as an ordinary read RPC.

### `generate_card_number(uuid)`

The current implementation uses `MAX(sequence)+1`. This is not concurrency-safe. The canonical counter design from Phase 1.6A must replace or supersede this behavior before production card issuance is migrated.

### `handle_new_user()`

The trigger reads `raw_user_meta_data` to construct the initial profile. This is not being changed in Phase 1.8E, but its trigger-only ACL and function qualification must be preserved.

## 5. Static assertions required in final migration

The final migration must abort unless all are true:

1. Expected function signatures exist exactly once.
2. No unexpected duplicate signatures exist.
3. Canonical SECURITY DEFINER functions have the intended `search_path`.
4. No canonical application RPC contains `auth.role()`.
5. Public EXECUTE exists only for the approved public-safe functions.
6. Internal helpers have no `anon` or `authenticated` EXECUTE.
7. Trigger functions retain all expected enabled trigger attachments.
8. `transition_event_assignment_status` retains its exact signature.
9. `system_settings`, `activity_logs`, `auth_attempts`, and `event_logs` remain without browser policies.
10. Canonical notification tables retain internal-only RLS boundaries.
11. `public_application_settings` remains authenticated-read/service-managed.
12. Card sequence baseline assertions preserve the known `737/0040` historical gap and do not renumber it.
13. Historical cancelled assignments without reasons remain preserved.
14. No migration step performs historical notification backfill.

## 6. Dependency-safe implementation order

1. Authorization primitives
2. Internal business-rule helpers
3. Trigger/internal functions
4. Authenticated application RPCs
5. Admin/privileged RPCs
6. Public-safe RPCs
7. EXECUTE ACL cutover
8. RLS assertions
9. Trigger assertions
10. Business-rule assertions
11. Final postconditions

## 7. Remaining blockers

- Exact rewrite bodies for every affected function are not yet frozen.
- `soft_delete_record()` caller/trigger contract is unresolved.
- Direct browser caller contracts for several reporting functions remain incomplete.
- `get_honor_statistics()` self-vs-admin contract remains undecided.
- `get_admin_dashboard_summary(NULL, ...)` all-region authorization remains undecided.
- `has_schedule_conflict()` must retain internal trigger compatibility.
- `verify_referee_card()` public mutation contract needs final bounded-output assertions.
- Final ACL cutover must be assembled only after these contracts are frozen.

## Final status

**PHASE 1.8E — BLOCKED**

The live function bodies materially confirm the risks identified in Phase 1.8A–1.8D. The next safe step is to resolve the remaining caller/body contracts and assemble the final rewrite artifact; Production must remain untouched.

Safety counters: Production mutation 0; DDL 0; DML 0; migration applied 0; deployment 0; secret reads 0.
