# Phase 8.5E Duplicate Semantics

## Evidence

The canonical body contains exact equality on `kota_id`, `location`, and `name`, with no date, status, deletion, normalization, or fuzzy predicate. Because `kota_id` is absent, this is an intended algorithm shape, not a validated executable business rule.

The historical migration uses case-insensitive name matching, date proximity, optional location/region filters, exclusion, status filtering, ordering, and similarity scores. That is historical application behavior and cannot be treated as canonical merely because it is richer.

## Decision

No authoritative evidence selects:

- D1: name + location + region
- D2: name + location + region + date
- D3: fuzzy name/location + date proximity
- D4: another rule

The duplicate business rule is `UNRESOLVED`. A future owner must explicitly decide whether date, status, deleted state, and region are identity dimensions.

The rich duplicate-record capability is a separate business capability gap. It is not recreated here.
