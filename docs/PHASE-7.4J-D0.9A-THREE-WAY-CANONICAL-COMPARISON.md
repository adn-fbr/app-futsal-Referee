# PHASE 7.4J-D0.9A Three-Way Canonical Comparison

Canonical source: `production-schema.sql`, baseline hash `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.

| Object | Migration | Canonical Production | Remote Non-Production | Decision |
|---|---|---|---|---|
| `public.app_role` and broad replay | broad pg_dump replay | canonical enum/objects already defined | partial early overlap; later history absent | SUPERSEDED_BY_CANONICAL_BASELINE; archive historical |
| `events.deleted_at` | candidate adds field | present canonically | absent | SUPERSEDED_BY_CANONICAL_BASELINE; reconstruct canonical target |
| `events.kabupaten_kota_id` -> `kabupaten_kota.id` | candidate adds field/FK | present canonically with FK | absent | SUPERSEDED_BY_CANONICAL_BASELINE; remote non-production drift |
| `public.check_duplicate_event(text,text,text)` | historical conflicting function migration | three-argument boolean contract | absent | SUPERSEDED_BY_CANONICAL_BASELINE; reject conflict |

The canonical Production definition has precedence in every row. No Production object was queried or changed.