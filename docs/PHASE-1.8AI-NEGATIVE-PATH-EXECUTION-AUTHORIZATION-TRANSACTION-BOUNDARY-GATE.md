# PHASE 1.8AI — Negative-Path Execution Authorization & Transaction Boundary Gate

Date: 2026-09-24
Mode: READ-ONLY / EXECUTION-GATE DESIGN
Project: Test `shorsqyycpptxcutrqrb`
Production: `xfscfjwapwnkiinkgbjg` — untouched
Gate: BLOCKED

## 1. Objective

Define the exact authorization, transaction, identity, fixture, expected-failure, and rollback boundary required before any negative-path RPC is executed against the Test project.

This phase does **not** execute privileged RPCs, mutations, ACL changes, migrations, provider calls, or authentication changes.

## 2. Current evidence

Verified read-only Test evidence:

- Roles: 3 `admin_provinsi`, 2 `admin_kab_kota`, 4 `wasit`.
- Events: 2 `DISETUJUI`, 29 `SELESAI`.
- Event assignments: 4 `confirmed`, 33 `pending`.
- Referee cards: 1 `active`.
- Profiles: 7 `approved`, 0 `pending`.
- `event_completion_notifications`: 4 rows.
- `message_delivery_ledger`: 1 row.
- Notification claim/finalize functions remain `anon=false`, `authenticated=false`.
- No negative-path RPC execution has been performed.

## 3. Execution authorization model

No test execution is authorized by this phase alone.

A later controlled-execution approval must explicitly authorize:

1. Test project `shorsqyycpptxcutrqrb` only.
2. Named negative-path cases or a bounded case range.
3. Use of disposable/rollback-safe fixtures where mutation is possible.
4. Exact test identities and sessions.
5. Expected denial semantics.
6. Maximum permitted state changes.
7. Post-test invariant verification.

Production is permanently excluded from this execution scope.

## 4. Transaction boundary

For mutation-capable negative tests:

- Execute one test case at a time.
- Prefer an isolated transaction/savepoint where the invocation path permits it.
- Do not rely on client-side rollback semantics for an RPC that commits independently.
- If the RPC cannot be wrapped safely in a rollbackable transaction, the case remains BLOCKED until a disposable fixture is provisioned.
- Capture pre-state and post-state for every potentially mutable target.
- Abort immediately if a supposed DENY case changes any business row, counter, notification ledger, audit state, or timestamp unexpectedly.

## 5. Safe execution classes

### Class A — ACL-only denial proof

Examples:
- anonymous → `approve_registration`
- anonymous → `reject_registration`
- anonymous → `issue_my_referee_card`
- anonymous → `mark_event_completed`
- anonymous → `transition_event_assignment_status`
- authenticated → notification claim/finalize
- authenticated → trigger/internal RPC

Expected result: PostgreSQL/API authorization denial before business mutation.

These are the safest first candidates because the expected denial should occur at EXECUTE privilege boundary.

### Class B — body-level authorization denial

Examples:
- wasit → admin card operation
- wasit A → card B
- admin kab/kota A → region B
- admin kab/kota → all-region dashboard
- invalid card transition
- revoke without reason
- unauthorized event completion

These require valid authenticated identities and exact target fixtures. They must not be executed until identity/session evidence is frozen.

### Class C — internal-function boundary

Examples:
- `generate_card_number`
- `get_user_kabupaten_kota`
- `get_user_kabupaten_kota_id`
- `has_schedule_conflict`
- trigger functions

Expected contract: browser/authenticated caller must be denied. No mutation or information disclosure is acceptable.

### Class D — registration administration

Currently BLOCKED because Test has zero `pending` profiles. Do not manufacture a production-like registration fixture by mutating live Test data without explicit fixture-provision authorization.

## 6. Negative-path proof requirements

A DENY result is valid only if all applicable conditions hold:

- caller is unauthorized for the requested operation;
- expected authorization error is returned;
- target business row remains unchanged;
- timestamps remain unchanged where relevant;
- card counter remains unchanged;
- notification claim/finalize state remains unchanged;
- no unintended audit entry is created;
- no sensitive target data is disclosed;
- no trigger side effect occurs.

An ACL denial is preferred over entering the privileged function body where the contract requires direct EXECUTE denial.

## 7. Required identity/session matrix before execution

| Actor | Required proof | Test purpose |
|---|---|---|
| anonymous | no JWT | public boundary denial |
| wasit A | valid Test JWT + role | own-vs-other object boundary |
| wasit B | valid Test JWT + role | cross-user IDOR |
| admin kab/kota A | JWT + role + region A | regional boundary |
| admin kab/kota B | JWT + role + region B | cross-region denial |
| admin provinsi | JWT + role | province-wide authorized boundary |

The actual UUIDs/session credentials must be obtained through a safe authenticated test mechanism. Passwords, refresh tokens, service-role keys, and other secrets must never be placed in the artifact.

## 8. Abort-first conditions

Abort the execution batch if any of the following occurs:

- production project is selected;
- identity cannot be mapped to the expected role/region;
- target fixture does not belong to the intended test actor/region;
- a DENY case mutates data;
- notification claim/finalize becomes executable by browser roles;
- card allocation changes unexpectedly;
- `MAX()+1` card allocation is exercised as part of a security test;
- sensitive data is returned from an unauthorized call;
- trigger state changes;
- unexpected function signature or return shape is observed;
- rollback cannot be verified;
- provider/network call occurs unexpectedly.

## 9. Execution order after explicit authorization

1. ACL-only anonymous denials.
2. Authenticated-to-internal denials.
3. Wasit/admin role denials.
4. Cross-user and cross-region denials.
5. Invalid transition/reason validation.
6. Event completion authorization boundary.
7. Registration cases only after a disposable pending fixture exists.
8. Full post-test invariant verification.

Do not reorder these to begin with mutation-capable business functions.

## 10. Current gate decision

**BLOCKED — EXECUTION AUTHORIZATION NOT GRANTED**

The design is complete enough to define the controlled execution protocol, but actual negative-path RPC execution requires explicit authorization and safe authenticated Test identities/sessions. Registration tests additionally require a disposable pending-registration fixture.

## 11. Safety counters

- Production mutation: 0
- Test mutation: 0
- DDL: 0
- DML: 0
- ACL changes: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 12. Next phase

**PHASE 1.8AJ — Test Session/Actor Evidence Closure & Controlled Execution Candidate Freeze**
