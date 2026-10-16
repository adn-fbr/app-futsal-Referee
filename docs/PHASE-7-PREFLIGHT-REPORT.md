# PHASE-7 Pre-flight Report

## Start condition

| Requirement | Status |
| --- | --- |
| Canonical Runtime Baseline available | YES |
| Production schema dump available | YES |
| Dependency graph available | YES |
| Application source available | YES |
| Supabase client configured | YES, but a valid browser publishable/anon key must be supplied |
| TypeScript strict mode | YES after this phase change |

## Architecture discovered

- React 18, Vite, React Router, React Query, and Supabase JavaScript.
- src/App.tsx owns the route table; it is React Router rather than TanStack Start.
- AuthContext owns application authentication state.
- Protected routes are centrally wrapped by ProtectedRoute.
- UI pages and hooks still make many direct Supabase calls; a repository/provider architecture for business modules was not found.

## Production risks found

1. A service-role JWT was configured in a browser-exposed Vite variable.
2. The prior authentication context inserted a missing profile automatically.
3. Generated Supabase types contain legacy admin and referee roles that do not appear in the verified public.app_role enum.
4. Existing lint failures and lack of an installed test runner prevent a quality PASS.

## Schema alignment

Phase 7 uses only auth.users, public.profiles, and public.user_roles. It does not add or assume organizations, clubs, memberships, tenants, or any equivalent relation.

## Files changed by Phase 7

- src/repositories/auth/*
- src/contexts/AuthContext.tsx
- src/components/auth/ProtectedRoute.tsx
- src/integrations/supabase/client.ts
- tsconfig.app.json
- local .env configuration

## Immutable evidence

The canonical baseline, production dump, and dependency-normalization artifacts were not modified.
