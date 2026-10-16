# Phase 1.8E Production Safety Check

## Production identity

- Ref: `xfscfjwapwnkiinkgbjg`
- Name: `AFP SULSEL`
- Environment: PRODUCTION / LIVE
- Mode: READ-ONLY SOURCE OF RUNTIME TRUTH

## Required preflight

Before every Supabase command or SDK operation, resolve `TARGET_PROJECT_REF` and target URL. Continue only when the target is present, explicitly non-production, and not equal to `xfscfjwapwnkiinkgbjg`.

## Forbidden production operations

No migration, db push/reset, DDL, DML, grant/revoke, policy/function/trigger/role change, Auth change, fixture creation, test account, or behavioral security probe may target production.

## Current evidence

The project was used only for read-only project metadata, migration metadata, and schema-only catalog export. No production database modification occurred.

## Failure response

If a target resolves to the production ref or the environment marker is absent/ambiguous: stop with `PRODUCTION SAFETY BLOCK`. Do not retry with alternate credentials or commands.
