# Phase 1.8C Identity Spoofing Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Test design

Authenticate as `USER_A`. For each permitted mutation, submit a body containing forged `user_id`, `profile_id`, `created_by`, `updated_by`, or `owner_id` set to `USER_B`.

Test resources include events, assignments, honors, evaluations, notifications, profiles, and any Edge Function accepting target identity.

## Expected behavior

Effective identity must derive from the authenticated session (`auth.uid()` or verified bearer identity). Client-supplied identity must be ignored or rejected. A created/updated row attributed to `USER_B`, or access granted because of the forged identity, is `UNEXPECTED ALLOW` and a security failure.

## Evidence

Record authenticated actor, endpoint/table, forged field name, result classification, returned row count, and server error code. Never log tokens or personal data.

## Preconditions

Owner-confirmed isolated non-production environment and disposable users A/B. No role or user changes in the unknown linked project.
