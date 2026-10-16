# PHASE 1.8W — Test SECURITY DEFINER Delta Inventory & Contract Reconciliation

**Date:** 2026-09-24  
**Mode:** READ-ONLY / TEST ONLY  
**Project:** test APP (`shorsqyycpptxcutrqrb`)  
**Production mutation:** 0  
**Test mutation:** 0  
**DDL:** 0  
**DML:** 0  
**Migration applied:** 0  
**Deployment:** 0  
**Provider calls:** 0  
**Secret reads:** 0  

## Gate

**BLOCKED — Test has 68 SECURITY DEFINER functions and therefore cannot be treated as a 42-function Production clone.**

The candidate must be reconciled against the complete Test privileged-function surface before any controlled execution.

## Live finding

The current Test catalog contains **68 SECURITY DEFINER functions**. This is materially different from the Production baseline of 42 SECURITY DEFINER functions used in the earlier Phase 1.8 candidate.

The Test delta includes additional application contracts such as:

- `_resolve_admin_scope`
- `approve_registration`
- `bulk_issue_referee_cards`
- `get_admin_audit_logs`
- `get_admin_card_verification_logs`
- `get_admin_referee_card_count`
- `get_admin_referee_cards`
- `get_admin_referee_count`
- `get_admin_referee_event_count`
- `get_admin_referee_income_summary`
- `get_admin_referees`
- `mark_event_completed`
- `regenerate_my_referee_card`
- `regenerate_referee_card_for_admin`
- `reject_registration`
- `renew_referee_card`
- `revoke_referee_card`
- `update_referee_card_status`
- `validate_event_assignment_transition`

These are not automatically legacy or unsafe. They require classification against their actual application callers and business contracts.

## Reconciliation rules

### 1. Do not overwrite Test with Production's 42-function set

The 42-function Production matrix is a security baseline, not a complete Test schema definition.

### 2. Every Test SECURITY DEFINER must have an explicit class

Allowed classes:

- PUBLIC-SAFE
- AUTHENTICATED APPLICATION
- ADMIN/PRIVILEGED APPLICATION
- INTERNAL AUTHORIZATION
- INTERNAL BUSINESS RULE
- TRIGGER/INTERNAL
- LEGACY INTERNAL
- UNRESOLVED / DENY-BY-DEFAULT

No function may remain implicitly exposed merely because it exists in Test.

### 3. Existing safer Test contracts must be preserved

Already verified internal notification functions remain denied to anon/authenticated:

- `claim_notification_channel`
- `finalize_notification_channel`
- `claim_event_completion_notification`
- `finalize_event_completion_notification`
- `create_event_completion_notification_intents`

Existing card issuance/admin functions also have an explicit authenticated contract and must not be generically revoked without caller reconciliation:

- `issue_my_referee_card`
- `issue_referee_card_for_admin`
- `bulk_issue_referee_cards`
- `regenerate_my_referee_card`
- `regenerate_referee_card_for_admin`
- `renew_referee_card`
- `revoke_referee_card`
- `update_referee_card_status`

Their search_path and body authorization still require hardening review.

## Immediate security findings

Several Test functions still expose `anon` EXECUTE where the final boundary expects internal-only or authenticated-only behavior, including:

- `auto_mark_expired_cards`
- `can_access_region`
- `can_approve_registration`
- `count_referees`
- `generate_card_number`
- `get_accessible_regions`
- `get_audit_logs`
- `get_honor_statistics`
- `get_my_referee_event_count`
- `get_pending_registrations`
- `get_referee_event_count`
- `get_referee_income_summary`
- `get_referees`
- `get_registration_history`
- multiple trigger/internal functions
- `soft_delete_record`

These are findings, not mutations. No ACL has been changed.

## Search-path findings

The Test delta contains mixed search_path configurations:

- hardened `search_path=""` exists for several notification functions;
- `search_path=public, pg_temp` exists on some internal functions;
- many Test functions remain `search_path=public`.

Therefore the final hardening must be function-specific. A blanket `ALTER FUNCTION ... SET search_path=''` without body qualification is prohibited.

## Card-management delta

Test has a substantially richer card-management API than the Production 42-function baseline. This is now a separate privileged contract surface and must be reconciled before the candidate can be executed.

Required checks for each card function:

- caller role;
- referee self-binding where applicable;
- admin regional/provincial scope;
- card ownership;
- lifecycle transition rules;
- sequence/counter behavior;
- atomicity;
- response projection;
- search_path;
- EXECUTE ACL.

## Assignment delta

Test contains `mark_event_completed()` and `validate_event_assignment_transition()` in addition to the Production-era assignment functions. Their relationship to the event-completion notification trigger chain must be preserved and verified before migration.

## Registration delta

Test contains explicit registration workflow functions:

- `approve_registration`
- `reject_registration`
- `_resolve_admin_scope`

These require caller/scope reconciliation and must not be classified solely by name.

## Required next action

Before any Test mutation, build a complete 68-function matrix with:

1. exact identity signature;
2. current ACL;
3. search_path;
4. trigger association;
5. application caller evidence;
6. authorization predicate;
7. intended class;
8. target ACL;
9. target search_path;
10. rewrite requirement;
11. regression tests;
12. migration ordering dependency.

## Gate decision

**PHASE 1.8W — BLOCKED**

The Test privileged surface is broader than the Production candidate. The correct next step is not execution but exact reconciliation of the Test-specific SECURITY DEFINER delta.

## Next phase

**PHASE 1.8X — Test 68-Function Authorization & Dependency Matrix**

This phase will reconcile every Test SECURITY DEFINER function against callers, triggers, card lifecycle, registration workflow, notification workflow, assignment workflow, and final ACL/search_path targets.
