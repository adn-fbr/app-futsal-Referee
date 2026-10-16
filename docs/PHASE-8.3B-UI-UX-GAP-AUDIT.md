PHASE: 8.3B
NAME: UI/UX CODEBASE GAP & UNFINISHED WORK AUDIT
MODE: READ-ONLY FORENSIC AUDIT
STATUS: PASS — UI/UX GAP AUDIT COMPLETE

## Executive Summary

Total Findings: 14
P0: 1
P1: 8
P2: 4
P3: 1

Routes Audited: 52 concrete routes plus catch-all (`*`), 53 `<Route>` elements
Pages Audited: 56 page files
Forms Audited: 15 `<form>`/`useForm` occurrences, consolidated into 10 workflows
Actions Audited: 315 `<Button>`/`<button>` occurrences, with material findings listed in the action matrix
Tables Audited: 5 major table/list surfaces, including `event_assignments`
Components Audited: 149 TSX source files plus shared UI/layout/auth primitives
Supabase References Audited: 84 static `supabase.` occurrences
RBAC Surfaces Audited: 5 application roles, ProtectedRoute, role-aware navigation, assignment step-up
Responsive Surfaces Audited: 5 major surfaces against the required viewport set statically; runtime screenshots not taken
Accessibility Surfaces Audited: 4 high-risk surfaces statically; no axe/screen-reader run

This audit is a discovery artifact, not a statement that the application has no gaps. PASS means the repository was inspected and the known gaps were documented. No application source, database schema, migrations, authentication, authorization, RLS, API/RPC, or Supabase configuration was changed.

## Inventory

- Framework: React 18.3.1 with TypeScript 5.8.3.
- Build tool: Vite 5.4.19 with React SWC.
- UI: Tailwind CSS 3.4.17, shadcn-style primitives, Radix UI, Lucide icons.
- State/data: TanStack React Query 5.83.0 and local React state.
- Routing: React Router DOM 6.30.1.
- Forms/validation: React Hook Form 7.61.1, Zod 3.25.76, `@hookform/resolvers`.
- Backend client: `@supabase/supabase-js` 2.89.0; auth repositories exist, while most business hooks access Supabase directly.
- Authentication: `AuthContext`, auth/profile/role repositories, and `ProtectedRoute` with loading, unauthenticated, profile-missing, role-missing, forbidden, and authorization-error branches.
- Lockfiles: `package-lock.json` and `bun.lockb` both exist.
- Main roles found: `admin_provinsi`, `admin_kab_kota`, `evaluator`, `panitia`, `wasit`.

Detailed inventories are in the companion JSON artifacts in this directory.

## Findings

### F-001 — P1 — RBAC_GAP

