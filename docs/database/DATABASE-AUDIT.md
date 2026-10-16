# DATABASE AUDIT

## Scope

The database layer is primarily managed through Supabase migrations in [supabase/migrations](../../supabase/migrations), with generated schema types in [src/integrations/supabase/types.ts](../../src/integrations/supabase/types.ts).

## Observed schema domain

Core operational tables include:

- `profiles`
- `user_roles`
- `events`
- `event_assignments`
- `event_approvals`
- `honors`
- `provinsi`
- `kabupaten_kota`
- `pengurus`
- `audit_logs`
- `system_settings`
- `evaluations`
- `referee_cards`
- `notifications`

## Key findings

### 1. Role model has drifted over time

The earliest migration defines a legacy enum:

- `app_role` with `('admin', 'referee')` in [supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql](../../supabase/migrations/20260103052354_5c53bda3-9ac3-419b-a632-62393465a94a.sql)

Later migrations extend it to:

- `admin_provinsi`
- `admin_kab_kota`
- `panitia`
- `wasit`
- `evaluator`

This is visible in [supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql](../../supabase/migrations/20260110162403_ab348fb7-327f-49bb-8ec1-a679de59f8ef.sql).

Risk: multiple generations of role semantics can coexist in code and DB, leading to inconsistent permissions.

### 2. RLS is enabled but not uniformly strict

The migrations enable RLS for many core tables, but there are also permissive policies such as:

- `FOR SELECT USING (true)`
- `FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)`
- public inserts into `auth_event_logs`

Examples are in [supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql](../../supabase/migrations/20260110162547_a4f781d5-ec4d-47a3-8ec5-ec8f37f11ba0.sql) and [supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql](../../supabase/migrations/20260121134513_0ccc0300-5231-4107-a83f-282fbc291dde.sql).

Risk: permissive policies create unauthorized read/write paths if the environment is not configured carefully.

### 3. Schema evolution is not centralized

The application contains many incremental migration files. This indicates iterative development rather than a single cleaned canonical schema. Some tables and policies were added, dropped, or altered repeatedly.

Risk: hidden drift, outdated triggers, and logic not fully reconciled with the application code.

### 4. Data integrity concerns around mutable business state

The app includes status fields such as:

- `registration_status`
- `status` in `events`
- `status` in `event_assignments`
- `status` in `honors`
- `status` in `evaluations`

These are mutable fields and are used across approval flows. The schema currently stores them as text fields rather than a strict domain-backed state machine, which increases risk of invalid transitions.

### 5. Some settings are treated as general-purpose storage

The table `system_settings` stores configuration with fields like `resend_api_key` and `smtp_password` in [src/hooks/useSettings.ts](../../src/hooks/useSettings.ts). This pattern is operationally convenient but should be treated as secret-bearing storage requiring extra safeguards.

## Good database practices identified

- Foreign keys are used in several critical tables
- RLS enforcement exists in many core tables
- `updated_at` triggers exist for many tables
- `auth_event_logs` is isolated from general access
- There are explicit admin role helper functions such as `is_admin` and `is_admin_provinsi`

## Database Risk Rating

Overall database health: YELLOW / RED depending on enforcement verification

### High-risk concerns

- inconsistent role definitions
- permissive RLS patterns in migration history
- broad and repeated schema changes without clear canonical model
- mutable operational state without a strict state machine layer

## Recommended immediate DB actions

1. Document the canonical role model and remove legacy role values from active use.
2. Audit every `FOR SELECT USING (true)` and `WITH CHECK (auth.uid() IS NOT NULL)` policy.
3. Define a single source of truth for approval and assignment status.
4. Add migration-level tests for auth, region, and tenant isolation checks.
5. Treat `system_settings` secrets as protected configuration, not general state.

## Conclusion

The database is feature-complete enough to support the application, but it shows the classic signs of a grown product: repeated incremental migrations, evolving role semantics, and a need for explicit authorization enforcement discipline.
