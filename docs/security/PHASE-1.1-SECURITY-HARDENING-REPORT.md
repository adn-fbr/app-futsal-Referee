# PHASE 1.1 SECURITY HARDENING REPORT

## Status

PARTIAL.

This repository has the security design documentation and now has a first implemented authorization slice, but it does not yet have the complete enforced production boundary required by the strict gate.

## Verified reality

### Authentication

The app authenticates through Supabase Auth and resolves user identity from the authenticated session in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx). That is the correct identity source.

### Authorization boundary

The actual boundary is fragmented across:

- route guards in [src/App.tsx](../../src/App.tsx)
- auth role resolution in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- SQL helper functions in migrations
- manual token verification in Edge Functions
- RLS policies in migration history

This means the boundary is not yet centrally enforced.

### Edge function status

The explicit `verify_jwt = false` settings have been removed from [supabase/config.toml](../../supabase/config.toml). A shared server-side resolver now validates the bearer token, loads roles from `user_roles`, and loads region scope from `profiles`; it is applied to auto-completion, reports, seeding, reminders, and assignment notifications.

Several remaining functions still need the same handler-level role and tenant review before the boundary is complete.

### Role drift

The current app uses the canonical business roles, but history still includes legacy values (`admin`, `referee`) in migration records. The repository has already normalized a subset of this in the app layer, but the database migration history still includes mixed role semantics.

### Tenant model

The application’s tenant concept is region-based through `kabupaten_kota_id` and related metadata. The evidence is present in the schema and SQL helper functions, but enforcement remains inconsistent across policies and functions.

## Remaining blockers

### P0

- Live Supabase/RLS verification is blocked because Docker Desktop is unavailable in the environment.
- Authorization remains partially fragmented across app, SQL, and server boundaries.
- Role drift remains unresolved in migration history.
- Cross-tenant enforcement remains incomplete.

### P1

- secret-bearing settings are still not isolated as secure server-only configuration
- business auth logic is still spread across hooks/pages and not centralized
- some RLS patterns remain permissive and must be tightened

### P2

- primitive authorization regression tests execute successfully, but live DB and Edge Function integration tests have not run
- role normalization and migration cleanup are staged but not fully executed
- application typecheck is blocked by existing missing dependencies and unrelated type errors

## Conclusion

The repository is not yet in a PASS state for Phase 1.1.

The correct next gate is not business feature development. The next gate is a narrowly scoped hardening pass that:

1. enforces verified JWT on privileged Edge Functions
2. centralizes server-side authorization around canonical role + tenant context
3. validates RLS against tenant ownership and role scope
4. executes the authz regression suite in a non-production environment
5. then re-runs build/typecheck verification before any additional feature work

This phase remains PARTIAL until the remaining handlers are hardened and the RLS/cross-tenant suite executes against a local or dedicated Supabase environment.
