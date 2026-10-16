# PHASE-7.1 Repository Boundary Report

## Completed

- Authentication operations are isolated behind AuthRepository and SupabaseAuthRepository.
- Profile resolution is isolated behind UserProfileRepository and SupabaseUserProfileRepository.
- Role resolution is isolated behind UserRoleRepository and SupabaseUserRoleRepository.
- These repositories use authenticated IDs and never fall back to demo data.

## Remaining direct business access

Direct Supabase access remains in 27 non-infrastructure files:

- Hooks: useAuditLogs, useAutoCompleteEvents, useDiscussions, useEvaluations, useEventAssignments, useEventReminders, useEvents, useExportDatabase, useImportDatabase, useIncompleteProfiles, useNotifications, useOrganization, useProfile, useRefereeCard, useReferees, useRegistrations, useReports, useSeedDatabase, useSmartAssignment, useUsers.
- Utilities: authAudit and systemRules.
- UI pages: EventSubmission, ForgotPassword, ResetPassword, Settings, Signup.

These are classified as BUSINESS HOOK, UTILITY, or UI COMPONENT and require a separate incremental repository refactor. Existing approved locations are auth repositories, Supabase client infrastructure, Edge Functions, and tests.

## Gate

Repository productionization is BLOCKED. No fake organization, club, tenant, or membership repository was added because those objects are not in the canonical baseline.
