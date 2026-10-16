# Next Development Roadmap

## Wave 0 — Blockers

1. Provision/verify authorized Non-Production identities and reversible assignment fixture.
2. Execute Admin Provinsi/non-admin/anonymous RLS and mutation validation for `event_assignments`.
3. Resolve duplicate-event and discussion/settings canonical contract ownership.
4. Review residual seed Edge Function capability and environment gating.

## Wave 1 — Core Business Workflows

5. Complete event-assignment live workflow: status, audit, notification, cache revalidation, rollback/failure behavior.
6. Add integration proof for events, referees, evaluations, honors, and user administration.
7. Establish role capability matrix consumed by route/menu/action tests.

## Wave 2 — Backend/Contract Hardening

8. Introduce repositories/services incrementally for events, assignments, users, and reports.
9. Centralize query keys/error normalization and remove direct-access duplication from critical domains.
10. Regenerate canonical route/module inventories from source.

## Wave 3 — UX/Accessibility

11. Browser validation at 390/768/1280; keyboard/focus/axe/screen-reader checks.
12. Standardize loading/error/empty/retry, table semantics, and mobile action layouts.

## Wave 4 — Testing

13. Add browser/RLS/mutation harness and regression fixtures; establish UAT gate.
14. Disposition lint baseline and enforce typecheck/build/lint policy without weakening rules.

## Wave 5 — Performance/Scale

15. Measure list sizes, pagination, bundle split, duplicate requests, and cache behavior before optimization.

## Wave 6 — Advanced Features

Defer richer duplicate search, broad analytics, advanced assignment templates, and new modules until canonical contracts and core UAT are stable.
