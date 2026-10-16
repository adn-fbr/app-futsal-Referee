# PHASE 7.4E-G Human Governance Decision Sheet

## Status

- Input: Phase 7.4E-F = **BLOCKED**
- Decision authority: **HUMAN / AUTHORIZED AUTHORITY REQUIRED**
- Current canonical: `public.check_duplicate_event(text,text,text) RETURNS boolean`
- Canonical status: **CANONICAL / UNCHANGED**
- Option: **OPTION C — SEPARATE RESPONSIBILITIES**
- Implementation, migration, deployment, and Production access: **NOT AUTHORIZED / NOT EXECUTED**

AI must not approve its own recommendation. This sheet is an explicit human decision form. Blank decision fields mean `PENDING`.

## Decision Instructions

For each decision, the authorized authority must record one of: `APPROVE`, `APPROVE WITH CONDITIONS`, `REJECT`, or `DEFER`. Until completed, the final register remains `PENDING`.

Do not modify, replace, overload, or wrap the canonical function. A rich-search capability, if approved, must remain a separate responsibility.

## D01 — Function Identity

**Evidence:** Existing canonical `public.check_duplicate_event(text,text,text) RETURNS boolean`; rich-search identity is not approved.

**Recommendation:** Create a separate rich-search function/capability. Do not modify `check_duplicate_event()`.

**Authority:** Database/Architecture Owner

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Approved rich-search schema: `____________________________`
- Approved rich-search function name: `____________________________`
- Approved signature: `____________________________`
- Approved return type: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D02 — Input Contract

**Evidence:** Application evidence confirms five inputs.

**Recommendation:** Preserve the five observed application semantics as design input; exact signature requires approval.

**Authority:** Database/Architecture Owner

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Input 1: `________________`
- Input 2: `________________`
- Input 3: `________________`
- Input 4: `________________`
- Input 5: `________________`
- Conditions: `________________`
- Approval reference: `____________________________`

## D03 — Return Contract

**Evidence:** Rich logical response is `isDuplicate` plus duplicate candidates; canonical return is boolean.

**Recommendation:** Separate rich result contract; exact database return type remains TBD.

**Authority:** Architecture and Database Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Return contract: `____________________________`
- NULL semantics: `____________________________`
- Empty result semantics: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D04 — Matching Semantics

**Evidence:** Observed exact/contains name matching, date proximity, optional location and region filtering, and event exclusion.

**Recommendation:** Evaluate only observed name/date/location/region/exclusion behavior; add no new fields.

**Authority:** Business/Product and Architecture Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Approved matching semantics: `____________________________`
- Case sensitivity: `____________________________`
- Normalization: `____________________________`
- NULL behavior: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D05 — Similarity Model

**Evidence:** Historical evidence contains CASE-based scoring.

**Recommendation:** Retain historical scoring only if explicitly approved; do not invent a new formula.

**Authority:** Architecture and Business Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Approved scoring model: `____________________________`
- Score range: `____________________________`
- Is score ranking-only? `[ YES / NO ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D06 — Threshold

**Evidence:** No numeric application threshold is established.

**Recommendation:** Treat `similarity_score` as a ranking signal; do not invent a threshold.

**Authority:** Business/Product and Architecture Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Threshold model: `[ NO NUMERIC THRESHOLD / NUMERIC THRESHOLD ]`
- Threshold value, if numeric: `________________`
- Meaning: `________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D07 — Ordering

**Evidence:** Historical ordering is `similarity_score DESC`, then `date DESC`.

**Recommendation:** Retain the observed ordering.

