# Phase 8.5F Migration Report

Migration: `20260908120844_phase_8_5f_duplicate_event_contract.sql`

## Scope

The migration contains one `CREATE OR REPLACE FUNCTION` statement only. It changes the canonical function body and security attributes, references `public.events.kabupaten_kota_id`, and contains no INSERT, UPDATE, DELETE, MERGE, COPY, table, policy, or extra-function statements.

## Execution

- Linked project verified as `shorsqyycpptxcutrqrb`.
- Exact pre-change Non-Production function inspected: three args, boolean, PL/pgSQL, SECURITY DEFINER, broken `kota_id` reference.
- Migration dry-run was blocked by existing local/remote migration-history drift; historical migrations were not replayed.
- The reviewed SQL was applied directly through the linked newer Supabase CLI SQL channel.
- Migration version `20260908120844` was then recorded as applied in Non-Production migration history.

## Post-apply identity

Exactly one `check_duplicate_event(text,text,text)` exists. It returns boolean, is `STABLE SECURITY INVOKER`, uses `SET search_path TO 'public'`, and references `public.events.kabupaten_kota_id`.

Production was not accessed.
