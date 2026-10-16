# PHASE 1.8Q — Test Candidate SQL Freeze & Controlled Dry-Run Gate

Date: 2026-09-24  
Mode: READ-ONLY / TEST PREPARATION  
Test project: `shorsqyycpptxcutrqrb`  
Production project: `xfscfjwapwnkiinkgbjg` — untouched

## Gate

**BLOCKED — candidate SQL is not approved for execution yet.**

Phase 1.8Q freezes the validation contract for the isolated Test project. No SQL mutation, migration application, DDL, DML, provider call, or deployment was performed.

## 1. Current Test state

The Test project is not a blank clone of Production. Its migration lineage includes later application work, including:

- `safe_public_application_settings_boundary_v2_controlled`
- `safe_public_application_settings_boundary_v2_privilege_hardening`
- `kirisan_message_delivery_ledger_v1`
- `phase_2_1_notification_channel_claims_v4`
- `referee_whatsapp_contact_self_service`
- `meta_webhook_events_v1`
- `phase_2_3_whatsapp_message_id_v1`
- `phase_2_3f_meta_webhook_identity_contract`
- `event_completion_notifications_v1`

The historical `canonical_baseline_reconstruction` migration remains a baseline artifact and must not be replayed.

## 2. Canonical table precondition

Live Test confirms all eight canonical candidate tables exist and have RLS enabled:

| Table | RLS | Policies |
|---|---:|---:|
| assignment_notifications | ON | 0 |
| event_completion_notifications | ON | 0 |
| message_delivery_ledger | ON | 0 |
| meta_webhook_events | ON | 0 |
| notification_channel_claims | ON | 0 |
| public_application_settings | ON | 2 |
| referee_card_counters | ON | 0 |
| referee_contacts | ON | 3 |

This means the Production integration migration must **not blindly CREATE these tables or policies on Test**. Test must be reconciled against the canonical contract first.

## 3. Test SECURITY DEFINER baseline

Current Test notification internals already demonstrate the intended boundary for several functions:

- claim/finalize notification functions: anon DENY, authenticated DENY;
- event-completion claim/finalize functions: anon DENY, authenticated DENY;
- `create_event_completion_notification_intents`: anon DENY, authenticated DENY.

Current card issuance functions require separate treatment:

- `issue_my_referee_card()` — authenticated EXECUTE currently present;
- `issue_referee_card_for_admin(uuid)` — authenticated EXECUTE currently present;
- `bulk_issue_referee_cards()` — authenticated EXECUTE currently present.

These functions are **not part of the five Production browser-approved RPCs** and must not be accidentally revoked or rewritten by a generic Test migration unless their own caller contract is explicitly included.

## 4. Candidate execution model

The controlled Test run, when separately authorized, must use this order:

1. capture Test catalog/ACL/RLS/trigger/migration baseline;
2. assert Test migration lineage is compatible;
3. assert eight canonical tables already exist where expected;
4. assert no duplicate canonical identity;
5. assert constraints/indexes/triggers match the canonical contract;
6. assert notification internal functions remain non-browser-callable;
7. apply only missing/approved function-body and ACL changes;
8. verify postconditions;
9. execute application/security contract tests;
10. compare Test post-state against the Phase 1.8 boundary contract.

A failed precondition must abort before any mutation.

## 5. Explicit no-replay rules

The following must never be replayed merely to make Test resemble Production:

- `20260908085000 canonical_baseline_reconstruction`;
- already-applied canonical notification migrations;
- already-applied public-settings migrations;
- already-applied Kirisan/Meta webhook migrations;
- already-applied event-completion migrations.

The objective is state convergence, not migration-history replay.

## 6. Required static assertions before Test execution

### Function boundary
- exact function identity exists once;
- no unexpected duplicate identity;
- only approved Production browser functions are granted by the candidate;
- existing Test-only authenticated card issuance functions are preserved unless separately contracted;
- internal notification functions remain anon/auth denied;
- no `auth.role()` in rewritten canonical functions;
- canonical rewritten SECURITY DEFINER functions use `search_path=''` where specified.

### RLS
- all eight canonical tables retain RLS;
- notification tables remain policy-free/internal unless a specific policy is contractually required;
- `public_application_settings` retains its safe authenticated-read policy;
- `referee_contacts` retains its own-row/wasit access contract;
- `referee_card_counters` remains internal-only.

### Business invariants
- Production card gap `2026/737/0040` is not reused;
- six historical cancelled assignments are not rewritten;
- no historical event-completion notification backfill;
- notification idempotency constraints remain intact;
- provider webhook deduplication remains intact.

## 7. Required negative tests

The controlled Test run must demonstrate:

- anonymous caller cannot execute internal notification RPCs;
- authenticated arbitrary user cannot execute internal notification RPCs;
- authenticated caller cannot access another referee's self statistics;
- unauthorized role cannot transition assignments;
- regional admin cannot cross regional boundary;
- cancellation without reason is rejected for new transitions;
- browser cannot write `public_application_settings` directly;
- browser cannot read `system_settings`;
- browser cannot access internal notification tables;
- public card verification does not expose internal identifiers/counters.

## 8. Required positive tests

- public referee lookup returns only approved public projection;
- public card verification returns bounded public contract;
- referee self statistics resolve only to `auth.uid()`;
- authorized assignment transition preserves state-machine rules;
- notification claim/finalize remains idempotent;
- webhook duplicate events remain harmless.

## 9. Production protection

Production remains completely untouched.

No Test execution is permitted to use Production credentials, Production service-role secrets, Kirisan Production credentials, or Meta Production webhook credentials.

## 10. Gate decision

**PHASE 1.8Q — BLOCKED / READY FOR CONTROLLED TEST EXECUTION ONLY AFTER EXPLICIT EXECUTION AUTHORIZATION.**

The environment is sufficiently characterized to design a controlled dry-run, but the migration itself has not been executed.

## 11. Next phase

**PHASE 1.8R — Controlled Test Execution Authorization & Transactional Dry-Run Protocol**

That phase will define the exact transaction boundary, preflight assertions, abort conditions, postconditions, and rollback verification for the isolated Test project.

Safety counters:

- Production mutation: **0**
- Test mutation: **0**
- DDL: **0**
- DML: **0**
- Migration applied: **0**
- Deployment: **0**
- Provider calls: **0**
- Secret reads: **0**
