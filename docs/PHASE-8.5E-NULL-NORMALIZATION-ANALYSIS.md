# Phase 8.5E NULL and Normalization Analysis

## NULL

The canonical body uses ordinary SQL equality:

```sql
kota_id::text = p_kota_id
AND location = p_location
AND name = p_name
```

A NULL input does not match a NULL stored value because `NULL = NULL` is UNKNOWN. A NULL `events.kabupaten_kota_id` cannot produce a canonical match under the shown body. Empty string is distinct from NULL. The canonical definition does not state whether NULL region means unknown, unrestricted, invalid, or excluded from duplicate matching.

The table schema permits nullable `events.kabupaten_kota_id` and nullable `location`; `name` and `date` are required. Schema permissiveness does not establish business duplicate semantics or whether historical events may omit region in accepted workflows.

## Normalization

Canonical matching is exact and provides no LOWER, TRIM, whitespace folding, punctuation handling, Unicode normalization, abbreviation handling, ILIKE, or trigram similarity. The historical migration applies LOWER, LIKE, date proximity, and similarity scores, but it is conflicting historical evidence rather than canonical authority.

No normalization rule can be selected without an explicit business/database decision.
