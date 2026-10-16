# PHASE 7.4J-D0 Events Schema Analysis

`events.deleted_at` and `events.kabupaten_kota_id` are required by current application code, generated types, and canonical offline schema evidence. Prior target evidence reported both missing.

- `deleted_at`: source appears in later schema/migration evolution; present in canonical baseline; required by soft-delete queries.
- `kabupaten_kota_id`: source appears in later schema/migration evolution; present in canonical baseline; required by region filters and relationships.
- Production schema change: **NOT AUTHORIZED**.
- Rebuild implication: target must be reconstructed or repaired only after deterministic migration/data analysis.
