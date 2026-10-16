# Phase 7.3 Business Supabase Access Inventory

Static-only inventory. Production, Test, and Staging were not connected to; no credentials, types, migrations, schema, RLS, or application source files were modified.

## Scope

This inventory covers direct browser-side Supabase calls in `src/`, excluding the client factory and the Phase 7 auth repository implementations. It found **41 files** and **270 operations**. The prior 27-file estimate is not current: the static source now contains 41 files with direct operations in this scope.

Each entry in the companion JSON has: file, line, operation, Supabase API, object, read/write/RPC classification, host, domain classification, repository disposition, risk, batch, and canonical-contract state. The common authorization context is: caller session plus RLS or Edge Function policy; static inspection cannot prove runtime authorization. For auth APIs, the object field is the Auth method; for storage, functions, and realtime it is an externally managed resource.


## Classification

| Value | Operations |
| --- | ---: |
| AUDIT | 3 |
| AUTH | 26 |
| DISCUSSION | 19 |
| EVALUATION | 17 |
| EVENT | 38 |
| EVENT ASSIGNMENT | 31 |
| HONOR | 9 |
| LEARNING | 10 |
| NOTIFICATION | 14 |
| OTHER | 22 |
| PROFILE | 7 |
| REFEREE CARD | 23 |
| REFEREE REVIEW | 15 |
| REFERENCE DATA | 19 |
| SYSTEM SETTINGS | 9 |
| UNKNOWN | 8 |


## Database contract

| Value | Operations |
| --- | ---: |
| AMBIGUOUS | 2 |
| EXTERNAL_MANAGED | 45 |
| NOT_FOUND_IN_BASELINE | 3 |
| VERIFIED_PRODUCTION_OBJECT | 220 |


## Operations

| Value | Operations |
| --- | ---: |
| AUTH | 15 |
| createSignedUrl | 2 |
| delete | 8 |
| getPublicUrl | 3 |
| insert | 30 |
| invoke | 18 |
| rpc | 25 |
| select | 119 |
| subscribe | 2 |
| unsubscribe | 2 |
| update | 42 |
| upload | 3 |
| upsert | 1 |


## Repository disposition

| Value | Operations |
| --- | ---: |
| EXTEND_EXISTING_REPOSITORY | 33 |
| NEW_REPOSITORY_REQUIRED | 237 |


## Risk

| Value | Operations |
| --- | ---: |
| P0 | 41 |
| P1 | 108 |
| P2 | 55 |
| P3 | 66 |


## File inventory

| File | Operations | Classification | Batch | Risk |
| --- | ---: | --- | --- | ---: |
| `src/components/users/BulkUserImportDialog.tsx` | 1 | AUTH | BATCH 1 | P0 |
| `src/contexts/NotificationContext.tsx` | 3 | NOTIFICATION | BATCH 6 | P3 |
| `src/hooks/useAdminLearning.ts` | 5 | LEARNING | BATCH 8 | P0, P2, P3 |
| `src/hooks/useAnalytics.ts` | 7 | OTHER | BATCH 9 | P3 |
| `src/hooks/useAuditLogs.ts` | 1 | AUDIT | BATCH 9 | P2 |
| `src/hooks/useAuthLogs.ts` | 1 | AUTH | BATCH 1 | P0 |
| `src/hooks/useAutoCompleteEvents.ts` | 2 | EVENT | BATCH 2 | P1 |
| `src/hooks/useDiscussions.ts` | 19 | DISCUSSION | BATCH 7 | P0, P2, P3 |
| `src/hooks/useEligibleHonorEvents.ts` | 3 | EVENT | BATCH 2 | P1 |
| `src/hooks/useEvaluations.ts` | 17 | EVALUATION | BATCH 4 | P0, P1 |
| `src/hooks/useEventAssignments.ts` | 20 | EVENT ASSIGNMENT | BATCH 2 | P1 |
| `src/hooks/useEventReminders.ts` | 2 | EVENT ASSIGNMENT | BATCH 2 | P1 |
| `src/hooks/useEvents.ts` | 26 | EVENT | BATCH 2 | P1 |
| `src/hooks/useExportDatabase.ts` | 2 | OTHER | BATCH 9 | P3 |
| `src/hooks/useHonors.ts` | 9 | HONOR | BATCH 5 | P0, P2, P3 |
| `src/hooks/useImportDatabase.ts` | 2 | OTHER | BATCH 9 | P3 |
| `src/hooks/useIncompleteProfiles.ts` | 3 | PROFILE | BATCH 1 | P0 |
| `src/hooks/useLearning.ts` | 5 | LEARNING | BATCH 8 | P2, P3 |
| `src/hooks/useNotificationPreferences.ts` | 5 | NOTIFICATION | BATCH 6 | P2, P3 |
| `src/hooks/useNotifications.ts` | 6 | NOTIFICATION | BATCH 6 | P2, P3 |
| `src/hooks/useOrganization.ts` | 19 | REFERENCE DATA | BATCH 9 | P0, P2, P3 |
| `src/hooks/useProfile.ts` | 4 | PROFILE | BATCH 1 | P0 |
| `src/hooks/usePublicReviews.ts` | 7 | REFEREE REVIEW | BATCH 3 | P2, P3 |
| `src/hooks/useRefereeCard.ts` | 23 | REFEREE CARD | BATCH 3 | P1 |
| `src/hooks/useRefereeEvents.ts` | 2 | EVENT | BATCH 2 | P1 |
| `src/hooks/useReferees.ts` | 8 | REFEREE REVIEW | BATCH 3 | P2, P3 |
| `src/hooks/useRegistrations.ts` | 8 | UNKNOWN | BATCH 9 | P2, P3 |
| `src/hooks/useReports.ts` | 3 | OTHER | BATCH 9 | P2 |
| `src/hooks/useSeedDatabase.ts` | 1 | OTHER | BATCH 9 | P3 |
| `src/hooks/useSettings.ts` | 4 | SYSTEM SETTINGS | BATCH 9 | P2, P3 |
| `src/hooks/useSignedUrl.ts` | 2 | OTHER | BATCH 9 | P3 |
| `src/hooks/useSmartAssignment.ts` | 9 | EVENT ASSIGNMENT | BATCH 2 | P1 |
| `src/hooks/useUsers.ts` | 18 | AUTH | BATCH 1 | P0 |
| `src/lib/authAudit.ts` | 2 | AUDIT | BATCH 9 | P2 |
| `src/lib/systemRules.ts` | 4 | SYSTEM SETTINGS | BATCH 9 | P2, P3 |
| `src/pages/Analytics.tsx` | 5 | OTHER | BATCH 9 | P3 |
| `src/pages/EventSubmission.tsx` | 5 | EVENT | BATCH 2 | P1 |
| `src/pages/ForgotPassword.tsx` | 1 | AUTH | BATCH 1 | P0 |
| `src/pages/ResetPassword.tsx` | 4 | AUTH | BATCH 1 | P0 |
| `src/pages/Settings.tsx` | 1 | SYSTEM SETTINGS | BATCH 9 | P3 |
| `src/pages/Signup.tsx` | 1 | AUTH | BATCH 1 | P0 |

