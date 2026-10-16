# PHASE-7.4 Business Repository Migration Plan

Version: v1.0.0
Status: BLOCKED before implementation

## Pre-migration plan: BATCH-01 EVENTS

| Item | Decision |
| --- | --- |
| Files inspected | 3 |
| Operations in scope | 33 |
| Repository destination | Domain-level EventRepository plus explicit storage/function adapters |
| Canonical objects | `public.events`, `public.event_approvals`, `public.audit_logs`, `public.check_duplicate_event(text,text,text)`, Storage `documents`, Functions `send-event-notification` and `auto-complete-events` |
| Schema gaps | None of the event tables; historical `increment_view_count` is outside this batch |
| Authentication | Authenticated application context; no hard-coded identity |
| Authorization | RLS, function grants, and Edge Function handler authorization remain authoritative |
| Tests | Repository success/error tests, lifecycle tests, RLS contract tests, consumer regressions |
| Type safety | Blocked by baseline/type mismatch for duplicate-event RPC |

## Blocking precondition

`src/hooks/useEvents.ts:556` calls `check_duplicate_event` with `p_name`, `p_date`, `p_location`, `p_kabupaten_kota_id`, and `p_exclude_event_id`. The immutable baseline defines only `public.check_duplicate_event(text,text,text)`, with parameters `p_kota_id`, `p_location`, and `p_name`, returning boolean. The generated application type instead describes the five-argument call returning duplicate rows. These contracts cannot be reconciled without choosing an unverified schema contract.

Therefore no repository interface, implementation, consumer migration, or replacement query is authorized in this pass. Existing direct access remains unchanged and is reported as unmigrated business access.

## Required unblock evidence

Obtain an authorized contract decision that either supplies a verified matching baseline revision or classifies the current application call as stale/schema-gap. Do not modify the baseline or create a function as part of this phase. After resolution, repeat TypeScript, unit tests, build, lint delta, direct-access scan, and security review before implementing BATCH-01.
