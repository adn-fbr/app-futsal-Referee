# Repository Strategy

## Do not rewrite 233 calls

The first boundaries should be chosen by business risk and cross-module reuse:

1. **AssignmentRepository**: list, authorized status transition, cancellation contract, query keys, error model. Highest security/data-integrity value.
2. **EventRepository**: list/detail/create/update/approval and duplicate-check adapter after canonical type reconciliation.
3. **Identity/AdministrationRepository**: users, profiles, roles, approvals, audit boundaries; reuse existing Auth/Profile/Role repository style.

## Contract shape

Each repository should define typed inputs/outputs, domain errors, authorization assumptions, RLS dependency, query keys/revalidation, and test seams. It must not be a thin rename of `supabase.from()`.

## Migration sequence

Assignment first after live validation; Events second after duplicate contract decision; identity/admin third. Keep existing hooks as adapters during migration. Do not introduce a new state-management library or repository provider until two domains prove the need.

## Success criteria

Cross-module mutation behavior is testable without page-specific Supabase code; canonical IDs/statuses are enforced once; RLS assumptions are documented; tests can substitute a controlled client/fake at the boundary.
