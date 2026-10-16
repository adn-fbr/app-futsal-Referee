# PHASE 7.4H — APPROVED CONTRACT FREEZE

## Status

**APPROVED CONTRACT FROZEN — CONTRACT FREEZE ONLY**

Contract: `DUPLICATE-EVENT-RICH-SEARCH-CONTRACT v1.0.0`

Governance source: `PHASE-7.4E-G-R2`

Governance hash: `9a1090db71c507491d841dfd445c03745e7382ff2f9bd69b30d8d185d956740f`

## Architecture

**OPTION C — SEPARATE EXISTENCE CHECK FROM RICH DUPLICATE SEARCH**

The canonical existence check remains immutable:

`public.check_duplicate_event(text,text,text) RETURNS boolean`

It must not be modified, replaced, overloaded with an incompatible contract, or reinterpreted as the rich-search function.

The rich-search physical function identity, schema, signature, and return type remain **TBD** because they are not explicitly frozen in the approved D01-D19 register. No function name or signature is invented here.

## Inputs

| Field | Type | Required | Meaning | Validation and NULL behavior |
|---|---|---:|---|---|
| `p_name` | string | Yes | Event name | NULL or blank is a validation error |
| `p_date` | string `yyyy-MM-dd` | Yes | Event date | NULL or blank or invalid date is a validation error |
| `p_location` | string | No | Optional location filter | NULL means filter not applied |
| `p_kabupaten_kota_id` | string | No | Optional region filter | NULL means filter not applied |
| `p_exclude_event_id` | string | No | Event exclusion | NULL means no exclusion filter |

No undocumented input may be added.

## Matching

The frozen behavior is limited to:

1. Name exact/contains matching.
2. Date proximity.
3. Optional location and region filtering.
4. Relevant event exclusion.
5. Historical duplicate ranking.

AI semantic matching, embeddings, machine learning, phonetic matching, unapproved fuzzy matching, and unrelated normalization are not part of this contract.

## Similarity and Results

`similarity_score` is a ranking field only. No fixed numeric duplicate threshold is frozen. A future threshold requires a separate contract decision.

Default/public ordering is deterministic:

`similarity_score DESC, date DESC`

The default maximum result count is **5**. Pagination is not part of this contract and may not be introduced implicitly.

The logical application wrapper is:

- `isDuplicate`
- `duplicates[]`

Each duplicate candidate may contain the evidence-established fields:

`id`, `name`, `date`, `location`, `status`, `similarity_score`.

## NULL Semantics

- Required NULL or blank input: validation error.
- NULL location or region: filter not applied.
- NULL database field: does not match.
- NULL similarity score: not duplicate evidence.
- When ordering requires it, non-NULL similarity values precede NULL values.

NULL behavior must be deterministic. Invalid input must not silently become a successful empty result.

## Errors

- Invalid required input: validation error.
- Valid input with no duplicate: success, `isDuplicate=false`, `duplicates=[]`.
- Database error: error.
- Permission or RLS failure: authorization error.
- Timeout: timeout/error.

**DATABASE FAILURE != NO DUPLICATE.** Database errors and timeouts must never be converted into `isDuplicate=false`.

## Security, RLS, and Visibility

- Execution model: **SECURITY INVOKER**.
- `SECURITY DEFINER`: not authorized without separate security governance.
- RLS: **ENFORCED**.
- RLS bypass and privileged bypass: prohibited.
- Visibility: **CALLER-AUTHORIZED DATA ONLY**.
- Global, cross-organization, cross-club, or invented tenancy visibility: prohibited.

Existing Production RLS remains authoritative and is not changed in this phase.

## Performance

The required strategy is:

`MEASURE -> EXPLAIN -> VALIDATE -> INDEX`

No speculative index is authorized. `pg_trgm` presence does not authorize a trigram index, similarity implementation, or query rewrite.

## Migration and Rollback

Non-Production implementation is allowed only after this freeze and the separate implementation gate. Production migration and deployment remain unauthorized.

Before any non-Production migration, document:

1. Migration identifier.
2. Objects created or modified.
3. Rollback procedure.
4. Rollback dependencies.
5. Verification procedure.
6. Failure conditions.

No rollback SQL is executed in Phase 7.4H.

## Baseline and Production

The canonical baseline remains unchanged. No Production access, SQL execution, data extraction, mutation, migration, deployment, function creation, or index creation occurred.

Baseline hash: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.

## Freeze Boundary

This freeze means **APPROVED CONTRACT = FROZEN**. It does not mean the application is implemented, the database is migrated, or Production deployment is authorized.

Next gate: **PHASE 7.4I — NON-PRODUCTION IMPLEMENTATION DESIGN**.
