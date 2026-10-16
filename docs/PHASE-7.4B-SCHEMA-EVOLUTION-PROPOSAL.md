# PHASE-7.4B Check Duplicate Event Schema Evolution Proposal

Version: v1.0.0
Status: GOVERNANCE_DECISION_REQUIRED

## Current production contract

The immutable Canonical Runtime Baseline defines `public.check_duplicate_event(text,text,text) RETURNS boolean`, with parameters `p_kota_id`, `p_location`, and `p_name`. Its body returns `EXISTS` for matching `events.kota_id`, `location`, and `name`. The known application caller is `src/hooks/useEvents.ts:556`, but its request shape does not match this contract.

## Application and historical contract

The application sends `p_name`, `p_date`, `p_location`, `p_kabupaten_kota_id`, and `p_exclude_event_id`. It expects duplicate records containing `id`, `name`, `date`, `location`, `status`, and `similarity_score`. `EventEdit` uses this result to warn before editing an event. Historical migration `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql:101` defines exactly this five-argument table-returning behavior.

## Semantic gap

YES. The current canonical contract is a boolean existence check; the application contract is a filtered duplicate search with similarity ranking and row-level output. Date proximity, region filtering, current-event exclusion, and result shape are material behavior, not redundant parameters.

## Recommendation

**RECOMMENDED: OPTION C**, split the capabilities into a canonical existence contract and a separately governed duplicate-search contract. This preserves the immutable current contract while allowing the richer application capability to receive an independently reviewed identity, security model, and return schema.

**AUTHORIZED: NONE.** This proposal authorizes no schema, baseline, migration, repository, application, or Production change.

Before Option C implementation, governance must provide every requirement listed in the decision-required artifact. Until then, BATCH-01 remains blocked and the current call-site must not be changed or replaced.

## Baseline rule

The current baseline remains immutable. Any approved evolution must create a new baseline revision with a new manifest and dependency graph after formal approval; `CANONICAL-RUNTIME-BASELINE.sql` must never be edited in place.

## Safety

No application code, SQL, migration, generated type, baseline, dependency graph, database, or Production environment was modified or accessed.
