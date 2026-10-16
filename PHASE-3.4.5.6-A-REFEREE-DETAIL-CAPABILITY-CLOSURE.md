# B.3.4.5.6-A — Referee Detail Capability Closure

**Final gate: BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE**

## 1. Database Baseline

- Target: TEST project `test APP`, ref `shorsqyycpptxcutrqrb`, status `ACTIVE_HEALTHY`, PostgreSQL 17.6.
- Verification timestamp: `2026-09-27T08:05:20Z` (UTC).
- Production ref `xfscfjwapwnkiinkgbjg` was not accessed or modified. Local Supabase config and `.env` point to production; neither was used for database access or migration application.
- Before this migration, `to_regprocedure('public.get_referee_detail(uuid)')` returned NULL.
- TEST has the required `profiles`, `kabupaten_kota`, `provinsi`, `user_roles`, `pengurus`, and `referee_contacts` tables/columns. `referee_contacts.referee_id` has a unique index.
- The current TEST baseline has zero active `pengurus` rows at level `PROVINSI`; no province binding or fixture was created.
- Migration `phase_3_4_5_6_a_referee_detail_capability` applied successfully to TEST as version `20260927080253`. It contains one function definition and EXECUTE ACL statements; it performs no data writes.

## 2. Function Definition

The exact deployed SQL definition is in [the TEST migration](supabase/migrations/20260927080253_phase_3_4_5_6_a_referee_detail_capability.sql), whose filename matches the version recorded by TEST.

```sql
CREATE OR REPLACE FUNCTION public.get_referee_detail(p_referee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
```

The body obtains the actor only from `auth.uid()`, validates the target argument, then resolves stored roles. Authorization order is `admin_provinsi`, `admin_kab_kota`, then `wasit`; a province-admin fixture with no binding cannot fall through to its `wasit` role. It calls `private.get_actor_provinsi_id()` or `private.get_actor_kabupaten_kota_id()` for administrative scope, checks the target region before constructing the response, and returns an explicit `pg_catalog.jsonb_build_object` projection. All referenced relations and non-built-in authorization functions are schema-qualified. No generic `is_admin()` check, client actor ID, client region parameter, `SELECT *`, or authority-resolution `LIMIT 1` is used.

## 3. Authorization Matrix

| Actor | Allowed | Denied | Static result |
|---|---|---|---|
| `wasit` | Own profile only | Any other target | PASS by body review; runtime BLOCKED |
| `admin_kab_kota` | Target profile in helper-derived actor city | Different city, NULL city, absent regional target | PASS by body review; runtime BLOCKED |
| `admin_provinsi` | Target city belongs to helper-derived province, after exactly-one-active-binding helper validation | Zero/multiple/null bindings, outside province, absent regional target | PASS by body review; runtime BLOCKED |
| `panitia`, `evaluator`, other authenticated role | None | Any target | PASS by body review; runtime BLOCKED |
| `anon` | None | All calls; EXECUTE is denied before the function body | PASS by ACL inspection; no HTTP request made |

The region checks return the same `FORBIDDEN_SCOPE` for an absent target and a target outside the actor's region. A wasit requesting another ID receives `FORBIDDEN` before any target lookup. This avoids disclosing target existence in authorization errors.

## 4. Response Projection Matrix

The deployed function returns `jsonb`, allowing self and admin response objects to have different keys. A catalog-source extraction verified each exact key set:

| Caller path | Exact keys | Count |
|---|---|---:|
| Self-service wasit | `id`, `full_name`, `birth_date`, `occupation`, `kabupaten_kota_id`, `kabupaten_kota_name`, `provinsi_id`, `provinsi_name`, `afk_origin`, `license_level`, `license_expiry`, `profile_photo_url`, `is_active`, `is_profile_complete`, `registration_status`, `created_at`, `updated_at`, `email`, `whatsapp_number` | 19 |
| Admin | `id`, `full_name`, `kabupaten_kota_id`, `kabupaten_kota_name`, `provinsi_id`, `provinsi_name`, `afk_origin`, `license_level`, `license_expiry`, `profile_photo_url`, `is_active`, `is_profile_complete`, `created_at`, `updated_at`, `email` | 15 |

`whatsapp_number` is present only in the self branch. `license_photo_url`, `ktp_photo_url`, `approved_by`, `rejected_reason`, password/credential/token fields, and arbitrary profile columns are not projected. No successful authenticated response was received, so serialized runtime keys and values remain unverified.

The application detail hook now calls this RPC. The generic detail page no longer fetches or displays license/KTP document paths; those require a separately authorized document capability. Existing list and update behavior was not changed by this detail cutover.

## 5. Error Contract

| Condition | Function result |
|---|---|
| `auth.uid()` is NULL, if the body is reached | `UNAUTHORIZED_ACTOR` |
| Authenticated caller supplies NULL target | `INVALID_TARGET` |
| Authenticated caller has no allowed role | `FORBIDDEN` |
| Wasit targets another ID | `FORBIDDEN` without target lookup |
| City/province target absent or outside scope | `FORBIDDEN_SCOPE` |
| Wasit self target has no profile row | `INVALID_TARGET` |

Anon EXECUTE is revoked, so an anon HTTP request is rejected at the ACL boundary before the `UNAUTHORIZED_ACTOR` body branch. No anon HTTP request was run; runtime error shapes remain unverified.

## 6. ACL

Live catalog and ACL inspection returned:

| Principal | EXECUTE |
|---|---:|
| `PUBLIC` | denied; no PUBLIC ACL entry |
| `anon` | denied |
| `authenticated` | granted |
| `service_role` | granted by existing platform role ACL |

