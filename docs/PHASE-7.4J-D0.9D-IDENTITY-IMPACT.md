# PHASE 7.4J-D0.9D Identity Impact

Canonical relationships remain:

- `profiles.id -> auth.users.id`.
- `user_roles.user_id -> auth.users.id`.
- `pengurus.user_id -> auth.users.id`.

Remote state: profiles and user_roles exist with zero rows; pengurus is absent; Auth row state is unknown. No orphaned profile or role rows were observed because those tables are empty. Auth/pengurus relationship status is unknown.

`IDENTITY_RELATIONSHIPS = UNKNOWN` because empty application tables cannot prove Auth emptiness or resolve managed Auth relationships.