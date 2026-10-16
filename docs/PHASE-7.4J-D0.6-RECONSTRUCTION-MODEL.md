# PHASE 7.4J-D0.6 Reconstruction Model

STATUS: PROPOSED ONLY; NOT AUTHORIZED FOR EXECUTION

## Layer A — Canonical schema

Reproduce only the verified offline canonical contract represented by `production-schema.sql` and hash `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`: tables, columns, constraints, foreign keys, 47 functions, 47 indexes, 86 RLS policies, 22 triggers, 3 views, and 7 extensions. `events.deleted_at` and `events.kabupaten_kota_id` are required contract fields.

## Layer B — External managed objects

Supabase Auth owns `auth.users` and related internal objects. Do not fabricate internal definitions. Local test identities, profiles, and roles require a separate non-production authorization and fixture plan.

## Layer C — Application seed

Only deterministic non-production seed data may be considered. The repository's seed function and synthetic fixtures are candidates/specifications, not executed data. No Production data may be copied.

## Layer D — Test-only objects

Security fixtures and rich duplicate-search behavior remain outside the canonical Production contract unless separately approved and isolated. Test objects must not alter canonical function identities or RLS semantics.

## Layer E — Migration compatibility

Exclude the broad historical pg_dump replay and the conflicting historical `check_duplicate_event` migration from a clean canonical set. Treat the later events-column migration as a candidate requiring per-file validation and target-state proof. No migration execution is authorized by D0.6.