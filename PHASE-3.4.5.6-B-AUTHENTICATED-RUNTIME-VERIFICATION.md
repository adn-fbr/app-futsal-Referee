# PHASE B.3.4.5.6-B — Authenticated Runtime Verification

**Final status: BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE**

## 1. Environment

- Target confirmed: TEST project `test APP`, ref `shorsqyycpptxcutrqrb`, status `ACTIVE_HEALTHY`, PostgreSQL 17.6.
- Production ref `xfscfjwapwnkiinkgbjg` was not accessed or modified.
- This phase made no migration, DDL, DML, fixture, RLS, or function changes.
- Database operations in this phase were read-only metadata/catalog checks only. No call to `get_referee_detail` was made.

## 2. Timestamp

`2026-09-27T08:11:53Z` (UTC)

## 3. Actor Fixture IDs

| Actor | User ID | Supplied city / role | Session status |
|---|---|---|---|
| admin_kab_kota A | `24598e43-a13f-42af-a7fa-e963e44680e6` | City `e2c10dfe-4746-46c0-b1ba-e2e0c197ef8f`; `admin_kab_kota` | Unavailable |
| admin_kab_kota B | `c5395935-4311-450d-8178-77f7ade21719` | City `be019cc8-1e5e-4ea6-a82f-d15b96e3aff0`; `admin_kab_kota` | Unavailable |
| admin_provinsi 1 | `35999d8c-4ffb-4dae-854a-fede06b56afa` | `admin_provinsi`; zero active province bindings | Unavailable |
| admin_provinsi 2 | `f0ce2004-f35a-48cf-91a2-2ca218f5c8da` | `admin_provinsi`; zero active province bindings | Unavailable |
| admin_provinsi 3 | `29519a01-da0c-4977-b73f-e870967b151e` | `admin_provinsi`; zero active province bindings | Unavailable |
| wasit A | `55e551f2-5456-439e-8712-4d9d759bc4b1` | City `0ce98228-ab31-480c-a212-6d5d540acff2`; `wasit` | Unavailable |
| wasit B | `5cd22a8c-c79d-40d1-b39e-70088dffae5d` | City `be019cc8-1e5e-4ea6-a82f-d15b96e3aff0`; `wasit` | Unavailable |

## 4. Authenticated-Session Availability

No real authenticated TEST actor session was available to this run, and no existing authenticated browser page handle was provided. The workspace had no Supabase/auth/token/session environment variable names available; its local application configuration points to the prohibited production project and was not used. No login was attempted, no token or cookie was obtained, and no impersonation or `auth.uid()` simulation was used.

Under the stop rule, runtime execution stopped before any RPC invocation. `get_referee_detail` responses, including anonymous HTTP behavior, were not observed.

## 5. Complete Runtime Matrix

All rows are **BLOCKED — NOT EXECUTED**. No response was received and no target details were returned.

| Test | Actor and target | Expected | Actual |
|---|---|---|---|
| A | admin_kab_kota A -> known referee in city A; target not selected | ALLOW; admin projection | BLOCKED; no session/RPC |
| B | admin_kab_kota A -> wasit B `5cd22a8c-c79d-40d1-b39e-70088dffae5d` | `FORBIDDEN_SCOPE` | BLOCKED; no session/RPC |
| C | admin_kab_kota B -> wasit B `5cd22a8c-c79d-40d1-b39e-70088dffae5d` | ALLOW; admin projection | BLOCKED; no session/RPC |
| D | admin_kab_kota B -> wasit A `55e551f2-5456-439e-8712-4d9d759bc4b1` | `FORBIDDEN_SCOPE` | BLOCKED; no session/RPC |
| E | wasit A -> self `55e551f2-5456-439e-8712-4d9d759bc4b1` | ALLOW; wasit-self projection | BLOCKED; no session/RPC |
| F | wasit A -> wasit B `5cd22a8c-c79d-40d1-b39e-70088dffae5d` | `FORBIDDEN` | BLOCKED; no session/RPC |
| G | wasit B -> self `5cd22a8c-c79d-40d1-b39e-70088dffae5d` | ALLOW; wasit-self projection | BLOCKED; no session/RPC |
| H | wasit B -> wasit A `55e551f2-5456-439e-8712-4d9d759bc4b1` | `FORBIDDEN` | BLOCKED; no session/RPC |
| I | Any listed admin_provinsi actor -> known referee | `FORBIDDEN_SCOPE` | BLOCKED; no session/RPC; no binding seeded |
| J | Existing ordinary `panitia` or `evaluator` actor -> known referee | `FORBIDDEN` | BLOCKED; no actor session available |
| K | Anonymous request -> known referee | ACL/authentication denial; no detail | BLOCKED; no HTTP request |

