# Event Assignment Validation

## Current status: BLOCKED

Static implementation is present: `/administration/event-assignments` is Admin Provinsi protected; list/search/filter/detail/status dialog/step-up exist; mutation is restricted to `pending -> confirmed`, by ID, with pending-row predicate; controls are disabled while pending; query errors/retry were added.

## Missing proof

- Non-Production Admin Provinsi identity and negative role.
- Canonical pending fixture.
- Actual RLS allow/deny behavior.
- Wrong/correct password mutation effects.
- Before/after status, event ID, referee ID, updated timestamp.
- Audit/notification behavior.
- Browser double-submit/refresh/mobile validation.

## Required next test sequence

1. Anonymous route denial.
2. Non-admin route/action denial.
3. Admin list and state matrix.
4. Wrong password, assert zero mutation.
5. Correct password, assert independent role proof.
6. Count update requests under rapid click.
7. Read persisted row after refresh.
8. Verify audit/notification if canonical mechanisms exist.
9. Restore fixture.
