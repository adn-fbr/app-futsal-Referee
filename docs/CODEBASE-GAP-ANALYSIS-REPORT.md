# CODEBASE-WIDE MODULE GAP ANALYSIS

## Executive Summary

Current inventory: 52 concrete routes, 56 pages, 33 hooks, 88 TSX components, 6 non-test repository files, 18 Edge Function directories, 9 test files/26 tests, 49 source files with direct `.from` patterns, 25 RPC occurrences, and 16 Edge Function invocations.

Status counts:

- COMPLETE: 1
- PARTIAL: 15
- DEMO: 0
- UI_ONLY: 0
- BLOCKED: 2
- BROKEN: 0 proven by static evidence
- MISSING: 1 grouped orphan-page module
- DEPRECATED: 0 confirmed

Overall maturity score: **61/100**. This is a static maturity estimate, not runtime certification.

The application is substantially implemented and connected to Supabase, but Production UAT is **NOT READY** because live Auth/RBAC/RLS/mutation/browser evidence is unavailable, several canonical contract gaps remain, and domain access is fragmented.

## P0 Findings

No newly confirmed P0 from static analysis. Production UAT remains blocked by P1 integration/contract gaps, not because the UI is absent.

## P1 Findings

- G-001: `check_duplicate_event` application contract conflicts with canonical boolean RPC.
- G-002: `increment_view_count` is absent from canonical schema.
- G-003: `public_system_settings` is historical/noncanonical.
- G-004/G-005: event assignment RLS and mutation workflow are not live-validated.
- G-006: seed UI exposure is resolved, but privileged seed Edge Function remains and needs capability governance.
- G-007: direct domain access bypasses repository boundaries.
- G-008: core workflows lack browser/RLS/integration coverage.

## P2 Findings

- Stale route/component/inventory artifacts.
- Inconsistent async/error/retry UX.
- Accessibility and responsive behavior unverified.
- Static organization data and possible data drift.
- Bundle/list performance risks not measured.

## P3 Findings

- Orphan page files and unresolved product scope.
- Design-system repetition and generic README/documentation.

## Module-by-Module Analysis

### Authentication and Identity — COMPLETE

`AuthContext`, Auth/Profile/Role repositories, session listener, persistence, and `ProtectedRoute` are implemented. Static/unit tests exist. Missing: live identity/RLS/browser proof.

### Profile — PARTIAL

Profile completion and referee profile pages exist and use real profiles data. Form/error/unsaved/mobile behavior is not comprehensively tested.

### Events and Approvals — PARTIAL

Routes, event CRUD, calendar, approval hooks, filters, and actions exist. Duplicate-event RPC caller mismatch is an open P1 contract gap; list query error/retry and browser CRUD coverage are incomplete.

### Event Assignments — BLOCKED

This is the highest-value current workflow. List/search/filter/detail, password step-up, role checks, status UI, and cache invalidation exist. Static remediation constrains direct admin mutation to `pending -> confirmed` by assignment ID. Live Non-Production RLS, unauthorized denial, before/after persistence, audit, notification, retry, and browser double-submit tests are absent.

### Referees/Cards — PARTIAL

Real profiles/RPC/card flows exist, but direct hooks, RLS, storage, card generation, and verification are not integration-tested.

### Reviews — PARTIAL

Public review routes and RPCs exist. Public error/abuse/duplicate submission and runtime contract tests are absent.

### Evaluations — PARTIAL

Forms and data hooks exist for evaluator/admin workflows. Server failure, duplicate submit, authorization, and browser tests are incomplete.

### Honors — PARTIAL

Wasit/admin surfaces and hooks exist. Persistence, verification, and notification behavior lack integration evidence.

### Learning — PARTIAL

Admin and referee material/progress pages exist. CRUD/error states and route/browser tests are incomplete.

### Discussions — BLOCKED

Pages and hooks exist, but `increment_view_count(uuid)` is an open schema gap; role/error/runtime behavior is therefore not production-safe to certify.

### Organization/Pengurus — PARTIAL

CRUD-like UI and regional hooks exist, but capability evidence notes static header/presentation data and no canonical membership repository.

