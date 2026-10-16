# AUTHORIZATION MODEL

## Goal

Use one canonical authorization mechanism that follows the actual repository architecture and data model.

## Canonical flow

```text
authenticated user
  -> membership context
  -> organization / region scope
  -> canonical role
  -> action permission
  -> resource ownership / tenant validation
  -> server enforcement
  -> RLS enforcement
```

## Source-of-truth chain

```text
auth.users
  -> profiles
  -> user_roles
  -> kabupaten_kota_id / organization scope
  -> resource table ownership
```

## Principle

Frontend can decide what to show, but it cannot be the enforcement boundary.

## Recommended server-side authorization contract

```ts
export type AuthzContext = {
  userId: string;
  role: "admin_provinsi" | "admin_kab_kota" | "panitia" | "wasit" | "evaluator" | null;
  organizationId: string | null;
  profile: {
    kabupaten_kota_id?: string | null;
    registration_status?: string | null;
    is_profile_complete?: boolean;
  } | null;
};
```

Then resolve authorization as:

```ts
const can = {
  isAuthenticated: !!userId,
  isAdminProvinsi: role === "admin_provinsi",
  isAdminKabKota: role === "admin_kab_kota",
  isPanitia: role === "panitia",
  isWasit: role === "wasit",
  isEvaluator: role === "evaluator",
  inTenant: organizationId !== null,
};
```

## Why this is the right model for this repo

The app already has the following reality in place:

- user identity originates in Supabase Auth
- profile data and tenant metadata exist in `profiles`
- role membership exists in `user_roles`
- region and organization context is represented via `kabupaten_kota_id` and similar metadata

This means a canonical, small authorization layer is the correct business fit without inventing a large new framework.

## Anti-pattern to avoid

Avoid scattered checks like:

```ts
user.role === "admin_provinsi"
```

throughout UI and hooks where the actual source of truth is not validated server-side.

## Server-side enforcement rule

Every privileged mutation must validate:

- `WHO` from `auth.uid()` / verified JWT
- `WHAT ROLE` from canonical role lookup
- `WHICH ORGANIZATION` from resolved tenant scope
- `WHICH RESOURCE` from target row ownership or table relation
- `WHICH ACTION` from explicit policy or server function logic

## Current repo evidence

- Auth identity state: [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- Route-level role gating: [src/App.tsx](../../src/App.tsx)
- Edge function identity checks: [supabase/functions/create-user/index.ts](../../supabase/functions/create-user/index.ts)
- DB policy patterns: [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql)

## Decision

This phase should implement a narrow authorization context centered on server-side session identity, canonical role resolution, and explicit tenant validation. The frontend remains an auxiliary UX layer, not the enforcement point.
