# Phase 1.6 Migration Baseline Strategy

## Decision

**Recommended: Option B, explicit non-production baseline, implemented only after schema approval.**

The current migration directory is Scenario C: partially overlapping histories. It cannot be replayed from empty state. A later additive migration cannot repair an earlier failure, and changing historical files would rewrite the production migration lineage.

## Safe implementation boundary

1. Keep every existing migration immutable.
2. Obtain an approved current schema source from a known non-production database or reviewed schema dump.
3. Generate a new baseline artifact in a separate, explicitly named non-production baseline path or project workflow.
4. Apply only post-baseline migrations, including the Phase 1.4 settings boundary, after catalog comparison.
5. Run the baseline against two independent empty non-production databases and compare catalogs.
6. Promote future migrations through the normal forward-only path after the baseline is accepted.

This phase cannot safely perform step 2 because no dedicated non-production database or approved canonical schema snapshot is configured. Therefore no baseline SQL, fake migration history, or new schema migration is created here.

## Options evaluated

### Option A: replay all historical migrations
Rejected. It fails on `public.app_role` and has confirmed overlap across tables, functions, views, triggers, policies, and constraints.

### Option B: explicit non-production baseline
Recommended. It preserves historical evidence and gives CI a deterministic empty-database starting point, but requires approval of the canonical schema and a controlled baseline artifact.

### Option C: forward reconciliation migrations
Rejected as the immediate repair. Forward migrations cannot execute before the pg-dump failure, and a sequence of conditional object checks would risk silently accepting incompatible definitions.

### Option D: Supabase-native migration baseline workflow
Required as the delivery mechanism for Option B: use a dedicated non-production project/local database, produce a reviewed schema dump or baseline migration from that environment, record the migration boundary, and apply later migrations forward. The exact CLI commands must be selected against the installed Supabase CLI after the canonical source is available.

## Safety properties

- Production is not connected or modified.
- Historical files and their timestamps remain unchanged.
- RLS and JWT settings are not weakened.
- No object is dropped to make replay succeed.
- CI can rebuild from an empty database once the approved baseline and boundary are committed.
- Existing environments continue using their existing migration history until an explicit deployment plan is approved.

## Rollback and risks

A baseline is a schema boundary, not a reversible data migration. Rollback requires restoring the isolated test database or deploying a forward corrective migration. The main risk is choosing a schema snapshot that differs from production. That is why catalog comparison, policy review, and two clean rebuilds are prerequisites.

## Future developer workflow

- Never edit or reorder historical migrations.
- Create new migrations with the installed Supabase CLI migration command.
- Validate against an empty non-production database and a representative fixture database.
- Run schema/object/security checks before merging.
- Keep production credentials unavailable to local and CI test jobs.

## Current status

Strategy selected: **Option B / explicit non-production baseline**.
Implementation status: **BLOCKED** pending an approved canonical schema source and isolated non-production environment.
