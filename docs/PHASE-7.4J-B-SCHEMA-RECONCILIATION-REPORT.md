# PHASE 7.4J-B Non-Production Schema Reconciliation

## Status

**BLOCKED — RECONCILIATION ONLY**

No SQL mutation, migration execution, database repair, Production access, or application implementation was performed in this phase.

## Environment

- Non-Production project: `shorsqyycpptxcutrqrb`
- CLI target: `shorsqyycpptxcutrqrb`
- Production project: `xfscfjwapwnkiinkgbjg` (not selected)
- Contract hash: `7ccbcced5b3ebfd74b5eb4e60c6c89c8f878a4a1162f312c51121ad6a7ed4bc6`

## Evidence

The target migration history records only the first four local migrations. The local repository contains many later migrations, including the migration that introduces the complete events shape and the historical duplicate-search evidence. The target schema previously reported by Phase 7.4J lacks `events.deleted_at` and `events.kabupaten_kota_id`.

The offline canonical baseline and `production-schema.sql` contain both columns. Application code and generated types also reference both columns extensively.

A read-only `supabase db dump --linked --schema public` was attempted and failed before producing a dump because the local Docker container runtime could not stat the overlay filesystem. Runtime catalog and data status are therefore not independently reverified in this phase.

## Classification

- Root cause: **MULTIPLE_CAUSES**
- Schema state: **DRIFTED / PARTIAL**
- Migration history: **INCONSISTENT**
- Generated types: **DRIFTED AGAINST TARGET RUNTIME; ALIGNED TO CANONICAL EXPECTATION**
- Data status: **UNKNOWN**
- Recommended path: **REBUILD_RECOMMENDED**

Rebuild is recommended only after an explicit non-Production data/seed/auth/storage impact review. No rebuild is executed here.

## Final Decision

**REBUILD_RECOMMENDED** before Phase 7.4J implementation. The existing target is not a safe deterministic base for repair-by-metadata or feature implementation.
