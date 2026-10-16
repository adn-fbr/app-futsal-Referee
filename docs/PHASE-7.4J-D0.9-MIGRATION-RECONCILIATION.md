# PHASE 7.4J-D0.9 Migration Reconciliation

Status: **BLOCKED; PLAN ONLY**.

The repository has 55 migration files while remote history contains 4 applied versions. The first four align with remote history; the remaining 51 are not an approved canonical replay set. D0.6 remains the authoritative per-file inventory.

## Classification

- Canonical: none promoted automatically.
- Compatible candidate: the events-column migration `20260110162455...` only after governance review.
- Historical: broad pg_dump replay `20260103165842...`.
- Conflicting: the three material conflict records.
- Unknown/review required: all remaining files until compared to the frozen baseline.

## Dispositions

Isolate the broad historical replay, governance-review the Events-column candidate, and reject the conflicting historical duplicate-function migration. Do not edit, delete, reorder, repair, or mark any migration applied in D0.9.