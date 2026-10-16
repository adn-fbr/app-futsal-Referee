# PHASE 1.8V — Final Candidate Static Compilation & Security Assertion Gate

Date: 2026-09-24
Mode: READ-ONLY / STATIC VERIFICATION
Project: test APP (`shorsqyycpptxcutrqrb`)
Production: untouched

## Gate

**BLOCKED — STATIC GATE NOT PASSED.**

No migration, DDL, DML, ACL change, RLS change, deployment, provider call, or secret read was executed.

## Critical Drift Detected

The latest Test catalog reports **68 SECURITY DEFINER functions**, whereas the Production baseline used by the Phase 1.8 candidate contained **42 SECURITY DEFINER functions**.

Therefore the Phase 1.8 candidate cannot be treated as a complete Test migration unit without first performing an exact Test-vs-candidate function inventory reconciliation.

A 42-function ACL/rewrite matrix is insufficient to safely classify all 68 Test SECURITY DEFINER functions. Applying it generically could either:

- leave newly introduced privileged functions exposed; or
- overwrite/revoke an already-established Test-specific contract.

This is an abort-first condition.

## Required Assertions Before Execution

1. Exact Test SECURITY DEFINER inventory = candidate inventory, or every additional function is explicitly classified.
2. Exact function identity signatures are unique.
3. No unexpected SECURITY DEFINER function remains browser-executable.
4. Approved public functions are limited to the frozen public contract.
5. Approved authenticated functions are limited to the frozen authenticated contract.
6. Internal notification claim/finalize functions remain anon/auth denied.
7. Canonical notification tables remain RLS enabled and policy-free for browser roles.
8. `public_application_settings` retains its explicit safe boundary.
9. `referee_contacts` retains own-row/role semantics.
10. No `auth.role()` remains in rewritten canonical functions.
11. Canonical rewritten functions use hardened search path and schema-qualified references.
12. Trigger attachments and enabled state are unchanged.
13. Historical card sequence gap `2026/737/0040` remains preserved.
14. Six historical cancelled assignments without reason remain preserved.
15. No historical notification backfill is introduced.
16. No blanket `GRANT ... TO PUBLIC` is introduced.
17. `soft_delete_record()` remains explicitly classified; it must not be assumed trigger-only.
18. Privileged reporting functions remain deny-by-default until caller contracts are proven.

## Current Test Boundary Evidence

The latest read-only catalog check confirms the Test environment contains additional SECURITY DEFINER surface beyond the 42-function Production matrix. This must be reconciled before any controlled execution.

Previously verified Test internal notification functions remain denied to both anon and authenticated roles.

## Decision

**ABORT / DO NOT EXECUTE.**

The correct next action is not to mutate Test. The next phase must produce a **Test-specific SECURITY DEFINER delta inventory** and reconcile all additional 26 functions against the canonical security boundary.

## Safety Counters

- Production mutation: 0
- Test mutation: 0
- DDL: 0
- DML: 0
- Migration applied: 0
- Deployment: 0
- Provider calls: 0
- Secret reads: 0

## Next Phase

**PHASE 1.8W — Test SECURITY DEFINER Delta Inventory & Contract Reconciliation**

Scope:
- inventory all 68 Test SECURITY DEFINER functions;
- classify the 26-function delta;
- identify Test-specific card, notification, webhook, and provisioning contracts;
- reconcile ACL/search_path/body requirements;
- update the candidate without touching the database.
