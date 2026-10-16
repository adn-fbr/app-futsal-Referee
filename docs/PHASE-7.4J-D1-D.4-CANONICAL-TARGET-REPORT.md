# PHASE 7.4J-D1-D.4 - CANONICAL TARGET RECONCILIATION

## Phase
PHASE 7.4J-D1-D.4

## Canonical baseline path
production-schema.sql

## Canonical baseline hash
b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1

## Canonical inventory derived directly from SQL

```json
{
  "tables": 27,
  "columns": 249,
  "primary_keys": 27,
  "unique_constraints": 7,
  "check_constraints": 3,
  "foreign_keys": 30,
  "functions": 47,
  "procedures": 0,
  "views": 3,
  "materialized_views": 0,
  "triggers": 22,
  "rls_policies": 86,
  "indexes": 47,
  "extensions": 7,
  "enum_types": 2,
  "schemas": 0
}
```

## Previously reported inventory
The established assertion was 27 tables, 249 columns, 27 primary keys, 7 unique constraints, 3 check constraints, 30 foreign keys, 47 functions, 0 procedures, 3 views, 0 materialized views, 22 triggers, 86 RLS policies, 47 indexes, 7 extensions, 2 enum types, and 0 schemas.

## Object-level differences
Every established count is reproduced directly from the canonical SQL. The D1-D.3 non-production snapshot differs because it contains only 14 tables, 119 columns, 20 functions, 1 view, 8 triggers, 11 indexes, 14 foreign keys, and 32 policies. That is a target-state difference, not canonical SQL drift.

## Events validation
PASS. public.events contains deleted_at and kabupaten_kota_id.

## Duplicate function validation
PASS. public.check_duplicate_event(text,text,text) RETURNS boolean is present exactly once. No five-argument duplicate-search function is present.

## Dependency reconciliation
The dependency graph source hash matches the canonical hash. It contains 351 records: 282 resolved, 47 unresolved static function-body markers, 22 external-managed records, and 0 not-exposed records. Its 30/30 FK claim matches the canonical SQL. Overloaded functions retain full identity arguments.

## Historical artifact analysis
D1-D.3 used the fresh non-production snapshot at tmp/PHASE-7.4J-D1-D.3-NONPROD-SNAPSHOT.sql. Its incomplete counts caused the blocker. The canonical baseline and dependency artifacts are generated from the current canonical source and match its hash. No baseline or historical artifact was modified.

## Root cause
The blocker was an incorrect comparison context: an incomplete non-production schema was treated as a canonical-target consistency failure. The canonical target assertions are deterministically derived from the authoritative SQL.

## Decision
PASS — CANONICAL TARGET RECONCILED

## Safety counters
```text
PRODUCTION_ACCESS = NO
PRODUCTION_QUERY = 0
PRODUCTION_MUTATION = 0
DATABASE_MUTATION = 0
MIGRATION_EXECUTION = 0
RESET = 0
REBUILD = 0
SEED = 0
AUTH_MUTATION = 0
STORAGE_MUTATION = 0
RLS_MUTATION = 0
APPLICATION_IMPLEMENTATION = 0
```
