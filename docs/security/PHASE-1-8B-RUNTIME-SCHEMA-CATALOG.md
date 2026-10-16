# Phase 1.8B Runtime Schema Catalog

## Status

**PASS for schema-only catalog recovery.** The linked public schema was exported read-only to a temporary file outside the repository. No catalog values below are inferred from local migrations.

## Project / connection

| Field | Evidence |
| --- | --- |
| Project | `AFP SULSEL` |
| Ref | `xfscfjwapwnkiinkgbjg` |
| URL | `https://xfscfjwapwnkiinkgbjg.supabase.co` |
| Database host | `db.xfscfjwapwnkiinkgbjg.supabase.co` |
| Region | `ap-southeast-2` |
| Status | `ACTIVE_HEALTHY` |
| PostgreSQL | `17.6.1.063` |
| CLI | `2.67.1` |
| Connection mode | linked Supabase CLI; remote migration metadata connection succeeded |
| Environment | `UNKNOWN — owner confirmation required` |

## Read-only channels attempted

1. Supabase CLI project listing: PASS.
2. Supabase CLI linked migration listing: PASS; 55 local versions had empty remote values.
3. Supabase CLI schema-only public dump: PASS. Exact image `public.ecr.aws/supabase/postgres:17.6.1.063`; dump size 113,595 bytes; no data dump.
4. Direct PostgreSQL catalog: not attempted because no database password was exposed and credentials must not be requested or printed.
5. SQL/API metadata: not available through an authorized read-only channel in this workspace.

## Runtime object counts

Runtime counts: 27 public tables, 3 public views, 47 public functions, 86 public policies, and 27 public tables with RLS enabled. The dump contains the `app_role` and `pengurus_level` enums. The schema-only dump contained no table data.

The dump also shows broad table ACLs: public tables are granted `ALL` to `anon`, `authenticated`, and `service_role`, with matching default privileges for tables, sequences, and functions. RLS is therefore the critical compensating boundary and requires behavioral testing.

## Safety result

No `CREATE`, `ALTER`, `DROP`, DML, grant, revoke, migration, reset, seed, fixture, role, policy, function, trigger, or auth configuration operation was executed.
