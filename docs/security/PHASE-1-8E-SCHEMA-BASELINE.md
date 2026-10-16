# Phase 1.8E Schema Baseline

## Status

**BLOCKED pending test project provisioning and baseline review.**

## Source

The baseline is derived from the verified Phase 1.8B runtime schema-only catalog, not blindly from the 55 local migrations.

Reference counts:

- 27 public tables
- 3 security-invoker views
- 47 public functions
- 41 SECURITY DEFINER functions
- 86 RLS policies
- 5 `app_role` values
- RLS enabled on all 27 public tables

## Exact method

1. Use the read-only production schema dump as the reference.
2. Review generated SQL for schema-only content.
3. Remove all data, Auth rows, storage records, secrets, ACL credentials, and environment-specific values.
4. Review functions, policies, grants, triggers, and security-invoker view definitions.
5. Store the approved baseline in a dedicated non-production boundary; do not edit historical migration files.
6. Apply it only to the new test project after project identity preflight.
7. Compare the resulting test catalog to the production reference.

## Historical migration warning

Do not replay the 55 local migrations blindly. The remote ledger has no matching versions and the historical chain contains overlapping definitions. A baseline boundary must be explicitly approved before future migrations are applied.

## Required contents

Schemas, tables, columns, PK/FK/unique/check constraints, indexes, enums, views, exact functions, triggers, RLS, policies, grants, and security configuration. Zero production rows.
