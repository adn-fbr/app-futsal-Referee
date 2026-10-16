# PHASE-7.4E-B Codebase Contract Evidence Report

Version: v1.0.0

STATUS: **PASS - EVIDENCE EXTRACTION COMPLETE**

Call-sites: **1** application runtime call-site.

Application arguments: **5**.

Argument contract: five confirmed inputs from EventEdit form/route state, transformed to named RPC arguments with null defaults for optional values.

Return contract: duplicate rows with `id`, `name`, `date`, `location`, `status`, and `similarity_score`, wrapped as `isDuplicate` plus `duplicates`.

Matching semantics: historical name exact/contains matching, date exact/proximity, optional location/region filtering, and current-event exclusion.

Similarity: historical fixed CASE scoring only; no application pg_trgm or similarity function evidence.

Threshold: **NOT ESTABLISHED BY CODEBASE**.

Ordering: historical `similarity_score DESC, date DESC`; application consumes the first duplicate.

Limit: historical `LIMIT 5`.

Pagination: **NOT ESTABLISHED BY CODEBASE**.

Errors: RPC errors are thrown by the hook; EventEdit catches them and allows proceeding. Empty/null data becomes an empty duplicate array.

Historical contract: five-argument table-returning function in migration `20260121161308...sql`.

Production canonical: `public.check_duplicate_event(text,text,text) RETURNS boolean`.

Contract conflict: **YES**.

Codebase evidence: **COMPLETE**.

Governance delta: implementation-critical rich-search name, exact types/signature, approved algorithm/threshold, security/RLS, performance/indexes, and migration policy remain governance decisions.

Application modified: **NO**.

Database modified: **NO**.

Migration created: **NO**.

Production connection: **NOT USED**.

Production mutation: **NOT EXECUTED**.

Baseline modified: **NO**.

BATCH-01: **BLOCKED**.

Determinism: **PASS**.

Next gate: **GOVERNANCE DECISION ON REMAINING CONTRACT DELTA**.
