# Database Migration Governance

## Status

Policy defined; enforcement waits for the approved canonical baseline.

1. **One canonical schema source.** The approved non-production baseline is the source for new environments.
2. **No parallel migration histories.** Historical migrations remain archival; future migrations have one supported path.
3. **No ad-hoc shared-environment SQL.** Changes must be represented by reviewed versioned migrations.
4. **Every schema change is versioned.** Include dependencies, security impact, and rollback/forward-repair notes.
5. **Every migration targets the canonical baseline.** Validate on an empty database and a representative fixture database.
6. **Fresh initialization runs in CI.** CI rebuilds at least two empty databases and compares catalog metadata.
7. **Schema drift is detectable.** Compare object definitions, RLS, policies, grants, extensions, and migration history.
8. **Production changes originate from reviewed migrations.** No production console edits or copied snapshots.

## Required review gates

- SQL dependency/order review.
- RLS and policy review.
- SECURITY DEFINER/search-path review.
- Generated types and application query compatibility.
- A/B schema equivalence.
- No secrets or production data in baseline artifacts.

## Prevention

A migration cannot be merged if it creates an already-owned object without an explicit compatible evolution, introduces a second baseline, or relies on a manual SQL step absent from CI.
