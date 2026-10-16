# PHASE 1.8AT — Controlled Negative-Path Execution Authorization & One-Case Transaction Protocol

**Date:** 2026-09-24  
**Project:** Test APP (`shorsqyycpptxcutrqrb`)  
**Production:** AFP SULSEL (`xfscfjwapwnkiinkgbjg`) — EXCLUDED  
**Mode:** CONTROLLED TEST EXECUTION DESIGN — NO EXECUTION  
**Gate:** BLOCKED

## 1. Objective

Define the final execution protocol for the frozen negative-path manifest from Phase 1.8AS.

This phase does not execute privileged RPCs, does not create fixtures, and does not mutate Test or Production.

## 2. Authorization Boundary

Actual execution requires an explicit authorization event covering:

- Test project `shorsqyycpptxcutrqrb` only;
- exact case IDs authorized;
- exact actor/session class;
- exact RPC signature and arguments;
- permitted mutation scope, if any;
- one-case-at-a-time execution;
- abort-first behavior.

Production is permanently outside the execution scope of this phase.

## 3. One-Case Protocol

For each case:

1. Verify case ID against the frozen Phase 1.8AS manifest.
2. Verify actor role/region/session evidence.
3. Verify target fixture and preconditions.
4. Capture pre-state and current invariant hashes.
5. Execute exactly one RPC attempt.
6. Capture actual result:
   - success/failure;
   - SQLSTATE when available;
   - return-shape metadata;
   - disclosure check.
7. Immediately compare protected post-state.
8. Compare invariant hashes.
9. Check audit/notification/card-counter side effects.
10. Classify `PASS`, `FAIL`, or `ABORT`.
11. If mutation occurred where denial was expected, stop the entire sequence.
12. Proceed to the next case only after the case is closed.

## 4. Transaction Rule

A transaction boundary must never be treated as a substitute for authorization.

For read-only denial cases, no mutation should occur.

For mutation-capable negative-path cases:

- use a disposable Test fixture;
- capture pre-state first;
- perform only the single intended call;
- verify protected state immediately;
- rollback/cleanup only where the fixture contract explicitly permits it;
- never rely on client-side rollback after an authorization failure;
- never use Production data as a disposable fixture.

If the execution mechanism cannot guarantee deterministic cleanup or post-state verification, the case remains `BLOCKED`.

## 5. Abort-First Conditions

Immediate global abort if any case produces:

- unexpected success;
- protected-row mutation during a denial case;
- card counter increment;
- card verification counter increment;
- event status change;
- assignment status/ownership change;
- cross-user disclosure;
- cross-region disclosure;
- notification claim/finalize side effect;
- unexpected audit-log mutation;
- trigger side effect inconsistent with the contract;
- internal RPC callable by an unauthorized browser actor;
- provider invocation;
- secret/credential exposure.

## 6. Evidence Record

Each executed case must capture:

| Field | Requirement |
|---|---|
| Case ID | Exact frozen ID |
| Actor class | Anonymous / wasit / regional admin / provincial admin |
| Actor identifier | Redacted/minimized |
| Region | Region identifier only when required |
| RPC signature | Exact identity signature |
| Arguments | Redacted where sensitive |
| Pre-state | Required |
| Expected result | Frozen contract |
| Actual result | Required |
| SQLSTATE | Capture if returned |
| Return shape | Capture without sensitive payload |
| Post-state | Required |
| Invariant hash | Before/after |
| Side effects | Audit/notification/counter checks |
| Verdict | PASS / FAIL / ABORT |
| Timestamp | Required |

## 7. Case Isolation

No parallel execution.

No batching of mutation-capable negative-path calls.

No reuse of a fixture after an unexplained state change.

No case may depend on a previous case's mutation unless explicitly specified by the frozen manifest.

## 8. Registration Exception

The registration cases remain blocked because the Test project currently has no pending registration fixture.

No pending registration may be created solely to bypass this gate without explicit execution authorization.

## 9. Production Safety

Production project `xfscfjwapwnkiinkgbjg` is excluded.

No:

- RPC execution;
- DML;
- DDL;
- migration;
- Edge Function invocation;
- provider call;
- secret read;
- authentication/session manipulation

is authorized by this artifact.

## 10. Current Evidence

Latest read-only Test baseline:

- events: 31
- approved events: 2
- completed events: 29
- assignments: 37
- confirmed assignments: 4
- pending assignments: 33
- referee cards: 1
- active cards: 1
- card counters: 1
- event completion notifications: 4
- assignment notifications: 27
- delivery ledger: 1
- notification channel claims: 0
- Meta webhook events: 0
- audit logs: 517

Baseline invariant hashes remain those frozen in Phase 1.8AR.

## 11. Gate

**BLOCKED — PROTOCOL FROZEN; NO CONTROLLED EXECUTION AUTHORIZATION HAS BEEN GRANTED.**

Safety counters:

- Production mutation: 0
- Test mutation: 0
- DDL/DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 12. Next Phase

**PHASE 1.8AU — Controlled Negative-Path Execution Authorization Checklist & First-Case Readiness Gate**

The next phase may prepare the first executable case, but execution must remain blocked until explicit authorization is provided.
