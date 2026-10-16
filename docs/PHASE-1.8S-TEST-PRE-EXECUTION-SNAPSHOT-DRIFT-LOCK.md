# PHASE 1.8S — Test Pre-Execution Snapshot & Drift Lock

Date: 2026-09-24
Mode: READ-ONLY / PRE-EXECUTION
Project: test APP (`shorsqyycpptxcutrqrb`)
Gate: BLOCKED — snapshot captured; controlled execution not performed.

## 1. Purpose
Freeze the relevant Test catalog state immediately before any future controlled execution. This is a drift-lock checkpoint, not an authorization to mutate the database.

## 2. Canonical table state
The following canonical tables exist in Test and RLS is enabled:

- assignment_notifications — RLS ON
- event_completion_notifications — RLS ON
- message_delivery_ledger — RLS ON
- meta_webhook_events — RLS ON
- notification_channel_claims — RLS ON
- public_application_settings — RLS ON
- referee_card_counters — RLS ON
- referee_contacts — RLS ON

Observed policy counts:
- assignment_notifications: 0
- event_completion_notifications: 0
- message_delivery_ledger: 0
- meta_webhook_events: 0
- notification_channel_claims: 0
- public_application_settings: 2
- referee_card_counters: 0
- referee_contacts: 3

This is consistent with the frozen internal-table model: internal notification/counter tables have no browser policies, while public_application_settings and referee_contacts have explicit application policies.

## 3. Existing privileged-function exceptions
The Test project contains contracts that must NOT be overwritten by a generic Production ACL migration:

- bulk_issue_referee_cards() — anon DENY, authenticated ALLOW, search_path=public
- issue_my_referee_card() — anon DENY, authenticated ALLOW, search_path=public
- issue_referee_card_for_admin(uuid) — anon DENY, authenticated ALLOW, search_path=public
- claim_event_completion_notification(...) — anon/auth DENY, search_path=''
- finalize_event_completion_notification(...) — anon/auth DENY, search_path=''
- create_event_completion_notification_intents() — anon/auth DENY, search_path=''
- claim_notification_channel(...) — anon/auth DENY, search_path=public,pg_temp
- finalize_notification_channel(...) — anon/auth DENY, search_path=public,pg_temp

These are treated as existing Test-specific contracts until their callers and exact bodies are independently reconciled.

## 4. Drift-lock rules
Before controlled execution, abort if any of the following changed unexpectedly:

1. canonical table disappears or changes identity;
2. RLS is disabled on a canonical table;
3. existing policy count changes outside the approved candidate;
4. internal notification functions gain anon/auth EXECUTE;
5. Test-specific card issuance functions disappear or change signature unexpectedly;
6. search_path of hardened notification functions regresses;
7. a new conflicting function signature appears;
8. migration history changes unexpectedly;
9. canonical constraints/indexes/FKs differ from the frozen candidate;
10. any Production object is targeted by the Test execution plan.

## 5. Execution boundary
No SQL mutation was executed in Phase 1.8S. No migration was applied. No DDL/DML, provider call, deployment, or secret read occurred.

The next execution step, if explicitly authorized, must use the frozen snapshot as its precondition and must remain isolated to Test.

## 6. Gate
**PHASE 1.8S — BLOCKED / DRIFT LOCK CAPTURED**

The snapshot is sufficient to define the pre-execution comparison, but it does not itself authorize execution.

Next: **PHASE 1.8T — Controlled Test Dry-Run Execution & Abort-First Verification**, only after explicit execution authorization.

Safety counters:
- Production mutation: 0
- Test mutation: 0
- DDL: 0
- DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0
