# PHASE 1.8AU — Controlled Negative-Path Execution Authorization Checklist & First-Case Readiness Gate

**Date:** 2026-09-24  
**Project:** Test APP (`shorsqyycpptxcutrqrb`)  
**Production:** AFP SULSEL (`xfscfjwapwnkiinkgbjg`) — EXCLUDED  
**Mode:** READ-ONLY / EXECUTION NOT AUTHORIZED  
**Gate:** BLOCKED

## 1. Objective

Close the final readiness checks before any controlled negative-path RPC execution. This phase does not execute RPCs, create fixtures, mutate rows, apply migrations, or call providers.

## 2. Authorization Checklist

Execution may proceed only when every item below is explicitly satisfied:

- [ ] Explicit authorization names Test project `shorsqyycpptxcutrqrb`.
- [ ] Production project is excluded.
- [ ] Exact Phase 1.8AS case ID(s) are named.
- [ ] Actor/session/JWT evidence is available for each selected case.
- [ ] Actor role and region are bound to the selected fixture.
- [ ] Exact RPC signature and arguments are frozen.
- [ ] Pre-state snapshot is captured immediately before the call.
- [ ] Phase 1.8AR invariant hashes are available for comparison.
- [ ] Expected denial/authorization semantics are frozen.
- [ ] Post-state verification query is frozen.
- [ ] Audit/notification/counter side-effect checks are frozen.
- [ ] Abort-first conditions are active.
- [ ] One-case-at-a-time execution is enforced.
- [ ] No provider call or secret access is involved.
- [ ] Cleanup/rollback path is deterministic for mutation-capable fixtures.

## 3. First-Case Selection Gate

The first executable case should be the lowest-risk ACL boundary test from the frozen manifest: an anonymous invocation of a privileged RPC expected to fail before entering business logic.

Candidate first case:

**N01 — anonymous → `approve_registration(uuid, app_role)` → DENY**

Expected behavior:

- EXECUTE denied for `anon`.
- No profile mutation.
- No `user_roles` mutation.
- No audit mutation attributable to the attempted call.
- No notification mutation.
- No card-counter mutation.
- No sensitive return payload.

This case is preferred as the first execution candidate because it does not require a valid authenticated actor and should terminate at the database EXECUTE boundary.

## 4. First-Case Preconditions

Before N01 can execute, the following must be verified:

1. Function signature exists exactly: `approve_registration(uuid, app_role)`.
2. `anon` EXECUTE is denied.
3. `authenticated` EXECUTE remains allowed for the intended application path.
4. Test project identity is confirmed.
5. No migration or DDL is pending as part of this test.
6. No disposable registration fixture is required for the ACL-only denial.
7. Pre-state counts/hashes are captured.

Current read-only Test evidence confirms the relevant ACL state and function signature from the preceding phases.

## 5. Current Security Advisor State

A fresh read-only security-advisor check on Test reports:

- 10 RLS-enabled tables without policies.
- 3 mutable-search-path function findings.
- `pg_trgm` installed in `public`.
- 39 anonymous SECURITY DEFINER execution findings.
- leaked-password protection disabled.

These findings are **not remediated by this phase** and must not be silently changed during negative-path testing.

The advisor result confirms that the security boundary remains an active remediation target; it does not authorize broad ACL changes.

## 6. Abort-First Conditions

Immediately stop the sequence if N01 or any later case causes:

- unexpected success;
- protected data mutation;
- role assignment mutation;
- card/counter mutation;
- event or assignment mutation;
- notification claim/finalize side effect;
- unexpected audit mutation;
- sensitive data disclosure;
- cross-user or cross-region disclosure;
- provider invocation;
- secret access;
- trigger disablement/detachment;
- any mutation outside the declared fixture boundary.

## 7. Evidence Capture

For each executed case capture:

`case_id → actor/session → RPC signature → args → pre-state → expected result → actual result → SQLSTATE → return shape → post-state → invariant diff → side effects → verdict`

Use `PASS`, `FAIL`, or `ABORT`; do not convert an unexpected result into a pass by interpretation.

## 8. Registration Exception

Registration cases remain blocked because Test currently has no pending registration fixture. No pending registration will be fabricated in this phase.

## 9. Safety Boundary

No operation in this phase changes:

- Production schema/data;
- Test schema/data;
- migration history;
- RLS policies;
- function ACLs;
- function bodies;
- triggers;
- Edge Functions;
- provider configuration;
- secrets.

## 10. Gate Result

**BLOCKED — FIRST-CASE PROTOCOL IS DEFINED, BUT ACTUAL EXECUTION AUTHORIZATION HAS NOT BEEN GRANTED.**

Safety counters:

- Production mutation: 0
- Test mutation: 0
- DDL/DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## 11. Next Phase

**PHASE 1.8AV — Controlled Negative-Path N01 Execution / Abort-First Evidence Capture**

Execution must not begin unless the user explicitly authorizes the named Test case N01 under the one-case protocol.
