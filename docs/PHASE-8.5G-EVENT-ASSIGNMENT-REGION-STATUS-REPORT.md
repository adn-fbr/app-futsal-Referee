# Phase 8.5G - Event Assignment Region & Status

## Result

**PARTIAL - EVENT ASSIGNMENT REGION & STATUS UI IMPLEMENTED, VALIDATION INCOMPLETE**

## Implemented

- Event assignment query resolves `events.kabupaten_kota_id` to canonical `kabupaten_kota.id/name`.
- Admin table and mobile cards display `DAERAH`, `LOKASI`, `WASIT`, `STATUS`, and `AKSI`.
- Missing region displays `Belum ditentukan`; free-text location is never used as a fallback.
- Region options are loaded from canonical `kabupaten_kota` and filtering compares the region UUID.
- Canonical status values remain lowercase database values: `pending`, `confirmed`, `declined`, `cancelled`.
- UI labels are Indonesian: Menunggu, Dikonfirmasi, Ditolak, Dibatalkan.
- Existing Admin Provinsi role check, `user_roles` verification, password step-up, RLS boundary, refresh/invalidation, error handling, and pending-mutation disabling are preserved.

## Governance

The existing contract authorizes only `pending -> confirmed` in this Admin Provinsi flow. The UI does not silently expand authority to decline or cancel assignments; those remain in their existing canonical flows. `CANCELED` maps to the canonical database value `cancelled`.

## Validation

Focused contract tests, the full test suite (33 tests), TypeScript, and local build results are recorded in the companion artifacts. Repository lint remains at the existing baseline failure (29 errors, 11 warnings). Live Auth/RLS/audit validation requires approved Non-Production fixtures and remains unavailable. Production project `xfscfjwapwnkiinkgbjg` was not accessed.
