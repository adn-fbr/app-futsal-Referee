# PHASE-7 Repository Productionization

The Phase 7 auth/profile/role paths now use production repositories and authenticated user context. They do not fall back to demo data when Supabase fails.

Remaining scope is blocked:

- business hooks still issue direct Supabase queries;
- several mutations accept user IDs from callers and require a separate repository/business-module refactor;
- no existing DemoRepository provider was found to classify or retain explicitly.

No fabricated production IDs, organization IDs, club IDs, tenant IDs, or membership IDs were introduced.

Gate 7.5: BLOCKED.
