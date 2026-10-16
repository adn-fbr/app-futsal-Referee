# SECURITY INTEGRATION TEST ENVIRONMENT

## Purpose

Provide a non-production Supabase environment for real RLS, cross-tenant, IDOR, and identity-spoofing tests. These tests must never target production.

## Required infrastructure

- Supabase CLI compatible with the repository migrations
- Docker Desktop for local Supabase, or a dedicated non-production Supabase project
- All repository migrations applied
- Edge Functions deployed to the same non-production project

## Required environment variables

```text
TEST_ENVIRONMENT=non-production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TEST_TENANT_A=...
TEST_TENANT_B=...
TEST_USER_A=...
TEST_USER_B=...
TEST_USER_A_EMAIL=...
TEST_USER_A_PASSWORD=...
TEST_USER_B_EMAIL=...
TEST_USER_B_PASSWORD=...
TEST_EVENT_A_ID=...
TEST_EVENT_B_ID=...
```

Credentials must be supplied through the shell or CI secret store. Do not commit an env file containing them.

## Fixture requirements

- Tenant A and Tenant B must be distinct `kabupaten_kota` records.
- User A must belong to Tenant A.
- User B must belong to Tenant B.
- Each user must have a canonical `admin_kab_kota` role for the tenant-isolation suite, plus dedicated normal-role fixtures for denial tests.
- Event A and Event B must belong to their corresponding tenants.
- Fixture records must be marked with `SECURITY_TEST_` names and exist only in the non-production project.

## Fixture setup

The guarded seeder is [supabase/tests/seed-security-fixtures.ts](../../supabase/tests/seed-security-fixtures.ts).

It refuses to run unless `TEST_ENVIRONMENT=non-production` and uses the service key only for fixture creation. Capture the returned event IDs as `TEST_EVENT_A_ID` and `TEST_EVENT_B_ID`.

## Test execution

Run the real integration suite with network and environment access:

```text
deno test --allow-env --allow-net supabase/tests/security.integration.test.ts
```

Run the primitive authorization suite separately:

```text
deno test supabase/functions/_shared/authorization_test.ts
```

## Covered integration scenarios

- Tenant A cannot select Tenant B data.
- Tenant A cannot insert a Tenant B resource.
- Tenant A cannot update a Tenant B resource by UUID.
- Tenant A cannot delete a Tenant B resource by UUID.
- Authenticated identity cannot be replaced by a client-provided `created_by` value.
- Client-provided tenant values cannot cross the authenticated tenant boundary.

## Reset and destruction

Destroy only the dedicated test project or test fixtures. Do not run cleanup commands against production. For local Supabase, reset the local database after test execution using the CLI command approved for the installed version.

## Blocked state

If Docker is unavailable, the migration chain fails, or no dedicated project is configured, integration tests must remain explicitly blocked. The current local startup is blocked by a historical migration conflict: `20260103165842_remix_migration_from_pg_dump.sql` attempts to create `public.app_role` after the type already exists. Historical migrations must not be edited during this phase. Ignored tests are not passing tests, and no report may claim RLS or tenant isolation PASS without execution evidence.
