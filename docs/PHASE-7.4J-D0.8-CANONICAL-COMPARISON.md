# PHASE 7.4J-D0.8 Canonical Comparison

Canonical offline Production baseline: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.

## Classification

- MATCH: non-production project identity; Auth-managed boundary exists; several early objects such as `events`, `profiles`, `user_roles`, and basic RLS exist.
- MISSING: at least 21 canonical public tables, `events.deleted_at`, `events.kabupaten_kota_id`, canonical duplicate function, rich application functions, views, triggers, indexes, and policies not represented in the six-table remote application schema.
- EXTRA: managed `auth` and `storage` objects are environment-managed and are not application-schema extras.
- DRIFTED: `events` shape, `profiles` shape, migration ledger, function set, public table set, RLS/policy set, and Storage bucket state.
- UNKNOWN: complete extension inventory, exact complete function security attributes, and object-by-object comparison for absent schema objects.

Byte equality is not required for the test project; the observed remote state is materially incomplete relative to the canonical contract.