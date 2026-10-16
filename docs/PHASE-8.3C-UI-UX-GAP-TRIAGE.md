# PHASE 8.3C — UI/UX GAP TRIAGE & REMEDIATION PLAN

## Mode and Scope

**MODE: READ-ONLY — NO CODE CHANGES**

This plan is based on all eleven Phase 8.3B artifacts, not only the executive summary. No source, component, route, hook, repository, Supabase object, database, migration, RLS policy, authentication, authorization, API/RPC, package version, or configuration was changed.

## Executive Triage

Phase 8.3B contains 14 findings: P0=1, P1=8, P2=4, P3=1.

The application is **NOT READY** for Production UAT. The P0 seed-data exposure must be isolated first. The P1 assignment and async-state findings then require remediation before UAT. The lint gate is a separate pre-UAT quality concern: it is a pre-existing repository condition, not evidence of a Phase 8.3A regression.

Recommended next phase: **PHASE 8.3D — P0/P1 CORE WORKFLOW REMEDIATION**.

## P0 Forensic Analysis — F-007

### What is broken

The protected `/export` route renders `DatabaseExport`. That page imports and instantiates `useSeedDatabase`, exposes a `Seed Data` tab, displays hard-coded testing-data quantities, and renders a `Generate Seed Data` button. The button calls `handleSeed`, which calls `seedDatabase`. The hook invokes the Supabase Edge Function `seed-database` with `POST` and reports a success toast when entities are created.

### Why P0

This is not merely placeholder copy. The production-visible UI is connected to a mutating backend invocation capable of creating users, events, assignments, reviews, learning materials, discussions, honors, and related data. The audit did not invoke it and did not access Production, so no contamination is claimed. The exposure nevertheless invalidates UAT data integrity unless the capability is unavailable in the UAT/production environment.

### Blocked workflow and affected route

- Affected workflow: Production UAT / real-data operation while an administrator uses the database export surface.
- Affected route: `/export`.
- Responsible page/component: `DatabaseExport`, Seed Data tab and `Generate Seed Data` action.
- Hook: `useSeedDatabase`.
- Repository/service: no repository abstraction; the hook calls Supabase Edge Function directly.
- Supabase/API boundary: `supabase.functions.invoke('seed-database', { method: 'POST' })`.
- Response/state: `isSeeding`, `progress`, `SeedResult`, success/error toast, and rendered seed result.
- Exact break point: the seed capability is rendered and callable from a production-protected application route without evidence of an environment or capability gate.

### Causal classification

- UI-only: **No**. The UI is the entry point, but it is wired to a real mutating function.
- Data integration: **Yes**. The hook invokes a Supabase Edge Function.
- Authentication: **Not proven as the cause**. The page requires `admin_provinsi`.
- RBAC: **Partially involved**. Admin role gating exists, but role authorization is not an adequate environment safety boundary for test-data generation.
- RLS: **Unknown/not inspected**. No RLS change or database inspection was performed.
- API/RPC: **Yes, Edge Function integration**. No API change is authorized in this phase.
- Application state: **Secondary**. Loading/progress state exists; the primary defect is exposure and capability separation.
- Configuration/environment: **Likely root cause**. No production/non-production capability boundary is evidenced.

### Security disposition

**NO_SECURITY_EXPLOIT_FOUND.** The audit found a privileged data-integrity and production-safety risk, but no proven privilege escalation, BOLA/IDOR, unauthorized read, unauthorized update, auth bypass, role bypass, or secret exposure. A non-production negative test is still required in the remediation phase.

## P1 Forensic Analysis

| Finding | Classification | Production UAT | Phase 8.3A | Reason |
|---|---|---:|---:|---|
| F-001 | Integration/RBAC defect | BLOCKS | No | Panitia sees a core assignment CTA that route authorization rejects. |
| F-002 | UX defect | BLOCKS acceptance | No | Mobile admin export path is a guaranteed dead link; direct URL is a workaround. |
| F-003 | UX/RBAC defect | BLOCKS acceptance | No | `admin_kab_kota` receives a menu item it cannot access; route guard itself remains protective. |
| F-004 | Integration defect | BLOCKS | DIRECT | Assignment read failures can masquerade as empty/not-found, affecting assignment decisions. |
| F-005 | Data-contract defect | BLOCKS | DIRECT | Status mutation can bypass reason, audit, and notification semantics. This is the highest-risk P1. |
| F-006 | UX/state defect | BLOCKS | DIRECT | Repeated assignment actions can issue duplicate requests and leave stale state. |
| F-008 | Integration defect | BLOCKS core referee UAT | No | Failed referee retrieval is indistinguishable from no assignments. |
| F-011 | Technical debt/quality gate | BLOCKS gate unless dispositioned | No | `npm run lint` fails with 66 errors and 11 warnings; this is pre-existing. |

