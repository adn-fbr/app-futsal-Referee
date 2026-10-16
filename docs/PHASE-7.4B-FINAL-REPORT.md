# PHASE-7.4B Check Duplicate Event Schema Evolution Proposal

Version: v1.0.0

## STATUS: GOVERNANCE_DECISION_REQUIRED

Current canonical: `public.check_duplicate_event(text,text,text) RETURNS boolean`.

Application: five-argument duplicate search returning rows plus similarity information.

Semantic gap: **YES**. The canonical function is an exact boolean existence check; the application contract adds date proximity, region filtering, current-event exclusion, similarity scoring, and row-level output.

Option A: technically smaller but changes current business behavior.

Option B: preserves behavior but requires a new approved schema contract and baseline revision.

Option C: preserves the current canonical contract while separately governing rich duplicate search. This is the **RECOMMENDED OPTION**, not authorization.

Option D: removes the duplicate-search feature and changes EventEdit behavior.

Authorization: **NOT GRANTED**.

Application modified: **NO**.

Database modified: **NO**.

Baseline modified: **NO**.

Production: connection **NOT USED**; mutation **NOT EXECUTED**; deployment **NOT AUTHORIZED**.

BATCH-01: **BLOCKED**.

Next gate: **GOVERNANCE DECISION**.

The current baseline remains immutable. No schema evolution, migration, repository implementation, application refactor, or workaround may proceed until the governance decision and required evidence are approved.
