# PHASE 1.8AV — Controlled Negative-Path N01 Execution / Abort-First Evidence Capture

**Date:** 2026-09-24  
**Project:** Test APP (`shorsqyycpptxcutrqrb`)  
**Production:** AFP SULSEL (`xfscfjwapwnkiinkgbjg`) — EXCLUDED  
**Mode:** READ-ONLY READINESS / EXECUTION NOT AUTHORIZED  
**Gate:** BLOCKED

## 1. Objective

Prepare the exact evidence-capture envelope for frozen case N01 from Phase 1.8AS/AT/AU:

`anonymous → approve_registration(uuid, app_role) → expected DENY`

This phase does **not** execute the RPC.

## 2. Live Read-Only Verification

Current Test catalog confirms:

- signature: `approve_registration(uuid,app_role)`
- `anon EXECUTE`: **false**
- `authenticated EXECUTE`: **true**
- `SECURITY DEFINER`: **true**
- search_path: `public, pg_temp`

Therefore N01 has an ACL-level anonymous denial precondition.

## 3. Frozen N01 Contract

| Field | Frozen value |
|---|---|
| Case | N01 |
| Actor | anonymous |
| RPC | `approve_registration(uuid, app_role)` |
| Expected | EXECUTE denial |
| Mutation expected | none |
| Fixture | no registration mutation required |
| Production | excluded |

## 4. Abort-First Conditions

Abort immediately if the anonymous attempt:

- succeeds;
- reaches function-body authorization unexpectedly;
- changes `profiles`;
- changes `user_roles`;
- changes `audit_logs`;
- changes notification/card state;
- returns protected data;
- produces an unexpected side effect.

## 5. Evidence Capture

Before an authorized execution, capture the current baseline for the relevant protected tables and the case timestamp. After the single attempt, compare the same invariants.

Required evidence:

- actual HTTP/RPC result;
- HTTP status when applicable;
- SQLSTATE when exposed;
- return shape;
- protected-row diff;
- audit diff;
- invariant hash comparison;
- final PASS/FAIL/ABORT verdict.

Do not record secrets or full JWTs.

## 6. Authorization Requirement

Actual execution requires explicit user authorization for **N01 only**, on **Test only**.

No authorization is inferred from requesting the phase or from the readiness artifact.

## 7. Safety

No RPC execution occurred in this phase.

- Production mutation: 0
- Test mutation: 0
- DDL/DML: 0
- Migration: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 8. Gate

**BLOCKED — N01 EXECUTION ENVELOPE READY; EXPLICIT EXECUTION AUTHORIZATION REQUIRED.**

## 9. Next Phase

If N01 is explicitly authorized, execute only N01 and capture evidence before proceeding to N02.
Otherwise, remain at this gate.
