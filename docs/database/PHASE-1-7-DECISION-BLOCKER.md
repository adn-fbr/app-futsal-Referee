# Phase 1.7 Decision Blocker

## Decision required

Approve one canonical current schema source and the migration boundary used to create future non-production databases.

## Conflicting definitions

- `public.app_role`: legacy `admin/referee` versus current application `admin_provinsi/admin_kab_kota/panitia/wasit/evaluator`.
- `profiles`, `user_roles`, `events`, `honors`, and `event_assignments`: legacy base definitions versus pg-dump definitions plus later column/constraint changes.
- Function signatures and bodies: repeated drop/recreate and `CREATE OR REPLACE` migrations.
- Views/triggers/policies: repeated create/drop/recreate changes with different security predicates.
- Tenant membership: distributed profile/regional fields rather than a single explicit membership contract.
- Settings boundary: Phase 1.4 migration is staged but cannot be tested against a complete baseline.

## Evidence for each option

### Option 1: replay historical migrations
Fails immediately with duplicate `public.app_role` and is expected to encounter further overlap. Rejected.

### Option 2: use the pg-dump migration as canonical
The dump contains the current-looking role/domain surface and matches generated application types in places, but its provenance and final policy/constraint/function compatibility are not independently proven. Not approved without catalog comparison.

### Option 3: use the legacy first migration as canonical
The application and security resolver depend on regional roles and tables not present in that minimal legacy base. Rejected.

### Option 4: approved explicit baseline from a trusted non-production catalog
Preserves historical evidence and can represent the actual intended current schema, but requires a trusted source and review. Recommended.

## Application dependencies

Frontend and Edge Functions require the generated table/view/RPC surface documented in `PHASE-1-7-CANONICAL-OBJECT-INVENTORY.md`, including regional tables, canonical roles, events, assignments, honors, evaluations, notifications, cards, discussions, audit, and settings objects.

## Security implications

Choosing the wrong enum or role mapping can deny legitimate access or grant unintended access. Choosing the wrong policy set can weaken tenant isolation. Choosing the wrong function body can create SECURITY DEFINER or resource-scope bypasses. Therefore a guessed baseline is unsafe.

## Recommended option

Option 4: establish a dedicated non-production database or provide an approved schema snapshot, then derive and review the baseline from that source. Preserve the current migration directory as immutable archival history and start future migrations after a recorded boundary.

## Risks

- A supplied snapshot may itself contain drift or production data.
- A baseline may omit managed Supabase objects if catalog export is incomplete.
- Existing environments may not share the same lineage and need a separate rollout plan.

## Exact human decision required

The database owner must provide or approve:

1. The trusted non-production project/database whose current schema is intended.
2. Whether the five-role model is authoritative and how legacy `admin`/`referee` rows map.
3. Whether `profiles.kabupaten_kota_id` remains the tenant boundary or a membership model is required.
4. The baseline boundary and approved post-boundary migrations.
5. Permission to generate the baseline artifact from that isolated source.

Until these decisions are supplied, do not create `supabase/baseline`, initialize Database A/B, or run runtime security tests.
