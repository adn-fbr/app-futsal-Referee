# Phase 1.6 Migration Forensic Analysis

## Scope and safety

Analysis is repository-only. No production connection, schema change, fixture, or credential was used. Historical migrations are unchanged.

## Conclusion

The repository is **Scenario C: multiple partially overlapping schema histories**.

Evidence:

- `20260103052354_...sql` is an incremental application migration. It creates a legacy `app_role` enum with `admin` and `referee`, plus `profiles`, `user_roles`, `events`, `honors`, and `event_assignments`.
- `20260103165842_remix_migration_from_pg_dump.sql` is a large schema snapshot. It creates `app_role` again, with `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, and `evaluator`, plus `pengurus_level`, approximately 30 functions, 11 tables, views, triggers, constraints, policies, and extension declarations.
- Migrations after the dump continue to modify both lines: they add enum values, replace functions, create/drop policies and views, add columns, and introduce additional domain tables.
- Therefore the dump is neither a safe first baseline nor a safe additive migration at its current position.

## Ordered migration timeline

All 55 SQL migrations under `supabase/migrations` were inspected in filename/timestamp order. The following timeline groups the changes by migration purpose while retaining the exact ordered filenames.

| Timestamped migration | Observed purpose and security effect |
| --- | --- |
| `20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql` | Legacy base: enum, core referee tables, role helper, signup/timestamp triggers, RLS and policies. |
| `20260103052405_96efd0d5-5f73-4e7e-a145-cf40e54556d9.sql` | Timestamp function adjustment. |
| `20260103055754_10f10d2a-7d9a-499e-988e-afc111bb4fc8.sql` | Referee reviews table and policies. |
| `20260103055804_66ea3bd3-8485-4973-8291-1e8c8a99d0df.sql` | Review-statistics view replacement. |
| `20260103165842_remix_migration_from_pg_dump.sql` | Full pg-dump snapshot: extensions, canonical role enum, second enum, functions, tables, views, triggers, constraints and policies. This is the first fresh-database blocker. |
| `20260103170216_e64f24e9-e592-4b75-9152-0c1a6a7bc439.sql` through `20260103205635_2634c533-5f86-4be5-8934-9bc4a6c20eb4.sql` | Function, policy, evaluation, and event schema follow-ups. |
| `20260105061345_460903f9-d740-4e56-a20d-f172e0192ad0.sql` through `20260106101221_da11672c-1089-437b-a531-039ab7fcb4c4.sql` | Learning, assignment, event column, and policy changes. |
| `20260107110651_ec7bd1e8-a2db-4e16-899f-1814b09adb1e.sql` through `20260108031510_df043706-8d60-4d9d-ae91-276bd92b0d8d.sql` | Repeated event-policy corrections, profile/roles changes, public referee/settings views and settings seed data. |
| `20260109135736_aeaa0919-8d0d-4c00-9d8f-5120d76707f5.sql` through `20260110163739_f1c60778-cd83-4c3b-98e4-476ad61300ff.sql` | Function replacements, event/user-role changes, regional tables, evaluation policy normalization, role expansion, and timestamp functions. |
| `20260111102857_cb4d72a9-78b7-46bd-8128-adeb285a37f0.sql` through `20260111120910_afe1e208-1031-49d5-af53-84a0bf3a45fb.sql` | Policy tightening, constraint changes, settings seed, pengurus policies, notifications and preferences. |
| `20260118113128_8bd9aa53-62f1-4874-856a-0764c62c6574.sql` | Referee cards. |
| `20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql` through `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` | Auth/card logs, policy hardening, role data update, card functions, and referee search functions. |
| `20260906063833_phase_1_4_public_settings_boundary.sql` | Removes broad settings policies and exposes only a filtered security-invoker public settings view. Not applied because initialization is blocked. |

## Object ownership and conflicts

| Object class | First creator | Conflicting/repeated definitions | Risk | Recommended resolution |
| --- | --- | --- | --- | --- |
| `public.app_role` | `20260103052354...` | `20260103165842...` creates it again; `20260110162403...` adds values | Guaranteed SQLSTATE 42710 on fresh replay; semantic role drift | Select one verified canonical snapshot and generate a new non-production baseline. |
| `public.pengurus_level` | `20260103165842...` | Recreated/guarded in later regional migrations | Duplicate type or incompatible enum history | Include exactly once in reviewed baseline. |
| Core tables `profiles`, `user_roles`, `events`, `honors`, `event_assignments` | `20260103052354...` | Dump creates overlapping definitions; later migrations alter columns/constraints | Table exists or incompatible definition errors | Reconcile definitions before baseline publication. |
| Regional tables `provinsi`, `kabupaten_kota`, `pengurus` | Dump | Later migrations use/create/alter them | Dependency and foreign-key ordering risk | Baseline must include complete dependency order. |
| Functions `has_role`, `handle_new_user`, `update_updated_at_column` | Legacy base | Dump defines them again; later files replace/drop/recreate signatures | Function body/signature drift and trigger dependency failures | Inventory signatures, then retain one current definition. |
| Reporting/access functions | Dump | `20260103170216...`, `20260109135736...`, `20260110105128...`, `20260110121757...` and later files replace/drop them | Policy callers may resolve to different semantics | Freeze current definitions in reviewed baseline. |
| Views `active_*`, `public_referees`, review statistics | Early review migration and dump | Later files drop/recreate views | View dependency and RLS/security-invoker drift | Recreate in dependency order with explicit security mode. |
| Triggers | Legacy base and dump | Later trigger migrations add or replace signup/timestamp/card triggers | Duplicate trigger names or duplicate side effects | One trigger per intended event in baseline. |
| Policies | Legacy base and dump | Many later migrations repeatedly drop/create same policy names | Fresh replay reaches duplicate policies or policy semantics diverge | Baseline final policy set only after review; retain RLS. |
| Constraints/indexes | Base and dump | Later migrations add/drop/rename checks and indexes | Duplicate names or incompatible checks | Compare final catalog definitions before publication. |
| `public.system_settings` | `20260107202318...` and another guarded create later | Seed migrations and Phase 1.4 boundary modify access | Secret exposure if broad policy survives | Apply filtered view/policy only after baseline is operational. |
| Extensions | Dump and standard Supabase setup | Multiple `CREATE EXTENSION IF NOT EXISTS` declarations | Usually idempotent, but extension availability differs | Validate against target Supabase image/project. |

## Dependency graph

```text
app_role / pengurus_level
  -> user_roles, profiles, regional tables
  -> has_role and regional authorization functions
  -> policies on profiles, events, assignments, settings
  -> Edge Function resource checks and RLS tests

profiles + regional tables
  -> events / assignments / honors / notifications / reports
  -> tenant and resource authorization

system_settings
  -> public settings view and server-only email configuration
```

## Fresh initialization evidence

The local CLI reached the migration runner, then failed at `20260103165842_remix_migration_from_pg_dump.sql` on duplicate `public.app_role`. The local stack was removed; no usable database remained. A later corrective migration cannot run before this failure.

## Forensic decision

The smallest safe decision is to approve a reviewed explicit non-production baseline generated from a known-good schema, with a documented migration boundary. Until the canonical schema source and boundary are approved, implementing a baseline would be guesswork and could produce a test schema unlike production.
