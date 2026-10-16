# PHASE 1.8AN — Controlled Negative-Path Execution Readiness Final Gate & Case-by-Case Authorization Matrix

**Date:** 2026-09-24  
**Mode:** READ-ONLY  
**Project:** test APP (`shorsqyycpptxcutrqrb`)  
**Production mutation:** 0  
**Test mutation:** 0  
**DDL/DML:** 0  
**Migration applied:** 0  
**Deployment:** 0  
**Provider call:** 0  
**Secret read:** 0

## 1. Objective

Freeze the final readiness gate before any controlled negative-path RPC execution. This phase does not execute privileged RPCs and does not create fixtures.

## 2. Live ACL evidence

Target privileged application RPCs remain `anon=DENY`, `authenticated=ALLOW`:

- approve_registration
- reject_registration
- issue_my_referee_card
- regenerate_my_referee_card
- issue_referee_card_for_admin
- bulk_issue_referee_cards
- renew_referee_card
- revoke_referee_card
- update_referee_card_status
- regenerate_referee_card_for_admin
- mark_event_completed
- transition_event_assignment_status

Notification claim/finalize RPCs remain `anon=DENY`, `authenticated=DENY`:

- claim_event_completion_notification
- finalize_event_completion_notification
- claim_notification_channel
- finalize_notification_channel

Unresolved high-risk functions remain browser-executable and therefore block execution of the corresponding positive/negative oracle tests until authorization is remediated or explicitly excluded:

- get_audit_logs
- get_honor_statistics
- get_user_kabupaten_kota
- get_user_kabupaten_kota_id
- has_schedule_conflict

## 3. Search-path evidence

Several privileged functions still use `search_path=public` or `public, pg_temp`; `mark_event_completed` and notification event functions use an empty search path. No mass rewrite is performed in this phase.

## 4. RLS readiness evidence

Verified on Test:

| Table | RLS | Policies |
|---|---:|---:|
| event_assignments | ON | 4 |
| events | ON | 4 |
| event_completion_notifications | ON | 0 |
| message_delivery_ledger | ON | 0 |
| profiles | ON | 11 |
| referee_cards | ON | 4 |
| user_roles | ON | 4 |
| referee_card_counters | ON | 0 |
| public_application_settings | ON | 2 |
| referee_contacts | ON | 3 |
| assignment_notifications | ON | 0 |
| meta_webhook_events | ON | 0 |
| notification_channel_claims | ON | 0 |

Zero-policy internal tables are intentionally not converted into permissive browser policies by this phase.

## 5. Case-by-case execution matrix

| Case | Actor | Target | Required precondition | Execution status |
|---|---|---|---|---|
| N01 | anon | approve_registration | no session | READY after session-path harness available |
| N02 | anon | reject_registration | no session | READY after session-path harness available |
| N03 | anon | issue_my_referee_card | no session | READY after session-path harness available |
| N04 | anon | mark_event_completed | no session + approved event | READY after session-path harness available |
| N05 | anon | transition_event_assignment_status | no session + assignment | READY after session-path harness available |
| N06 | wasit | admin card operation | valid wasit identity | READY after authenticated session harness available |
| N07 | wasit A | card B | two mapped card identities | READY after fixture pairing |
| N08 | admin region A | card/registration region B | two valid regional admins | READY after session harness |
| N09 | admin region A | dashboard region B | two valid regional admins | READY after session harness |
| N10 | regional admin | all-region dashboard | valid regional admin | READY after session harness |
| N11 | authenticated | notification claim/finalize | valid session | READY; ACL already denies |
| N12 | authenticated | helper/oracle | valid session | BLOCKED — unresolved helper authorization |
| N13 | admin | invalid card transition | valid card fixture | READY after fixture pairing |
| N14 | admin | revoke without reason | valid card fixture | READY after fixture pairing |
| N15 | unauthorized actor | event completion | approved event | READY after fixture pairing |
| N16 | anon | audit/financial/oracle RPCs | no session | BLOCKED for runtime because these endpoints are currently executable |

## 6. Mandatory pre-execution conditions

Before mutation-capable tests are authorized:

1. session/JWT actor evidence must be available without exposing tokens;
2. each actor must be paired to an exact fixture;
3. pre-state must be recorded;
4. only one mutation-capable case may execute at a time;
5. post-state must be compared against pre-state;
6. audit, notification, card-counter and event side effects must be checked;
7. unexpected success or mutation causes immediate ABORT;
8. registration cases remain blocked until a disposable pending-registration fixture exists;
9. no production project may be used for this execution phase.

## 7. Gate decision

**BLOCKED — FINAL READINESS CONTRACT NOT YET EXECUTABLE.**

The structural ACL/RLS prerequisites for the core negative-path cases are substantially closed, but controlled execution still requires an approved authenticated-session mechanism and paired fixture evidence. The unresolved arbitrary-user helper/oracle functions must remain excluded from execution rather than treated as safe.

No RPC invocation was executed in this phase.

## 8. Next phase

**PHASE 1.8AO — Controlled Test Actor Session & Fixture Binding Protocol**

Purpose: bind non-secret actor/session evidence to exact Test fixtures and freeze the first executable negative-path batch, without touching Production.
