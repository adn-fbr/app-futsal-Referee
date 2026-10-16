# Phase 7.4J-D0.2 Events Schema Resolution

| Field | Production baseline | Application/types | Non-Production evidence | Resolution |
|---|---|---|---|---|
| `events.deleted_at` | Present in offline canonical schema | Required by soft-delete queries | Previously reported missing | Non-Production drift; reconstruct only in approved rebuild |
| `events.kabupaten_kota_id` | Present with FK to `kabupaten_kota.id` | Required by region filters/relationships | Previously reported missing | Non-Production drift; reconstruct only in approved rebuild |

The canonical duplicate function remains unchanged. No Production schema change is authorized.

Status: **BLOCKED** pending runtime schema verification.
