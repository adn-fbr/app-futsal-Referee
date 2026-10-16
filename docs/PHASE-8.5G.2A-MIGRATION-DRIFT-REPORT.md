# PHASE 8.5G.2A — NON-PRODUCTION MIGRATION HISTORY DRIFT RECONCILIATION & RLS MIGRATION APPLICATION

## FINAL GATE

**BLOCKED — APPROVED RLS MIGRATION NOT APPLIED**

Target project was positively linked as `shorsqyycpptxcutrqrb`. Production was not accessed.

## DRIFT FINDING

Remote migration history contains `20260908085000`, while the local `supabase/migrations/` directory does not. `supabase migration list --linked` also shows many local-only versions, so a normal `db push` would not be limited to the approved RLS migration.

The recovered workspace copy `tmp/d1d6-work/supabase/migrations/20260908085000_canonical_baseline_reconstruction.sql` is classified **CLASS B — HISTORICAL MIGRATION WITH VERIFIED LOCAL SOURCE**. Its SQL is a baseline reconstruction containing `DROP SCHEMA public CASCADE` and extensive DDL/function/policy/data-shape operations. It is unrelated to the regional RLS remediation and MUST NOT be replayed.

## APPLY RESULT

- `supabase db push --linked --dry-run`: blocked by remote-only migration drift
- `supabase db push --linked --dry-run --include-all`: not used for apply; dry-run also blocked
- `supabase migration repair`: not executed
- `supabase db reset`: not executed
- database query channel: unavailable (`Connection not found`)
- approved migration applied: no

Because no safe single-migration apply channel was available, the approved RLS SQL was not executed. This is an intentional fail-closed stop.

## REMEDIATION FILE

[20260908184851_phase_8_5g_2_regional_rls_authorization.sql](../supabase/migrations/20260908184851_phase_8_5g_2_regional_rls_authorization.sql)

The migration remains ready for a controlled apply after migration drift is reconciled or an authenticated Non-Production SQL channel is restored.

## REGRESSION

- TypeScript: PASS
- Tests: PASS, 16 files / 54 tests
- Build: PASS
- Lint: BASELINE FAIL, 68 errors / 12 warnings

## SAFETY

Production queries, mutations, Auth, storage, migrations, and deployments: 0. Non-Production RLS mutations: 0. No application logic, schema, RLS, or production baseline was modified.
