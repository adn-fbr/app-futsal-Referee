# Phase 7.4J-D0.2 Migration Conflict Matrix

| Migration | Object | Classification | Resolution |
|---|---|---|---|
| `20260103165842_remix_migration_from_pg_dump.sql` | Broad schema, `app_role`, events | Historical/partial migration | Isolate; no blind replay |
| `20260110162455_98e87d41-5e63-4dba-9290-9fb5f39f3a12.sql` | `events.deleted_at`, `events.kabupaten_kota_id` | Canonical-compatible candidate; target partial migration | Candidate only for clean non-Production reconstruction |
| `20260121161308_170f4f14-a4bb-494b-ac16-77f99251a8c4.sql` | `check_duplicate_event` | Production conflict; historical non-Production | Exclude; canonical function remains untouched |

Material conflicts: **3**. No migration was modified or executed.
