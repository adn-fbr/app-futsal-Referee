# PHASE 7.4J-D0.1 Events Schema Resolution

`events.deleted_at` and `events.kabupaten_kota_id` are required by current application code and generated types, present in offline canonical baseline, and sourced by later migration `20260110162455_98e87d41-5e63-4dba-9290-9fb5f39f3a12.sql`.

Target runtime previously reported both missing. Classification: **CANONICAL-COMPATIBLE CANDIDATE / TARGET STATE UNRESOLVED**.

They must not be added to Production; reconstruction must establish them only in an approved non-Production rebuild.