City-admin NULL target / target with NULL city cases were also not executed. No fixture target was queried or modified for a runtime attempt.

## 6. Exact Response-Key Verification

No successful runtime response was available. Therefore actual key-set assertions are **BLOCKED / NOT OBSERVED** for both role classes.

Expected admin key set (15):

```text
id, full_name, kabupaten_kota_id, kabupaten_kota_name, provinsi_id,
provinsi_name, afk_origin, license_level, license_expiry,
profile_photo_url, is_active, is_profile_complete, created_at,
updated_at, email
```

Expected wasit-self key set (19):

```text
id, full_name, birth_date, occupation, kabupaten_kota_id,
kabupaten_kota_name, provinsi_id, provinsi_name, afk_origin,
license_level, license_expiry, profile_photo_url, is_active,
is_profile_complete, registration_status, created_at, updated_at,
email, whatsapp_number
```

Prior static catalog inspection showed these distinct projections in the function definition. That evidence does not count as runtime response verification.

## 7. Forbidden-Field Verification

Runtime forbidden-field checks are **BLOCKED / NOT OBSERVED** because no response was returned. Static inspection of the live function definition found no projection of `license_photo_url`, `ktp_photo_url`, `approved_by`, `rejected_reason`, `deleted_at`, `user_roles`, password, access/refresh token, service-role, API-key, or secret fields. This is source evidence only; it does not prove serialized runtime output.

## 8. Error-Contract Verification

No runtime error response was collected. Static body review retains these branches: NULL actor -> `UNAUTHORIZED_ACTOR`; NULL target -> `INVALID_TARGET`; unauthorized role / wasit non-self -> `FORBIDDEN`; missing or out-of-scope regional target -> `FORBIDDEN_SCOPE`. Regional missing-target and outside-scope paths share `FORBIDDEN_SCOPE`. The anonymous role has no EXECUTE privilege, so an anon request is denied at the ACL boundary before the function body; this HTTP behavior was not exercised.

## 9. Client Consumer Verification

- **PASS (static):** `useReferee()` calls `supabase.rpc("get_referee_detail", { p_referee_id })` in [useReferees.ts](src/hooks/useReferees.ts).
- **PASS (static):** The generic detail page [RefereeDetail.tsx](src/pages/RefereeDetail.tsx) does not fetch `license_photo_url` or `ktp_photo_url`.
- **PASS (static):** `get_referees()` remains in use by list/statistics and assignment consumers; it was not dropped. See [useReferees.ts](src/hooks/useReferees.ts), [useEventAssignments.ts](src/hooks/useEventAssignments.ts), and [useSmartAssignment.ts](src/hooks/useSmartAssignment.ts).
- **PASS (static):** Browser client code uses a publishable key and rejects a `service_role` key; no service-role credential was found in browser source. See [client.ts](src/integrations/supabase/client.ts).

The hook file still has separate explicit profile reads in its update flow; those are not performed by the generic `useReferee()` detail query.

## 10. Static Security Verification

Read-only TEST catalog inspection reported:

| Check | Result |
|---|---|
| Signature `public.get_referee_detail(uuid)` | PASS |
| `SECURITY DEFINER` | PASS |
| `search_path = ''` | PASS |
| Server-derived `auth.uid()` | PASS |
| Province helper `private.get_actor_provinsi_id()` | PASS |
| City helper `private.get_actor_kabupaten_kota_id()` | PASS |
| Explicit projection; no `SELECT *` | PASS (static only) |
| No authority `LIMIT 1` | PASS |
| `anon` EXECUTE denied | PASS |
| `authenticated` EXECUTE granted | PASS |
| No PUBLIC EXECUTE grant | PASS |
| Active `PROVINSI` bindings in TEST | 0 (read-only count) |

## 11. Final Gate

**BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE**

Tests A-K and all runtime projection, forbidden-field, and error-response assertions remain unexecuted. Static checks are recorded separately and have not been substituted for runtime PASS.