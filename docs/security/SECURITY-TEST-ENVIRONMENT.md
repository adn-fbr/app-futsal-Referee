# SECURITY TEST ENVIRONMENT

## Goal

Create a secure, non-production test environment for authorization regression validation.

## Required environment

Use a local Supabase stack or a dedicated non-production Supabase project.

Recommended setup:

- local Supabase instance for migration validation
- dedicated test database or schema for authz checks
- seeded fixture users for each canonical role
- role-specific tenant / region fixtures
- reset script between test runs

## Required fixture model

Minimum fixtures:

- `admin_provinsi` user
- `admin_kab_kota` user in region A
- `admin_kab_kota` user in region B
- `panitia` user in region A
- `wasit` user in region A
- `evaluator` user
- unauthenticated session identity

## Data strategy

Use transaction rollback or database reset between tests.

The test environment must have:

- separate tenant A and tenant B data
- at least one resource owned by region A
- at least one resource owned by region B
- explicit role assignment rows in `user_roles`
- a valid `profiles.kabupaten_kota_id` relationship

## Why not production

Authorization tests are intentionally destructive if they are written against live data. A non-production environment is required to safely validate:

- cross-tenant denial
- privilege escalation rejection
- RLS enforcement
- direct function invocation without valid token

## Execution model

Recommended sequence:

1. reset DB
2. seed canonical fixtures
3. run authz tests
4. validate no data leak across tenants
5. capture failure output
6. do not proceed to feature work until all critical security tests pass

## Tooling

Use the project’s existing Vitest configuration with Supabase-backed tests. The repo already includes [vitest.config.ts](../../vitest.config.ts).

## Final requirement

No production database or production Supabase project should be used for security regression testing.
