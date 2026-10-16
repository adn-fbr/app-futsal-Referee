# PHASE 7.4J-D0.8 Events Evidence

STATUS: EVENTS_SCHEMA_EVIDENCE_BLOCKED

## Actual remote state

- `public.events`: **EXISTS**.
- Column count: **10**.
- Columns: `id`, `name`, `date`, `location`, `category`, `status`, `description`, `created_by`, `created_at`, `updated_at`.
- Defaults: `id` uses `gen_random_uuid()`, `status` defaults to `upcoming`, timestamps default to `now()`.
- Constraints: primary key `events_pkey`; check constraint `events_status_check` restricts status values.
- Foreign keys: `created_by -> public.profiles.id`.
- Indexes: no explicit public events index was present in the schema dump; the primary key supplies its key constraint/index.
- Triggers: `update_events_updated_at` before update.
- RLS: enabled.
- Policies: 4, including admin insert/delete/update policies and authenticated select policy.

## Required fields

- `deleted_at`: **ABSENT**.
- `kabupaten_kota_id`: **ABSENT**.
- Production canonical relationship `kabupaten_kota_id -> kabupaten_kota.id`: remains an offline Production contract fact; it is not classified as a Production gap. The remote non-production table simply does not currently contain the field.

## Classification

Remote Events state is **DRIFTED** from the canonical contract. Reconstruction evidence is **BLOCKED** because the remote schema is incomplete and migration history is divergent. No table or column was modified.