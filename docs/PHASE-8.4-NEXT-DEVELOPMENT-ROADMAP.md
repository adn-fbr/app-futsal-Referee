# Phase 8.4 Roadmap

## 61 -> 70: Foundation and blockers

- Authorize synthetic Non-Production identities/assignment fixture.
- Add minimal browser harness with fail-closed target guard.
- Validate Event Assignment RLS, mutation, step-up, duplicate prevention, audit/notification, refresh.
- Reconcile generated type source and `check_duplicate_event` caller; keep schema gaps explicit.
- Establish risk-first test coverage and generated inventories.

## 70 -> 80: Core workflow completion

- Introduce AssignmentRepository and EventRepository incrementally.
- Complete Events, Referees, Users/Approvals, Evaluations, Honors integration paths.
- Standardize query keys, mutation invalidation, error/retry states.
- Validate notification and audit delivery.
- Establish direct URL/capability matrix tests.

## 80 -> 90: Production hardening

- Resolve `increment_view_count` and settings governance decisions.
- Browser/RLS/accessibility/responsive regression gates.
- Lint disposition and full quality gate.
- Pagination/cache/bundle/performance measurement and fixes.
- Accessibility, observability, rollback and operational documentation.

Do not optimize for score; each step is tied to business, security, contract, or UAT evidence.
