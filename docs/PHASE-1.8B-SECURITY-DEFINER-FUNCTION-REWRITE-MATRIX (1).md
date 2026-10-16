# PHASE 1.8B — SECURITY DEFINER Function Rewrite Matrix

Date: 2026-09-24
Mode: READ-ONLY / DESIGN & STATIC CONTRACT
Production: xfscfjwapwnkiinkgbjg

## Gate

**BLOCKED — function implementation hardening is not yet authorized for execution.**

This artifact freezes the remediation classification for the 42 current Production SECURITY DEFINER functions. It does not execute DDL, DML, ACL changes, migration, or deployment.

## Global target

Every SECURITY DEFINER function entering the canonical migration must:

- have an explicit caller class;
- have no implicit PUBLIC EXECUTE;
- use `SET search_path = ''` where technically feasible;
- schema-qualify object references;
- preserve required trigger semantics;
- contain explicit authorization when exposed to authenticated callers;
- have regression assertions in the migration/test gate.

## Function matrix

| Function | Class | Target anon | Target auth | Hardening | Main blocker / assertion |
|---|---|---:|---:|---|---|
| auto_mark_expired_cards() | internal/operational | DENY | DENY | search_path='' | scheduler/caller must be proven |
| can_access_region(uuid,uuid) | internal helper | DENY | DENY | search_path='' | arbitrary user_id oracle |
| can_approve_registration(uuid,uuid) | internal helper | DENY | DENY | search_path='' | caller-bound admin context |
| count_referees(text,bool,uuid,text) | admin RPC candidate | DENY | DENY by default | search_path=''; remove auth.role() | role + region contract |
| enforce_referee_assignment_update_scope() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| generate_card_number(uuid) | legacy internal | DENY | DENY | search_path='' | replace with counter architecture |
| get_accessible_regions(uuid) | internal helper | DENY | DENY | search_path='' | arbitrary user_id oracle |
| get_admin_dashboard_summary(uuid,date,date) | admin RPC | DENY | DENY until caller proven | search_path=''; scope auth | NULL region must not mean unrestricted |
| get_audit_logs(...) | admin RPC | DENY | DENY until caller proven | search_path=''; admin auth | sensitive old/new/metadata |
| get_honor_statistics(uuid) | admin/self RPC candidate | DENY | DENY until caller proven | search_path=''; ownership/role | arbitrary referee_id |
| get_my_referee_event_count(date,date) | authenticated app RPC | DENY | ALLOW | search_path=''; caller-bound | assert auth.uid() |
| get_pending_registrations() | admin RPC | DENY | DENY until caller proven | search_path=''; admin auth | regional authorization |
| get_public_referee(uuid) | public-safe | ALLOW | ALLOW | search_path=''; safe projection | output contract assertion |
| get_public_referees(text,bool) | public-safe | ALLOW | ALLOW | search_path=''; safe projection | output contract assertion |
| get_referee_event_count(uuid,date,date) | admin/report RPC | DENY | DENY until caller proven | search_path=''; region auth | arbitrary region scope |
| get_referee_income_summary(uuid,date,date) | sensitive financial RPC | DENY | DENY until caller proven | search_path=''; region auth | financial scope |
| get_referees(text,bool,uuid,text,int,int) | authenticated app RPC | DENY | ALLOW only after rewrite | search_path=''; remove auth.role() | sensitive fields + scope |
| get_registration_history() | admin RPC | DENY | DENY until caller proven | search_path=''; admin auth | caller matrix |
| get_user_kabupaten_kota(uuid) | internal helper | DENY | DENY | search_path='' | arbitrary user_id oracle |
| get_user_kabupaten_kota_id(uuid) | internal helper | DENY | DENY | search_path='' | arbitrary user_id oracle |
| handle_honor_verification() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| handle_new_user() | trigger-only | DENY | DENY | search_path='' | auth trigger preservation |
| has_role(uuid,app_role) | internal helper | DENY | DENY | search_path='' | arbitrary role oracle |
| has_schedule_conflict(uuid,uuid) | internal helper / app candidate | DENY | DENY until caller proven | search_path='' | arbitrary referee oracle; trigger dependency |
| is_admin(uuid) | internal helper | DENY | DENY | search_path='' | arbitrary identity oracle |
| is_admin_kab_kota(uuid) | internal helper | DENY | DENY | search_path='' | arbitrary identity oracle |
| is_admin_provinsi(uuid) | internal helper | DENY | DENY | search_path='' | arbitrary identity oracle |
| is_event_approved(uuid) | internal helper | DENY | DENY | search_path='' | event oracle; trigger dependency |
| is_referee_active(uuid) | internal helper | DENY | DENY | search_path='' | referee oracle; trigger dependency |
| is_same_region(uuid,uuid) | internal helper | DENY | DENY | search_path='' | arbitrary identity oracle |
| log_honor_verification() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| log_referee_assignment() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| log_registration_approval() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| prevent_hard_delete() | trigger-only | DENY | DENY | search_path='' | dynamic SQL safety + trigger preservation |
| soft_delete_record() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| sync_card_expiry() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| transition_event_assignment_status(uuid,text,text) | authenticated app RPC | DENY | ALLOW | search_path=''; preserve auth/role/scope logic | exact transition contract |
| update_topic_reply_count() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| validate_honor_submission() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| validate_referee_assignment() | trigger-only | DENY | DENY | search_path='' | depends on is_event_approved/is_referee_active/has_schedule_conflict |
| validate_regional_access() | trigger-only | DENY | DENY | search_path='' | trigger preservation |
| verify_referee_card(text) | controlled public API | ALLOW | ALLOW | search_path=''; bounded input/output | public mutation + abuse contract |

## Required rewrite assertions

### Public functions

`get_public_referee`, `get_public_referees`, and `verify_referee_card` must retain only documented public-safe output. `verify_referee_card` must remain bounded to the card identified by the supplied verification code and preserve verification logging.

### Authenticated functions

`get_referees` must remove `auth.role()` and its anonymous fallback. `get_my_referee_event_count` must remain caller-bound to `auth.uid()`. `transition_event_assignment_status` must preserve row locking, role checks, regional scope, valid statuses, and cancellation-reason enforcement.

### Admin functions

Admin/report functions must not receive `authenticated EXECUTE` merely because the caller is logged in. Each requires an explicit role/region caller contract or remains internal/server-only.

### Internal helpers

Functions accepting arbitrary `_user_id` or `_referee_id` remain internal unless a concrete caller proves otherwise. They must not become browser-readable identity or information oracles.

### Trigger functions

Revoking EXECUTE must not disable triggers. Static verification must compare trigger count, trigger names, event/timing, enabled state, and function attachment before and after Test execution.

## Current Production evidence

All 42 SECURITY DEFINER functions currently have:

- `anon EXECUTE = true`
- `authenticated EXECUTE = true`
- `search_path = public`

This is the pre-remediation baseline and must be captured before any execution.

## Next gate

Phase 1.8C — **Caller Matrix & Exact Authorization Contract**.

Phase 1.8C must resolve the remaining direct-browser callers before final EXECUTE ACL statements are assembled.
