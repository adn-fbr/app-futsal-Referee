# PHASE 7.4J-D0.9C Identity Relationships

Canonical relationships only:

- `profiles.id -> auth.users.id`.
- `user_roles.user_id -> auth.users.id`.
- `pengurus.user_id -> auth.users.id`.

Remote state:

- `profiles`: EXISTS, 0 rows; no orphaned references observed.
- `user_roles`: EXISTS, 0 rows; no orphaned references observed.
- `pengurus`: ABSENT; row and relationship state UNKNOWN.
- `auth.users`: managed boundary present in schema evidence; row count unavailable.

No additional identity table or relationship is introduced. Identity status remains **GOVERNANCE_REQUIRED** because Auth enumeration and `pengurus` state are unresolved.