# PHASE-7 Route Protection

Existing routes are centrally classified through ProtectedRoute:

- Public: login, signup, password recovery, public referee review, and public verification routes.
- Authenticated: notifications and profile-completion routes.
- Role-protected: administration, event, evaluation, and referee modules.

The guard waits for authentication/profile/role resolution, redirects unauthenticated visitors, displays explicit profile-missing and resolution-error states, honors any allowed role for a multi-role user, and keeps pending/rejected registration handling.

Protected content does not render while its authorization state is unresolved.

Gate 7.4: PASS.
