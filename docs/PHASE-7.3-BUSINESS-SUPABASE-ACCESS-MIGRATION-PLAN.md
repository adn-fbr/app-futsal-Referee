# Phase 7.3 Business Supabase Access Migration Plan

This is a deterministic planning artifact only. No repository or application refactor was performed.

## Migration boundary

`UI / Context → Hook or application service → Repository interface → Supabase repository`

For every write, preserve the existing caller identity and enforce the intended RLS/Edge Function authorization at the repository boundary. Static analysis cannot establish the actual policy semantics, so P0/P1 writes need policy review before migration.

## BATCH 1

- `src/components/users/BulkUserImportDialog.tsx` — AUTH; 1 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/hooks/useAuthLogs.ts` — AUTH; 1 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/hooks/useIncompleteProfiles.ts` — PROFILE; 3 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/hooks/useProfile.ts` — PROFILE; 4 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/hooks/useUsers.ts` — AUTH; 18 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/pages/ForgotPassword.tsx` — AUTH; 1 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/pages/ResetPassword.tsx` — AUTH; 4 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.
- `src/pages/Signup.tsx` — AUTH; 1 direct operations; repository: EXTEND_EXISTING_REPOSITORY; risk: P0.

## BATCH 2

- `src/hooks/useAutoCompleteEvents.ts` — EVENT; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useEligibleHonorEvents.ts` — EVENT; 3 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useEventAssignments.ts` — EVENT ASSIGNMENT; 20 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useEventReminders.ts` — EVENT ASSIGNMENT; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useEvents.ts` — EVENT; 26 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useRefereeEvents.ts` — EVENT; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useSmartAssignment.ts` — EVENT ASSIGNMENT; 9 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/pages/EventSubmission.tsx` — EVENT; 5 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.

## BATCH 3

- `src/hooks/usePublicReviews.ts` — REFEREE REVIEW; 7 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.
- `src/hooks/useRefereeCard.ts` — REFEREE CARD; 23 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P1.
- `src/hooks/useReferees.ts` — REFEREE REVIEW; 8 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.

## BATCH 4

- `src/hooks/useEvaluations.ts` — EVALUATION; 17 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P0, P1.

## BATCH 5

- `src/hooks/useHonors.ts` — HONOR; 9 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P0, P2, P3.

## BATCH 6

- `src/contexts/NotificationContext.tsx` — NOTIFICATION; 3 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/hooks/useNotificationPreferences.ts` — NOTIFICATION; 5 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.
- `src/hooks/useNotifications.ts` — NOTIFICATION; 6 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.

## BATCH 7

- `src/hooks/useDiscussions.ts` — DISCUSSION; 19 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P0, P2, P3.

## BATCH 8

- `src/hooks/useAdminLearning.ts` — LEARNING; 5 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P0, P2, P3.
- `src/hooks/useLearning.ts` — LEARNING; 5 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.

## BATCH 9

- `src/hooks/useAnalytics.ts` — OTHER; 7 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/hooks/useAuditLogs.ts` — AUDIT; 1 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2.
- `src/hooks/useExportDatabase.ts` — OTHER; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/hooks/useImportDatabase.ts` — OTHER; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/hooks/useOrganization.ts` — REFERENCE DATA; 19 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P0, P2, P3.
- `src/hooks/useRegistrations.ts` — UNKNOWN; 8 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.
- `src/hooks/useReports.ts` — OTHER; 3 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2.
- `src/hooks/useSeedDatabase.ts` — OTHER; 1 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/hooks/useSettings.ts` — SYSTEM SETTINGS; 4 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.
- `src/hooks/useSignedUrl.ts` — OTHER; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/lib/authAudit.ts` — AUDIT; 2 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2.
- `src/lib/systemRules.ts` — SYSTEM SETTINGS; 4 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P2, P3.
- `src/pages/Analytics.tsx` — OTHER; 5 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.
- `src/pages/Settings.tsx` — SYSTEM SETTINGS; 1 direct operations; repository: NEW_REPOSITORY_REQUIRED; risk: P3.

## Review queue

- `NOT_FOUND_IN_BASELINE` operations must be reconciled against an authorized non-production source or confirmed as deliberate contract gaps; do not alter the canonical baseline automatically.
- Dynamic table/bucket targets are `AMBIGUOUS` and need explicit interfaces before migration.
- Edge Functions, Auth, Storage, and Realtime are externally managed; repository design must preserve their service-specific security rules.
