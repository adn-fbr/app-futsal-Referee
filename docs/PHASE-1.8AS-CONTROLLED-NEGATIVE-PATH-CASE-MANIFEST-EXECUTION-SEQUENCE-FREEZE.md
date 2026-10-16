# PHASE 1.8AS — Controlled Negative-Path Case Manifest & Exact Execution Sequence Freeze

Date: 2026-09-24
Mode: READ-ONLY / EXECUTION NOT AUTHORIZED
Project: Test `shorsqyycpptxcutrqrb`

## Gate
**BLOCKED — manifest and execution order frozen; no RPC execution authorized.**

## Purpose
Freeze the exact negative-path cases before any controlled execution. Every case must be executed independently, with pre-state capture, expected denial semantics, post-state invariant comparison, and abort-first handling.

## Case Manifest

| Seq | Case | Actor | Target | Expected |
|---:|---|---|---|---|
| 01 | N01 | anonymous | `approve_registration` | DENY |
| 02 | N02 | anonymous | `reject_registration` | DENY |
| 03 | N03 | anonymous | `issue_my_referee_card` | DENY |
| 04 | N04 | anonymous | `mark_event_completed` | DENY |
| 05 | N05 | anonymous | `transition_event_assignment_status` | DENY |
| 06 | N06 | wasit | admin card operation | DENY |
| 07 | N07 | wasit A | own self-service card | ALLOW only if exact positive contract is separately authorized; not part of negative execution |
| 08 | N08 | wasit A | wasit B card | DENY |
| 09 | N09 | admin kab/kota A | region B card/registration | DENY |
| 10 | N10 | admin kab/kota A | region B dashboard | DENY |
| 11 | N11 | admin kab/kota | province/all-region dashboard | DENY |
| 12 | N12 | authenticated | notification claim | DENY |
| 13 | N13 | authenticated | notification finalize | DENY |
| 14 | N14 | authenticated | internal helper | DENY |
| 15 | N15 | authenticated | `generate_card_number` | DENY |
| 16 | N16 | anonymous | `get_audit_logs` | DENY |
| 17 | N17 | anonymous | `get_honor_statistics` | DENY |
| 18 | N18 | anonymous | `get_pending_registrations` | DENY |
| 19 | N19 | anonymous | `get_registration_history` | DENY |
| 20 | N20 | authenticated | arbitrary `get_user_kabupaten_kota*` | DENY / internal-only |
| 21 | N21 | authenticated | arbitrary `has_schedule_conflict` | DENY / internal-only |
| 22 | N22 | admin | invalid card transition | DENY |
| 23 | N23 | admin | revoke without reason | DENY |
| 24 | N24 | wasit A | wasit B assignment | DENY |
| 25 | N25 | admin region A | assignment region B | DENY |
| 26 | N26 | unauthorized admin | event completion outside scope | DENY |

N07 is explicitly excluded from execution because it is a positive-path mutation and requires its own authorization gate.

## Frozen Execution Order

### Group A — ACL-only denials
N01–N05

No protected mutation should be reachable. These cases establish the anonymous boundary first.

### Group B — internal/browser boundary
N12–N21

These cases establish that internal notification, helper, audit, financial, identity-oracle, and scheduling functions are not browser-callable.

### Group C — cross-user authorization
N06, N08, N24

Verify that authenticated users cannot operate on another referee's protected objects.

### Group D — cross-region authorization
N09, N10, N11, N25, N26

Verify regional isolation and administrative scope.

### Group E — business-rule denial
N22–N23

Verify invalid card transition and missing-reason rejection without state mutation.

### Registration
Pending-registration negative-path cases remain **BLOCKED** until a disposable pending fixture exists. No fixture creation is authorized by this phase.

## Required Evidence Per Case

1. case ID
2. actor class (no token/JWT storage)
3. role and region
4. exact function signature
5. redacted arguments
6. target fixture identifier
7. pre-state snapshot
8. expected authorization outcome
9. actual response/error category
10. return-shape check
11. post-state snapshot
12. invariant hash comparison
13. sensitive-disclosure check
14. audit/notification side-effect check
15. PASS / FAIL / ABORT
16. rollback status
17. timestamp

## Abort-First Rules

Immediately stop the entire run if any DENY case:

- succeeds unexpectedly;
- mutates a protected row;
- changes a card counter;
- changes event/assignment/card state;
- claims/finalizes a notification;
- creates an unintended audit record;
- returns sensitive target data;
- crosses user or regional scope;
- exposes an internal function;
- produces an unexpected trigger side effect.

## Baseline Invariants

The following frozen hashes from Phase 1.8AR must remain unchanged for cases where the corresponding object is not an explicitly expected mutation target:

- `event_assignments`: `e990373f0806048c2ea289754174dced`
- `events`: `ff5812c19f8a83b2c935d5ce3741f63a`
- `referee_cards`: `4b5258c7bf1375442f6d9b19a8221ccb`
- `referee_card_counters`: `885155d692551cfd668d1fc326081dac`
- `event_completion_notifications`: `09fbfe6ef2b5226fba89f03cafcd7f19`
- `message_delivery_ledger`: `20ccf349a0a09ff6e20a5adb566e49ba`
- `audit_logs`: `b8828bf54753df0852d748f8893d36ea`

## Explicit Non-Goals

- No Production execution.
- No migration.
- No DDL.
- No ACL changes.
- No fixture creation.
- No provider calls.
- No secret reads.
- No positive-path mutation.

## Safety Counters

Production mutation: 0  
Test mutation: 0  
DDL/DML: 0  
Migration applied: 0  
Deployment: 0  
Provider calls: 0  
Secret reads: 0

## Next Phase
**PHASE 1.8AT — Controlled Negative-Path Execution Authorization & One-Case Transaction Protocol**
