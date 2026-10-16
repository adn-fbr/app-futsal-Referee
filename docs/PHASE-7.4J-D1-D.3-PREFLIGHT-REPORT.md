# PHASE 7.4J-D1-D.3 - RECONSTRUCTION RE-AUTHORIZATION & FRESH PREFLIGHT

## Scope
Fresh read-only preflight for controlled non-production reconstruction. No reconstruction, migration execution, reset, rebuild, seed, Auth mutation, Storage mutation, RLS mutation, or Production access was performed.

## Authorization boundary
- Authorized target: `shorsqyycpptxcutrqrb` only
- Production project: `xfscfjwapwnkiinkgbjg`, forbidden
- D01-D10 authorization remains limited to non-production
- Supabase CLI confirmed `shorsqyycpptxcutrqrb` linked and healthy
- Production project was listed for identity comparison only and was not linked or accessed

## Baseline authority
D1-D.2 establishes the authoritative canonical baseline hash as:

`b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`

The current `production-schema.sql` produced that exact hash through both PowerShell `Get-FileHash` and .NET SHA-256 over raw bytes. The file is 126597 bytes, has no Git working-tree or staged diff, and the canonical copy is byte-identical. No encoding or line-ending conversion occurred.

## Target verification
The checked-in `supabase/config.toml` contains `project_id = "shorsqyycpptxcutrqrb"`. `supabase projects list` reported that project as linked and `ACTIVE_HEALTHY`; `xfscfjwapwnkiinkgbjg` was not linked. No executed command contained the production project ID as a target.

## Non-production snapshot
A read-only `supabase db dump --linked --schema public,storage` was captured at `2026-09-08T08:29:10.0300767Z`.

- Snapshot: `tmp/PHASE-7.4J-D1-D.3-NONPROD-SNAPSHOT.sql`
- Size: 67413 bytes
- SHA-256: `c214e785cff8f5323158d0dc5e9d9e51d88f21a56968a00c816c2640398210da`
- Schemas: 2
- Tables: 14
- Functions: 20
- Procedures: 0
- Views: 1
- Materialized views: 0
- Indexes: 11
- Primary keys: 14
- Unique constraints: 3
- Columns: 119
- Check expressions: 13
- Foreign keys: 14
- RLS-enabled tables: 14
- Policies: 32
- Triggers: 8
- Extensions: 0 in the schema dump scope
- Enum types: 2
- Auth users definition: not dumped; managed Auth boundary preserved
- Data INSERT/COPY statements: 0

## Recovery / rollback preflight
Recovery evidence is complete for a later separately authorized action: the current non-production schema snapshot, linked migration history, project reference, timestamp, and hashes were captured before any mutation. The linked project has 4 remote-applied migrations while 55 migration files exist locally. No reset or rebuild was executed. This phase does not authorize rollback execution.

Migration history artifact: `tmp/PHASE-7.4J-D1-D.3-MIGRATION-HISTORY.txt` with SHA-256 `8a3aafae7b8cc2b321a6b89ef6d00de62d2767c41bc71116857df49a88ebd64e`.

## Canonical target assertions
The fresh snapshot does not satisfy the established canonical target:

- 14 tables observed versus 27 required
- 20 functions observed versus 47 required
- 1 view observed versus 3 required
- 14 foreign keys observed versus 30 required
- 32 policies observed versus 86 required
- `public.events` lacks `deleted_at`
- `public.events` lacks `kabupaten_kota_id`
- `public.check_duplicate_event(text,text,text) RETURNS boolean` was not found

The snapshot is therefore an incomplete current non-production state, not evidence that the canonical target has already been reconstructed. Historical migrations remain excluded from execution, and no rich duplicate-search function was created.

## Decision
BLOCKED — CANONICAL TARGET INCONSISTENT

## Reason
Baseline integrity, target identity, production safety, and recovery evidence passed. The canonical target consistency gate failed because the fresh non-production snapshot is materially incomplete and lacks both required `events` columns and the exact three-argument duplicate-event contract. D1-D.3 stops here; reconstruction must not begin until a separately authorized execution phase addresses this blocker under `CANONICAL_BASELINE_ONLY`.

## Mutation counters
```text
DATABASE_MUTATION = 0
MIGRATION_EXECUTION = 0
RESET = 0
REBUILD = 0
SEED = 0
AUTH_MUTATION = 0
STORAGE_MUTATION = 0
RLS_MUTATION = 0
APPLICATION_IMPLEMENTATION = 0
PRODUCTION_ACCESS = NO
PRODUCTION_QUERY = 0
PRODUCTION_MUTATION = 0
PRODUCTION_DEPLOYMENT = 0
```

## Final gate
BLOCKED — CANONICAL TARGET INCONSISTENT