## Architecture findings

- Direct operations in hooks, components, contexts, and utilities bypass a domain repository boundary.
- Existing repositories are available only for the Phase 7 Auth/Profile/Role seam; matching operations are marked `EXTEND_EXISTING_REPOSITORY`.
- All other direct domain operations are marked `NEW_REPOSITORY_REQUIRED`; this is a migration-planning classification, not a request to create those repositories now.
- `NOT_FOUND_IN_BASELINE` objects require review in a future migration phase; they were not invented or changed.
- Storage, Auth, Realtime, and Edge Function resources are `EXTERNAL_MANAGED` rather than baseline database objects.

## Required field interpretation

The companion JSON records every operation as a normalized tuple in this order: `file`, `line`, `operation`, `supabaseApi`, `object`, `readWrite`, `host`, `classification`, `repositoryStatus`, `risk`, `migrationBatch`, `databaseContract`. The file and line identify the caller; `host` identifies the service-layer shape; the global authorization context is caller session plus RLS or Edge Function policy. Runtime authorization is not inferred from static source.

The effective repository requirement is `EXTEND_EXISTING_REPOSITORY` for the 33 Auth/Profile/Role operations already covered by the repository seam and `NEW_REPOSITORY_REQUIRED` for the remaining 237 operations. No schema change was created. `NOT_FOUND_IN_BASELINE` and `AMBIGUOUS` are preserved as review blockers.

## Static validation

| Check | Result | Expected | Evidence |
| --- | --- | --- | --- |
| All application access records have a deterministic file and line | YES | YES | 270 normalized records |
| All application dependencies resolved | NO | YES | 3 `NOT_FOUND_IN_BASELINE`, 2 `AMBIGUOUS` |
| Application canonical identities are OID-based | 0 | 0 | Static source contains no catalog OID identity |
| Application direct `auth.users` access | 0 | 0 | Auth users is external-managed and not queried |
| Ambiguous function signatures | 0 | 0 | Baseline has explicit overloaded signatures |
| Dependency cycles | 0 | 0 | No dependency graph was generated in this static phase |
| Supabase/system objects misclassified as application | 0 | 0 | Auth, Storage, Realtime, and Functions are external-managed |
| Deterministic run comparison | YES | YES | Companion hash artifact |

## Write-operation security review

The inventory contains 30 `INSERT`, 42 `UPDATE`, 8 `DELETE`, 1 `UPSERT`, and 25 RPC calls. Current callers are browser hooks, contexts, components, pages, and library utilities; no operation was executed. Authentication is required where the current hook/page obtains a session or calls an authenticated Edge Function, but static inspection cannot prove the server policy. Expected RLS boundary is the authenticated user plus role and regional predicates, or the configured Edge Function authorization boundary for privileged operations. Every write requires repository migration followed by policy review; the two dynamic `systemRules.ts` updates additionally require explicit allowlisted repository interfaces.

## Final report

`PHASE-7.3-BUSINESS-SUPABASE-ACCESS-INVENTORY v1.0.0`

**STATUS: BLOCKED**

Application dependencies: 270 records; 265 contract-classified as verified or external-managed; 5 require resolution review. Direct-access files: 41.

Database contract: verified 220, not found 3, ambiguous 2, external-managed 45. Repository status: existing repository 0, extend existing 33, new repository required 237, schema change required 0, unknown 0.

Risk totals: P0 41, P1 108, P2 55, P3 66. No P0 assignment is based only on architectural layering; it reflects authentication, authorization, or data-isolation exposure in the current operation.

Determinism: run 1 and run 2 are identical. The SHA-256 values are recorded in `PHASE-7.3-BUSINESS-SUPABASE-ACCESS-HASH.txt`.

Production: connection not used; mutation not executed; deployment not authorized. Canonical baseline respected. Refactoring not executed.

**NEXT GATE: PHASE-7.4 BUSINESS REPOSITORY MIGRATION**

Because unresolved contract references remain, migration must first resolve the dynamic table target and the three missing baseline objects. Do not generate or apply a runtime baseline from this artifact.
