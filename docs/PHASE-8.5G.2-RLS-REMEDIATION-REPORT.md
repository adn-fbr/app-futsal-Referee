# PHASE 8.5G.2 — REGIONAL RLS AUTHORIZATION REMEDIATION & CROSS-REGION ISOLATION

## FINAL GATE

**BLOCKED — MIGRATION NOT APPLIED DUE REMOTE MIGRATION HISTORY DRIFT**

## ROOT CAUSE CONFIRMED

The existing `event_assignments` admin policies call `is_admin()`. The canonical `is_admin()` helper returns true for both `admin_provinsi` and `admin_kab_kota`, so regional Admin Kab/Kota sessions receive global assignment access.

Canonical regional ownership is `profiles.kabupaten_kota_id`, exposed through `get_user_kabupaten_kota(auth.uid())`. The canonical event relationship is `event_assignments.event_id -> events.id -> events.kabupaten_kota_id`.

## REMEDIATION PREPARED

Migration: `supabase/migrations/20260908184851_phase_8_5g_2_regional_rls_authorization.sql`

It scopes Admin Kab/Kota reads and writes to the event's `kabupaten_kota_id`, preserves Admin Provinsi access, preserves panitia's existing admin path, and supplies `WITH CHECK` protection against event-region escape. Referee access remains governed by the existing referee policies.

## APPLY BLOCKER

The linked project was positively verified as `shorsqyycpptxcutrqrb`, but `supabase db push --dry-run` reported remote migration version `20260908085000` missing locally. Applying with `--include-all` or repairing migration history blindly could apply unrelated SQL, so no migration was applied.

## LIVE STATUS

- Pre-remediation leakage: confirmed, Admin Kab/Kota A read/update Region B
- Post-remediation RLS validation: NOT EXECUTED
- Cross-region isolation: NOT PROVEN
- Production operations: 0
- Non-Production RLS mutations: 0
- Schema mutations: 0
- Migration executions: 0

## NEXT ACTION

Reconcile the remote migration history with the local migration directory, review the missing remote version, then apply only the prepared remediation to the verified Non-Production project. Rerun authenticated Admin A/B read, direct-ID, update, and `WITH CHECK` tests afterward.