**Authority:** Architecture Owner

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Ordering: `____________________________`
- Is ordering part of public contract? `[ YES / NO ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D08 — Limit

**Evidence:** Historical query uses `LIMIT 5`.

**Recommendation:** Retain maximum 5 candidates unless Product Owner changes it.

**Authority:** Product and Architecture Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Maximum result count: `________________`
- Is limit part of contract? `[ YES / NO ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D09 — NULL Semantics

**Evidence:** Optional location, region, and exclusion values are converted to null; historical null filters disable those filters.

**Recommendation:** Preserve that behavior only if approved.

**Authority:** Architecture Owner

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- NULL input behavior: `____________________________`
- NULL database field behavior: `____________________________`
- NULL similarity behavior: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D10 — Error Semantics

**Evidence:** Hook throws while EventEdit allows proceeding; exact database error contract is not established.

**Recommendation:** Do not preserve fail-open behavior without explicit review; exact error policy remains TBD.

**Authority:** Architecture and Security Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Invalid input: `____________________________`
- No result: `____________________________`
- Database error: `____________________________`
- Permission error: `____________________________`
- Timeout: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D11 — Security Model

**Evidence:** Historical and canonical functions use SECURITY DEFINER, but that does not authorize a new rich function.

**Recommendation:** Prefer SECURITY INVOKER; any SECURITY DEFINER exception requires explicit approval.

**Authority:** Security and Database Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Security model: `[ SECURITY INVOKER / SECURITY DEFINER ]`
- If SECURITY DEFINER, search_path: `________________`
- Execution identity: `________________`
- Privilege boundary: `________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D12 — RLS

**Evidence:** RLS is authoritative; rich visibility is not proven.

**Recommendation:** RLS must be respected; no bypass and no service-role browser workaround.

**Authority:** Security and Database Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- RLS behavior: `____________________________`
- Cross-scope visibility: `____________________________`
- Explicit bypass: `[ NO / YES ]`
- If YES, justification: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D13 — Data Visibility Scope

**Evidence:** Tenant, organization, club, membership, and cross-scope visibility are not established.

**Recommendation:** Do not invent a tenant model; explicitly approve the event visibility boundary.

**Authority:** Business and Security Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Search visibility scope: `____________________________`
- Accessible events: `____________________________`
- Cross-scope search: `[ ALLOWED / NOT ALLOWED / CONDITIONAL ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D14 — Performance

**Evidence:** Dataset, latency, timeout, and concurrency targets are absent; no Production EXPLAIN was run.

**Recommendation:** Set measurable targets before implementation.

**Authority:** Performance and Product Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Target latency: `____________________________`
- Expected concurrency: `____________________________`
- Performance validation required: `[ YES / NO ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D15 — Index Strategy

**Evidence:** `pg_trgm` presence alone does not approve an index; no rich-search index is approved.

**Recommendation:** Inspect workload and query plan before any index request.

**Authority:** Database Owner

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Index candidate: `____________________________`
- Columns: `____________________________`
- Purpose: `____________________________`
- Index creation authorized: `[ YES / NO ]`
- Environment: `[ NON-PRODUCTION / PRODUCTION / BOTH ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D16 — Migration Strategy

**Evidence:** Future sequence requires contract, security/RLS, and performance approval before controlled non-Production work.

**Recommendation:** No migration now; Production migration remains a separate future gate.

**Authority:** Database/Architecture and Deployment Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Migration approach: `____________________________`
- Database objects allowed: `____________________________`
- Application changes allowed: `____________________________`
- Non-Production implementation: `[ AUTHORIZED / NOT AUTHORIZED ]`
- Production migration: `[ AUTHORIZED / NOT AUTHORIZED ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D17 — Rollback

**Evidence:** Only conceptual rollback exists; exact rollback SQL and operational triggers are not approved.

**Recommendation:** Preserve the canonical function and make rich capability/repository adoption reversible.

**Authority:** Database/Architecture and Deployment Owners

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Rollback mechanism: `____________________________`
- Rollback trigger: `____________________________`
- Canonical function preservation: `[ REQUIRED ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D18 — Baseline Impact

**Evidence:** Current canonical baseline is `UNCHANGED`.

**Recommendation:** A new revision is required only after authorized schema change, validation, deployment, and fresh extraction.

**Authority:** Database Governance Owner

- Decision: `[ APPROVE / APPROVE WITH CONDITIONS / REJECT / DEFER ]`
- Baseline impact: `[ NONE / FUTURE REVISION REQUIRED ]`
- Revision trigger: `____________________________`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## D19 — Implementation / Deployment Boundary

**Evidence:** Contract approval, implementation authorization, and Production deployment authorization are separate gates.

**Recommendation:** Keep Production deployment as a separate future authorization gate.

**Authority:** Deployment Owner

- Contract: `[ APPROVE / REJECT / DEFER ]`
- Non-Production implementation: `[ AUTHORIZE / DO NOT AUTHORIZE ]`
- Production migration: `[ AUTHORIZE / DO NOT AUTHORIZE ]`
- Production deployment: `[ AUTHORIZE / DO NOT AUTHORIZE ]`
- Conditions: `____________________________`
- Approval reference: `____________________________`

## Authority Record Requirements

For every decision, record the actual authority, approver, date, reference, and conditions. Never fabricate a name, date, approval number, ticket, meeting, or signature.

## Current Sheet Result

- Total decisions: 19
- Decisions with human status: 0/19
- Critical decisions with human status: 0/9
- Contract: **PROVISIONAL / BLOCKED**
- Next gate: **AUTHORITY DECISION**
