# PHASE 8.1 — APPLICATION BASELINE AUDIT

## 1. Executive Summary
This read-only audit records the current React/Vite application baseline before further development. The repository contains a substantial implemented application with Supabase Auth, role-aware route guards, direct Supabase data access, 55 page components, 33 hooks, and a small auth-focused repository layer. No source, SQL, package, database, or deployment artifact was modified.

Overall gate: **PASS — APPLICATION BASELINE AUDIT COMPLETE** with open P1/P2 findings documented below.

## 2. Environment Verification
- Authorized non-production reference: `shorsqyycpptxcutrqrb`.
- Production reference `xfscfjwapwnkiinkgbjg` was not queried or accessed.
- Database inspection was not required for this source audit.
- Canonical baseline reference: `production-schema.sql`, SHA-256 `b77b6cf72482a3401a7abd0a097f24587b6b78e88fbf1c6a816f1f1c9ed98db1`.
- Source and filesystem audit was read-only.

## 3. Repository Architecture
Framework is React 18 + TypeScript with Vite, React Router, TanStack Query, Radix/shadcn UI, and Supabase JS. Entry points are `src/main.tsx` and `src/App.tsx`. The application uses Context for Auth/Notifications, React Query for server state, local component state, and direct Supabase calls from many hooks/pages.

Inventory: 202 source files, 55 pages, 33 hooks, 9 repository files, 89 components, 19 Edge Function files, 4 test files. General repositories/services are absent; only auth repositories exist.

## 4. Application Runtime
`package.json` defines Vite dev/build/preview, ESLint, and Vitest commands. Runtime configuration is supplied through `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID`. The browser client rejects missing configuration and rejects a publishable key whose JWT role is `service_role`.

## 5. Route Inventory
`src/App.tsx` defines 51 route entries including public review/auth routes, protected admin routes, protected wasit routes, `/notifications`, and a catch-all. `ProtectedRoute` enforces session, profile resolution, registration state, profile completion, role requirements, and forbidden redirects. Full route data is in `PHASE-8.1-ROUTE-MATRIX.json`.

## 6. Authentication Audit
Supabase Auth is implemented through `SupabaseAuthRepository`, `AuthContext`, and `ProtectedRoute`. Login, logout, session restoration, `onAuthStateChange`, loading/error states, profile lookup, and role lookup are present. Session persistence uses browser localStorage with token refresh. Unauthenticated users are redirected to `/login`; missing profiles and authorization errors have explicit UI states.

## 7. Identity Audit
The current identity comes from `session.user.id`. `profiles.id` and `user_roles.user_id` are queried with that identity. The app does not show a hard-coded authenticated user ID or fake auth identity. Feature hooks also query profiles and roles directly, creating a distributed identity/access pattern. A static organization header is present in `src/pages/Organization.tsx:27`, but it is not a user identity.

