# PHASE 1.8AE — Privileged RPC Negative-Path Test Matrix & Authorization Proof Contract

Date: 2026-09-24
Mode: READ-ONLY / TEST
Project: test APP (`shorsqyycpptxcutrqrb`)
Gate: BLOCKED — CONTRACT FROZEN, EXECUTION NOT AUTHORIZED

## 1. Objective
Convert caller reconstruction into an executable negative-authorization proof contract without mutating Test or Production.

## 2. Authoritative Test Catalog Evidence
Current Test catalog contains 68 SECURITY DEFINER functions. Relevant privileged boundaries include:
- `approve_registration(uuid, app_role)` — anon DENY, authenticated ALLOW
- `reject_registration(uuid,text)` — anon DENY, authenticated ALLOW
- `issue_my_referee_card()` — anon DENY, authenticated ALLOW
- `regenerate_my_referee_card()` — anon DENY, authenticated ALLOW
- `issue_referee_card_for_admin(uuid)` — anon DENY, authenticated ALLOW
- `bulk_issue_referee_cards()` — anon DENY, authenticated ALLOW
- `renew_referee_card(uuid)` — anon DENY, authenticated ALLOW
- `revoke_referee_card(uuid,text)` — anon DENY, authenticated ALLOW
- `update_referee_card_status(uuid,text,text)` — anon DENY, authenticated ALLOW
- `regenerate_referee_card_for_admin(uuid)` — anon DENY, authenticated ALLOW
- `mark_event_completed(uuid,text)` — anon DENY, authenticated ALLOW
- `transition_event_assignment_status(uuid,text,text)` — anon DENY, authenticated ALLOW
- notification claim/finalize functions — anon DENY, authenticated DENY
- public verification functions — anonymous execution intentionally retained pending bounded-output contract.

## 3. Negative Authorization Matrix

| ID | Caller | Target | Expected | Side effect on DENY |
|---|---|---|---|---|
| N01 | anonymous | `approve_registration` | DENY | none |
| N02 | anonymous | `reject_registration` | DENY | none |
| N03 | anonymous | `issue_my_referee_card` | DENY | no card/counter change |
| N04 | anonymous | `mark_event_completed` | DENY | event remains unchanged |
| N05 | anonymous | `transition_event_assignment_status` | DENY | assignment/audit unchanged |
| N06 | wasit | admin card function | DENY | no card mutation |
| N07 | wasit A | `issue_my_referee_card` for implicit self | ALLOW only if own auth contract passes | one own card only |
| N08 | wasit A | card of wasit B | DENY | no B mutation |
| N09 | admin_kab_kota A | card/registration in region B | DENY | no cross-region mutation |
| N10 | admin_kab_kota A | dashboard region B | DENY | no aggregate disclosure |
| N11 | admin_kab_kota | all-region dashboard | DENY | no aggregate disclosure |
| N12 | admin_provinsi | own authorized admin operation | ALLOW if body contract passes | bounded expected mutation |
| N13 | authenticated user | notification claim RPC | DENY | no claim lease |
| N14 | authenticated user | notification finalize RPC | DENY | no ledger transition |
| N15 | anonymous | trigger-only function | DENY | no trigger-state mutation |
| N16 | authenticated user | `generate_card_number` | DENY | no sequence allocation |
| N17 | anonymous | `get_audit_logs` | DENY | no sensitive disclosure |
| N18 | anonymous | `get_honor_statistics` | DENY | no financial disclosure |
| N19 | anonymous | `get_pending_registrations` | DENY | no registration disclosure |
| N20 | anonymous | `get_registration_history` | DENY | no approval-history disclosure |
| N21 | authenticated user | helper with arbitrary user UUID | DENY / internal-only | no identity oracle |
| N22 | authenticated user | `has_schedule_conflict` arbitrary referee UUID | DENY / internal-only | no cross-user schedule disclosure |
| N23 | admin | invalid card transition | DENY | card unchanged |
| N24 | admin | revoke without reason | DENY | card unchanged |
| N25 | wasit | assignment belonging to another referee | DENY | assignment unchanged |
| N26 | admin_kab_kota | assignment in another region | DENY | assignment unchanged |

