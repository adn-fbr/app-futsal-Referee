# PHASE 7.4J-D0.7 Auth Topology

Status: **REMOTE_NON_PRODUCTION_AUTH REQUIRED; STATE UNKNOWN**.

- The application uses Supabase Auth sessions and password sign-in.
- `auth.users` is an externally managed Auth boundary.
- `profiles` and `user_roles` are application tables linked to Auth identities.
- Local Auth is absent.
- The application client targets remote non-production, so intended verification belongs there.
- Remote Auth users, profile rows, role rows, and empty-state are unverified.

No users were created, exported, inspected in Production, or modified.