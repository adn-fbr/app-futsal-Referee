# SECURITY TEST REPORT

## Execution status

The executable unit security tests pass. The real database harness is implemented and ready, but its execution is BLOCKED because Docker Desktop is unavailable and no dedicated non-production Supabase credentials were provided.

## Tests executed

Command:

```text
deno test supabase/functions/_shared/authorization_test.ts
```

Result:

```text
3 passed, 0 failed
```

Covered:

- missing bearer token denied
- malformed bearer token denied
- valid bearer token extracted
- canonical role allow/deny decisions

## Required but blocked tests

The following require a real isolated Supabase database and were not faked:

- cross-tenant SELECT
- cross-tenant INSERT
- cross-tenant UPDATE
- cross-tenant DELETE
- IDOR resource access
- role escalation through RLS
- identity spoofing with a foreign `user_id`
- tenant spoofing with a foreign tenant ID
- authenticated Edge Function allow/deny behavior against real roles

## Harness artifacts

- Guarded fixture seeder: [supabase/tests/seed-security-fixtures.ts](../../supabase/tests/seed-security-fixtures.ts)
- Real Supabase integration suite: [supabase/tests/security.integration.test.ts](../../supabase/tests/security.integration.test.ts)
- Environment contract: [SECURITY-INTEGRATION-TEST-ENVIRONMENT.md](SECURITY-INTEGRATION-TEST-ENVIRONMENT.md)

The integration tests require `SUPABASE_URL`, `SUPABASE_ANON_KEY`, two non-production users, two tenant IDs, and two fixture event IDs. Without those variables, the tests are ignored rather than reported as passing.

## Environment evidence

`supabase start` reached the migration stage but failed on a historical duplicate enum definition:

```text
ERROR: type "app_role" already exists (SQLSTATE 42710)
At migration: 20260103165842_remix_migration_from_pg_dump.sql
```

No production database was used.

## Test data plan

Once an isolated environment is available, create:

- tenant A and tenant B
- user A in tenant A
- user B in tenant B
- `admin_kab_kota` roles for each tenant
- resources owned by each tenant

Then execute read, insert, update, delete, IDOR, role escalation, and spoofing cases under authenticated sessions.

## Result classification

- Authentication primitive tests: PASS
- Authorization primitive tests: PASS
- Cross-tenant tests: BLOCKED
- RLS tests: BLOCKED
- IDOR tests: BLOCKED
- Identity spoofing tests: BLOCKED
- Edge Function integration tests: BLOCKED
