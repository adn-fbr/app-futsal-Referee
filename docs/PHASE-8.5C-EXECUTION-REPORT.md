# PHASE 8.5C — CANONICAL TYPE REGENERATION & TRANSACTION FUNCTION IMPLEMENTATION

## Final Gate

**BLOCKED**

## Canonical type source

The linked CLI target was verified as Non-Production and `supabase gen types --linked --lang=typescript --schema public` completed successfully with exit code 0. The temporary generated output confirmed `check_duplicate_event` has `p_kota_id`, `p_location`, `p_name` and boolean return. The temporary output was removed; application generated types were not replaced because semantic compatibility is unresolved.

## Duplicate contract

All known callers remain unreconciled: `useEvents.ts`, `EventEdit.tsx`, and generated `src/integrations/supabase/types.ts`. Canonical parameter mapping cannot be safely completed because the canonical function body references `events.kota_id`, while canonical `events` table definition exposes `kabupaten_kota_id` and no `kota_id`. No fallback mapping was invented.

## Transaction architecture

No transaction function, RPC, migration, procedure, Edge Function, or RLS change was created. The approved design remains a governed PostgreSQL function/RPC, preferably SECURITY INVOKER, but it cannot be implemented safely until the event scope/parameter inconsistency and idempotency contract are resolved.

## Safety

- Exact target: `shorsqyycpptxcutrqrb`.
- Production queries/mutations/auth/storage/deployments: 0.
- Non-Production type-generation read: 1.
- Non-Production data mutations: 0.
- Schema/RLS/RPC/migration changes: 0.
- Source/config changes: 0.

## Validation

Baseline remains: TypeScript PASS, 10 files/28 tests PASS, build PASS, lint pre-existing 66 errors/11 warnings. No live transaction/RLS/browser tests were executed because no implementation or fixture was available.

## Remaining blockers

1. Canonical function body/schema semantic mismatch (`kota_id` vs `kabupaten_kota_id`).
2. Approved parameter mapping and canonical type regeneration integration.
3. Idempotency/duplicate retry design.
4. Approved Non-Production fixture identities and live RLS/mutation channel.

## Recommended Phase 8.5D

**PHASE 8.5D — CANONICAL EVENT SCOPE DECISION & TRANSACTION FUNCTION APPROVAL**

Resolve the canonical schema/function inconsistency first. Then approve the exact function signature, security mode, idempotency policy, and migration SQL before implementation.

Production UAT: **NOT READY**.

BLOCKED
