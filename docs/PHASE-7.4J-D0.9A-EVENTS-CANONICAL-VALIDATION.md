# PHASE 7.4J-D0.9A Events Canonical Validation

## Canonical Production evidence

`public.events` has 14 canonical columns: `id`, `name`, `date`, `start_date`, `end_date`, `location`, `category`, `description`, `status`, `kabupaten_kota_id`, `created_by`, `deleted_at`, `created_at`, `updated_at`.

- `deleted_at`: canonically exists as `timestamp with time zone`.
- `kabupaten_kota_id`: canonically exists as `uuid`.
- FK: `events.kabupaten_kota_id -> kabupaten_kota.id` is present in the canonical dependency evidence.
- Primary key: `events_pkey`.
- Status check: canonical status values are `DIAJUKAN`, `DISETUJUI`, `DITOLAK`, `SELESAI`.
- Canonical view: `active_events`, security-invoker, filters `deleted_at IS NULL`.
- Canonical trigger: `set_updated_at_events`.
- Canonical RLS: included in the 86-policy baseline.

## Remote comparison

Remote Events has 10 columns and lacks both required fields. Remote state is **NON-PRODUCTION_DRIFT**, not a Production schema gap. Remote Events has RLS enabled and 4 policies, but not the canonical contract.

No table, column, FK, index, trigger, view, or policy was modified.