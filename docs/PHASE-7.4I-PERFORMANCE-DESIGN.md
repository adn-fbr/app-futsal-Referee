# PHASE 7.4I Performance Design

## Strategy

`MEASURE -> EXPLAIN -> VALIDATE -> INDEX`

## Required Measurements

- Dataset cardinality for visible events.
- Query frequency and concurrency.
- Latency target and timeout budget.
- Candidate selectivity for name/date/location/region filters.
- Execution plan for the approved query design.
- Cost of ranking and NULL ordering.

## Existing Evidence

Baseline indexes exist for `date`, `deleted_at`, `kabupaten_kota_id`, and `status`. `pg_trgm` is present in schema evidence, but that presence does not authorize a trigram index, similarity implementation, or query rewrite.

## Boundary

No index is authorized. No EXPLAIN or Production workload measurement was run. Any index request requires workload evidence, query-plan validation, separate review, and a non-Production gate.

Status: **EVIDENCE REQUIRED** before implementation.
