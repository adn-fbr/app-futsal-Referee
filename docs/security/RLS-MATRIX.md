# RLS MATRIX

## Summary

The app uses Supabase Postgres with RLS enabled on many tables. The risk is not absence of RLS, but inconsistency and permissiveness in policy definitions created over several migration batches.

## RLS review matrix

| Table | RLS enabled | Select policy | Insert policy | Update policy | Delete policy | Tenant restriction | Role restriction | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profiles` | Yes | Some `auth.uid() = id` and admin checks | Not always explicit | Some updates by owner/admin | Not always explicit | Partial | Partial | REVIEW |
| `user_roles` | Yes | Owner or admin | Not always explicit | Admin only | Admin only | Partial | Yes | REVIEW |
| `events` | Yes | Many authenticated/public selects | Some admin + panitia + region checks | Mixed admin and owner rules | Partial | Partial | Partial | DANGEROUS |
| `event_assignments` | Yes | Own or admin view | Mixed | Mixed ownership and admin flows | Partial | Partial | Partial | DANGEROUS |
| `honors` | Yes | Owner or admin | Owner or admin | Owner draft + admin | Owner draft + admin | Partial | Partial | REVIEW |
| `provinsi` | Yes | `FOR SELECT USING (true)` | `FOR ALL USING (public.is_admin(auth.uid()))` | same | same | No | Admin only | SAFE/REVIEW |
| `kabupaten_kota` | Yes | `FOR SELECT USING (true)` | Admin only | Admin only | Admin only | No | Admin only | REVIEW |
| `pengurus` | Yes | Admin or self | Admin or self | Region/admin rules | Some admin restrictions | Partial | Partial | REVIEW |
| `audit_logs` | Yes | Admin only | System inserts | No updates/deletes | No updates/deletes | Partial | Admin only | SAFE |
| `auth_event_logs` | Yes | Admin only | Restricted event names; authenticated `user_id` must match or anonymous events require `identifier_hash` | Not allowed | Not allowed | No | Admin read | REVIEW |
| `system_settings` | Not fully confirmable in current evidence | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | REVIEW |
| `evaluations` | Yes | Some admin/evaluator/referee filters | Admin/evaluator or owner | Mixed | Mixed | Partial | Partial | REVIEW |

## High-risk policy patterns observed

### 1. `FOR SELECT USING (true)`

This pattern appears in `provinsi` and `kabupaten_kota` policies in migration history. This may be acceptable for public reference lists, but it should be treated as a conscious public data decision, not default behavior.

### 2. `WITH CHECK (auth.uid() IS NOT NULL)`

This pattern is broader than many applications need. It allows any authenticated user to create rows when the table is not scoped to owner/tenant context.

### 3. Public auth event insert

The original `auth_event_logs` policy allowed unrestricted insertion, but the follow-up migration [supabase/migrations/20260121134535_7cfd3b2d-b133-4765-9ab2-31229811a424.sql](../../supabase/migrations/20260121134535_7cfd3b2d-b133-4765-9ab2-31229811a424.sql) narrows event names and binds authenticated `user_id` values to `auth.uid()`.

That is not a direct authorization bypass, but it undermines trust in the audit trail.

## Classification

- SAFE: `audit_logs`
- REVIEW: `profiles`, `user_roles`, `honors`, `provinsi`, `kabupaten_kota`, `pengurus`, `evaluations`
- DANGEROUS: `events`, `event_assignments`
- CRITICAL: `auth_event_logs` and any table with unscoped insert or public access by default

## Recommendation

Before any production hardening code change, rewrite policy intent as a single list of tenant-scoped, role-scoped access rules and remove permissive defaults.
