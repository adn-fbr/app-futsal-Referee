# PHASE 7.4J-D0.9A Auth Disposition

Status: **GOVERNANCE_REQUIRED; AUTH USERS = EXTERNAL MANAGED**.

- `auth.users` remains Supabase-managed; no DDL or data export is permitted.
- The remote schema contains the Auth boundary.
- Auth user count was not enumerated; identity PII was not retrieved.
- `profiles` and `user_roles` counts are 0 in observed remote tables.
- `pengurus` is absent, so its relationship is UNKNOWN.
- Broken identity relationships cannot be evaluated without Auth row IDs and a present `pengurus` table.

Future strategy: synthetic Auth identities only, linked to synthetic `profiles`, `user_roles`, and `pengurus` rows. No users were created, deleted, copied, or modified.