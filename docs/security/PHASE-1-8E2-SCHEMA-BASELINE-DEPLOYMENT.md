# Phase 1.8E.2 Schema Baseline Deployment

## Status

**BLOCKED** before deployment. The target project exists and is healthy, but its database connection/schema state was not available through an approved read-only or deployment credential channel. No baseline SQL was applied.

## Verified targets

| Target | Ref | Status | PostgreSQL | Region | Use |
| --- | --- | --- | --- | --- | --- |
| Production AFP SULSEL | `xfscfjwapwnkiinkgbjg` | LIVE / ACTIVE_HEALTHY | 17.6.1.063 | ap-southeast-2 | read-only reference |
| Security test `test APP` | `shorsqyycpptxcutrqrb` | ACTIVE_HEALTHY | 17.6.1.166 | ap-south-1 | target test database |

The region difference is accepted and documented. The workspace remains linked to production; the test project is not linked.

## Baseline source

The reviewed source is the Phase 1.8B production schema-only catalog: 113,595-byte public schema dump, containing 27 public tables, 3 views, 47 functions, 41 SECURITY DEFINER functions, 86 policies, 5 `app_role` values, and RLS enabled on 27 public tables. No production rows are included.

## Deployment mechanism

After target credentials are supplied through protected configuration:

1. Verify target ref is exactly `shorsqyycpptxcutrqrb` and not production.
2. Verify target environment is non-production and database is empty/read-only inspected.
3. Review/sanitize the schema-only SQL.
4. Apply the reviewed baseline to the target only.
5. Capture target schema-only dump and compare it to the production reference.
6. Stop on any unexpected pre-existing data or object difference.

Do not replay the 55 historical migrations.

## Current blocker

The installed CLI requires a target database URL/password for `--db-url` schema inspection/deployment. No target database password, connection string, or test secret was available. The target schema and row state are therefore **UNKNOWN**, and deployment is not authorized.
