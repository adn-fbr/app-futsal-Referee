# PHASE 1.8AM — Controlled Negative-Path Test Harness Specification & Evidence Capture Schema

Date: 2026-09-24
Mode: READ-ONLY / EXECUTION-PREP
Project: test APP (`shorsqyycpptxcutrqrb`)
Production: NOT TOUCHED
Gate: BLOCKED — HARNESS FROZEN, CONTROLLED EXECUTION NOT AUTHORIZED

## 1. Objective

Define a deterministic evidence-capture contract for the 26 negative-path authorization cases established in Phase 1.8AE–AK. This phase does not execute mutation-capable RPCs.

## 2. Evidence record

Every future test case must capture:

1. case_id
2. actor_class
3. actor_user_id_hash_or_safe_reference
4. actor_role
5. actor_region
6. target_type
7. target_safe_reference
8. target_owner/region relationship
9. pre_state_hash or safe scalar snapshot
10. exact RPC signature
11. input category (never secrets/tokens)
12. expected authorization outcome
13. expected SQLSTATE/error category, if contractually frozen
14. actual outcome
15. actual SQLSTATE/error category
16. returned-row count / safe return-shape summary
17. post_state comparison
18. mutation_detected boolean
19. sensitive_disclosure_detected boolean
20. invariant_result
21. final PASS/FAIL/BLOCKED
22. timestamp and execution environment

Raw JWTs, passwords, refresh tokens, service-role keys, provider secrets, or personal secrets must never be stored in evidence.

## 3. Abort-first rules

Immediately abort the entire controlled run if any case demonstrates:

- unauthorized mutation;
- cross-user object access;
- cross-region access;
- privileged data disclosure;
- notification claim/finalize mutation from browser context;
- unexpected card-counter mutation;
- trigger side effect outside the expected contract;
- unexpected schema/function signature;
- unexpected return projection exposing internal fields;
- internal/trigger RPC becoming callable by an unauthorized actor.

## 4. Case execution classes

### ACL-only / low-risk
N01–N05, N13–N16, N17–N22 should first be evaluated through the existing EXECUTE boundary and expected authorization contract. No privileged mutation is required to establish the ACL-deny portion.

### Mutation-capable authorization tests
N06–N12, N23–N26 require authenticated actor sessions and target fixtures. They must be executed one case at a time with pre/post invariant capture.

Registration cases requiring a pending profile remain BLOCKED until a disposable pending fixture exists.

## 5. Required invariants

### Card
- card count unchanged for denied calls;
- `status`, `expires_at`, `verification_count`, and `updated_at` unchanged unless explicitly expected;
- `referee_card_counters.last_sequence` unchanged for denied calls.

### Assignment
- status unchanged on denied transition;
- reason unchanged;
- assignment ownership unchanged;
- no unexpected audit/notification side effect.

### Event completion
- event status unchanged on denied call;
- completion approval unchanged;
- notification intent count unchanged.

### Notification subsystem
- claim/finalize internal functions remain inaccessible from browser actors;
- no ledger/claim state changes on denied calls.

### Registration
- profile registration status unchanged on denied calls;
- no role row inserted or changed.

## 6. Evidence minimization

Evidence must record only the minimum identifiers required to correlate a test. Prefer UUID hashes or short safe references over names, email addresses, phone numbers, card numbers, or other PII.

## 7. PASS criteria

A negative-path case is PASS only when:

`authorization outcome = expected DENY`
AND
`no unauthorized mutation`
AND
`no sensitive disclosure`
AND
`post-state = pre-state for protected invariants`.

A case is BLOCKED if actor/session/fixture evidence is incomplete. A case is FAIL if any security invariant is violated.

## 8. Current gate

No controlled negative-path RPC execution occurred in Phase 1.8AM.

Safety counters:
- Production mutation: 0
- Test mutation: 0
- DDL/DML: 0
- ACL changes: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 9. Next phase

PHASE 1.8AN — Controlled Negative-Path Execution Readiness Final Gate & Case-by-Case Authorization Matrix.
