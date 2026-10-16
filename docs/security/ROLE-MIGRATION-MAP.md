# ROLE MIGRATION MAP

## Objective

Map legacy values to the canonical role set without breaking current repository behavior.

## Canonical role vocabulary

The canonical business vocabulary used by the application is:

- `admin_provinsi`
- `admin_kab_kota`
- `panitia`
- `wasit`
- `evaluator`

## Legacy-to-canonical mapping

| Legacy Role | Current Role | Tables | Policies | Functions | Frontend | Migration Required |
| --- | --- | --- | --- | --- | --- | --- |
| `admin` | `admin_provinsi` | `user_roles`, `profiles` | early admin checks in migration history | admin checks in auth functions | [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx) | Yes, compatibility migration + validation |
| `referee` | `wasit` | `user_roles`, assignment tables, referee views | earlier referee policy definitions | matcher/assignment logic and views | [src/App.tsx](../../src/App.tsx), [src/pages/Referees.tsx](../../src/pages/Referees.tsx) | Yes, compatibility migration + validation |

## Evidence of current role usage

- Legacy role definitions: [supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql)
- Expanded role addition: [supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql](../../supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql)
- Role normalization in app: [src/contexts/AuthContext.tsx](../../src/contexts/AuthContext.tsx)
- Role-driven UI: [src/App.tsx](../../src/App.tsx)

## Canonical role decision

The canonical role vocabulary must be derived from the actual business roles already used in the app and database, not from a new invented taxonomy.

## Migration rules

1. Do not delete legacy role values immediately.
2. Treat `admin` and `referee` as compatibility states until data validation is complete.
3. Create a migration that backfills legacy rows into canonical roles.
4. Reconcile any role-dependent assumptions in RLS policies and Edge Function checks.
5. Add a validation query to confirm no stale legacy role values remain before removing compatibility code.

## Recommended migration sequence

```text
existing user_roles
  -> identify legacy rows
  -> backfill to canonical role values
  -> validate counts and tenant scope
  -> update helper functions
  -> update RLS policies
  -> remove legacy compatibility once verified
```

## Risk note

The primary risk is not a missing role enum. The risk is mixed semantics across historical and current migration states. This must be resolved carefully because role checks are used in both RLS and server-side functions.
