# PHASE-7.4E-C Contract Delta Resolution

Version: v1.0.0
Status: PASS - evidence resolution complete; implementation not approved

## Current canonical contract

`public.check_duplicate_event(text,text,text) RETURNS boolean` is the immutable Production contract. Its parameters are `p_kota_id text`, `p_location text`, and `p_name text`; its body performs an exact `EXISTS` check over event kota, location, and name.

## Application and historical contract

The only application call-site is `src/hooks/useEvents.ts:556`. It sends five values: `p_name`, `p_date`, optional `p_location`, optional `p_kabupaten_kota_id`, and optional `p_exclude_event_id`. The hook expects duplicate rows and derives `isDuplicate` from array length. `EventEdit` consumes the first duplicate name for a warning.

Historical migration evidence defines the same five-argument shape and returns `id`, `name`, `date`, `location`, `status`, and `similarity_score`. Historical SQL applies lowercase exact/contains name matching, date proximity, optional location/region filters, exclusion, `ORDER BY similarity_score DESC, date DESC`, and `LIMIT 5`.

## Resolved deltas

- Application five-argument semantics: `RESOLVED_BY_HISTORICAL_EVIDENCE`.
- Canonical three-argument semantics: `RESOLVED_BY_CANONICAL_BASELINE`.
- Historical score formula and limit: `RESOLVED_BY_HISTORICAL_EVIDENCE`.
- Application call-site and DTO consumption: `RESOLVED_BY_EVIDENCE`.
- Canonical function preservation: `RESOLVED_BY_CANONICAL_BASELINE`.

## Governance-required deltas

Rich function identity, schema, exact approved signature/types, return contract approval, Production algorithm/threshold policy, ordering/limit/pagination policy, security execution model, RLS behavior, leakage protection, index authorization, performance targets, error policy, migration authorization, rollback authorization, and new baseline revision remain `NOT_ESTABLISHED_REQUIRES_GOVERNANCE` or `CONFLICT_REQUIRES_GOVERNANCE` as shown in the matrix.

The codebase does not use pg_trgm or a similarity function directly. Extension presence is not treated as application evidence.

## Boundary result

All dimensions have explicit status; no assumption is presented as evidence. No application, SQL, migration, database, baseline, dependency graph, or Production modification occurred.
