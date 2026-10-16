# Technical Debt

## P1

- No general domain repository/service layer; direct Supabase access is spread across hooks/pages.
- Canonical RPC mismatch for `check_duplicate_event`.
- Schema gaps for `increment_view_count` and `public_system_settings`.
- Event assignment cache/query contract fragmented across hooks.
- Browser/RLS/mutation test harness and approved fixtures absent.
- Lint baseline fails with 66 errors/11 warnings across 41 files.

## P2

- Route/page/component governance inventories are stale or inconsistent.
- Many `any`/unsafe casts and shared UI lint warnings.
- Repeated async/error/table/dialog patterns.
- No browser harness; no standard viewport/accessibility gate.
- Privileged Edge Function behavior lacks comprehensive integration coverage.
- Potential unbounded list reads and large bundle warning require measurement.

## P3

- Orphan page files: Bookings, Courts, Teams, Index.
- Static organization/header values.
- Repeated design-system variants and raw table markup.
- README remains generic Lovable scaffolding rather than operational project documentation.

## Resolved but retained risk

F-007 seed UI exposure was removed from the production page and bundle, but `useSeedDatabase` and the Edge Function remain as controlled tooling/capability. Treat as a separate environment/function-governance item, not as resolved deletion.
