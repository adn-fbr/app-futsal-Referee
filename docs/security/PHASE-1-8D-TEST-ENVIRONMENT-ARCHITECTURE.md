# Phase 1.8D Test Environment Architecture

## Target topology

```text
PRODUCTION: xfscfjwapwnkiinkgbjg
  read-only catalog/reference only
          |
          | reviewed schema-only baseline, no data
          v
AFP SULSEL SECURITY TEST: separate Supabase project
  Auth + Postgres + PostgREST + Storage + Edge Functions
          |
          +-- synthetic users/roles/regions/resources
          +-- isolated secrets
          +-- security test runner
          +-- disposable reset/rebuild lifecycle
```

## Project separation

The test project must have a different project ref, URL, database password, anon/publishable key, service-role key, Auth configuration, Edge Function secrets, and CI secret namespace. Production values must be rejected by preflight checks.

## Access model

- Browser-style tests use the test project's anon/publishable key and synthetic user sessions.
- Fixture setup uses the test service role only from a protected CI/job context.
- Test code must reject `SUPABASE_URL` matching the production URL/ref.
- No service-role result is interpreted as ordinary-user authorization evidence.
- Production network/database credentials are unavailable to test jobs.

## Lifecycle

1. Provision empty test project.
2. Apply reviewed schema-only baseline.
3. Apply approved security migration/boundary changes.
4. Verify catalog equivalence to the approved production reference.
5. Create deterministic synthetic fixtures.
6. Run behavioral suite.
7. Destroy/reset only the test project or its fixtures.

## Required infrastructure

Dedicated Supabase project, secret manager, CI job identity, schema deployment path, Edge Function deployment path, test runner with network access, fixture cleanup, and catalog comparison tooling.
