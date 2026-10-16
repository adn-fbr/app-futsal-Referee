# Phase 1.8C RLS Behavior Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.** No remote behavioral request was sent.

## Fixture contract

Use only deterministic non-production fixtures: `REGION_A`/`REGION_B`, `USER_A`/`USER_B`, and `RESOURCE_A`/`RESOURCE_B`. Resource relationships must use actual runtime tables and be documented before execution.

## Matrix

| Actor | Resource | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- | --- |
| USER_A | RESOURCE_A / same authorized scope | ALLOW | domain-dependent ALLOW | domain-dependent ALLOW | domain-dependent |
| USER_A | RESOURCE_B / different region | DENY | DENY | DENY | DENY |
| USER_B | RESOURCE_A / different region | DENY | DENY | DENY | DENY |
| USER_B | RESOURCE_B / same authorized scope | ALLOW | domain-dependent ALLOW | domain-dependent ALLOW | domain-dependent |

## Runtime assertions

Record each result as `ALLOW`, `DENY`, `ERROR`, `UNEXPECTED ALLOW`, or `UNEXPECTED DENY`. An unexpected cross-region allow is a security failure. Verify both returned rows and mutation row counts; do not treat an empty successful response as proof without checking policy semantics.

## Policy hypotheses

Test broad runtime policies on `events`, `event_approvals`, `pengurus`, `provinsi`, `kabupaten_kota`, and `referee_reviews` against actual data sensitivity. `USING (true)` is not automatically a failure; it becomes a failure when it exposes tenant-sensitive data contrary to the approved model.

## Preconditions

Owner-confirmed isolated non-production project, two fixture users, canonical roles, two regions, resources in both regions, and a non-service client session for each user. No production or unknown environment execution is permitted.