P1 does not automatically mean security blocker. F-001 and F-003 are authorization-consistency defects, but the inspected `ProtectedRoute` still denies the unauthorized route. F-005 needs a non-production authorization/RLS test because the UI mutation is contractually broader than the visible workflow; the current evidence does not prove an exploit.

## Phase 8.3A Impact

The Provincial Admin Event Assignment implementation is directly affected by F-004, F-005, F-006, F-010, and F-012. F-001 and F-011 are indirect. F-002, F-003, F-007, F-008, F-009, F-013, and F-014 have no direct impact on the implemented Provincial Admin assignment route, although F-007 affects overall UAT safety and F-008 affects the adjacent referee workflow. No impact was classified as UNKNOWN.

The affected workflow is:

`Admin Provinsi -> /administration/event-assignments -> list -> search/filter -> detail -> status dialog -> password step-up -> current user/user_roles re-check -> event_assignments update -> React Query invalidation`.

The route, current-user check, post-password identity check, role check, masked password field, and query invalidation are present. The remaining blockers are transition-contract fidelity, mutation busy-state completeness, error/retry clarity, accessibility evidence, and cross-surface cache consistency.

## Root-Cause Groups

- **ROOT_CAUSE_A — environment/capability separation:** F-007.
- **ROOT_CAUSE_B — capability-policy drift:** F-001, F-003.
- **ROOT_CAUSE_C — route literal drift:** F-002.
- **ROOT_CAUSE_D — missing async query-state contract:** F-004, F-008.
- **ROOT_CAUSE_E — canonical assignment transition bypass:** F-005.
- **ROOT_CAUSE_F — incomplete mutation busy-state policy:** F-006.
- **ROOT_CAUSE_G — baseline quality/documentation governance debt:** F-011, F-013.
- **ROOT_CAUSE_H — missing runtime responsive evidence:** F-009.
- **ROOT_CAUSE_I — missing accessibility acceptance evidence:** F-010.
- **ROOT_CAUSE_J — fragmented assignment data-access/cache contract:** F-012.
- **ROOT_CAUSE_K — design-system consolidation debt:** F-014.

The dependency graph and validation order are recorded in `PHASE-8.3C-DEPENDENCY-GRAPH.json`.

## Remediation Strategy

- F-007: **FIX_NOW**. Remove the production/UAT capability or hard-gate it to approved non-production environments. This may require architecture/deployment policy work; do not assume a database/RLS change is authorized.
- F-001, F-002, F-003, F-004, F-005, F-006, F-008, F-011: **FIX_BEFORE_UAT**.
- F-009 and F-010: **INVESTIGATE** first, then remediate only confirmed runtime issues.
- F-012 and F-013: **FIX_BEFORE_PRODUCTION**; manual refresh and documented inventory review are temporary workarounds.
- F-014: **DEFER** until functional readiness.

No finding is recommended for `ACCEPT_RISK` before UAT where it affects data integrity, core assignment behavior, or a visible broken navigation path.

## Scope and Change Risk

- UI-only: F-002, F-009, F-010, F-013, F-014.
- UI + RBAC: F-001, F-003.
- UI + hook: F-004, F-006, F-008.
- UI + hook + API/contract: F-005. Any API, RPC, RLS, or database change must be separately authorized; this plan does not authorize it.
- UI + auth/architecture/deployment boundary: F-007. The required safety boundary may be outside the UI.
- UI + hook + repository: F-012, after an architecture decision.
- Architecture/tooling: F-011.

Risk classification: F-005 is **CRITICAL**; F-007 is **HIGH**; F-001, F-003, F-011, and F-012 are **HIGH/MEDIUM** depending on the chosen contract boundary; F-002, F-006, F-009, F-013, and F-014 are **LOW/MEDIUM**; F-004, F-008, and F-010 are **MEDIUM**.

## Implementation Waves

### WAVE 0 — BLOCKERS

1. F-007: isolate seed capability and prove it is unavailable in UAT/production.

### WAVE 1 — CORE WORKFLOW

1. F-001, F-003, F-002: reconcile role capabilities and route targets.
2. F-005: separately review and implement the approved event-assignment transition contract.
3. F-006: prevent duplicate row mutations and define failure revalidation.
4. F-004 and F-008: add explicit query error/retry/offline states.

### WAVE 2 — UX QUALITY AND RELEASE GOVERNANCE

1. F-011: disposition the 66-error/11-warning lint baseline and establish a reproducible typecheck gate.
2. F-012: document and test assignment cache/query-key invalidation.
3. F-013: regenerate route governance inventory.
4. F-009 and F-010: run responsive and accessibility validation, fixing confirmed defects.

### WAVE 3 — POLISH

1. F-014: consolidate confirmed design-system variants.

## Lint Analysis

Exact command: `npm run lint`.

