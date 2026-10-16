# Phase 1.6 Schema Integrity Report

## Result

BLOCKED: no complete non-production database exists against which runtime catalog checks can be executed.

## Static schema inventory

The migration forensic analysis confirms expected families of tables, enums, functions, views, triggers, indexes, constraints, RLS policies, and grants, but the current chain cannot establish them atomically from empty state.

Important static checks:

- `app_role` appears in two incompatible creation histories and is later extended.
- `user_roles`, `profiles`, `events`, `honors`, and `event_assignments` are created in the legacy base and replayed/extended by the pg-dump history.
- Regional tables and canonical role-dependent functions are introduced by the dump and later migrations.
- Policies are repeatedly dropped and recreated across the chain, so source order alone does not prove the final intended policy set.
- Views and triggers are similarly replaced or recreated, requiring catalog comparison after a valid baseline is established.
- `system_settings` has a staged public-settings boundary, but that migration is not applied.

## Required runtime checks after baseline repair

- Each expected table, enum, view, function, trigger, index, constraint, and grant exists exactly as approved.
- Security-sensitive tables have RLS enabled.
- Policy definitions match the approved tenant and role matrix; no broad settings policy remains.
- Security-definer functions have controlled owners, fixed search paths, input validation, and tested caller boundaries.
- The filtered public settings view exposes no secret keys or values.

## Current conclusion

No claim of schema integrity or RLS integrity can be made from the failed partial startup. Runtime verification is blocked until the explicit non-production baseline is approved and applied.
