# Phase 1.8E.3 Test Database Access

## Status

**BLOCKED — linked target identity is inconsistent.**

## Evidence

- `supabase projects list` reports `test APP` (`shorsqyycpptxcutrqrb`) as linked and `AFP SULSEL` (`xfscfjwapwnkiinkgbjg`) as unlinked.
- `supabase/config.toml` still declares production project ref `xfscfjwapwnkiinkgbjg`.
- `supabase migration list --linked` connected and returned the historical migration ledger associated with production, not an empty test target.
- `supabase status` failed because no local Supabase container exists; it does not verify remote identity.

## Read-only access attempted

Project metadata and migration metadata only. No target schema dump, SQL query, DDL, DML, migration, reset, seed, fixture, or auth operation was executed after the identity conflict was detected.

## Credential safety

No password, access token, service-role key, JWT, or secret was printed or recorded.

## Required correction

An authorized operator must establish one unambiguous test-project link in an isolated deployment context, verify the effective target ref from the CLI metadata and connection, and only then perform schema-only inspection. Do not edit the production-linked workspace or run commands until the target ref is unambiguous.
