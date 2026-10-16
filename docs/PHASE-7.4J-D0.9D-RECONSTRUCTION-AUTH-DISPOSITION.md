# PHASE 7.4J-D0.9D Reconstruction Auth Disposition

Future reconstruction remains:

- Auth: synthetic identities only.
- Profiles/user_roles/pengurus: synthetic rows linked to synthetic Auth UUIDs.
- Application data: synthetic fixtures only.
- Storage: synthetic fixtures only.
- RLS: canonical definitions enforced.

Current disposition: **AUTH_RECONSTRUCTION_DISPOSITION = GOVERNANCE_REQUIRED**. Auth users must not be deleted or discarded by assumption. No Auth mutation is authorized.