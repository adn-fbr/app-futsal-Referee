# PHASE-7.4D Detailed Duplicate Search Contract

Version: v1.0.0
Status: DESIGN ONLY

## Responsibilities

The existing canonical capability remains `public.check_duplicate_event(text,text,text) RETURNS boolean` and is unchanged. Option C adds a separately governed rich duplicate-search capability for candidate discovery and similarity information. The final function name, schema, signature, and return type are `TBD / GOVERNANCE REQUIRED`; this document does not invent them.

## Proposed conceptual contract

- Capability name: Rich Duplicate Event Search
- Preferred function name: `TBD / GOVERNANCE REQUIRED`
- Alternatives: `TBD / GOVERNANCE REQUIRED`
- Schema: `TBD / GOVERNANCE REQUIRED`; `public` exists in the baseline, but a new function placement is not approved
- Signature: `TBD / GOVERNANCE REQUIRED`
- Return shape: `TBD / GOVERNANCE REQUIRED`

The application evidence establishes five semantic inputs: event name, event date, optional location, optional kabupaten/kota id, and optional current-event exclusion id. PostgreSQL types, nullability, defaults, and validation remain to be approved.

## Current application mapping

`useEvents.ts:556` is the only runtime call-site. `EventEdit` uses the result to warn before update. The historical behavior returns duplicate rows with `id`, `name`, `date`, `location`, `status`, and `similarity_score`. These are observed application requirements, not an approved new database contract.

## Matching matrix

| Candidate field/behavior | Evidence-backed behavior | Design decision |
| --- | --- | --- |
| Name | Exact and contains comparisons appear in historical SQL | Exact/normalized/fuzzy weighting: TBD / GOVERNANCE REQUIRED |
| Date | Exact date and proximity within historical logic | Window and weighting: TBD / GOVERNANCE REQUIRED |
| Location | Optional exact comparison when supplied | Normalization and weighting: TBD / GOVERNANCE REQUIRED |
| Region id | Optional filter on `events.kabupaten_kota_id` | Mandatory/optional boundary: TBD / GOVERNANCE REQUIRED |
| Current event id | Exclusion during edit | Null handling and authorization: TBD / GOVERNANCE REQUIRED |
| Status/deleted rows | Historical logic excludes rejected/deleted candidates | Approved visibility rule: TBD / GOVERNANCE REQUIRED |
| Similarity metric | Historical SQL uses a CASE score, not pg_trgm | Algorithm and threshold: TBD / GOVERNANCE REQUIRED |

## Result and determinism

Scalar/table/SETOF/TABLE, field types, nullability, ordering, tie-breaker, maximum results, pagination, and NULL behavior are all `TBD / GOVERNANCE REQUIRED`. A future contract must define deterministic ordering and bounded results before implementation.

## Security and performance gates

Authentication, authorization, RLS interaction, event visibility, sensitive fields, rate limiting, query timeout, dataset size, operator, indexes, and concurrency target are `TBD / GOVERNANCE REQUIRED`. Baseline presence of `pg_trgm` does not authorize its use or index creation.

## Schema impact

Existing canonical: `public.check_duplicate_event(text,text,text)` and `public.events`.

New required: rich-search function contract, if approved.

TBD: exact function, grants, indexes, and any baseline objects.

No object was created or modified.
