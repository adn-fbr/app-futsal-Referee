# PHASE 8.8A — LIVE RLS CROSS-REGION VALIDATION & DASHBOARD KPI FOUNDATION

## STATUS

PARTIAL — local KPI foundation implemented; live RLS and cross-region validation remain blocked without approved Non-Production fixtures.

## IMPLEMENTED

- Shared current-year and Asia/Makassar time semantics preserved from Phase 8.7.
- Dashboard KPI cards for Total Event, Disetujui, Selesai, Pending, Hari Ini, Mendatang, Bulan Ini were added in [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx).
- KPI aggregation logic lives in [src/lib/dashboardKpis.ts](../src/lib/dashboardKpis.ts).
- Event list supports filtering by status and kabupaten/kota via query parameters to align dashboard action links with the list.
- Regression tests covering dashboard KPI logic were added in [src/test/phase-8-8a-dashboard-kpi.test.ts](../src/test/phase-8-8a-dashboard-kpi.test.ts).

## BLOCKED

Live non-production RLS validation remains blocked because the required official Auth fixtures were not available in this workspace. The repository also does not contain approved Non-Production identities for `ADMIN_PROVINSI`, `ADMIN_KAB_KOTA_A`, `ADMIN_KAB_KOTA_B`, `EVENT_REGION_A`, and `EVENT_REGION_B`.

Because of this, the following cannot be honestly marked PASS:

- Live RLS validation
- Cross-region leakage proof
- Admin Provinsi live scope validation
- Admin Kab/Kota live scope validation
- Direct route or API bypass validation

## SAFETY

- No Production project ID / production runtime URL was introduced.
- No service-role or secret values were added to the frontend.
- No schema/RLS changes were made as part of this patch.

## VERIFICATION

- TypeScript: PASS
- Build: PASS
- Tests: PASS (45/45)
- Lint: BASELINE FAIL (68 errors / 12 warnings)
- Live RLS: BLOCKED
