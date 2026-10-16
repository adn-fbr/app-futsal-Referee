# PHASE 7.4J-D0.9 Auth Strategy

Future non-production execution must use synthetic users and synthetic identities only. No Production Auth export or user copy is permitted.

- `auth.users`: external Supabase-managed boundary; do not fabricate DDL.
- `profiles.id`: link to synthetic Auth UUIDs.
- `user_roles.user_id`: link to the same synthetic identities.
- `pengurus.user_id`: link only to approved synthetic identities.
- Test roles: use canonical `app_role` values only; legacy role mapping requires governance.
- Credentials: generated and held outside repository artifacts.

Status: **DESIGN RESOLVED, EXECUTION NOT AUTHORIZED**.