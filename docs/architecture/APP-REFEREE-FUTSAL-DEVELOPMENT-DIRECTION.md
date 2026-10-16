# APP REFEREE FUTSAL DEVELOPMENT DIRECTION

## 1. What is this application now?

This is a production-oriented referee management platform built as a Vite React application backed by Supabase. It includes user registration workflows, role-based navigation, organization management, event submission and approval, assignment management, referee profile data, evaluation workflows, and operational admin dashboards.

The application has clear domain ambition, but it still behaves more like a feature-rich operational dashboard running on a database-backed CRUD layer than a fully hardened, domain-governed platform.

## 2. What is already good?

- Feature coverage is broad and business-relevant.
- The codebase has a strongly opinionated role model and route structure.
- There is a real Supabase backend and migration history.
- Operational workflows such as approvals, assignments, and notifications are implemented.
- A structured auth context and route guards give the frontend a usable access model.

## 3. What is dangerous?

- The authorization model remains split between frontend checks and database policies.
- Some edge functions intentionally disable JWT verification in [supabase/config.toml](../../supabase/config.toml).
- The application contains multiple role and schema evolution artifacts across migrations.
- The app currently relies on broad or permissive policies in several database tables.
- There is no mature regression suite for security or match-critical workflows.

## 4. Biggest technical debt

The largest technical debt is not UI debt; it is architectural debt in authorization and schema evolution.

Evidence:

- hybrid role management across [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) and [supabase/migrations](../../supabase/migrations)
- permissive policies in [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql)
- privileged functions with `verify_jwt = false` in [supabase/config.toml](../../supabase/config.toml)
- large data access logic embedded in hooks, e.g. [src/hooks/useEvents.ts](../../src/hooks/useEvents.ts), [src/hooks/useRegistrations.ts](../../src/hooks/useRegistrations.ts), [src/hooks/useUsers.ts](../../src/hooks/useUsers.ts)

## 5. Biggest security risk

The biggest security risk is an incomplete authorization boundary: the app trusts frontend role checks and some Supabase policies, while several privileged server endpoints are configured without JWT enforcement.

This is a classic production-level risk for:

- privilege escalation
- unauthorized mutation
- cross-tenant access
- altered approvals or assignments
- data exposure through broad table access

## 6. Is the current architecture suitable for continued development?

Conditionally yes, but only with a stabilization phase first.

It is suitable if the team explicitly treats it as an operational MVP with hardening work required before any large-scale feature expansion. It is not yet suited for unbounded feature growth without first locking down security and schema integrity.

## 7. What should be preserved?

- The role-based route model
- The operational workflow design for approvals and assignments
- The Supabase platform foundation
- The broad feature coverage around referee lifecycle management

## 8. What should be refactored?

- Authorization checks should be centralized into server-enforced policies and application service contracts
- Hook-heavy data access should be organized behind clear domain boundaries
- Role and region checks should be normalized around one canonical model
- Business rules should be moved out of individual pages and into explicit domain services

## 9. What should be rebuilt?

- The canonical authorization model should be rebuilt around a single source of truth
- The role and tenant isolation logic should be rebuilt and verified with security tests
- Any critical match and approval workflow that depends on mutable status transitions should be rebuilt around explicit state machine rules

## 10. Target architecture

Target architecture should be:

- identity: Supabase Auth + explicit user profiles
- organizations: provinsi / kabupaten_kota / org membership
- roles: a canonical role model with strict tenant scope
- workflows: event, assignment, evaluation, approval, report, notification
- security: DB + RLS + edge function checks + UI-protection as secondary only
- data integrity: single source of truth for event status, assignment status, role transitions, and approvals

## 11. Roadmap: 3 months

1. Security baseline
2. Role policy hardening
3. Region/data access isolation checks
4. Edge function JWT verification cleanup
5. Critical regression tests for auth, approval, assignment, and user management
6. Stabilize product flow for current admin and referee workflows

## 12. Roadmap: 6 months

1. Canonical role and tenant model
2. Service-layer domain boundaries
3. Referee lifecycle and profile integrity
4. Event/assignment/approval consistency improvements
5. Observability and operator dashboards
6. Production-grade data validation and audit trail improvements

## 13. Roadmap: 12 months

1. Mature referee operations platform
2. Strong match lifecycle and reporting workflow
3. Policy-driven organization management
4. Analytics and operational intelligence
5. Mobile-first operational UX improvements
6. Multi-organization scalability with stronger tenant isolation and support models

## 14. Dependency order

1. Security baseline
2. Role+tenant model
3. Data integrity
4. Event/assignment logic
5. Approval/reporting workflow
6. Analytics and automation

## 15. What should be done first?

The first action is:

> Stabilize the authorization model and Supabase security boundary before adding or expanding any new business workflow.

This means verifying the actual database policies, removing permissive execution patterns, and locking the app to a single canonical role + tenant model before continuing development.

## Maturity Assessment

Current maturity level: LEVEL 2 — Production Application

Reasoning:

- The app has production-oriented workflows and a real backend
- It includes real operational features and dashboards
- It is not yet a fully hardened platform and still shows security and schema drift risks

## Final Recommendation

Continue the platform only after a controlled stabilization sprint focused on security, role isolation, and schema integrity. The codebase has enough value to justify investment, but not enough hardening to treat it as a low-risk production platform without that stabilization work.
