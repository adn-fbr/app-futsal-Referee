# PHASE 1.8X — Test 68-Function Authorization & Dependency Matrix

Date: 2026-09-24
Mode: READ-ONLY / TEST RECONCILIATION
Project: test APP (`shorsqyycpptxcutrqrb`)
Gate: BLOCKED — matrix prepared from latest verified catalog evidence; no mutation executed.

## 1. Objective

Reconcile the Test project's 68 SECURITY DEFINER functions before any candidate migration is allowed to execute. The Production 42-function baseline must not be replayed over Test because Test contains additional application contracts.

## 2. Evidence baseline

Latest verified Test catalog contains 68 SECURITY DEFINER functions. Previously verified functions include:

- notification claim/finalize functions: anonymous and authenticated EXECUTE denied;
- `create_event_completion_notification_intents()`: anonymous/authenticated denied;
- card issuance functions such as `issue_my_referee_card()` and `issue_referee_card_for_admin(uuid)`: anonymous denied, authenticated allowed;
- several newer administrative/card/registration functions are authenticated-callable;
- a number of legacy/internal functions still expose EXECUTE to anonymous/authenticated and require remediation review.

## 3. Canonical classification

### A. Public-safe
Only these remain candidates for anonymous execution:

- `get_public_referee(uuid)`
- `get_public_referees(text, boolean)`
- `verify_referee_card(text)` — special bounded public mutation.

### B. Authenticated application RPC
Candidate only where caller binding and business authorization are explicit:

- `get_my_referee_event_count(date,date)` — self-bound to `auth.uid()`.
- `transition_event_assignment_status(uuid,text,text)` — role, region and state-transition authorization.
- Existing Test card self-service/admin card functions require their own contract and must not be collapsed into the Production baseline.
- `approve_registration(uuid, app_role)` / `reject_registration(uuid,text)` require their existing admin authorization to be preserved and independently hardened.

### C. Admin / privileged application RPC
Must remain authenticated-only and retain explicit role/scope checks:

- `get_admin_audit_logs(...)`
- `get_admin_card_verification_logs(uuid)`
- `get_admin_dashboard_summary(...)`
- `get_admin_referee_card_count(...)`
- `get_admin_referee_cards(...)`
- `get_admin_referee_count(...)`
- `get_admin_referee_event_count(...)`
- `get_admin_referee_income_summary(...)`
- `get_admin_referees(...)`
- `get_pending_registrations()`
- `get_registration_history()`
- card lifecycle operations: issue, regenerate, renew, revoke, status update.

These are not automatically equivalent to the Production reporting functions with similar names.

### D. Internal authorization/business-rule helpers
Target: no direct browser EXECUTE unless a separate, explicit caller contract proves otherwise.

Examples:

- `_resolve_admin_scope()`
- `has_role(...)`
- `is_admin(...)`
- `is_admin_kab_kota(...)`
- `is_admin_provinsi(...)`
- `can_access_region(...)`
- `can_approve_registration(...)`
- `get_accessible_regions(...)`
- `get_user_kabupaten_kota(...)`
- `get_user_kabupaten_kota_id(...)`
- `is_event_approved(...)`
- `is_referee_active(...)`
- `is_same_region(...)`
- `has_schedule_conflict(...)`
- `validate_regional_access()`

### E. Trigger/internal
Direct browser EXECUTE should be denied while trigger execution remains enabled:

- `auto_mark_expired_cards()`
- `enforce_referee_assignment_update_scope()`
- `handle_honor_verification()`
- `handle_new_user()`
- `log_event_approval()`
- `log_honor_verification()`
- `log_referee_assignment()`
- `log_registration_approval()`
- `prevent_hard_delete()`
- `soft_delete_record()` — still unresolved because no verified non-internal trigger attachment has been established.
- `sync_card_expiry()`
- `update_topic_reply_count()`
- `validate_event_assignment_transition()`
- `validate_honor_submission()`
- `validate_referee_assignment()`

### F. Notification/internal subsystem
Already verified as internal-only:

- `claim_event_completion_notification(...)`
- `claim_notification_channel(...)`
- `create_event_completion_notification_intents()`
- `finalize_event_completion_notification(...)`
- `finalize_notification_channel(...)`

Target remains anonymous DENY + authenticated DENY.

## 4. Search-path contract

Canonical rewrites should target `search_path=''` where feasible and schema-qualify application references. Existing Test functions using `public, pg_temp` or `public` must be evaluated individually; they must not be mass-rewritten without body/dependency review.

## 5. Critical Test-specific contracts

The following must be preserved rather than overwritten by the Production candidate:

1. card self-service and admin card lifecycle functions;
2. registration approval/rejection workflow;
3. event completion workflow (`mark_event_completed`);
4. admin referee/card reporting functions;
5. notification claim/finalize functions;
6. Meta/Kirisan delivery and webhook ledger contracts;
7. public application settings boundary;
8. referee WhatsApp contact self-service boundary.

## 6. Abort conditions

Abort any execution if:

- a Test-specific function signature would be replaced unexpectedly;
- an authenticated card/registration function loses its caller authorization;
- an internal notification function gains browser EXECUTE;
- a trigger function becomes disabled or detached;
- `search_path` hardening changes an unresolved dependency;
- `auth.role()` remains in a browser-callable security-sensitive function;
- public output exposes private IDs, counters, secrets, or internal timestamps;
- `system_settings` becomes browser-readable;
- canonical notification tables gain browser policies;
- card sequence or historical cancellation invariants change;
- candidate SQL attempts blanket `GRANT ... TO PUBLIC`.

## 7. Gate decision

**PHASE 1.8X — BLOCKED**

The Test project cannot yet be treated as a simple target for the Production 42-function candidate. The 68-function catalog demonstrates that Test contains additional contracts requiring independent preservation and authorization verification.

No DDL, DML, ACL mutation, RLS mutation, migration application, deployment, provider call, or secret read was performed.

Safety counters:
- Production mutation: 0
- Test mutation: 0
- DDL: 0
- DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 8. Next phase

**PHASE 1.8Y — Test-Specific Function Body & Caller Evidence Closure**

Next step is to inspect the bodies and source callers of the Test-specific functions before any ACL or search-path change is proposed. The objective is to distinguish intentionally authenticated application APIs from accidental privilege exposure.
