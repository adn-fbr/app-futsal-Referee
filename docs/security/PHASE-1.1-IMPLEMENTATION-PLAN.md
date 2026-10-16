# PHASE 1.1 IMPLEMENTATION PLAN

## Scope

This plan is based on the actual repository state, not on assumptions. It is intentionally limited to the security boundary work required before new business features are added.

## Evidence used

- Frontend auth model: [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- Route gate definitions: [src/App.tsx](../../src/App.tsx)
- Privileged function config: [supabase/config.toml](../../supabase/config.toml)
- Example privileged function: [supabase/functions/create-user/index.ts](../../supabase/functions/create-user/index.ts)
- Example privileged function: [supabase/functions/delete-user/index.ts](../../supabase/functions/delete-user/index.ts)
- Existing role schema: [supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql)
- Role expansion migration: [supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql](../../supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql)
- Policy normalization migration: [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql)
- Auth event logging hotfix: [supabase/migrations/20260121134535_7cfd3b2d-b133-4765-9ab2-31229811a424.sql](../../supabase/migrations/20260121134535_7cfd3b2d-b133-4765-9ab2-31229811a424.sql)

## Baseline conclusions

### Authentication

The app authenticates through Supabase Auth. That is the correct upstream identity source. However, the project currently treats a read-only frontend role state as if it were authorization evidence, and the Edge Function config still disables JWT verification for privileged endpoints.

### Authorization

Authorization is split across:

- frontend route guards in [src/App.tsx](../../src/App.tsx)
- frontend role normalization in [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- Postgres helper functions in migration history
- manual role lookups in privileged Edge Functions
- RLS policies added over multiple migration batches

This is not yet one authoritative boundary.

### Canonical domain model

The existing PG model is effectively:

```text
auth.users
  -> profiles
  -> user_roles
  -> kabupaten_kota_id / organization scope
  -> resource ownership and functions
```

This is the correct foundation. The implementation should refine and harden it rather than replace it.

## Required implementation sequence

### 1. Close the biggest trust hole first

- Re-enable JWT verification in all privileged Edge Function configs.
- Require `Authorization: Bearer <token>` on all privileged functions.
- Resolve the caller from `supabaseAdmin.auth.getUser(token)`.
- Do not accept client-provided `user_id` or `role` as trusted inputs.

### 2. Normalize the role model without destructive churn

- Use `user_roles` as canonical DB role source.
- Keep current business role names:
  - `admin_provinsi`
  - `admin_kab_kota`
  - `panitia`
  - `wasit`
  - `evaluator`
- Keep legacy role values only as compatibility migration state.
- Add a deterministic role-mapping migration plan only after data validation and dry-run checks.

### 3. Establish canonical authorization resolver

Use a single authorization service pattern in the existing architecture, but keep it small and not over-abstracted.

Recommended conceptual contract:

```ts
type AuthorizationContext = {
  userId: string;
  role: AppRole | null;
  organizationId: string | null;
  profile: { kabupaten_kota_id?: string | null; registration_status?: string | null } | null;
};
```

Then resolve authorization decisions from the server-side context rather than from frontend state.

### 4. Harden RLS ownership + tenant checks

For each table that includes tenant-sensitive data:

- enforce `auth.uid()` ownership checks where appropriate
- enforce role checks with canonical helper functions
- enforce region ownership through `kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())` or equivalent approved logic
- reject broad `USING (true)` / `WITH CHECK (auth.uid() IS NOT NULL)` defaults unless the table is intentionally public

### 5. Make Edge Function authorization explicit

Every privileged function must answer:

- who is calling
- which role is required
- which resource is being mutated
- which org scope is allowed
- what action is being performed

Any function without JWT verification must be documented as intentional, not accidental.

### 6. SQL helper functions must be narrow and reviewable

If helper functions are retained, they should be:

- `security definer` only when necessary
- scoped with `set search_path = public`
- simple and deterministic
- specifically tied to role + region checks

Do not create wide helper abstractions unless they clearly reduce repeated authz mistakes.

### 7. Build security regression tests around actual DB behavior

Use Supabase local test DB or a non-production environment plus Vitest. The test suite must validate:

- no unauthenticated access
- no cross-tenant access
- no unauthorized role escalation
- no client identity override
- no privileged function execution without valid auth

### 8. Keep frontend guards as UX only

The current frontend route guards are useful for navigation and user experience. They should remain.

However, the backend and database are the actual enforcement boundary.

## Non-negotiable security gate

The implementation cannot be considered complete unless all items below are true:

- privileged Edge Functions require verified JWT
- all role checks are resolved from server-side canonical context
- tenant ownership is enforced in DB
- permissions are not acceptably based on client state
- security tests execute successfully in a real test environment
- build + typecheck pass after changes

## Implementation status

This repository is currently at the documentation and design stage, not the pass stage. It remains a PARTIAL implementation until actual policy and function hardening are executed and verified.
