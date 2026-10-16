# PHASE 1.8AF — Test Identity Matrix & Safe Negative-Path Execution Readiness Gate

Date: 2026-09-24
Mode: READ-ONLY / TEST ONLY
Project: test APP (`shorsqyycpptxcutrqrb`)
Gate: BLOCKED — EXECUTION FIXTURES / IDENTITY EVIDENCE INCOMPLETE

## 1. Objective

Define the minimum identity and fixture evidence required before executing the Phase 1.8AE negative-authorization matrix. No production execution and no mutation are permitted in this phase.

## 2. Required identity classes

The test plan requires controlled identities representing:

- anonymous / unauthenticated
- wasit user A
- wasit user B
- admin_kab_kota region A
- admin_kab_kota region B
- admin_provinsi
- optional panitia/evaluator where a function contract explicitly requires them
- server-side/service-role execution context for internal Edge Function paths only

Exact user identifiers, credentials, tokens, or secrets must not be copied into migration artifacts.

## 3. Required fixture classes

At minimum, isolated non-production fixtures must exist for:

- event in region A
- event in region B
- assignment owned by wasit A
- assignment owned by wasit B
- card owned by wasit A
- card owned by wasit B
- pending registration in region A
- pending registration in region B
- completed/approved event suitable for completion-state negative tests
- notification intent suitable for claim/finalize negative tests
- card counter row suitable for non-destructive inspection

Fixtures must be synthetic or explicitly approved test data. Production identifiers must not be reused as test credentials or mutation targets.

## 4. Negative-path execution matrix

| Actor | Target | Expected | Side effect |
|---|---|---|---|
| anon | admin RPC | DENY | none |
| anon | card self-service | DENY | none |
| anon | notification claim | DENY | none |
| wasit A | wasit B card | DENY | none |
| wasit A | wasit B assignment | DENY | none |
| wasit A | admin reporting | DENY | none |
| admin region A | region B object | DENY | none |
| admin region A | province-wide aggregate | DENY unless explicitly contracted | none |
| admin province | valid admin operation | ALLOW if contract permits | bounded |
| admin | invalid card transition | DENY | none |
| admin | revoke without reason | DENY | none |
| browser | notification claim/finalize | DENY | none |
| browser | trigger-only function | DENY | none |
| arbitrary caller | `generate_card_number` | DENY | none |

## 5. Proof requirements

A negative test is valid only when all are captured:

1. caller identity/class;
2. exact function signature;
3. invocation result/error class;
4. target object/region class;
5. pre-state fingerprint for mutation-sensitive tests;
6. post-state fingerprint;
7. proof that DENY caused no state mutation;
8. absence of provider calls for database-only negative tests.

Do not treat a generic HTTP 4xx/5xx as sufficient authorization proof without correlating the database state.

## 6. High-risk functions requiring special handling

### `get_audit_logs`
Current Test evidence shows anonymous execution remains enabled and the function returns old/new data and metadata. This is a direct negative-path candidate and must be DENY for anonymous callers before any privileged-boundary rewrite is accepted.

### `get_honor_statistics`
Anonymous execution remains enabled and accepts an arbitrary referee UUID. Test must prove that an unrelated caller cannot obtain another referee's financial statistics.

### `get_user_kabupaten_kota` / `get_user_kabupaten_kota_id`
Anonymous execution remains enabled and accepts arbitrary user UUIDs. These are identity/region oracle candidates and require explicit denial or internalization.

### `has_schedule_conflict`
The function accepts arbitrary referee/event IDs. Cross-user and cross-region negative cases are mandatory.

### `generate_card_number`
The current body uses `MAX()+1`; this function must not be exposed to browser callers and must not be used as the canonical concurrent allocator.

### Trigger functions
Functions such as `handle_new_user`, `log_honor_verification`, `log_referee_assignment`, `prevent_hard_delete`, `soft_delete_record`, and validation triggers must not be tested as normal application RPCs. Their required proof is trigger attachment + browser EXECUTE denial, not direct invocation.

## 7. Execution safety protocol

Phase 1.8AF does NOT execute the matrix yet because the required controlled identity/fixture evidence has not been independently established in the available evidence set.

Before execution:

- confirm Test project only;
- confirm identities are non-production;
- confirm no provider credentials are needed;
- snapshot relevant row counts/fingerprints;
- run negative cases before any positive control;
- abort on unexpected ALLOW;
- abort if a DENY changes state;
- abort if an internal notification RPC becomes callable;
- abort on cross-region data exposure;
- abort on any production reference.

## 8. Current evidence status

Previously verified Test evidence establishes:

- privileged admin/card RPCs: anon denied, authenticated allowed;
- `mark_event_completed`: anon denied, authenticated allowed;
- notification claim/finalize: anon and authenticated denied;
- public functions remain anonymous-capable;
- several legacy/helper/trigger functions remain anonymous-capable and require remediation.

The available source/library search did not provide authoritative application call-sites. Therefore application identity assumptions must not be inferred from function existence.

## 9. Gate decision

**BLOCKED — SAFE NEGATIVE-PATH EXECUTION NOT YET AUTHORIZED.**

The contract is complete enough to define tests, but execution requires a controlled non-production identity/fixture inventory and proof that test credentials/context are isolated.

## 10. Safety counters

Production mutation: 0
Test mutation: 0
DDL: 0
DML: 0
ACL change: 0
Migration applied: 0
Deployment: 0
Provider call: 0
Secret read: 0

## 11. Next phase

**PHASE 1.8AG — Controlled Test Identity & Fixture Inventory Closure**

Objective: establish the exact non-production actor/fixture inventory and map every Phase 1.8AE test to a safe fixture without executing the mutation-sensitive tests yet.
