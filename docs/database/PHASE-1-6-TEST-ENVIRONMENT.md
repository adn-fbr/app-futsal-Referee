# Phase 1.6 Test Environment

## Status

BLOCKED. No dedicated non-production Supabase project is configured, and the repository migration chain cannot initialize local Supabase from empty state.

## Required environment identity

The environment must be explicitly identified as `non-production` and must use a separate Supabase project or isolated local stack. Production project IDs, URLs, keys, and data are prohibited.

## Required configuration

Supply through CI secret storage or the shell, never commit them:

- `TEST_ENVIRONMENT=non-production`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEST_TENANT_A`, `TEST_TENANT_B`
- `TEST_USER_A`, `TEST_USER_B`
- test user email/password values
- test resource IDs
- server-only email and scheduler secrets where applicable

No actual values belong in this document.

## Initialization method

After the approved baseline exists:

1. Create an empty isolated project/database.
2. Apply the approved baseline.
3. Apply all post-baseline migrations in order.
4. Confirm migration history and catalog integrity.
5. Seed only deterministic `SECURITY_TEST_` fixtures.
6. Deploy Edge Functions to the same non-production project.

The current `supabase start` command is not a valid initialization method until the baseline conflict is resolved.

## Reset and rebuild

Use only the installed Supabase CLI's documented local reset command or destroy/recreate the dedicated test project. Never run reset, seed, or destructive cleanup commands with production credentials.

## Fixture strategy

The guarded seeder at `supabase/tests/seed-security-fixtures.ts` must require `TEST_ENVIRONMENT=non-production`, create Tenant A/B and User A/B relationships in the actual schema, and return fixture IDs without printing secrets.

## Security restrictions

- Service-role keys are limited to fixture setup and trusted server jobs.
- Browser clients use only the anonymous/publishable key.
- Production secrets are not present in local or CI test environments.
- Test names are prefixed `SECURITY_TEST_`.
- No test is considered passing if it is ignored due to missing environment variables.
