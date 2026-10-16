# Phase 1.8 Actual Schema Inventory

## Audit status

**PARTIAL / BLOCKED**. The linked Supabase project was verified through the authenticated CLI, but a schema-only `pg_dump` is still unavailable because the CLI is downloading the PostgreSQL 17.6 image. No write operation was executed.

## Project metadata

| Field | Verified value |
| --- | --- |
| Project ref | `xfscfjwapwnkiinkgbjg` |
| Project name | `AFP SULSEL` |
| Project status | `ACTIVE_HEALTHY` |
| Region | `ap-southeast-2` |
| PostgreSQL engine | 17 |
| PostgreSQL version | `17.6.1.063` |
| Environment classification | UNKNOWN; project is linked and active, but no authoritative production/staging label was available |
| Production safety | No writes, migrations, fixtures, or data changes performed |

## Runtime catalog status

The CLI connected to the remote database for migration metadata. `supabase migration list --linked` showed all 55 local migration versions with an empty Remote column. This indicates migration-ledger drift or an unrecorded schema lineage; it does not prove the database is empty.

The schema-only public dump was requested to a temporary path outside the repository. At audit capture time it had not completed, so actual table/column/constraint/RLS/function catalog values are **BLOCKED**, not inferred from local files.

## Static application inventory

The generated Supabase contract and application access code reference: `audit_logs`, `auth_event_logs`, `card_verification_logs`, `discussion_replies`, `discussion_topics`, `evaluation_criteria`, `evaluation_scores`, `evaluations`, `event_approvals`, `event_assignments`, `events`, `honors`, `kabupaten_kota`, `learning_materials`, `learning_progress`, `notification_preferences`, `notifications`, `pengurus`, `profiles`, `provinsi`, `referee_cards`, `referee_reviews`, `system_settings`, and `user_roles`.

These are application expectations, not verified production catalog facts.

## Required runtime inventory

Once a read-only catalog dump is available, record for every public object: schema/name, object type, columns/types/nullability/defaults, generated/identity columns, PK/FK/unique/check constraints, indexes, RLS flags, policy definitions, functions/owners/search paths/EXECUTE privileges, views/security-invoker mode, triggers, grants, and extensions.

## Preliminary risk

Because the remote migration ledger is empty while the project is active, the connected schema cannot yet be treated as reproducible from repository migrations. Do not run `db pull`, `db push`, migration repair, or any write operation during this forensic phase.
