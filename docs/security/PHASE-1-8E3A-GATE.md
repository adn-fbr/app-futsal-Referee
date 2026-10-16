# PHASE 1.8E.3A Isolated CLI Gate

PHASE 1.8E.3A STATUS: BLOCKED

Main Repository: PRODUCTION REFERENCE
Production Ref: `xfscfjwapwnkiinkgbjg`
Isolated CLI: PASS
Test Project: `test APP`
Test Project Ref: `shorsqyycpptxcutrqrb`
Effective CLI Target: `shorsqyycpptxcutrqrb`
Test Database: BLOCKED
Test Database Identity: BLOCKED
Test Empty State: BLOCKED
Production Changes: NONE
Production Config Modified: NO
Writes Performed: NO
Overall: BLOCKED

## Evidence

1. Created isolated workspace: `D:\AFP SULSEL\afp-sulsel-security-test-cli`.
2. Ran `supabase init` only in that workspace.
3. Ran `supabase link --project-ref shorsqyycpptxcutrqrb` only in that workspace.
4. Verified target metadata: `test APP`, `ACTIVE_HEALTHY`, PostgreSQL `17.6.1.166`, `ap-south-1`.
5. `supabase migration list --linked` returned an empty migration table for the isolated target.
6. Main `supabase/config.toml` remains `xfscfjwapwnkiinkgbjg`.
7. Schema-only dump was attempted but failed locally during Docker container creation with an overlayfs `metadata.db` input/output error.

## Counts

Application tables, views, functions, enums, policies, triggers, and application data: **NOT VERIFIED**. An empty migration ledger is not sufficient proof of an empty database.

## Commands not executed

No `db push`, `db reset`, `migration up`, `migration repair`, seed, DDL, DML, grant, revoke, fixture, user, role, policy, function, trigger, Auth, or behavioral security command was executed.

## Next exact action

Repair or replace the local Docker storage/runtime used by the schema-only dump, then rerun the read-only dump from `D:\AFP SULSEL\afp-sulsel-security-test-cli`. Alternatively provide an approved direct read-only PostgreSQL connection for catalog queries. Do not deploy the baseline until empty-state inspection passes.
