# PHASE 1 AUTHORIZATION INVENTORY

## Scope

This inventory documents the actual security boundary in the current application without changing implementation behavior. It is intentionally evidence-based and anchored to repository code.

## Security object inventory

| Security object | Location | Current enforcement | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Auth session and user hydration | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) | Browser-side state from Supabase Auth; role and profile data loaded client-side | Medium | Treat this as UX state only; enforce lifecycle checks server-side |
| Route protection | [src/components/auth/ProtectedRoute.tsx](../../src/components/auth/ProtectedRoute.tsx) | `user`, `role`, `registrationStatus`, `isProfileComplete`, `requireRole`, `requireAdmin` | Medium | Keep as UX-only; never as the sole security control |
| Application route map | [src/App.tsx](../../src/App.tsx) | Role-specific route definitions | Medium | Centralize permission matrix in server-side contract |
| Role definitions | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) | TypeScript `AppRole` union | High | Keep canonical role vocabulary aligned with DB and policies |
| User role table | [supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql) | DB row membership via `user_roles` | High | Use as the authoritative DB role source, but normalize legacy values |
| Profile record | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) | `profiles` row used for `kabupaten_kota_id` and profile completion | High | Use canonical identity mapping to tenant scope |
| Region / organization scope | [src/hooks/useOrganization.ts](../../src/hooks/useOrganization.ts), [src/pages/Organization.tsx](../../src/pages/Organization.tsx) | Client filtering by `kabupaten_kota_id` | Critical | Require DB tenant validation for all reads and updates |
| User approval workflow | [src/hooks/useRegistrations.ts](../../src/hooks/useRegistrations.ts), [src/pages/UserApprovals.tsx](../../src/pages/UserApprovals.tsx) | App loads `get_pending_registrations` and updates profile/user_roles client-side | High | Server-side authorization on approval actions required |
| Edge functions | [supabase/functions](../../supabase/functions) | Some functions validate JWT manually; config disables JWT verification for many functions | Critical | Re-enable JWT verification and enforce canonical role checks |
| RLS policies | [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql) and other migration files | Mixed; some broadly permissive policies exist | Critical | Audit and reduce policies to explicit tenant + role enforcement |
| Secrets/settings | [src/hooks/useSettings.ts](../../src/hooks/useSettings.ts), [src/pages/Settings.tsx](../../src/pages/Settings.tsx) | Values stored in `system_settings` table and loaded in app | High | Move secrets to secure server-side storage |

## Critical findings

### 1. The real enforcement boundary is fragmented

The app currently uses multiple approval layers:

- React route guards in [src/components/auth/ProtectedRoute.tsx](../../src/components/auth/ProtectedRoute.tsx)
- app-level role normalization in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- database role checks in Supabase migrations and policies
- manual logic in edge functions under [supabase/functions](../../supabase/functions)

This is not a canonical security boundary and should not be treated as a single trusted source of truth.

### 2. JWT enforcement is disabled for privileged actions

Evidence from [supabase/config.toml](../../supabase/config.toml):

- `verify_jwt = false` is set for `create-user`, `delete-user`, `reset-user-password`, `seed-database`, `export-database`, `import-database`, `test-email-config`, and several other functions

Even though some functions validate tokens manually, this weakens the default server trust boundary and is not acceptable for a production authorization model without a strong documented exception strategy.

### 3. Role semantics have drifted

The current app contains legacy and active values such as:

- `admin`, `referee` in early migrations
- `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, `evaluator` in later migrations

The TypeScript union in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) also normalizes legacy values like `referee => wasit` and `admin => admin_provinsi`.

This role evolution indicates a drift risk and should be treated as a security issue until canonicalized.

### 4. Tenant boundaries are not consistently enforced

The app includes a tenant model around province / kabupaten_kota / user membership, but many access checks are client-filtered rather than database-enforced. This is especially visible around `kabupaten_kota_id` handling in [src/hooks/useUsers.ts](../../src/hooks/useUsers.ts), [src/hooks/useEvents.ts](../../src/hooks/useEvents.ts), [src/hooks/useOrganization.ts](../../src/hooks/useOrganization.ts), and [src/pages/Organization.tsx](../../src/pages/Organization.tsx).

## Inventory conclusion

The current implementation is not yet aligned to a single server-enforced security boundary. A canonical identity + RBAC + tenant model is required before further scaling or business feature work.

## Recommended next step

Document the canonical model first, then harden the boundary in a controlled manner without broad application refactoring.
