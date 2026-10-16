# PHASE-7.3A Business Contract Reference Resolution

Version: v1.0.0
Status: BLOCKED

## Scope and evidence

This is a read-only static resolution of the five blockers recorded by the Phase 7.3 inventory. Evidence was limited to the immutable `CANONICAL-RUNTIME-BASELINE.sql`, its manifest, `production-schema.sql`, `PRODUCTION-FULL-DEPENDENCY-GRAPH.json`, and application source. No database connection, SQL execution, migration, or application edit was performed.

## Exact blockers

| ID | File | Operation | Target | Classification | Baseline Evidence | Required Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| B-001 | `src/hooks/useDiscussions.ts:118` | `supabase.rpc("increment_view_count", ...)` | `public.increment_view_count(uuid)` | NOT_FOUND_IN_BASELINE | Not present in canonical baseline or manifest; present in historical migration `20260110162707_d7177856-78a2-4504-b0ef-ac5c63a5a280.sql` | Confirm an authorized canonical contract or remove the stale application reference in a later phase; do not create the function here |
| B-002 | `src/hooks/useSettings.ts:30` | `supabase.from("public_system_settings").select(...)` | `public.public_system_settings` | NOT_FOUND_IN_BASELINE | Not present in canonical baseline or manifest; present as a view in historical migration `20260906063833_phase_1_4_public_settings_boundary.sql` | Confirm whether the view belongs in the canonical contract; do not add it to the baseline here |
| B-003 | `src/hooks/useSettings.ts:45` | `supabase.from("public_system_settings").select(...)` | `public.public_system_settings` | NOT_FOUND_IN_BASELINE | Same missing baseline evidence as B-002 | Resolve once for both call-sites through contract governance; no schema change here |
| B-004 | `src/lib/systemRules.ts:8` | `supabase.from(table).update(...)` | Dynamic table union: `profiles`, `events`, `honors`, `event_assignments` | AMBIGUOUS | Static source constrains four possible public tables but does not produce one canonical target per invocation | Split into explicit repository operations or provide a canonical operation-to-table mapping in a later migration phase |
| B-005 | `src/lib/systemRules.ts:21` | `supabase.from(table).update(...)` | Dynamic table union: `profiles`, `events`, `honors`, `event_assignments` | AMBIGUOUS | Same four-value union and no runtime call-site evidence resolving each invocation | Same as B-004; do not guess a table identity |

B-002 and B-003 are separate blockers because the inventory records two operations, even though they share one missing object. B-004 and B-005 are separate blockers because they are separate update operations.

## Not-found resolution

`increment_view_count` is category H / application contract gap: it is a historical migration definition but absent from the immutable baseline and production schema evidence supplied to this phase. `public_system_settings` is category H / contract gap for the same reason: historical migration evidence exists, but canonical baseline evidence does not. No evidence justifies classifying either as Production-present, renamed, test-only, or external-managed.

Resolution: B-001, B-002, and B-003 are `SCHEMA_GAP`, remain unresolved, and block the gate.

## Dynamic target resolution

`softDelete` and `restoreRecord` accept `table: 'profiles' | 'events' | 'honors' | 'event_assignments'` and issue an update of `deleted_at` by `id`. The variable is supplied by callers at runtime; static inspection does not establish one intended object for either operation. The operations are therefore `UNRESOLVED` and remain `BLOCKED_AMBIGUOUS_REFERENCE`.

## Gate result

Resolved blockers: 0/5. Unresolved not-found operations: 3. Unresolved ambiguous operations: 2. No fabricated schema or canonical identity was introduced.
