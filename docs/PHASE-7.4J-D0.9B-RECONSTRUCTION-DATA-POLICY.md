# PHASE 7.4J-D0.9B Reconstruction Data Policy

Future execution policy only:

- Schema: canonical Production baseline, without Production data.
- Data: synthetic non-production fixtures only.
- Auth: synthetic identities only.
- Application data: deterministic synthetic fixtures only.
- Storage: synthetic buckets/files only after approval.
- RLS: canonical Production policies, enforced.
- Functions/views/triggers/indexes: canonical Production definitions.
- `auth.users`: external-managed; never fabricate DDL or copy Production users.

No executable seed SQL is included. No seed, Auth, Storage, RLS, or database mutation occurred.