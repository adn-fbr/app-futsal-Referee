# Phase 1.7 Migration Boundary

## Proposed boundary

```text
HISTORICAL DATABASE HISTORY
        |
        | immutable archival evidence
        v
ARCHIVAL RECORD
        |
        | reviewed schema decision and catalog comparison
        v
CANONICAL NON-PRODUCTION BASELINE
        |
        v
FUTURE FORWARD-ONLY MIGRATIONS
```

## Historical-only material

All current files in `supabase/migrations`, including the pg-dump artifact and the Phase 1.4 settings migration, remain historical until a canonical baseline is approved. They must not be edited, reordered, deleted, or silently skipped in their existing lineage.

## Intended canonical artifact

A reviewed schema baseline should be stored under a dedicated repository path such as `supabase/baseline/` or as an explicitly versioned baseline migration workflow selected with the installed Supabase CLI. It must contain schema only, no production data or secrets. This artifact does not exist yet because the canonical source is unresolved.

## New database initialization

After approval:

1. Create an empty isolated non-production database.
2. Apply the canonical baseline exactly once.
3. Apply only migrations explicitly designated as post-boundary migrations.
4. Verify migration history and catalog objects.
5. Seed separate deterministic non-production fixtures.

## Future changes

Every schema change after the boundary must be a new reviewed forward migration applied against the canonical baseline. No ad-hoc shared-environment SQL and no second independent migration directory are allowed.

## Drift detection and CI

CI must build two empty databases from the same baseline, apply the same post-boundary migrations, dump catalog metadata, and compare enums, tables, columns, constraints, indexes, functions, views, triggers, RLS, policies, grants, and extensions. Any difference fails the job.

## Existing environments

Existing environments are not rewritten by this document. A separate deployment plan is required for any environment whose migration history predates the boundary. Production remains untouched.

## Current status

Boundary documented: YES.
Canonical artifact created: NO.
Reason: unresolved source-of-truth and no isolated catalog.
