# PHASE 1.8H — Final SECURITY DEFINER Rewrite Candidate Assembly & Abort-First Assertions

Date: 2026-09-24
Mode: READ-ONLY / DESIGN ASSEMBLY ONLY
Production: xfscfjwapwnkiinkgbjg

## Gate

**BLOCKED — CANDIDATE ASSEMBLY COMPLETE, EXECUTABLE MIGRATION NOT AUTHORIZED**

No DDL, DML, ACL mutation, migration application, deployment, or provider call was performed.

## 1. Objective

Assemble the final rewrite candidate set for the 42 Production SECURITY DEFINER functions while preserving trigger semantics, business rules, card legacy invariants, and public API boundaries. The artifact is intentionally non-executable until all unresolved contracts are frozen.

## 2. Rewrite order

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

## 3. Candidate ACL matrix

### Public API

- get_public_referee(uuid): anon ALLOW; authenticated ALLOW
- get_public_referees(text,boolean): anon ALLOW; authenticated ALLOW
- verify_referee_card(text): anon ALLOW; authenticated ALLOW, subject to bounded public-mutation contract

### Authenticated application API

- get_my_referee_event_count(date,date): authenticated ALLOW only after auth.uid() binding is preserved
- transition_event_assignment_status(uuid,text,text): authenticated ALLOW only after role/region/state/cancellation assertions are preserved

### Deferred authenticated/admin APIs

The following remain DENY for anon/authenticated until exact caller contracts are frozen:

- get_referees(text,boolean,uuid,text,integer,integer)
- count_referees(text,boolean,uuid,text)
- get_referee_event_count(uuid,date,date)
- get_referee_income_summary(uuid,date,date)
- get_admin_dashboard_summary(uuid,date,date)
- get_audit_logs(text,uuid,text,uuid,timestamptz,timestamptz,integer,integer)
- get_honor_statistics(uuid)
- get_pending_registrations()
- get_registration_history()

### Internal authorization/business-rule

Target anon DENY and authenticated DENY:

- has_role(uuid,app_role)
- is_admin(uuid)
- is_admin_kab_kota(uuid)
- is_admin_provinsi(uuid)
- is_same_region(uuid,uuid)
- can_access_region(uuid,uuid)
- get_user_kabupaten_kota(uuid)
- get_user_kabupaten_kota_id(uuid)
- get_accessible_regions(uuid)
- validate_regional_access()
- can_approve_registration(uuid,uuid)
- has_schedule_conflict(uuid,uuid)
- is_event_approved(uuid)
- is_referee_active(uuid)

### Trigger/internal

Target direct browser DENY while trigger execution remains enabled:

- auto_mark_expired_cards()
- enforce_referee_assignment_update_scope()
- handle_honor_verification()
- handle_new_user()
- log_honor_verification()
- log_referee_assignment()
- log_registration_approval()
- prevent_hard_delete()
- sync_card_expiry()
- update_topic_reply_count()
- validate_honor_submission()
- validate_referee_assignment()

### Legacy/internal unresolved

- generate_card_number(uuid): internal only; legacy MAX()+1 behavior must not become the canonical counter mechanism.
- soft_delete_record(): RETURNS trigger but trigger attachment/caller is not yet proven; do not change ACL based on assumption.

## 4. Search-path candidate

All rewritten SECURITY DEFINER functions should target:

    SET search_path = ''

All relations, types, and internal function references must be schema-qualified. Authorization code must not use auth.role().

Exceptions require a documented dependency reason and an explicit assertion.

## 5. Abort-first assertions

The eventual migration must abort before mutation if any assertion fails:

1. Every expected function identity signature exists exactly once.
2. No duplicate identity signature exists.
3. Required trigger attachments exist and are enabled.
4. soft_delete_record() has an explicitly verified caller/trigger contract before ACL change.
5. transition_event_assignment_status(uuid,text,text) exists exactly once.
6. Canonical public API is limited to the three approved public-safe functions.
7. Internal helpers have no anon/authenticated EXECUTE after cutover.
8. No canonical application authorization contains auth.role().
9. Canonical SECURITY DEFINER functions use the intended search_path.
10. system_settings, activity_logs, auth_attempts, event_logs remain private/internal.
11. Canonical notification tables remain internal-only.
12. public_application_settings remains authenticated-read/service-managed.
13. Card sequence baseline preserves 2026/737/0040 as a historical gap; no renumber/reuse.
14. Historical cancelled assignments without cancellation_reason remain unchanged.
15. No historical notification backfill occurs.
16. Existing trigger functions remain enabled.
17. verify_referee_card remains bounded to its public verification contract.

## 6. Unresolved contracts that block executable assembly

### A. soft_delete_record()

No trigger attachment/caller has been conclusively established. It must remain unresolved until catalog/source evidence proves its execution path.

### B. get_honor_statistics()

Current function accepts arbitrary referee_id, including NULL for aggregate output. No browser grant is safe until the product contract is split or rewritten into self-only and explicitly authorized admin operations.

### C. get_admin_dashboard_summary()

NULL region currently has all-region semantics. Explicit admin_provinsi vs admin_kab_kota scope must be encoded before authenticated/admin execution is granted.

### D. get_referee_income_summary()

Current body accepts arbitrary region and exposes financial aggregates without caller authorization. Exact admin/region contract is required.

### E. get_referee_event_count()/count_referees()/get_referees()

Reporting/listing caller and regional scope need to be proven from current application paths. Authentication alone is not sufficient.

### F. verify_referee_card()

Public mutation remains intentional but needs final assertions for input length/format, output projection, verification counter update, logging bounds, and absence of arbitrary mutation.

## 7. Business invariants preserved

- six historical cancelled assignments without cancellation_reason are preserved.
- no automatic cleanup of historical confirmed/deleted assignment anomaly.
- 2026/737 card sequence gap 0040 is preserved.
- legacy XXX card numbers are preserved; no new canonical XXX issuance is implied.
- notification intent creation remains transition-based and idempotent; no historical backfill.
- internal notification claim/finalize RPCs remain non-browser callable.
- provider secrets remain server-side.

## 8. Final decision

The final migration is **NOT READY FOR EXECUTION**.

The safe next phase is:

**PHASE 1.8I — Unresolved Contract Closure & Source-to-RPC Evidence Reconciliation**

Focus:
- prove or formally retire the remaining browser callers;
- resolve soft_delete_record;
- freeze self/admin honor statistics contract;
- freeze dashboard and income regional scope;
- freeze reporting/list RPC authorization;
- finalize verify_referee_card public mutation assertions.

Safety counters remain zero: Production mutation 0; Test mutation 0; DDL 0; DML 0; migration applied 0; deployment 0; provider calls 0.
