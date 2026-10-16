# PHASE 7.4J-B Production Baseline Comparison

Production was not accessed. Comparison uses offline canonical evidence only.

| Field | Production canonical baseline | Non-Production evidence | Classification |
|---|---|---|---|
| `events.deleted_at` | Present in `production-schema.sql` and baseline evidence | Missing per Phase 7.4J target evidence | Non-Production schema drift |
| `events.kabupaten_kota_id` | Present in `production-schema.sql` and baseline evidence | Missing per Phase 7.4J target evidence | Non-Production schema drift |
| `events` RLS | Enabled with policies in baseline | Runtime policy set not independently dumped | Evidence required |
| Canonical duplicate function | `public.check_duplicate_event(text,text,text) RETURNS boolean` | No change authorized | Protected |

The Production baseline is unchanged and must not be modified to repair the test environment.
