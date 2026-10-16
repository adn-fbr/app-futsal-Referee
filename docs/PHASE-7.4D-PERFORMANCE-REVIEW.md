# PHASE-7.4D Performance Review

Version: v1.0.0
Status: DESIGN ONLY

## Evidence

The baseline contains `pg_trgm`, but historical duplicate logic uses a CASE-based name/date comparison. Extension presence does not establish that a trigram operator, index, threshold, or query plan is approved.

## Required decisions

| Concern | Required value |
| --- | --- |
| Expected events dataset size | TBD / GOVERNANCE REQUIRED |
| Candidate query shape | TBD / GOVERNANCE REQUIRED |
| Similarity operator/metric | TBD / GOVERNANCE REQUIRED |
| Name normalization | TBD / GOVERNANCE REQUIRED |
| pg_trgm usage | TBD / GOVERNANCE REQUIRED |
| Required indexes | TBD / GOVERNANCE REQUIRED; do not create here |
| Maximum candidate set | TBD / GOVERNANCE REQUIRED |
| Default and maximum result limit | TBD / GOVERNANCE REQUIRED |
| Pagination strategy | TBD / GOVERNANCE REQUIRED |
| Query execution target | TBD / GOVERNANCE REQUIRED |
| Timeout | TBD / GOVERNANCE REQUIRED |
| Concurrency expectation | TBD / GOVERNANCE REQUIRED |
| Query-plan evidence | REQUIRED before implementation |

## Performance guardrails

Any future contract must bound work, define deterministic ordering, and test worst-case name/date/region searches. Index creation, schema changes, and production performance validation require a separately authorized migration and new baseline process.

No index or schema change was created.
