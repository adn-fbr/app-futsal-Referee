# PHASE 7.4J-D0.9 — NON-PRODUCTION RECONSTRUCTION SPECIFICATION

STATUS: BLOCKED; DESIGN AND EVIDENCE ONLY

## Boundary

- Non-production target: `shorsqyycpptxcutrqrb`.
- Production: `xfscfjwapwnkiinkgbjg`.
- Canonical baseline: `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.
- D0.8 remote dump: `15bd39c8b6d0c7abb76177ea694bf7c4f8cfa2dc07a9c6dcce59732e731a3814`.
- D0.8 evidence hash: `8769bb1e880726f1c21f34ce7803dd7186f5ce5450a3cc9b44c3ac9dcf63628c`.

## Desired target

Reconstruct the verified canonical Production application structure in non-production without Production data: 27 public tables, 249 columns, 27 primary keys, 7 unique constraints, 3 checks, 30 foreign keys, 47 functions, 47 indexes, 3 views, 22 triggers, 86 RLS policies, 7 extensions, 2 public enum types.

The remote state is materially partial: 6 public tables, 48 columns, 3 public functions, 1 view, 4 triggers, 23 policies, zero observed application rows in existing tables, zero Storage buckets, and 4 remote migration versions versus 55 local files.

## External boundary

`auth.users` and Supabase-managed Auth/Storage internals remain externally managed. No Auth DDL or Production Auth data belongs in this specification.

## Events target

`public.events` must contain the canonical 14 columns, including `deleted_at` and `kabupaten_kota_id`; the latter references `public.kabupaten_kota(id)`. The remote absence is `REMOTE_NONPROD_DRIFT`, not a Production gap. The canonical function `public.check_duplicate_event(text,text,text) RETURNS boolean` remains unchanged. Rich duplicate search is a separate future object and remains TBD.

## Method decision

Recommended design: **OPTION A — CANONICAL BASELINE RECONSTRUCTION**, with a hybrid compatibility review for future migrations. Do not execute it in D0.9. The canonical baseline is the only deterministic schema source; the 55 migrations are historical evidence and cannot be blindly replayed.

## Blocking conditions

Data provenance is not fully established, Auth/Storage fixture policy is not approved, three migration conflicts remain unresolved, and no rollback approval exists. Therefore D1 remains blocked.