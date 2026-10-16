# Phase 8.4 Integration Harness Plan

## Current state

No Playwright, Cypress, Vitest Browser, or equivalent browser harness exists. Vitest is configured for jsdom and current evidence is 9 files/26 tests. Non-Production runtime binding is verified, but synthetic identities/fixtures are unavailable and no browser session was started.

## Minimum viable harness

1. Use one existing browser framework only after dependency/credential authorization; do not introduce multiple frameworks.
2. Environment preflight must parse `VITE_SUPABASE_URL`, require project ref `shorsqyycpptxcutrqrb`, reject `xfscfjwapwnkiinkgbjg`, and refuse to run otherwise.
3. Provide login helpers for synthetic Admin Provinsi and non-admin identities without storing passwords in source/artifacts.
4. Support anonymous context, authenticated context, desktop/mobile viewport, request failure interception, and mutation request counting.
5. Capture only safe evidence: route, role label, status, request count, response class, and synthetic IDs where approved.

## Dependencies

- Approved Non-Production public client credential.
- Synthetic Auth identities and one reversible pending assignment.
- Browser dependency/tooling decision.
- RLS and mutation contract decision.

## Acceptance

Harness can prove login/session restoration, protected route, role denial, error/retry, pending-to-confirmed mutation, duplicate-click prevention, refresh persistence, and logout without Production access.