Current result: exit code 1, **66 errors, 11 warnings, 77 total problems**, including one potentially auto-fixable error. The static extraction found 41 affected files across `src/components`, `src/contexts`, `src/hooks`, `src/pages`, `supabase/functions`, and `tailwind.config.ts`. Representative affected files include `src/contexts/AuthContext.tsx`, `src/hooks/useEvents.ts`, `src/hooks/useSmartAssignment.ts`, `src/pages/Login.tsx`, `src/pages/EventEdit.tsx`, `supabase/functions/send-assignment-notification/index.ts`, `supabase/functions/send-event-notification/index.ts`, and `tailwind.config.ts`.

Phase 8.3A explicitly recorded the same full-repository baseline: 66 errors and 11 warnings outside that feature. Therefore:

1. The failure is pre-existing based on available evidence.
2. No evidence shows Phase 8.3A introduced it.
3. Lint findings alone do not prove runtime failure, though affected auth/pages/hooks need normal review.
4. It blocks a clean Production UAT quality gate unless formally dispositioned; it does not prove the application cannot execute.
5. ESLint configuration must not be changed in this phase.

## Build Status

**BUILD: NOT VERIFIED IN PHASE 8.3C**.

TypeScript passing with `npx tsc --noEmit` is useful static evidence but is not sufficient evidence that Vite bundling, environment loading, generated assets, or the service-role browser-bundle guard pass. Phase 8.3A contains prior successful build evidence for its feature scope, but that does not establish a current full build. Build must be executed before or during the remediation validation phase in a disposable workspace/working tree so generated artifacts do not pollute this read-only audit.

## Authorization and Security Review

The inspected evidence supports these conclusions:

- Protected routes use `ProtectedRoute`; direct unauthorized URL access is guarded by the client route layer.
- Admin assignment step-up checks the current authenticated user and `user_roles` before and after password reauthentication.
- Password is masked and not treated as role proof.
- Vite contains a service-role JWT browser-bundle rejection guard.
- F-001 and F-003 are role/menu consistency failures, not proven bypasses.
- F-005 needs authorized/forbidden and RLS behavior tested in Non-Production; no exploit is asserted.
- F-007 is a privileged data-integrity risk caused by exposed seed capability, not a proven privilege escalation.

**NO_SECURITY_EXPLOIT_FOUND**

## Required Validation After Remediation

1. Static: `npx tsc --noEmit`, `npm run lint`, and a disposable-workspace build.
2. Route/RBAC: role matrix tests, direct URL tests, and menu/action visibility tests.
3. Assignment: list/search/filter/detail/status/step-up/mutation/revalidation tests, including transition denial and failure recovery.
4. Data safety: prove seed function is unavailable in UAT/production; do not run it against Production.
5. Responsive: 320, 375, 390, 414, 768, 1024, 1280, and 1440px.
6. Accessibility: keyboard/focus, axe, table semantics, live-region, and screen-reader smoke checks.
7. Security: Non-Production authorized and forbidden update/read tests with RLS evidence.

## Final Decision

PHASE: 8.3C
NAME: UI/UX GAP TRIAGE & REMEDIATION PLAN

FINDINGS:
P0 = 1
P1 = 8
P2 = 4
P3 = 1

P0 BLOCKERS:
- F-007 — production-visible seed-data generation through `/export`.

P1 BLOCKERS:
- F-001 — Panitia assignment CTA/route authorization mismatch.
- F-002 — mobile `/database-export` dead link.
- F-003 — `admin_kab_kota` sees forbidden approval navigation.
- F-004 — assignment query failures collapse into misleading states.
- F-005 — status mutation bypasses canonical transition/audit semantics.
- F-006 — assignment row mutations lack complete duplicate prevention.
- F-008 — referee query failures collapse into empty state.
- F-011 — lint quality gate fails with a pre-existing 66-error/11-warning baseline.

PHASE 8.3A IMPACT:
DIRECT: F-004, F-005, F-006, F-010, F-012. INDIRECT: F-001, F-011. NO_IMPACT: F-002, F-003, F-007, F-008, F-009, F-013, F-014. UNKNOWN: none.

PRODUCTION UAT:
NOT READY

REQUIRED REMEDIATION:
1. Isolate seed-data generation from UAT/production.
2. Reconcile role capability policy, CTA visibility, mobile route targets, and approval menu visibility.
3. Stabilize the event-assignment transition contract and mutation busy/error/revalidation behavior.
4. Add explicit assignment and referee query error/retry/offline states.
5. Disposition lint baseline and verify a current build in a disposable workspace.
6. Validate responsive and accessibility behavior, then reconcile assignment cache/query contracts and route inventory.

DEFERRED:
- F-009 runtime responsive investigation until core blockers are stable.
- F-010 accessibility verification until the test harness is available, with confirmed blockers promoted.
- F-012 and F-013 until core workflow remediation, but before production release.
- F-014 design-system polish.

NEXT PHASE:
PHASE 8.3D — P0/P1 CORE WORKFLOW REMEDIATION

STATUS:
PASS — UI/UX GAP TRIAGE COMPLETE
