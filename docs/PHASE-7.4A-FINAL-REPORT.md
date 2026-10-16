# PHASE-7.4A Check Duplicate Event Contract Reconciliation

Version: v1.0.0

## STATUS: BLOCKED

Call-sites: **1 application runtime call-site** (`src/hooks/useEvents.ts:556`).

Canonical contract: `public.check_duplicate_event(text,text,text) RETURNS boolean`.

Application contract: **5 arguments**, returning duplicate rows with similarity data.

Argument semantics: **RESOLVED individually; cross-contract mapping UNRESOLVED**.

Historical evidence: **FOUND**.

Non-production evidence: **NOT FOUND / NOT AUTHORIZED**.

Decision: **CONTRACT_REQUIRES_GOVERNANCE_DECISION**.

Rationale: The five-argument contract is directly defined by a historical migration and matches generated types and application behavior. The three-argument boolean contract is independently established by the immutable canonical baseline, production schema artifact, and dependency graph. Their semantics differ materially, so no safe adaptation or stale-reference conclusion can be made without governance.

Test baseline: **11/11 PASS in controlled run 1 and 11/11 PASS in controlled run 2**. The earlier 4-pass/5-fail report was a non-reproducible test-tool internal-state/environment failure.

Test failure classification: **ENVIRONMENT_FAILURE** for the earlier tool invocation; no application regression established.

Application modified: **NO**.

Database modified: **NO**.

Production: connection **NOT USED**; mutation **NOT EXECUTED**; deployment **NOT AUTHORIZED**.

Canonical baseline: **IMMUTABLE**.

Next gate: **BATCH-01 EVENTS ONLY AFTER CONTRACT DECISION IS CLEAR**.

## Determinism

The normalized resolution artifact set was hashed twice after analysis. Both runs were identical; values are recorded in `PHASE-7.4A-HASH.txt`.
