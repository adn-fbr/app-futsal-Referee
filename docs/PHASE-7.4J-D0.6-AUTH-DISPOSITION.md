# PHASE 7.4J-D0.6 Auth Disposition

STATUS: BLOCKED

## Repository evidence

- `SupabaseAuthRepository` calls `auth.getSession`, `auth.signInWithPassword`, `auth.signOut`, and Auth state subscriptions.
- `user-profile-repository.ts` reads `profiles` by Auth user ID.
- `user-role-repository.ts` reads `user_roles` by Auth user ID.
- Application routes and profile completion flows depend on identity, profiles, and roles.
- Seed/test code references test users and non-production guards, but no users were created.

## Classification

`AUTH_RECONSTRUCTION_REQUIRED`.

The local Auth service and `auth.users` are absent from the Docker inventory. Auth-owned objects must remain externally managed; no internal `auth.users` definition is fabricated in the reconstruction model. Test users, profile rows, role rows, credentials, and their disposition are unresolved. No Production Auth data was accessed.