The migration explicitly revokes from `PUBLIC`, `anon`, and `authenticated`, then grants to `authenticated`. Runtime authorization remains enforced inside the function.

## 7. SECURITY DEFINER and Static Security Checks

Live catalog values: exact signature `get_referee_detail(uuid)`; return type `jsonb`; `prosecdef = true`; `proconfig = {search_path=""}`; `auth.uid()` and both private scope helpers are referenced. All relation references and the JSON builder are schema-qualified.

| Static check | Result | Evidence |
|---|---|---|
| Exact `get_referee_detail(uuid)` signature | PASS | TEST catalog identity arguments |
| `SECURITY DEFINER` | PASS | TEST `pg_proc.prosecdef` |
| Empty `search_path` | PASS | TEST `pg_proc.proconfig` |
| 1. Exact `get_referee_detail(uuid)` signature | PASS | TEST catalog identity arguments |
| 2. `SECURITY DEFINER` | PASS | TEST `pg_proc.prosecdef` |
| 3. Empty `search_path` | PASS | TEST `pg_proc.proconfig` |
| 4. Explicit projection exists | PASS | Exact 15/19 key extraction from role branches |
| 5. No `SELECT *` | PASS | Live definition inspection |
| 6. No client actor ID | PASS | Only argument is target UUID; actor uses `auth.uid()` |
| 7. No client region authorization | PASS | Exact one-argument signature; scope is helper-derived |
| 8. Province helper used | PASS | `private.get_actor_provinsi_id()` in live definition |
| 9. City helper used | PASS | `private.get_actor_kabupaten_kota_id()` in live definition |
| 10. No authority `LIMIT 1` | PASS | No `LIMIT 1`; province helper validates binding count |
| 11. Anon EXECUTE denied | PASS | Effective privilege inspection |
| 12. Authenticated EXECUTE granted | PASS | Effective privilege inspection |
| 13. No forbidden document/approval/credential fields | PASS | Live definition inspection |
| 14. WhatsApp not exposed to admins | PASS | Exact role-specific live key sets |
| 15. Unauthorized target existence is not disclosed | PASS (static) | Missing and out-of-scope regional targets share `FORBIDDEN_SCOPE`; no runtime comparison |
| Additional: no PUBLIC EXECUTE grant | PASS | Expanded ACL contains no PUBLIC entry |
| Additional: frontend TypeScript typecheck and ESLint | PASS | `npm run typecheck`; `npx eslint src/hooks/useReferees.ts src/pages/RefereeDetail.tsx src/integrations/supabase/types.ts` |
| Frontend TypeScript typecheck and ESLint | PASS | `npm run typecheck`; `npx eslint src/hooks/useReferees.ts src/pages/RefereeDetail.tsx src/integrations/supabase/types.ts` |

## 8. Legacy `can_approve_registration(uuid, uuid)`

The overload still exists and was not dropped. It remains `SECURITY DEFINER` with `search_path = public`; its body accepts `_admin_id` and passes that value to role/scope helpers rather than deriving the actor from `auth.uid()`. Current TEST effective privileges are denied for both `authenticated` and `anon`. This is recorded separately as a legacy static risk; this phase did not change its ACL, body, or dependencies.

## 9. `get_referees()` Dependency Status

`public.get_referees(...)` was not dropped or modified. Source search found active calls in:

- `useReferees.ts`: directory/list, additional list/count flow, and statistics query in [the referee hooks](src/hooks/useReferees.ts).
- `useEventAssignments.ts`: assignment candidate lookup in [event assignment hooks](src/hooks/useEventAssignments.ts).
- `useSmartAssignment.ts`: candidate lookup in [smart assignment hooks](src/hooks/useSmartAssignment.ts).

The detail hook no longer depends on `get_referees()` or direct profile reads; it calls `get_referee_detail`. Existing list and assignment consumers still require the legacy function, so retirement is deferred until their cutover and regression checks.

## 10. Runtime Test Results — BLOCKED

No real authenticated TEST actor sessions were available. The local application environment points to the prohibited production project and no local Supabase/auth/session variables were available. No JWT was fabricated, no credentials were substituted, and no role/session impersonation was attempted.

The following runtime cases remain unexecuted:

- wasit A self detail ALLOW and wasit A targeting wasit B DENY;
- admin_kab_kota A own-city ALLOW and other-city DENY;
- admin_kab_kota A NULL target (`INVALID_TARGET`) and target with NULL city (`FORBIDDEN_SCOPE`);
- admin_kab_kota B own-city ALLOW, city A DENY, NULL target (`INVALID_TARGET`), and target with NULL city (`FORBIDDEN_SCOPE`);
- each current admin_provinsi fixture targeting any referee DENY / `FORBIDDEN_SCOPE` with zero active province bindings;
- ordinary authenticated user DENY and anon ACL denial over HTTP;
- exact successful response keys/values and absence of private target data in every denial response.

No fixture was created or modified. No production request, data mutation, or non-test migration/deployment occurred.

## 11. Migration Status

**Applied to TEST only:** version `20260927080253`, `phase_3_4_5_6_a_referee_detail_capability`.

The local source is [the migration file](supabase/migrations/20260927080253_phase_3_4_5_6_a_referee_detail_capability.sql). The detail hook is wired to the RPC in [useReferees.ts](src/hooks/useReferees.ts), the generated database types include its signature in [types.ts](src/integrations/supabase/types.ts), and the document-path consumer was removed from [RefereeDetail.tsx](src/pages/RefereeDetail.tsx).

## 12. Final Gate

**BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE**

The implementation, TEST migration, ACL, security-definer settings, and static response projections are verified. Do not mark this phase PASS until the required real-session runtime matrix and successful/denied response checks have actually run against TEST.