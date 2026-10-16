# PHASE 7.4J-D0.6 Canonical Comparison

## Source

The comparison source is the offline canonical runtime baseline, not a live Production connection.

- Baseline source: `production-schema.sql`.
- Canonical hash: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.
- Source fidelity: byte-identical; catalog counts and function identities identical.
- Production query/access: **NO**.

## Baseline catalog

| Object class | Count |
|---|---:|
| Tables | 27 |
| Columns | 249 |
| Primary keys | 27 |
| Unique constraints | 7 |
| Check constraints | 3 |
| Foreign keys | 30 |
| Functions | 47 |
| Indexes | 47 |
| RLS policies | 86 |
| Triggers | 22 |
| Views | 3 |
| Extensions | 7 |

## Required contract comparison

| Contract | Canonical evidence | D0.6 state |
|---|---|---|
| `events` | Present in canonical schema | Required; local runtime unavailable |
| `events.deleted_at` | Present in offline canonical baseline and later candidate migration | Reconstruction target; local state unknown |
| `events.kabupaten_kota_id` | Present in offline canonical baseline with FK to `kabupaten_kota.id` | Reconstruction target; not a Production gap |
| Foreign keys | 30 canonical FKs | Required; local state unknown |
| Functions | 47 canonical functions | Required; migration conflict remains |
| Indexes | 47 canonical indexes | Required; local state unknown |
| RLS | 86 canonical policies | Policies identifiable offline; target runtime absent |
| Triggers | 22 canonical triggers | Required; local state unknown |
| Views | 3 canonical views | Required; local state unknown |
| Extensions | 7 canonical extensions | Required; local state unknown |
| `profiles` | Application repository reads it; canonical baseline includes table contract | Auth/profile reconstruction required |
| `user_roles` | Application repository reads it; canonical baseline includes table contract | Role reconstruction required |

The known `events.kabupaten_kota_id -> kabupaten_kota.id` relationship is treated as present in the canonical contract. No Production schema gap is asserted.