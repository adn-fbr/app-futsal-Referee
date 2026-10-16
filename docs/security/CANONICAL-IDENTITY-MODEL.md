# CANONICAL IDENTITY MODEL

## Source-of-truth decision

The actual identity source in this repository is the Supabase Auth user record, not a custom identity table.

Canonical chain:

```text
auth.users
  └── profiles (one-to-one by id)
       └── user_roles (many rows per user)
            └── tenancy metadata (e.g. kabupaten_kota_id / organization context)
```

## Evidence from the codebase

- Auth provider: [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- Profile table: [supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql)
- Role table: same migration file
- Organization scope: [supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql](../../supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql)

## Identity model

### 1. User identity

- `auth.users.id` is the canonical user ID
- This is the identity that all role assignments and profile references bind to
- The frontend should not invent a separate user identity

### 2. Profile identity

- `public.profiles` is the user profile table, representing the human record
- It stores fields such as:
  - `full_name`
  - `kabupaten_kota_id`
  - `is_profile_complete`
  - `registration_status`
  - `requested_role`
- This table is the current identity/profile augmentation layer for auth users

### 3. Membership / scope identity

The repository already uses organization-like identity metadata via:

- `profiles.kabupaten_kota_id`
- `provinsi`
- `kabupaten_kota`
- `pengurus`

This means the tenant/context is already represented by existing tables, not by creating a parallel identity model.

### 4. Role identity

- `public.user_roles` is the current role source table
- A user may hold multiple rows
- A single user can therefore be part of a multi-role model in the database even if frontend selects one primary role

## Canonical interpretation

The actual canonical identity model should be:

```text
auth.users
  -> profiles
  -> user_roles
  -> kabupaten_kota_id / region membership
  -> organization/admin context
```

This is the correct model for the current repository because it matches the real schema and is already heavily used by the application.

## Ambiguity to document

The repository does not present a fully explicit `organization_memberships` table with a single canonical membership contract. Instead, the effective membership model is distributed across:

- `profiles.kabupaten_kota_id`
- `user_roles`
- `provinsi` and `kabupaten_kota`
- regional filters and admin checks in SQL functions and hooks

This is an architectural ambiguity and should be treated as a known blocker for a strict tenant model until it is normalized.

## Security recommendation

Do not create a new parallel identity table unless the existing model is proven insufficient. For this phase, use the existing tables as the canonical identity and tenant boundary source while documenting the ambiguity as a migration follow-up item.
