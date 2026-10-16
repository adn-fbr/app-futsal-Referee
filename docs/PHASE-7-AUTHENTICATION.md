# PHASE-7 Authentication

## Implementation

- AuthRepository defines session restore, password sign-in, sign-out, and auth-event subscription.
- SupabaseAuthRepository delegates only to Supabase Auth APIs.
- AuthContext restores the session on startup, subscribes to changes, exposes loading/error state application-wide, and cleans up its subscription.
- Login continues to use email/password. Logout calls Supabase Auth sign-out and clears application context.

## Security

- No replacement user table or duplicate credentials were added.
- No token is manually stored by application code; Supabase client session persistence is used.
- Browser client initialization rejects a JWT whose role claim is service_role.
- The local browser key was replaced with a non-secret placeholder. An operator must supply a newly rotated publishable/anon key via secure configuration.

## Gate

BLOCKED pending credential rotation and secure publishable/anon-key provisioning.
