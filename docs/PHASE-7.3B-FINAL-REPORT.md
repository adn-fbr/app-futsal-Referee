# PHASE-7.3B Business Contract Blocker Resolution

Version: v1.0.0

## STATUS: PASS

### BLOCKER 1 - increment_view_count

Classification: `SCHEMA_GAP`.

Evidence: `useDiscussions.ts:118` calls `supabase.rpc("increment_view_count", { topic_id: id })`; historical migration defines `public.increment_view_count(uuid) RETURNS void`; the function is absent from the immutable canonical baseline and dependency graph.

Resolution: Definitively identified as a database function and definitively classified as a canonical schema gap. No function was created.

### BLOCKER 2 - public_system_settings call-site A

Classification: `SCHEMA_GAP`.

Evidence: `useSettings.ts:30` selects all columns from `public_system_settings`; historical migration and generated types identify it as a view over `public.system_settings`; it is absent from the immutable baseline.

Resolution: Definitively classified as a missing canonical view reference. It was not equated to `public.system_settings` and no schema was changed.

### BLOCKER 3 - public_system_settings call-site B

Classification: `SCHEMA_GAP`.

Evidence: `useSettings.ts:45` selects by `key` and uses `maybeSingle` against the same generated/historical view.

Resolution: Same definitive schema-gap classification as call-site A.

### BLOCKER 4 - systemRules.ts dynamic target

Classification: `CANONICAL`.

Possible targets: `public.profiles`, `public.events`, `public.honors`, `public.event_assignments`.

Resolution: Both dynamic update functions use a closed literal union. All possible values map to canonical baseline tables; no caller or external input expands the set. Security review remains required for repository migration.

### BLOCKER 5 - unresolved RPC

Function: `increment_view_count`.

Signature: `public.increment_view_count(uuid)`; return `void`.

Classification: `SCHEMA_GAP`.

Resolution: Exact identity and return type are established from the historical migration, but the object is absent from the immutable baseline. No function was fabricated.

## Gate totals

- Resolved/evidence-cleared blockers: **5/5**
- Unresolved blockers: **0/5**
- RPC contracts: **25/25** identified; 24 canonical baseline functions and 1 definitive schema gap
- Dynamic targets: **8/8** value-to-table mappings resolved
- Migration impact: **CRITICAL** for dynamic updates; **HIGH** for schema-gap references
- Determinism: **PASS**

Application code: **NOT MODIFIED**.

Database, migrations, baseline, and dependency graph: **NOT MODIFIED**.

Production: connection **NOT USED**; mutation **NOT EXECUTED**; deployment **NOT AUTHORIZED**.

Canonical baseline: **IMMUTABLE**.

**NEXT GATE: PHASE-7.4 BUSINESS REPOSITORY MIGRATION**

Phase 7.4 may begin planning only. It must not create the schema-gap objects without a separate contract decision and authorization.