Location: [EventDetail.tsx](../src/pages/EventDetail.tsx#L72-L76), [App.tsx](../src/App.tsx#L126-L182)

Evidence: Panitia can see the event assignment CTA, while `/events/:id/assign-referees` is guarded by `requireAdmin`. Current behavior is a visible action followed by forbidden/redirect behavior. Expected behavior is one shared capability policy for action visibility and route authorization. Impact is a broken assignment workflow for a supported event role. Dependency: approved assignment authorization contract.

### F-002 — P1 — NAVIGATION_GAP

Location: [MobileNav.tsx](../src/components/layout/MobileNav.tsx#L41-L55), [App.tsx](../src/App.tsx#L256-L266)

Evidence: Mobile navigation uses `/database-export`, but the registered route is `/export`. Current behavior is a catch-all 404. Expected behavior is a registered target. Impact is a dead admin navigation link.

### F-003 — P1 — RBAC_GAP

Location: [MobileNav.tsx](../src/components/layout/MobileNav.tsx#L41-L55), [App.tsx](../src/App.tsx#L219-L228)

Evidence: Non-provinsi admins receive an `Event Approval` item pointing to `/approvals`; that route permits only `admin_provinsi`. Current behavior is a menu item that always ends in forbidden navigation for `admin_kab_kota`. Expected behavior is role-capability-aligned menu visibility.

### F-004 — P1 — ERROR_HANDLING_GAP

Location: [RefereeAssignment.tsx](../src/pages/RefereeAssignment.tsx#L78-L86), [EventDetail.tsx](../src/pages/EventDetail.tsx#L25-L44)

Evidence: Assignment page exposes only the available-referee error, while event, assignments, and smart-suggestions errors are not represented. EventDetail likewise lacks an assignment error branch. Current behavior can turn a failed query into not-found, empty, or no-recommendation UI. Expected behavior is an explicit error, retry, and revalidation state for every query.

### F-005 — P1 — CONTRACT_GAP

Location: [AdminEventAssignments.tsx](../src/pages/AdminEventAssignments.tsx#L16-L18), [useAdminEventAssignments.ts](../src/hooks/useAdminEventAssignments.ts#L66-L88), [useEventAssignments.ts](../src/hooks/useEventAssignments.ts#L464-L512)

Evidence: Admin UI allows pending, confirmed, declined, and cancelled transitions; its mutation directly updates status. The existing cancellation workflow additionally requires reason, `cancelled_by`, and audit behavior. Current behavior can mutate cancellation/decline without that contract. Expected behavior is a transition matrix and canonical mutation per transition. Impact is inconsistent business state and auditability.

### F-006 — P1 — LOADING_GAP / STATE_GAP

Location: [RefereeAssignment.tsx](../src/pages/RefereeAssignment.tsx#L116-L152), [RefereeAssignment.tsx](../src/pages/RefereeAssignment.tsx#L337-L375)

Evidence: Role changes and remove actions call mutations without row-level pending disablement; failures are mostly global toasts. Current behavior permits repeated clicks and leaves local presentation dependent on later invalidation. Expected behavior is action-level busy state, duplicate prevention, and clear recovery.

### F-007 — P0 — DEMO_DATA_GAP / SECURITY_GAP

Location: [DatabaseExport.tsx](../src/pages/DatabaseExport.tsx#L520-L557), [useSeedDatabase.ts](../src/hooks/useSeedDatabase.ts#L72-L151)

Evidence: A protected production route exposes a Seed Data tab that describes creating dummy users, events, assignments, and reviews, including a hardcoded 21-user summary. Current behavior permits production-surface test-data generation for an admin-capable route. Expected behavior is non-production isolation or an explicit environment capability gate. Impact is potential production data contamination and UAT integrity failure.

### F-008 — P1 — ERROR_HANDLING_GAP

Location: [RefereeEvents.tsx](../src/pages/RefereeEvents.tsx#L86-L114), [RefereeEvents.tsx](../src/pages/RefereeEvents.tsx#L260-L306)

Evidence: Upcoming and past query loading is handled, but query errors are not read. Current behavior renders ordinary empty states when retrieval fails. Expected behavior is error, retry, and network/offline recovery.

### F-009 — P2 — RESPONSIVENESS_GAP

Location: [AdminEventAssignments.tsx](../src/pages/AdminEventAssignments.tsx#L103-L113), [Events.tsx](../src/pages/Events.tsx#L57-L125)

Evidence: Responsive table/card and scrollable-tab implementations exist, but no runtime evidence covers 320, 375, 390, 414, 768, 1024, 1280, and 1440px. Long event/referee/status labels and the bottom navigation/FAB are risk points. This is a verification gap, not an asserted defect.

### F-010 — P2 — ACCESSIBILITY_GAP

Location: [AdminEventAssignments.tsx](../src/pages/AdminEventAssignments.tsx#L103-L113), [MobileNav.tsx](../src/components/layout/MobileNav.tsx#L103-L140)

Evidence: Raw table semantics do not visibly include scope/caption; async state announcements and icon-only trigger naming require runtime verification. Expected behavior is WCAG 2.1 AA evidence for table relationships, live status changes, focus, and keyboard navigation.

### F-011 — P1 — TECHNICAL_DEBT / PRODUCTION_READINESS_GAP

Location: [package.json](../package.json#L1-L45), prior [Phase 8.3A report](PHASE-8.3A-PROVINCIAL-ADMIN-EVENT-ASSIGNMENT-UI.md#L32-L37)

Evidence: There is no dedicated `typecheck` script, and the prior validation records 66 full-repository lint errors and 11 warnings outside the feature. `npx tsc --noEmit` passed during this audit. Current behavior is a noisy/non-passing lint gate. Expected behavior is a clean or explicitly dispositioned UAT gate.

### F-012 — P2 — STATE_GAP / CONTRACT_GAP

Location: [useAdminEventAssignments.ts](../src/hooks/useAdminEventAssignments.ts#L1-L31), [useEventAssignments.ts](../src/hooks/useEventAssignments.ts#L430-L540)

Evidence: Business hooks directly access Supabase and invalidate different query keys across admin/referee/detail surfaces. Current behavior has no single documented assignment repository/cache contract. Expected behavior is a shared query-key and mutation revalidation matrix. Impact is stale or divergent status after cross-surface mutation.

### F-013 — P2 — DOCUMENTATION_GAP

Location: [PHASE-8.1-ROUTE-MATRIX.json](PHASE-8.1-ROUTE-MATRIX.json#L1-L4), [App.tsx](../src/App.tsx#L335-L350)

Evidence: Phase 8.1 records 51 routes and predates `/administration/event-assignments`; the executable app now has 52 concrete routes plus catch-all. Current behavior is stale governance inventory. Expected behavior is route documentation regenerated as part of the release gate.

### F-014 — P3 — DESIGN_SYSTEM_GAP

Location: [index.css](../src/index.css#L13-L113), broad `src/pages` surface

Evidence: Tokens and shared primitives exist, but pages repeat raw table/card/status/async patterns and use an Inter/system fallback. Current behavior risks visual and interaction drift. Expected behavior is consistent shared variants. This is lower priority than UAT blockers.

## State Coverage Summary

- Auth guard: PASS for loading, unauthenticated, profile missing, role missing, forbidden, and auth error branches in [ProtectedRoute.tsx](../src/components/auth/ProtectedRoute.tsx#L30-L139).
- `AdminEventAssignments`: PASS for loading, error, empty, mutation loading, success toast, and failure toast; GAP for transition contract and richer retry/authorization semantics.
- `RefereeAssignment`: PASS for initial loading and not-found; GAP for several query errors, retry, and action-level busy/error recovery.
- `RefereeEvents`: PASS for loading and empty; GAP for query error/offline/retry.
- `Events`: PASS for loading and empty/filter results; GAP for query error/retry.
- Other pages: route and source inventory completed; detailed per-page state coverage remains partial where no direct evidence was available and is marked in route/form JSON rather than invented as a defect.

## Event Assignment Dedicated Flow

`List -> Search -> Filter -> Detail -> Referee/Event display -> Status dialog -> Password step-up -> role re-check -> mutation -> invalidation` is present in the Admin Event Assignments surface. The flow is not production-UAT complete because:

1. Status mutation is broader than the canonical cancellation/decline business contract.
2. Mutation error/retry is toast-only and does not provide a durable recovery state.
3. The separate assignment page does not consistently surface all query errors.
4. Direct role-change/remove actions lack complete duplicate-click prevention.
5. Browser viewport, keyboard, screen-reader, and Non-Production mutation verification were not performed.

Positive security evidence: password uses a masked input, is cleared on close/success, is not persisted/logged by the inspected code, and role is checked before and after reauthentication. Password is not treated as proof of role.

## Prioritized Backlog

### P0 — Must Fix Before Production UAT

- F-007: isolate/remove dummy-data generation from production UI and verify no production endpoint can seed test data.

### P1 — Must Fix Before Production UAT

- F-001: reconcile Panitia assignment CTA and assignment route capability.
- F-002: fix `/database-export` dead link.
- F-003: remove/replace forbidden approval menu for `admin_kab_kota`.
- F-004 and F-008: add query error, retry, and network recovery states.
- F-005: enforce event-assignment transition contract, including cancellation reason/audit semantics.
- F-006: disable duplicate assignment mutations and expose mutation recovery.
- F-011: disposition lint baseline and add reproducible typecheck gate.

### P2 — Should Fix Before Production

- F-009: execute required viewport matrix and fix confirmed overflow/clipping.
- F-010: complete keyboard, focus, table, live-region, and screen-reader checks.
- F-012: document and test cache invalidation/query-key contract.
- F-013: regenerate route governance inventory.

### P3 — Can Be Deferred / Cosmetic

- F-014: consolidate confirmed design-system variants after blocker work.

## Validation Record

| Command | Result | Exit code |
|---|---|---|
| `npx tsc --noEmit` | PASS, no output | 0 |
| `npm run lint` | FAIL, repository lint baseline errors/warnings; prior Phase 8.3A records 66 errors and 11 warnings outside feature | non-zero |
| `npm run build` | Not run because Vite writes build files and the audit forbids non-requested files | not run |
| Database inspection/mutation | Not performed | N/A |
| Production access | Not performed | N/A |
| Browser viewport/axe/screen-reader | Not performed | N/A |

## Safety Counters

See [PHASE-8.3B-SAFETY-COUNTERS.json](PHASE-8.3B-SAFETY-COUNTERS.json). Source mutation, database access/mutation, migrations, user creation, auth/RBAC/RLS/API changes, dependency changes, and configuration changes were all false.

## Production UAT Answer

Jika aplikasi dibawa ke Production UAT sekarang, pekerjaan UI/UX yang masih belum selesai adalah: menghapus atau mengisolasi seed dummy data; menyamakan visibility CTA penugasan dengan authorization Panitia; memperbaiki dua mismatch navigasi/role; melengkapi error/retry/offline state pada assignment dan referee-event queries; membatasi status transition agar mengikuti contract `event_assignments`; mencegah duplicate mutation; dan memulihkan lint gate. P0 adalah seed data. P1 adalah workflow assignment/navigation/error/loading serta lint gate. P2 adalah viewport, accessibility, cache-contract, dan route-inventory verification. P3 adalah konsistensi design system dan dapat ditunda.

PASS — UI/UX GAP AUDIT COMPLETE
