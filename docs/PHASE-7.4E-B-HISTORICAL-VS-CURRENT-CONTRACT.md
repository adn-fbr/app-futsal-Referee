# PHASE-7.4E-B Historical vs Current Contract

Version: v1.0.0

| Aspect | Historical migration | Current application | Current Production canonical |
| --- | --- | --- | --- |
| Function identity | `check_duplicate_event(p_name text, p_date date, p_location text, p_kabupaten_kota_id text, p_exclude_event_id text)` | Calls same five named arguments | `public.check_duplicate_event(p_kota_id text, p_location text, p_name text)` |
| Return | TABLE rows with six fields | Expects rows, casts to `DuplicateEvent[]` | `boolean` |
| Name matching | Lowercase exact/contains | Uses duplicate warning from returned rows | Exact name equality |
| Date matching | Exact and proximity | Sends formatted event date | No date argument |
| Location | Optional lowercase exact | Sends optional location | Exact location equality |
| Region | Optional event region filter | Sends optional kabupaten/kota id | Uses `kota_id` text argument |
| Exclusion | Optional current event exclusion | Sends route event id during edit | None |
| Score | Fixed CASE values 100/90/80/70/60/50 | Uses `similarity_score` in DTO/UI | None |
| Ordering | Score descending, date descending | Consumes first duplicate name | None beyond boolean |
| Limit | 5 rows | Array behavior | No row result |

## Compatible evidence

Both contracts concern duplicate event detection and reference event identity fields. The canonical function may remain as the separate existence responsibility.

## Incompatible evidence

Argument count, argument meaning, date/region/exclusion behavior, result cardinality, scoring, ordering, limit, and return type differ. No codebase evidence proves a lossless transformation.

## Status

Historical contract: CONFIRMED historical evidence.

Application contract: CONFIRMED current source behavior.

Production canonical: CONFIRMED immutable baseline.

Contract conflict: YES.