### Notifications — PARTIAL

Tables/preferences/hooks and notification Edge Functions exist. End-to-end delivery, failure, deduplication, and authorization are unverified.

### Analytics/Reports — PARTIAL

Reports and dashboard RPCs exist. Data shape, empty/error state, performance, and browser evidence are missing.

### Users/Approvals — PARTIAL

Admin pages and privileged functions exist. No live privileged integration tests; role/RLS/function behavior remains uncertain.

### Audit/Auth Logs — PARTIAL

Pages and data calls exist, but completeness, immutable audit behavior, filtering, and access tests are absent.

### Export/Import — PARTIAL

Legitimate export/import remains; seed UI was removed from production page/bundle. Edge Function authorization, large export/import behavior, and browser validation are incomplete.

### Settings — BLOCKED

Settings UI exists but references historical `public_system_settings`; canonical ownership is unresolved.

### Public Verification — PARTIAL

Route/RPC surface exists, but expiry, malformed input, rate/abuse, and browser tests are absent.

### Orphan Pages — MISSING

`Bookings`, `Courts`, `Teams`, and `Index` exist as files but have no current executable route evidence. Product scope must decide whether to route, remove, or defer them.

## Backend Contract Findings

The canonical RPC inventory confirms most calls, but `check_duplicate_event` is mismatched and `increment_view_count` is a schema gap. `public_system_settings` is historical. Business data access is direct from hooks rather than repository/services. See the backend JSON artifact.

## Auth/RBAC/RLS Findings

The AuthContext/ProtectedRoute model is structurally sound. Role capability drift was fixed in prior phase, but policy decisions remain distributed. RLS is the final boundary and currently unverified for the critical assignment mutation. No new confirmed exploit was found. Do not weaken RLS or replace canonical role checks with metadata/email/local state.

## Security Findings

No new confirmed exploit. P1 security/reliability concerns are unverified assignment authorization, duplicate-event contract failure, residual seed-function capability, and distributed direct access. Service-role browser exposure guards are present.

## Testing Gaps

Only 9 files/26 tests exist. Local typecheck/tests/build pass; lint remains pre-existing 66 errors/11 warnings. Browser, RLS, mutation, responsive, keyboard, accessibility, notification delivery, and most CRUD integration tests are absent or blocked.

## Development Roadmap

Wave 0: Non-Production fixture/identity readiness and assignment RLS/mutation proof; contract decisions; seed Edge Function governance.

Wave 1: Assignment, events, referees, user administration and role capability tests.

Wave 2: Canonical contract reconciliation and incremental repositories/query layer.

Wave 3: Responsive/accessibility/error UX.

Wave 4: Browser/RLS/mutation regression gates and lint disposition.

Wave 5: measured pagination/cache/bundle optimization.

Wave 6: advanced features only after core readiness.

## Next 10

See [CODEBASE-NEXT-10-TASKS.md](CODEBASE-NEXT-10-TASKS.md). The first task is authorized Non-Production identity and reversible assignment fixture readiness; the second is live RLS/mutation proof. Cosmetic redesign is not the next priority.

## Production Readiness

**BLOCKED / NOT READY.** The codebase builds and has substantial backend connectivity, but canonical contract gaps, live RLS/mutation absence, no browser harness, fragmented repositories, and lint/inventory debt prevent a defensible Production UAT declaration.

## Final Answer

Jika development dilanjutkan besok, 10 pekerjaan terpenting adalah: (1) siapkan fixture dan identity Non-Production, (2) validasi RLS/mutation assignment, (3) reconcile duplicate-event RPC, (4) resolve discussion/settings schema gaps, (5) complete assignment audit/notification/cache proof, (6) centralize role capability tests, (7) introduce incremental repositories, (8) build browser/accessibility regression harness, (9) disposition lint and regenerate inventories, dan (10) measure/fix pagination/cache/bundle performance. Urutan ini mengikuti evidence: risiko terbesar berada pada security/data integrity/core workflow, bukan pada kosmetik.

PASS — CODEBASE-WIDE MODULE GAP ANALYSIS COMPLETE
