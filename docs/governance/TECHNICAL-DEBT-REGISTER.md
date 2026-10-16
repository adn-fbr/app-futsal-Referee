# TECHNICAL DEBT REGISTER

| ID | Problem | Evidence | Impact | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- |
| TD-001 | Authorization logic is split between frontend and database | [src/App.tsx](../../src/App.tsx), [src/components/auth/ProtectedRoute.tsx](../../src/components/auth/ProtectedRoute.tsx), [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql) | High risk of unauthorized access if DB enforcement is incomplete | P0 | Centralize and validate authz at DB + service layer |
| TD-002 | Role model drift across migrations and runtime code | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx), [supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql), [supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql](../../supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql) | Inconsistent policy interpretation | P0 | Define canonical role model and migrate old semantics |
| TD-003 | Edge functions disable JWT verification | [supabase/config.toml](../../supabase/config.toml), [supabase/functions/create-user/index.ts](../../supabase/functions/create-user/index.ts), [supabase/functions/delete-user/index.ts](../../supabase/functions/delete-user/index.ts) | Privileged actions can be invoked without strong auth boundaries | P0 | Re-enable JWT verification and enforce permission checks |
| TD-004 | Broad RLS permissiveness is present | [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql), [supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql](../../supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql) | Data exposure risk | P0 | Harden table policies and verify with tests |
| TD-005 | Business logic is scattered in UI hooks | [src/hooks/useUsers.ts](../../src/hooks/useUsers.ts), [src/hooks/useEvents.ts](../../src/hooks/useEvents.ts), [src/hooks/useRegistrations.ts](../../src/hooks/useRegistrations.ts) | Harder to reason about workflow correctness and audit changes | P1 | Move shared business logic to domain/application services |
| TD-006 | Large migration history indicates schema churn | [supabase/migrations](../../supabase/migrations) | Hard to know the canonical schema without documentation | P1 | Consolidate into a diagrammed canonical schema |
| TD-007 | Test suite is not meaningful for critical flows | [vitest.config.ts](../../vitest.config.ts), [src/test/example.test.ts](../../src/test/example.test.ts) | Regression risk for auth, approvals, events | P0 | Add business-critical tests before feature expansion |
| TD-008 | Secret-bearing config is stored in a general settings table | [src/hooks/useSettings.ts](../../src/hooks/useSettings.ts), [src/pages/Settings.tsx](../../src/pages/Settings.tsx) | Secret exposure risk if access is broad | P1 | Store secrets in secure secret manager or encrypted storage |
| TD-009 | Route behavior is hardcoded, not policy-driven | [src/lib/routeUtils.ts](../../src/lib/routeUtils.ts), [src/App.tsx](../../src/App.tsx) | Hard to maintain when role rules change | P1 | Build a centralized permission matrix |
| TD-010 | README and actual app implementation diverge | [README.md](../../README.md), [src/App.tsx](../../src/App.tsx) | Operators cannot rely on docs for current architecture | P2 | Update documentation to reflect actual implementation |

## Severity legend

- P0 = Blocking / critical
- P1 = High
- P2 = Medium

## Debt management guidance

Do not begin a roadmap item that depends on new business features before addressing TD-001, TD-002, TD-003, TD-004, and TD-007.
