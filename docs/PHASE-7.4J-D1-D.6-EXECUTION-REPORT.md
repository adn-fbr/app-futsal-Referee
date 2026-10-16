# PHASE 7.4J-D1-D.6 - CONTROLLED NON-PRODUCTION RECONSTRUCTION EXECUTION

## Scope
Canonical-baseline-only reconstruction against non-production project `shorsqyycpptxcutrqrb`. Production project `xfscfjwapwnkiinkgbjg` was not targeted, queried, mutated, migrated, reset, rebuilt, seeded, or deployed.

## Baseline and target lock
- Source: `production-schema.sql`
- SHA-256: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`
- Size: 126597 bytes
- D1-D.5 recovery checkpoint: `tmp/PHASE-7.4J-D1-D.5-NONPROD-SNAPSHOT.sql`
- Recovery checkpoint SHA-256: `c214e785cff8f5323158d0dc5e9d9e51d88f21a56968a00c816c2640398210da`
- Target identity: `shorsqyycpptxcutrqrb`
- Historical migrations: 55, excluded from replay

## Reconstruction method
The isolated temporary workdir contained one pending migration, `20260908085000_canonical_baseline_reconstruction.sql`, consisting of an explicit non-production `DROP SCHEMA public CASCADE` preparation, public schema recreation/grants, and the unchanged canonical baseline. Four already-applied remote migration versions were represented only by empty local placeholders so the CLI could identify them as applied; they were not executed. No storage or Auth schema was dropped.

The dry run reported exactly one pending migration. `supabase db push --yes --linked` then completed with exit code 0 against the authorized project. No historical migration replay occurred.

## Post-reconstruction validation
Two read-only `public,storage` dumps were captured after execution:

- Dump 1: 165218 bytes, SHA-256 `77d9d8e4fe1f439a1118edc5f0ac5454cf9a2a38cfc72f0253f9653c300c9260`
- Dump 2: 165218 bytes, SHA-256 `77d9d8e4fe1f439a1118edc5f0ac5454cf9a2a38cfc72f0253f9653c300c9260`

Public application objects exactly matched D1-D.4:

| Category | Expected | Actual | Result |
| --- | ---: | ---: | --- |
| Tables | 27 | 27 | PASS |
| Columns | 249 | 249 | PASS |
| Constraints | 67 | 67 | PASS |
| Functions | 47 | 47 | PASS |
| Views | 3 | 3 | PASS |
| Triggers | 22 | 22 | PASS |
| RLS policies | 86 | 86 | PASS |
| Indexes | 47 | 47 | PASS |
| Enum types | 2 | 2 | PASS |

All 47 functions, 3 views, 22 triggers, 86 policies, and 47 indexes had zero normalized definition mismatches. The canonical `events` fields `deleted_at` and `kabupaten_kota_id` are present. `public.check_duplicate_event(text,text,text) RETURNS boolean` is present exactly once; no rich duplicate-search function was created. `auth.users` was not recreated and no data statements were present.

The only textual dump difference is `public.referee_cards` table-body formatting for `referee_cards_status_check`: PostgreSQL reserialized equivalent cast/parenthesis syntax. Constraint identity, count, and semantic definition remain equivalent; this is classified as dump serialization normalization, not schema drift.

Managed Storage objects remain outside the public canonical inventory. The seven canonical extensions are platform-managed and not emitted as extension definitions by the schema dump; the migration encountered no extension creation failure and no substitute extension was used.

## Dependency validation
The canonical dependency model remains equivalent: 351 records, 282 resolved, 47 unresolved function-body static-analysis markers, 22 external-managed records, 0 not-exposed records, and 30/30 canonical foreign keys. Exact public object identity and executable-definition comparisons passed, so no dependency identity changed during reconstruction.

## RLS validation
All 86 canonical public policies are present with zero normalized policy-definition mismatches. Public RLS-enabled tables and policy identities match the canonical inventory. No generic authorization replacement or RLS weakening was introduced.

## Determinism
The two complete post-reconstruction schema dumps are byte-identical and have the same SHA-256. The second validation therefore passed deterministic serialization requirements.

## Synthetic data gate
No synthetic data was inserted. Auth identities, profiles, referee records, events, and Storage fixtures remain deferred to a separate authorized stage.

## Decision
PASS — NON-PRODUCTION CANONICAL RECONSTRUCTION COMPLETE

## Safety counters
See `PHASE-7.4J-D1-D.6-SAFETY-COUNTERS.json`. Production access remained `NO`; all Production counters remained zero.