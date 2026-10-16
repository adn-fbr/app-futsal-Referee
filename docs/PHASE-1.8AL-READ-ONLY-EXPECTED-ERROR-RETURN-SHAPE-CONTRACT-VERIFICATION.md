# PHASE 1.8AL — Read-Only Expected-Error & Return-Shape Contract Verification

Date: 2026-09-24
Mode: READ-ONLY / TEST PROJECT
Project: shorsqyycpptxcutrqrb
Gate: BLOCKED — CONTRACT VERIFIED STRUCTURALLY; EXECUTION EVIDENCE NOT AVAILABLE

## Objective
Verify exact function signatures, return shapes, volatility and available exception behavior before controlled negative-path execution. No RPC mutation was executed.

## Verified signatures / return shapes
- approve_registration(uuid, app_role) -> void
- reject_registration(uuid, text) -> void
- issue_my_referee_card() -> referee_cards
- regenerate_my_referee_card() -> referee_cards
- issue_referee_card_for_admin(uuid) -> TABLE(id, referee_id, card_number, issued_at, expires_at, status, last_verified_at, verification_count, created_at, updated_at)
- bulk_issue_referee_cards() -> SETOF TABLE(referee_id, card_id, status, error_code)
- renew_referee_card(uuid) -> SETOF TABLE(id, referee_id, card_number, issued_at, expires_at, status, last_verified_at, verification_count, updated_at)
- revoke_referee_card(uuid,text) -> same card projection
- update_referee_card_status(uuid,text,text) -> same card projection
- regenerate_referee_card_for_admin(uuid) -> SETOF TABLE(id, referee_id, card_number, issued_at, expires_at, status, verification_count, updated_at)
- mark_event_completed(uuid,text) -> events
- transition_event_assignment_status(uuid,text,text) -> event_assignments
- get_audit_logs(...) -> TABLE including old_data, new_data, metadata, actor_id
- get_honor_statistics(uuid) -> TABLE including financial aggregates
- get_user_kabupaten_kota(uuid) -> uuid
- get_user_kabupaten_kota_id(uuid) -> uuid
- has_schedule_conflict(uuid,uuid) -> boolean
- claim_event_completion_notification(uuid,uuid,text) -> SETOF event_completion_notifications
- finalize_event_completion_notification(...) -> integer
- claim_notification_channel(uuid,text,uuid) -> text
- finalize_notification_channel(...) -> integer

## Expected negative-path semantics
1. Anonymous calls to privileged RPCs must fail at EXECUTE/authorization boundary; no return payload expected.
2. Authenticated but unauthorized role/scope must fail before protected mutation.
3. Cross-user card operations must fail without changing card status, counter or audit state.
4. Cross-region admin operations must fail without touching target rows.
5. Invalid card transition or missing required reason must fail without mutation.
6. Unauthorized event completion must fail without changing event status or generating notification side effects.
7. Notification claim/finalize must remain inaccessible to browser roles.
8. Identity/helper oracles must not disclose arbitrary user's region/scheduling information.

Exact SQLSTATE/error text is NOT frozen from static inspection alone. Runtime error codes/messages must be captured only during authorized controlled execution and compared against the contract without requiring a specific message string unless the function contract explicitly guarantees it.

## Return-shape safety findings
High-risk sensitive return shapes:
- get_audit_logs exposes old_data/new_data/metadata/actor_id.
- get_honor_statistics exposes financial aggregates.
- get_user_kabupaten_kota* expose region identity for arbitrary UUID input.
- has_schedule_conflict exposes scheduling information for arbitrary IDs.

These functions remain negative-path targets; their current anonymous EXECUTE state is a security finding, not an approved public contract.

## Volatility / mutation relevance
Mutation-capable functions are VOLATILE, including registration, card lifecycle, event completion and assignment transition functions. Therefore they must not be called merely to learn their runtime error behavior without an execution authorization gate.

## Exception evidence
Static body inspection confirms RAISE EXCEPTION usage for the main privileged mutation functions. Several functions have explicit exception handling; exact SQLSTATE/message behavior is not treated as frozen until runtime evidence exists.

## Abort-first execution rules
Abort immediately if a DENY case:
- mutates any protected table;
- increments a card counter or verification counter;
- creates/claims/finalizes notification work;
- changes event/assignment/card/profile state;
- returns sensitive protected data;
- crosses regional scope;
- succeeds where DENY is required.

## Gate
BLOCKED. Structural contract verification is complete enough to define runtime assertions, but no authenticated session/JWT execution evidence has been authorized or captured. No mutation, ACL change, migration or provider call occurred.

Safety counters: production mutations 0; test mutations 0; DDL 0; DML 0; ACL changes 0; migrations 0; deployment 0; provider calls 0; secret reads 0.

## Next phase
PHASE 1.8AM — Controlled Negative-Path Test Harness Specification & Evidence Capture Schema.
