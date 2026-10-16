# PHASE 7.4J-D0.6 Events Schema Readiness

STATUS: EVENTS_RECONSTRUCTION_BLOCKED

## Canonical contract

The offline canonical baseline establishes `public.events` as part of the Production contract. It includes `deleted_at` and `kabupaten_kota_id`; `kabupaten_kota_id` references `kabupaten_kota.id`. The canonical contract must also preserve the table's types, defaults, primary/foreign keys, indexes, triggers, and RLS policies.

## Migration evidence

`20260110162455_98e87d41-5e63-4dba-9290-9fb5f39f3a12.sql` is a candidate for the two events columns but is not approved for blind replay. The target runtime is absent, so current local columns, constraints, indexes, triggers, and policies cannot be verified.

## Classification

`EVENTS_RECONSTRUCTION_BLOCKED`.

No events table was altered. `kabupaten_kota_id` is not classified as a Production schema gap.