# PHASE-7.4E-B Contract Matrix

Version: v1.0.0

## Argument contract

| Position | Expression | Source | Type/runtime | Meaning | Optional/default | Normalization/validation | Confidence |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `p_name: name` | EventEdit form `eventName` -> mutation input | string | Event name for name comparison | Required; no default | `trim()` used only for precheck; value sent unchanged | CONFIRMED |
| 2 | `p_date: date` | EventEdit `format(startDate, "yyyy-MM-dd")` | string/date-shaped | Event date for exact/proximity matching | Required at caller | Date formatted before RPC | CONFIRMED |
| 3 | `p_location: location || null` | EventEdit form location | string or null | Optional location comparison | Nullable; null default | Empty/absent value becomes null | CONFIRMED |
| 4 | `p_kabupaten_kota_id: kabupatenKotaId || null` | EventEdit selected region | string or null | Optional regional filter | Nullable; null default | Empty/absent value becomes null | CONFIRMED |
| 5 | `p_exclude_event_id: excludeEventId || null` | Route `eventId` | string or null | Excludes current event during edit | Nullable; null default | Empty/absent value becomes null | CONFIRMED |

## Return contract

| Field | TypeScript type | PostgreSQL type | Use | Required/nullable | Confidence |
| --- | --- | --- | --- | --- | --- |
| `id` | string | text in historical SQL | Present in duplicate row; not rendered directly | Required in historical row | CONFIRMED |
| `name` | string | text | First duplicate name is shown in warning | Required in historical row | CONFIRMED |
| `date` | string | text in historical SQL | Present; not rendered by current caller | Required in historical row | CONFIRMED |
| `location` | string | text | Present; not rendered by current caller | Historical SQL does not guarantee nullability | CONFIRMED |
| `status` | string | text | Present; not rendered by current caller | Required in historical row | CONFIRMED |
| `similarity_score` | number | integer in historical SQL | Displayed by DuplicateEventDialog when supplied elsewhere | Required in historical row | CONFIRMED |
| `isDuplicate` | boolean | Application-derived | True when duplicate array length is greater than zero | Required wrapper field | CONFIRMED |
| `duplicates` | DuplicateEvent[] | Application-derived | Array consumed for length and first name | Empty array on nullish data | CONFIRMED |

## Matching field matrix

| Field | Exact | Normalized | Fuzzy | Range | Weighted | Ignored | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| name | Historical first/second/fifth CASE branches | `LOWER` | Contains/contains reverse | No | Score branches | No | Historical migration |
| date | Historical exact-date branch | No | No | Within 3/7 days | Score branches | No | Historical migration |
| location | Exact when supplied | `LOWER` | No | No | Affects top score | No | Historical migration |
| kabupaten_kota_id | Equality filter | No | No | No | Filter, not score | No | Historical migration |
| exclude_event_id | Not applicable | No | No | No | Exclusion filter | No | Historical migration |
| status/deleted_at | Exclude rejected/deleted candidates | No | No | No | No | No | Historical migration |

Algorithm, threshold policy, ordering approval, and pagination remain separate governance questions.
