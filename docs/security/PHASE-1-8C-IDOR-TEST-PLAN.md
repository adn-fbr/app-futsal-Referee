# Phase 1.8C IDOR Test Plan

## Status

**READY for isolated non-production execution; BLOCKED now.**

## Resources

Test resource identifiers from actual fixtures for `profiles`, `events`, `event_assignments`, `event_approvals`, `referee_cards`, `honors`, `evaluations`, `notifications`, and `audit_logs`.

## Matrix

For each resource, test same-user, same-region different-user, different-region, privileged-user, and unprivileged-user access. Use SELECT by known foreign UUID, update by known foreign UUID, delete by known foreign UUID, and function/Edge requests containing the foreign identifier.

Expected outcomes must follow the approved authorization contract. Cross-region and unauthorized-resource access must be `DENY`; any `UNEXPECTED ALLOW` is a failure. Public/reference resources require an explicit sensitivity decision before testing.

## Evidence

Capture operation, actor role, resource owner/region, identifier class, HTTP/PostgREST result, row count, error code, and expected-versus-actual classification. Never record personal data or tokens.

## Preconditions

Only isolated non-production identities and resources. Do not probe the linked unknown project.
