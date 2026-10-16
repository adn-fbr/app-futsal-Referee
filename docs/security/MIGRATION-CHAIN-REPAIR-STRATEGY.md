# MIGRATION CHAIN REPAIR STRATEGY

## Observed failure

A fresh local Supabase startup fails while applying:

```text
supabase/migrations/20260103165842_remix_migration_from_pg_dump.sql
```

The failing statement attempts to create:

```text
public.app_role
```

The type already exists because the earlier migration [20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql) creates it first.

## Conclusion

The pg-dump migration is a baseline/schema snapshot that was committed alongside incremental migrations, but it is not safe as a clean replay after the initial migration. This is a repository migration-chain inconsistency, not an RLS test result.

## Prohibited response

Do not:

- edit or delete the historical migrations
- drop `public.app_role`
- mark the failed migration as applied without proving the full schema was created
- run security tests against a partially initialized database
- use production as a repair or test target

## Safe repair options

### Preferred: dedicated non-production baseline

1. Create a fresh dedicated non-production Supabase project.
2. Import the known-good current schema using an approved schema snapshot.
3. Apply only migrations after the selected baseline.
4. Validate tables, functions, RLS policies, and enum values.
5. Record the baseline commit and migration boundary in deployment documentation.

### Alternative: repository migration reconciliation

1. Compare the pg-dump object inventory against all incremental migrations.
2. Produce a new clean baseline branch or migration set outside production history.
3. Verify object ownership, functions, policies, triggers, and data constraints.
4. Keep the existing historical files immutable.
5. Use the reconciled chain only for new non-production environments after review.

## Required decision

The project owner must choose a baseline strategy before real RLS tests can be run locally. Until then, the security gate remains BLOCKED.
