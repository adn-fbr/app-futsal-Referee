# Phase 1.8B Migration Drift Analysis

## Verified evidence

- Local migration files: 55.
- Supabase linked project: `xfscfjwapwnkiinkgbjg`.
- `supabase migration list --linked` connected successfully.
- Every local version displayed an empty Remote value.
- Runtime public schema dump was obtained read-only: 27 public tables, 3 views, 47 functions, 86 policies, and 27 RLS-enabled tables.

## Classification

**E — OVERLAPPING / UNRECORDED MIGRATION HISTORY**, with a verified migration-ledger mismatch. The runtime schema contains the expanded regional/application object set while the remote migration column is empty for all 55 local versions. The exact provisioning route remains unknown.

The runtime catalog rules out classification A (synchronized). A complete definition-by-definition comparison is still required to distinguish an independent baseline from a dump-derived overlapping history.

## Required comparison

Compare runtime schemas, enums, functions, tables, policies, triggers, constraints, indexes, grants, and extensions against all 55 local migrations. Record local-only objects, runtime-only objects, conflicting definitions, legacy/dump-derived objects, and missing security objects.

## Safety decision

Do not run migration repair, `db pull`, `db push`, reset, or any write command. This audit documents drift only.
