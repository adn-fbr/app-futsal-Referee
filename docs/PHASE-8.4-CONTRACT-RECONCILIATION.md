# Contract Reconciliation

## E1 — check_duplicate_event

Canonical local schema: `public.check_duplicate_event(p_kota_id text, p_location text, p_name text) RETURNS boolean`, body checks exact existence by kota/location/name. Application `useEvents.ts` sends historical five-argument named parameters and expects an array; `EventEdit.tsx` displays duplicate record details.

Status: **BLOCKED**. The application behavior can be adapted without schema change, but generated `src/integrations/supabase/types.ts` also contains the historical signature. Regenerating types requires an approved canonical type source; hand-editing generated types is not acceptable. Do not create or overload the RPC. Next action: regenerate types from approved canonical Non-Production/source, then adapt hook/UI to boolean semantics and add unit tests.

## E2 — increment_view_count

`useDiscussions.ts` invokes `increment_view_count(uuid)`, absent from canonical inventory. Status: **SCHEMA GAP / BLOCKED**. Do not create it automatically. Decide whether view count is essential, remove/defer the call, or obtain separately governed contract approval.

## E3 — public_system_settings

`useSettings.ts` reads historical `public_system_settings` while writes target `system_settings`. Status: **SCHEMA GAP / BLOCKED**. Identify current consumers and canonical replacement before changing UI or recreating a view.

## No schema changes

No RPC, view, table, migration, RLS policy, or generated type was modified in Phase 8.4.
