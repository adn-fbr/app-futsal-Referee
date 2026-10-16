# Phase 8.5D Gap Report

## Final gate

`BLOCKED`

## Open gaps

- `events.kota_id` is referenced by the canonical function but absent from the canonical table.
- The semantic equivalence of `p_kota_id` and `kabupaten_kota_id` is unproven.
- Historical five-argument similarity search conflicts with the canonical three-argument boolean identity.
- The SECURITY DEFINER function has no fixed search_path and may disclose existence beyond caller visibility.
- The boolean duplicate check provides no concurrency or idempotency guarantee.
- The authorized Non-Production runtime body/catalog and controlled invocation were not available through a safe SQL query channel; no mutation was attempted.

## Required next phase

Phase 8.5E should obtain an explicit database/business semantic decision, inspect the authorized Non-Production routine definition and dependencies through an approved read-only SQL channel, and then separately authorize the chosen database/application remediation. Transaction implementation remains blocked until that decision and idempotency design are complete.

Production UAT: `NOT READY`.
