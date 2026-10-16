# Phase 1.6 Blocker Report

## Exact blocker

A fresh local Supabase database fails while applying `supabase/migrations/20260103165842_remix_migration_from_pg_dump.sql` because it executes `CREATE TYPE public.app_role` after `20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql` already created that type.

Observed PostgreSQL error: type `app_role` already exists (SQLSTATE `42710`).

## Root cause

The migration directory contains multiple partially overlapping schema histories. The first migration is an incremental legacy application schema; the pg-dump file is a later full schema snapshot; subsequent migrations continue to alter both. The dump is not a safe replay point at its current timestamp.

## Conflicting objects

Confirmed or statically identified overlap includes:

- `public.app_role` and later enum value additions.
- `public.pengurus_level` creation in the dump/regional history.
- `profiles`, `user_roles`, `events`, `honors`, and `event_assignments`.
- `has_role`, `handle_new_user`, `update_updated_at_column`, reporting, regional, and referee functions.
- active/public/review views.
- signup, timestamp, audit, and card triggers.
- policy names on events, profiles, user roles, pengurus, settings, and audit/log tables.
- indexes, checks, foreign keys, and grants attached to the replayed tables.

## Migration chain

```text
legacy base
  -> legacy tables/enums/functions/policies
  -> pg-dump snapshot
  -> canonical regional schema and policies
  -> repeated forward function/policy/table changes
  -> Phase 1.4 settings boundary (not reached)
```

## Dependency graph

```text
app_role / pengurus_level
  -> user_roles / profiles / regional tables
  -> has_role and tenant helper functions
  -> RLS policies and security-definer functions
  -> Edge Function resource authorization
  -> runtime RLS/security regression tests
```

## Safe options

1. Approve an explicit non-production baseline generated from a known-good schema and apply later migrations forward.
2. Reconcile the histories into a reviewed clean baseline outside production migration history, then rebuild two empty test databases.
3. Keep the current history only for forensic/legacy reference and prevent new environments from replaying it directly.

## Unsafe options rejected

- Editing, deleting, renaming, or reordering historical migrations.
- Dropping `public.app_role` or using `CASCADE`.
- Adding `IF NOT EXISTS` blindly to the dump.
- Marking the failing migration applied without proving its complete schema.
- Disabling RLS or JWT verification.
- Running tests against a partial schema or production.

## Recommended resolution

Approve Option B: an explicit, reviewed non-production baseline with a recorded migration boundary. The canonical schema source must come from a dedicated non-production database or an approved schema snapshot. The current repository does not contain enough trustworthy evidence to generate that baseline safely without making assumptions about production schema semantics.

## Required environment

- Dedicated non-production Supabase project or isolated local database.
- No production credentials.
- Approved schema snapshot/catalog comparison.
- Ability to rebuild two empty databases.
- Server-only secret store for test email/scheduler credentials.

## Next action

The project owner/database maintainer must provide or approve the canonical non-production schema source and baseline boundary. After that decision, generate the reviewed baseline, run two clean rebuilds, apply the Phase 1.4 settings boundary, seed fixtures, and execute the real security suite.
