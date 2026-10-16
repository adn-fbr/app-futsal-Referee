# Canonical Non-Production Baseline

## Decision

The reviewed non-production baseline is the schema-only artifact
`CANONICAL-RUNTIME-BASELINE.sql`. It is selected as a complete schema snapshot,
not as a replay of the historical migration directory.

Evidence:

- `CANONICAL-RUNTIME-BASELINE-MANIFEST.json` identifies `production-schema.sql`
  as the source and records matching SHA-256 `b77c6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.
- `CANONICAL-RUNTIME-BASELINE-REPORT.md` records matching catalog counts and
  function identities.
- The artifact is schema-only and records zero DML operations.
- No production connection or execution is required to use this artifact.

The historical migration chain is not authoritative because it contains both a
legacy incremental schema and a later full pg-dump snapshot with overlapping
object definitions.

## Boundary

The baseline boundary is the artifact generated at `2026-09-07T10:35:27.518Z`.
Forward work begins after that boundary with migrations dated `20260908` and
later, subject to the classifications below. The January migration history is
not replayed before or after the baseline.

The baseline represents application schema objects and required extension
declarations present in the approved schema artifact. Supabase-managed runtime
objects such as Realtime, PostgREST, pgBouncer, and pg_graphql are not treated
as application objects. The artifact explicitly declares `supabase_vault`, but
Vault secret inspection and secret creation remain out of scope for this phase.

## app_role resolution

`20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql` defines
`public.app_role` as `admin, referee` and immediately makes it a dependency of
the legacy `user_roles` table and `has_role` function.

`20260103165842_remix_migration_from_pg_dump.sql` defines the same type as
`admin_provinsi, admin_kab_kota, panitia, wasit, evaluator` and uses it in the
regional authorization functions and application tables.

The definitions are different and semantically incompatible. The canonical
five-value definition is selected because it is present in the approved
runtime baseline and current application authorization contracts. Neither
historical migration is modified.

## Object coverage

The selected artifact records:

- 27 tables and 249 columns
- 27 primary keys, 7 unique constraints, 3 check constraints, 30 foreign keys
- 47 functions, 3 views, 22 triggers, 47 indexes
- 86 RLS policies and 27 RLS-enabled tables
- 7 extensions and 2 enum types

Definitions not proven by the selected artifact or the inspected migration
history remain `UNRESOLVED`; no replacement definitions are invented here.

## Migration classification

| Migration or artifact | Classification | Reason |
| --- | --- | --- |
| `20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql` | CONFLICTING | Legacy `app_role` and overlapping application schema; cannot replay with the selected baseline. |
| `20260103165842_remix_migration_from_pg_dump.sql` | CONFLICTING | Full dump recreates `app_role` and overlapping objects already represented by the selected baseline. |
| `20260103052405` through `20260121161308` | SUPERSEDED | January history is covered by the later complete baseline and is not replayed. |
| `20260906063833_phase_1_4_public_settings_boundary.sql` | SUPERSEDED | Dated before the baseline boundary and represented by the approved runtime snapshot. |
| `20260908120844_phase_8_5f_duplicate_event_contract.sql` | FORWARD | Dated after the baseline boundary; replay must be validated independently. |
| `20260908184851_phase_8_5g_2_regional_rls_authorization.sql` | FORWARD | Dated after the baseline boundary; replay must be validated independently. |
| `20260909120000_phase_8_9_assignment_state_machine.sql` | FORWARD | Dated after the baseline boundary; replay must be validated independently. |
| `20260909140000_phase_8_11_official_document_contract.sql` | FORWARD | Dated after the baseline boundary; replay must be validated independently. |
| `20260917000000_whatsapp_settings_security.sql` | UNKNOWN | Post-boundary proposal; requires separate security and schema validation before replay. |
| `CANONICAL-RUNTIME-BASELINE.sql` | BASELINE | Selected complete schema snapshot and replay source. |
| `production-schema.sql` | BASELINE | Byte-identical read-only evidence source for the selected baseline. |

The forward chain is intentionally not applied until the clean baseline has
passed catalog validation. A migration that recreates an object established by
the baseline must be reclassified as `CONFLICTING`, not patched silently.

## Safety gate

- Production project `xfscfjwapwnkiinkgbjg` is not contacted.
- Test/local project context remains `shorsqyycpptxcutrqrb`.
- Historical migrations remain unchanged.
- Vault is not inspected or modified.
- WhatsApp credentials are not created, tested, or modified.
- The unrelated `futsal_os` containers and volume are excluded.