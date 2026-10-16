# Phase 1.6 Fresh Database Verification

## Result

**FAIL / BLOCKED**

## Attempt

Command:

```text
supabase start --workdir "D:\\AFP SULSEL\\app-futsal" --debug
```

Environment: local Supabase only, with Docker server `29.7.2` and Supabase CLI `2.67.1`. Production was not addressed.

## Evidence

- The migration runner began applying the repository chain.
- Initialization failed at `20260103165842_remix_migration_from_pg_dump.sql`.
- Exact conflicting object: `public.app_role`.
- PostgreSQL error: type already exists, SQLSTATE `42710`.
- `supabase status` afterward reported no initialized `supabase_db_xfscfjwapwnkiinkgbjg` container.
- No migrations were successfully recorded as a complete fresh initialization.

## Counts

- Migration files discovered: 55.
- Successful complete migrations: 0.
- Failed migration chain: 1.
- Usable final schema: no.
- Security migration `20260906063833_phase_1_4_public_settings_boundary.sql`: not applied.

## Resolution status

No unsafe resolution was attempted. The historical chain remains unchanged. A later corrective migration cannot run before the failure, and marking the failing migration applied would produce an unproven/incomplete schema.

## Required next verification

Repeat this document after the approved explicit non-production baseline is available. The acceptance test must rebuild two empty databases, apply the complete supported baseline and post-baseline migrations, and compare migration history plus catalog objects.

Verification timestamp: 2026-09-06 (local run; exact clock time is recorded by the terminal session).