## 4. Application-Path Proof
For every ALLOW case, evidence must prove:
1. authenticated identity is present;
2. role is expected;
3. region is expected where applicable;
4. target object belongs to authorized scope;
5. RPC signature is exact;
6. return shape is consumed safely;
7. expected side effects occur exactly once.

For every DENY case, evidence must prove:
1. authorization fails before privileged mutation;
2. no card sequence increment;
3. no assignment/event mutation;
4. no notification claim/finalize mutation;
5. no sensitive row disclosure;
6. no audit side effect unless explicitly designed for denied attempts.

## 5. High-Risk Current Findings
### `generate_card_number`
Current Test body still uses `MAX()+1`. This function must not be used as the canonical card allocator. Atomic `referee_card_counters` logic in card issuance functions remains authoritative.

### `get_referees` / `count_referees`
Current body contains `auth.role() = 'authenticated' OR public-row condition`, so authenticated users can potentially receive broader data than intended. These functions require caller/data-exposure closure before rewrite.

### `get_audit_logs`
Current function exposes old/new JSON, metadata and actor fields while anonymous execution remains enabled. This is a critical negative-path case.

### `get_honor_statistics`
Current function accepts arbitrary referee UUID and has anonymous execution. Financial data exposure must be denied outside the intended caller contract.

### `get_user_kabupaten_kota*`
Current functions accept arbitrary UUIDs and remain anonymous-executable. Treat as internal authorization helpers, not public identity APIs.

### Trigger functions
Several trigger functions remain browser-executable despite being trigger-returning functions. Their direct EXECUTE boundary must be denied after trigger lineage is independently preserved.

## 6. Event Completion Proof
`mark_event_completed()` is authenticated-only and uses `search_path=''`. Its body:
- resolves `auth.uid()`;
- locks the event;
- permits provincial admin or same-region kab/kota admin;
- changes only `DISETUJUI → SELESAI`;
- inserts completion approval;
- relies on the `events` completion trigger to create notification intents.

The trigger `event_completion_notification_intents_trigger` is confirmed attached to `events` and invokes `create_event_completion_notification_intents()`.

## 7. Notification Proof
The following remain internal-only in the current Test ACL:
- `claim_event_completion_notification`
- `finalize_event_completion_notification`
- `claim_notification_channel`
- `finalize_notification_channel`
- `create_event_completion_notification_intents`

No browser grant should be introduced.

## 8. Abort-First Conditions
Abort candidate migration if any of the following occurs:
- anonymous execution remains on a function classified internal/admin-only;
- a wasit can address another user's card or assignment;
- kab/kota admin crosses region boundary;
- notification internal RPC becomes browser-executable;
- card issuance allocates using `MAX()+1`;
- negative path produces a mutation;
- sensitive admin/financial data is disclosed;
- trigger attachment is missing/disabled;
- `system_settings` becomes browser-readable;
- notification tables acquire browser policies;
- function signature changes unexpectedly;
- search_path rewrite changes object resolution.

## 9. Execution Status
No negative-path tests were executed against live identities in this phase. No mutation was performed.

Production mutation: 0
Test mutation: 0
DDL: 0
DML: 0
ACL changes: 0
Migration applied: 0
Deployment: 0
Provider calls: 0
Secret reads: 0

## 10. Gate
**BLOCKED — NEGATIVE AUTHORIZATION CONTRACT COMPLETE AS DESIGN, EXECUTION EVIDENCE NOT YET AVAILABLE.**

Next phase: **PHASE 1.8AF — Test Identity Matrix & Safe Negative-Path Execution Readiness Gate**.
