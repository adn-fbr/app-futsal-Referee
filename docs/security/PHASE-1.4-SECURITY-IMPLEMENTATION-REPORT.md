# PHASE 1.4 SECURITY IMPLEMENTATION & TEST HARNESS

## Status

IMPLEMENTATION READY / BLOCKED FOR DATABASE VALIDATION

## Resource-scope authorization

Implemented with the existing shared resolver:

- all 17 privileged Edge Functions import [authorization.ts](../../supabase/functions/_shared/authorization.ts)
- event notifications validate event tenant and panitia ownership
- assignment notifications validate event tenant and ownership
- regional profile reminders filter target profiles by resolved tenant
- regional email updates validate the target profile tenant
- admin reports constrain regional filters

Real database behavior remains unverified.

## Secret management

Implemented in code and migration staging:

- browser settings queries use `public_system_settings`
- secret keys are excluded from the public view
- browser hooks reject secret setting writes
- email handlers read credentials from `RESEND_API_KEY` and `SMTP_*` environment secrets
- new migration: [20260906063833_phase_1_4_public_settings_boundary.sql](../../supabase/migrations/20260906063833_phase_1_4_public_settings_boundary.sql)

The migration is not applied because no database environment is available. Until applied, the deployed database retains historical broad settings policies.

## Integration harness

- Fixture seeder: [seed-security-fixtures.ts](../../supabase/tests/seed-security-fixtures.ts)
- Integration suite: [security.integration.test.ts](../../supabase/tests/security.integration.test.ts)
- Environment contract: [SECURITY-INTEGRATION-TEST-ENVIRONMENT.md](SECURITY-INTEGRATION-TEST-ENVIRONMENT.md)

The harness requires explicit non-production environment variables and refuses to seed unless `TEST_ENVIRONMENT=non-production`.

## Executed evidence

- All privileged Edge Functions Deno type-check: PASS
- Shared authorization tests: 3 passed, 0 failed
- Integration harness collection: 5 tests ignored because required environment variables were absent
- Production build: PASS
- Static JWT coverage: PASS
- Static browser secret-read check: PASS
- Local Supabase startup: BLOCKED by Docker Desktop availability

## Not executed

- RLS SELECT/INSERT/UPDATE/DELETE tests
- Cross-tenant tests
- IDOR tests
- Identity spoofing tests
- Legacy role data validation
- Migration application and database syntax validation

## Remaining blockers

1. Repair the migration execution path without editing historical migrations, or provide a dedicated non-production Supabase project. Local startup currently fails because `20260103165842_remix_migration_from_pg_dump.sql` recreates the existing `public.app_role` type.
2. Apply and validate the public settings migration in that environment.
3. Set server-side email secrets in the Edge Function environment.
4. Seed tenant A/B fixtures and execute the integration suite.
5. Reassess existing RLS policies and legacy role data using live evidence.

## Security gate

The implementation is ready for integration validation. The overall security gate remains BLOCKED and must not be declared PASS until real database tests execute successfully.
