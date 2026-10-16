# SECURITY AUDIT

## Summary

Security health: RED

The codebase has real operational value and a serious security model effort in place, but there are critical gaps between the frontend and database enforcement layers. The most severe risk is incomplete authorization enforcement, especially in configuration and edge-function access.

## Findings

### 1. Privileged functions are configured without JWT verification

Evidence:

- [supabase/config.toml](../../supabase/config.toml)
- [supabase/functions/create-user/index.ts](../../supabase/functions/create-user/index.ts)
- [supabase/functions/delete-user/index.ts](../../supabase/functions/delete-user/index.ts)
- [supabase/functions/reset-user-password/index.ts](../../supabase/functions/reset-user-password/index.ts)

Finding:

These functions explicitly declare `verify_jwt = false` in the Supabase config, which is a critical trust reduction for privileged operations. The functions still do token validation manually, but the config setting still weakens the default security boundary.

Risk: authorization can be bypassed if token validation or route protection is not correctly implemented.

### 2. Frontend role checks are used as a security boundary

Evidence:

- [src/components/auth/ProtectedRoute.tsx](../../src/components/auth/ProtectedRoute.tsx)
- [src/lib/routeUtils.ts](../../src/lib/routeUtils.ts)
- [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)

Finding:

React route guards are useful UX protection but not sufficient as a security control. They should be treated as a secondary defense layer only.

Risk: direct API abuse or malicious client requests can bypass route logic.

### 3. Broad table access policies exist

Evidence:

- [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql)
- [supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql](../../supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql)

Finding:

Several policies are written as `USING (true)` or `WITH CHECK (auth.uid() IS NOT NULL)` and therefore do not represent strong tenant or role isolation by default.

Risk: unauthorized reads or writes against public-facing tables.

### 4. Public insert policy for auth event logs

Evidence:

- [supabase/migrations/20260121134535_7cfd3b2d-b133-4765-9ab2-31229811a424.sql](../../supabase/migrations/20260121134535_7cfd3b2d-b133-4765-9ab2-31229811a424.sql)
- [supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql](../../supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql)

Finding:

Anyone can insert into `auth_event_logs` in the migration logic, while only admins can read it.

Risk: ability to write noise or misleading records into an audit trail. This is not a catastrophic issue in isolation, but it weakens trust in operational logs.

### 5. Secrets are stored in general app settings

Evidence:

- [src/pages/Settings.tsx](../../src/pages/Settings.tsx)
- [src/hooks/useSettings.ts](../../src/hooks/useSettings.ts)

Finding:

The settings screen manages `resend_api_key`, `smtp_password`, and other secret-bearing values in application configuration. This is workable for a small app, but it should be treated as a secret-management risk.

Risk: accidental leakage via UI, logs, or broad DB access.

## Positive security notes

- Supabase Auth is used as a real identity system.
- Several critical functions validate user tokens and role memberships before actions.
- Audit logs and auth event logging exist.
- Route guards and role-based navigation are already implemented.

## Recommended security plan

1. Fix the default JWT verification configuration for privileged edge functions.
2. Make database RLS the primary policy enforcement layer.
3. Remove or narrow permissive policies.
4. Replace frontend-only authorization assumptions with explicit service-level checks.
5. Reduce secret exposure by moving configuration secrets to a secure secret manager.
6. Add security regression tests for role isolation, region scoping, and approval mutation paths.

## Conclusion

The application is feature-rich, but its security posture is not yet production-safe without explicit hardening. The strongest action is to lock the authorization model down before continuing with new features or large-scale deployment changes.
