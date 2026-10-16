# PHASE-7.4C Governance Decision Record

Version: v1.0.0
Package status: PASS - governance preparation complete

## 1. Context

The immutable Production contract is `public.check_duplicate_event(text,text,text) RETURNS boolean`. Current application behavior calls a historical five-argument duplicate search and expects duplicate rows with similarity information. Phase 7.4A established that the contracts are materially different; Phase 7.4B recommended Option C.

## 2. Evidence

Evidence is documented in the Phase 7.4A and 7.4B artifacts, the immutable baseline, production schema artifact, dependency graph, historical migration `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql`, generated types, and source call-site `src/hooks/useEvents.ts:556`. No Production or non-Production database was accessed for this package.

## 3. Current Canonical Contract

`public.check_duplicate_event(p_kota_id text, p_location text, p_name text) RETURNS boolean`. It performs an exact existence check over event kota, location, and name.

## 4. Application Contract

Five arguments: event name, event date, optional location, optional kabupaten/kota id, and optional current-event exclusion id. It returns duplicate event rows and similarity scores for EventEdit warning behavior.

## 5. Semantic Gap

Confirmed. The canonical contract and application contract differ in argument count, matching semantics, filtering, exclusion, ordering/scoring, and return shape.

## 6. Recommended Option

Option C: retain the existing canonical existence check and separately govern a rich duplicate-search capability. Recommendation is not authorization.

## 7. Alternatives

Option A adapts the application but loses current rich-search semantics. Option B evolves one function with incompatible behavior and requires a new contract. Option D retires the feature and changes user behavior. Option C best isolates compatibility and security decisions.

## 8. Security Impact

The future rich capability requires decisions on authenticated access, allowed roles, event visibility, cross-region access, sensitive fields, input validation, abuse prevention, rate limiting, auditability, and SECURITY DEFINER/search-path behavior. All unresolved values are `TBD / GOVERNANCE REQUIRED`.

## 9. RLS Impact

RLS remains authoritative for `public.events`; no client-side check may replace it. The relationship to `event_approvals`, `audit_logs`, and any other object is `TBD / GOVERNANCE REQUIRED`. No organizations, clubs, or memberships are introduced.

## 10. Performance Impact

Dataset size, similarity operator, pg_trgm usage, indexes, execution target, timeout, result limit, pagination, and concurrency target are `TBD / GOVERNANCE REQUIRED`. The existing baseline presence of `pg_trgm` does not authorize index or function changes.

## 11. Migration Impact

BATCH-01 Events remains blocked. A future approved path requires contract implementation, repository integration, application migration, tests, new baseline revision, dependency graph revision, and deployment authorization.

## 12. Rollback

Application, repository, function, schema, and baseline rollback procedures are `TBD / GOVERNANCE REQUIRED`. The existing canonical function must remain available unless a separately approved deprecation plan says otherwise.

## 13. Required Approvals

Business, product, technical, database/architecture, security, and deployment authorities must approve their respective concerns using the approval matrix. Names, dates, and approval records are `TBD / GOVERNANCE REQUIRED`.

## 14. Decision

Decision: `PENDING`

Authorization: `NOT GRANTED`

## 15. Decision Authority

Decision authority: Database/Architecture Owner with Business Owner, Product Owner, Technical Owner, Security Owner, and Deployment Authority approval as applicable. Individual identity: `TBD / GOVERNANCE REQUIRED`.

## 16. Effective Baseline Revision

Baseline Revision: `UNCHANGED`.

A future approved evolution may create a new baseline revision only; the current baseline must never be edited in place.

## Safety status

Application: NOT MODIFIED.

Database/schema/migrations: NOT MODIFIED.

Production: NOT USED, NOT AUTHORIZED.

BATCH-01: BLOCKED.