## 8. Authorization / RBAC Audit
Canonical roles are represented in source as `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, and `evaluator`. Route guards and `AuthContext` role helpers are implemented. Edge Functions use the shared bearer-token/role/profile resolver in `supabase/functions/_shared/authorization.ts`. UI checks are not a substitute for RLS; direct table access remains widespread.

## 9. Repository Audit
The repository layer contains `SupabaseAuthRepository`, `SupabaseUserProfileRepository`, `SupabaseUserRoleRepository`, and authorization helpers. `DemoRepositories`, `SupabaseRepositories`, `RepositoriesProvider`, general domain repositories, and `MembershipRepository` are missing. Domain access is implemented primarily in hooks and pages using direct `.from()` and `.rpc()` calls.

## 10. Supabase Integration Audit
The browser client is created in `src/integrations/supabase/client.ts` with publishable-key validation and persistent auth. Direct database access occurs in 33 files with 229 observed table/RPC references. Storage access occurs in profile and event document flows. Edge Functions cover user administration, notifications, reports, export/import, and seed operations. Server-side service-role usage is present in Edge Functions via environment variables; no client service-role exposure was found.

## 11. RPC Contract Audit
Seventeen unique RPC names were inventoried. Most map to canonical functions. Two material exceptions are documented: `increment_view_count` is a PHASE 7.3B schema gap, and `check_duplicate_event` is called with a five-argument array-returning contract even though canonical D1-D.4 defines `public.check_duplicate_event(text,text,text) RETURNS boolean`. `public_system_settings` is a historical view contract, not a canonical D1-D.4 view.

## 12. Canonical Schema Compatibility
The application uses canonical entities including `events`, `event_assignments`, `profiles`, `user_roles`, `referee_cards`, `referee_reviews`, `evaluations`, `honors`, learning, notifications, discussions, regional tables, and logs. It also assumes absent `public_system_settings` and `increment_view_count`, and its duplicate-event contract conflicts with canonical identity. Organization/club/membership table assumptions were not found; the organization feature uses canonical `provinsi`, `kabupaten_kota`, and `pengurus` plus static header data.

## 13. RLS Awareness
The app has explicit identity and role awareness, and Edge Functions resolve bearer tokens against Auth, roles, and regional profile data. Direct feature queries rely on canonical RLS. Client-side role checks and filtering are present and must not be treated as security boundaries. No RLS policy was changed by this audit.

## 14. Security Audit
The browser client protects against service-role key configuration. Server-side Edge Functions use service-role environment secrets and token verification. The primary security finding is plaintext demo seed passwords in source (`src/hooks/useSeedDatabase.ts:87-91`) and a user-visible seed action in `src/pages/DatabaseExport.tsx:659`. Additional findings cover the duplicate RPC mismatch, distributed direct data access, and noncanonical contracts.

## 15. Hard-Coded / Demo State
`useSeedDatabase.ts` contains demo counts, fixture descriptions, and plaintext demo passwords. `Organization.tsx:27-33` contains static organization contact/header data. Assignment templates use localStorage as an interim client store. No `club-default`, `Agus Setiawan`, hard-coded authenticated user ID, or fake session was found in source search.

## 16. Capability Matrix
Authentication, session, profile, roles, dashboard, events, assignments, referee cards, reviews, evaluations, learning, notifications, honors, regional data, audit logs, and card verification are implemented. Discussions, pengurus, settings, and activity-log coverage are partial due contract or static-header gaps. Full evidence is in `PHASE-8.1-CAPABILITY-MATRIX.json`.

## 17. Findings
Every finding records severity, evidence, current behavior, canonical expectation, impact, and future action in the JSON artifacts. The main open findings are APP-SEC-001 through APP-SEC-004 and APP-RLS-001/002.

## 18. P0 Findings
None observed. No Production access, client service-role exposure, or direct Auth bypass was found.

## 19. P1 Findings
- `APP-SEC-001`: plaintext demo passwords in client source.
- `APP-SEC-002`: duplicate-event RPC contract conflicts with canonical function identity and return type.
- `APP-RLS-001`: distributed direct data access makes RLS assumptions difficult to centralize and audit.

## 20. P2 Findings
- `APP-SEC-003`: general repository/service abstraction is missing; direct Supabase access is widespread.
- `APP-SEC-004`: `increment_view_count` and `public_system_settings` remain application contracts outside canonical D1-D.4.
- `APP-ID-001`: identity/profile/role access is duplicated outside the auth repositories.
- `APP-RLS-002`: client-side filtering and UI guards must not be relied on as authorization.

## 21. P3 Findings
- Static organization header/contact data in `Organization.tsx` is application presentation state rather than canonical persisted organization metadata.
- LocalStorage assignment templates and event drafts are interim client persistence.

## 22. Recommended Remediation Sequence
1. Remove or isolate demo credentials and seed controls under an explicitly authorized synthetic-data phase.
2. Reconcile duplicate-event caller to the canonical boolean contract without changing canonical SQL.
3. Decide governance for `increment_view_count` and `public_system_settings` as application/historical contracts.
4. Introduce domain repository boundaries and centralize contract/error/RLS awareness.
5. Perform focused route/RLS integration tests after contract remediation.

## 23. Safety Verification
All PHASE 8.1 safety counters are zero. No source, database, package, migration, Auth, Storage, RLS, or deployment mutation occurred.

## 24. Determinism Verification
The audit uses a deterministic source inventory and normalized evidence set. Run 1 and Run 2 hashes are recorded in `PHASE-8.1-AUDIT-HASH.txt` and must be identical; timestamps/environment metadata are excluded from the canonical audit input.

## 25. Gate Decision
**PASS — APPLICATION BASELINE AUDIT COMPLETE**

Next phase: PHASE 8.2 — AUTHENTICATION & IDENTITY. No PHASE 8.2 implementation was performed.