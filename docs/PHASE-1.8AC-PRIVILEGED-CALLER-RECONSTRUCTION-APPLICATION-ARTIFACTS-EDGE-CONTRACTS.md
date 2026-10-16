# PHASE 1.8AC — Privileged Caller Reconstruction from Application Artifacts & Edge Function Contracts

Date: 2026-09-24
Mode: READ-ONLY / TEST RECONCILIATION
Gate: BLOCKED

## Objective
Reconstruct authoritative callers for Test SECURITY DEFINER functions using available application artifacts, Edge Function contracts, database-side contracts, and previously verified integration evidence. Do not infer a browser caller merely because a function exists or has authenticated EXECUTE.

## Evidence status

1. Library/source search for Edge Function names, `supabase.rpc(...)`, and exact privileged RPC names returned no indexed source artifacts. This is an evidence gap, not proof of no caller.
2. Test live catalog confirms the critical functions exist as SECURITY DEFINER.
3. Previously verified function bodies provide authorization semantics for registration, card lifecycle, assignment transition, event completion, admin reporting, and notification orchestration.
4. Previously verified Edge Function contracts provide authoritative server-side paths for notification/provider operations.

## Caller reconstruction matrix

| Function family | Reconstructed caller class | Browser direct RPC? | Required evidence before ACL rewrite |
|---|---|---:|---|
| `approve_registration`, `reject_registration` | Admin UI / authenticated application | Yes, if exact UI caller confirmed | source call-site + negative regional test |
| `issue_my_referee_card`, `regenerate_my_referee_card` | Referee self-service UI | Yes, self-bound only | source call-site + self/other-user negative tests |
| `issue_referee_card_for_admin`, `bulk_issue_referee_cards` | Admin referee-card UI | Yes, authenticated admin only | source call-site + regional negative tests |
| `renew_referee_card`, `revoke_referee_card`, `update_referee_card_status` | Admin card-management UI | Yes, authenticated admin only | source call-site + transition matrix tests |
| `regenerate_referee_card_for_admin` | Admin card-management UI | Yes, authenticated admin only | source call-site + cross-region negative test |
| `mark_event_completed` | Event/assignment administration workflow | Yes, authenticated contract only | exact caller + event/role scope + notification side effects |
| `transition_event_assignment_status` | Event assignment UI | Yes, authenticated contract only | exact caller + role/region/state tests |
| `get_admin_*`, `get_admin_audit_logs`, `get_admin_card_verification_logs` | Admin dashboards/reporting | Yes, authenticated admin only | exact caller + region/all-region contract |
| notification `claim/finalize_*` | Notification orchestration / server-side internal path | **No** | Edge Function/server-side evidence + browser negative test |
| `get_public_*`, `verify_referee_card` | Public verification/browser | Yes | bounded public output + mutation/idempotency contract |
| helper/auth/trigger functions | DB internal | **No** | trigger/internal dependency evidence |

## Edge Function contract reconstruction

Known server-side integration contracts establish the following boundary:

- `notification-orchestrator`: JWT required; resolves caller; application roles are checked; service-role is used internally for notification claim/finalize operations.
- `send-whatsapp`: JWT required; caller authorization occurs before server-side provider call; Kirisan credentials remain Edge Function environment secrets.
- `kirisan-webhook`: JWT intentionally disabled; provider-specific custom authentication and payload validation; ledger writes are idempotent.
- `meta-whatsapp-webhook`: JWT intentionally disabled; Meta verification/HMAC validation; webhook identity and idempotency are server-side concerns.

Therefore notification claim/finalize functions are classified as **internal/server-side callers**, not browser RPCs.

## Negative authorization contract

Required tests before execution:

### Anonymous
- anon cannot execute every privileged/admin/card-management function.
- anon cannot execute notification claim/finalize functions.
- anon cannot execute trigger-only/internal helpers.
- public verification functions may remain callable only within bounded public contract.

### Authenticated non-admin
- referee cannot execute admin registration/card/reporting functions.
- referee cannot target another referee's card.
- referee cannot complete arbitrary events.
- referee cannot transition another referee's assignment.
- referee cannot access admin audit or financial aggregates.

### Regional admin
- `admin_kab_kota` cannot operate on another region.
- cannot request unrestricted all-region aggregate/reporting unless explicitly authorized by contract.
- cannot approve/reject registration outside its region.

### Provincial admin
- may use explicitly contracted province-wide administrative operations.
- all-region reporting remains bounded to functions whose body explicitly permits provincial scope.

### Notification path
- browser cannot call claim/finalize RPCs directly.
- Edge Function service-role path remains the only operational path unless a future contract explicitly changes this.

## Critical unresolved caller evidence

The following remain unverified at source level:

1. Exact UI/hook call-sites for registration RPCs.
2. Exact UI/hook call-sites for card self-service/admin RPCs.
3. Exact caller and authorization context for `mark_event_completed`.
4. Exact UI/reporting call-sites for admin reporting RPCs.
5. Exact source path from event completion to notification intent/claim/finalize.
6. Exact browser caller for `transition_event_assignment_status`.
7. Whether any legacy code still directly calls helper functions such as `get_user_kabupaten_kota`, `has_role`, or `generate_card_number`.

## Rewrite consequences

Do not perform blanket `REVOKE EXECUTE` on all Test SECURITY DEFINER functions yet.

Do not grant any additional browser execution.

Do not rewrite signatures.

Do not replace notification service-role paths with browser calls.

Do not harden `search_path` blindly on functions whose body dependencies have not been reconciled.

## Abort conditions

Abort any future migration if:

- a required source caller is incompatible with the frozen signature;
- a self-service function accepts an arbitrary target without an explicit admin contract;
- an admin function loses regional enforcement;
- event completion can be invoked outside its authorized event/role scope;
- notification claims become browser-callable;
- card issuance regresses from atomic counter semantics;
- a trigger is disabled/detached;
- a public function exposes internal IDs, secrets, counters, or sensitive metadata;
- `system_settings` or notification internals become browser-readable;
- any blanket `GRANT ... TO PUBLIC` is introduced.

## Safety counters

Production mutations: 0
Test mutations: 0
DDL: 0
DML: 0
Migration applied: 0
ACL changes: 0
Deployment: 0
Provider calls: 0
Secret reads: 0

## Gate

**BLOCKED — SOURCE-LEVEL CALLER EVIDENCE REMAINS INCOMPLETE.**

The available evidence is sufficient to define caller classes and negative authorization requirements, but not sufficient to authorize ACL/search_path/function-body migration.

## Next phase

**PHASE 1.8AD — Caller Contract Gap Closure & Edge-Function Invocation Trace Matrix**
