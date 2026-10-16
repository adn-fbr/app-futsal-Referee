# Test Coverage Plan

## Risk-first additions

1. Auth/Profile/Role: session restoration, missing profile/role, forbidden direct route.
2. Event Assignment: state matrix, status transition, wrong/correct password, RLS allow/deny, duplicate submit, refresh.
3. Contract-sensitive calls: duplicate boolean adapter, settings contract decision, discussion schema-gap behavior.
4. Events: create/edit/approval/delete error and duplicate-check behavior.
5. Privileged operations: user management, export/import, Edge Function authorization.
6. Shared async states: error/retry/empty/loading assertions.

## Current baseline

9 test files and 26 tests pass locally. Browser/RLS/mutation coverage is missing or blocked. Lint baseline is 66 errors/11 warnings and must be dispositioned separately.

## Gate

A module is not integration-ready when only static contract tests pass. Critical workflows require at least one authorized positive, one negative identity, one failure/retry path, and persistence/revalidation proof.
