# PHASE-7.4E-F Critical Approval Register

Nine critical conflicts are preserved from the Phase 7.4E-E input. They are grouped by contract dimension; the complete D01-D19 register remains authoritative for individual decisions.

## CR-01

- **CRITICAL DECISION ID:** CR-01
- **CONTRACT DIMENSION:** Function identity, schema, and name (D01)
- **CURRENT STATE:** Canonical `public.check_duplicate_event(text,text,text)` exists; rich identity is not established.
- **RECOMMENDATION:** Use a separate candidate identity; do not reuse or overload the canonical name.
- **AUTHORITY:** Database/Architecture Owner
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Rich contract identity cannot be approved or implemented.

## CR-02

- **CRITICAL DECISION ID:** CR-02
- **CONTRACT DIMENSION:** Exact signature and input semantics (D02)
- **CURRENT STATE:** Canonical function has three arguments; observed rich application behavior has five inputs.
- **RECOMMENDATION:** Preserve five observed semantics as design input; exact PostgreSQL signature remains TBD.
- **AUTHORITY:** Database/Architecture Owner
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** No rich function contract may be finalized.

## CR-03

- **CRITICAL DECISION ID:** CR-03
- **CONTRACT DIMENSION:** Return contract (D03)
- **CURRENT STATE:** Canonical return type is boolean; rich behavior requires duplicate candidates and `isDuplicate` derivation.
- **RECOMMENDATION:** Separate rich result contract; exact database return type remains TBD.
- **AUTHORITY:** Architecture and Database Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Consumers and repository boundary cannot be authorized.

## CR-04

- **CRITICAL DECISION ID:** CR-04
- **CONTRACT DIMENSION:** Matching semantics (D04)
- **CURRENT STATE:** Name/date/location/region/exclusion behavior is observed but not business-approved.
- **RECOMMENDATION:** Evaluate only observed fields and behavior; add no new fields.
- **AUTHORITY:** Business/Product and Architecture Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Duplicate determination policy remains unresolved.

## CR-05

- **CRITICAL DECISION ID:** CR-05
- **CONTRACT DIMENSION:** Similarity model and threshold (D05-D06)
- **CURRENT STATE:** Historical CASE scoring is evidenced; no numeric threshold is evidenced or approved.
- **RECOMMENDATION:** Retain scoring only if explicitly approved; use ranking-only and non-empty-match semantics only as a recommendation.
- **AUTHORITY:** Architecture, Business/Product Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Matching results cannot be treated as an approved contract.

## CR-06

- **CRITICAL DECISION ID:** CR-06
- **CONTRACT DIMENSION:** Error and security execution semantics (D10-D11)
- **CURRENT STATE:** Exact error policy is TBD; historical SECURITY DEFINER behavior does not authorize a new function.
- **RECOMMENDATION:** Review fail-open behavior; prefer SECURITY INVOKER; any exception requires explicit approval.
- **AUTHORITY:** Architecture, Security, and Database Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Security-sensitive behavior cannot be implemented.

## CR-07

- **CRITICAL DECISION ID:** CR-07
- **CONTRACT DIMENSION:** RLS and data visibility scope (D12-D13)
- **CURRENT STATE:** Rich visibility boundary is not proven; caller region is not an authorization boundary.
- **RECOMMENDATION:** Respect RLS, bypass nothing, and explicitly approve event visibility scope.
- **AUTHORITY:** Security, Database, Business Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Potential data leakage remains an unresolved gate.

## CR-08

- **CRITICAL DECISION ID:** CR-08
- **CONTRACT DIMENSION:** Performance target and index strategy (D14-D15)
- **CURRENT STATE:** Dataset, latency, timeout, concurrency, operator, and index requirements are not approved.
- **RECOMMENDATION:** Set measurable targets and inspect workload/query plans before any index request.
- **AUTHORITY:** Performance, Product, and Database Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** Performance and schema changes are unauthorized.

## CR-09

- **CRITICAL DECISION ID:** CR-09
- **CONTRACT DIMENSION:** Migration, rollback, baseline, and deployment boundary (D16-D19)
- **CURRENT STATE:** No implementation, migration, rollback execution, baseline revision, or Production deployment is authorized.
- **RECOMMENDATION:** Future controlled non-Production work only after approvals; keep Production as a separate gate and preserve the canonical function.
- **AUTHORITY:** Database Governance, Architecture, Deployment Owners
- **STATUS:** PENDING
- **APPROVAL EVIDENCE:** None provided.
- **BLOCKING IMPACT:** No implementation, migration, baseline revision, or Production deployment may proceed.

## Critical Gate

`CRITICAL APPROVED = 0/9` and `CRITICAL PENDING = 9/9`.

**FINAL GATE: BLOCKED.**
