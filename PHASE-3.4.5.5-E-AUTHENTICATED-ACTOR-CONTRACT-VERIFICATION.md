# B.3.4.5.5-E — Authenticated Actor Contract Verification

**Final status: BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE**

## 1. Environment Identity

- Verification target: TEST project `shorsqyycpptxcutrqrb` (`test APP`), confirmed through the Supabase project metadata tool; status `ACTIVE_HEALTHY`, region `ap-south-1`, PostgreSQL 17.6.
- Prohibited production project `xfscfjwapwnkiinkgbjg` was not queried or accessed.
- The workspace `.env` points to the prohibited production project. It was not used for any request.
- All database queries in this verification were read-only catalog or fixture-baseline `SELECT` statements scoped explicitly to TEST. No HTTP RPC request could be made with an actor session.

## 2. Test Timestamp

`2026-09-27T07:49:19Z` (UTC)

## 3. Actor/Session Verification — BLOCKED

No real authenticated TEST sessions or actor credentials were available to this run. A local environment-variable name check found no Supabase/auth/session variables. Catalog access through the Supabase tooling is not an authenticated actor request and cannot establish `auth.uid()` as any listed actor. No JWT, cookie, session token, impersonation mechanism, or service-role substitute was used.

Read-only TEST baseline evidence confirmed:

| Actor | Stored role | Profile city | Baseline |
|---|---|---|---|
| admin_kab_kota A `24598e43-a13f-42af-a7fa-e963e44680e6` | `admin_kab_kota` | `e2c10dfe-4746-46c0-b1ba-e2e0c197ef8f` | Matches supplied actor/city |
| admin_kab_kota B `c5395935-4311-450d-8178-77f7ade21719` | `admin_kab_kota` | `be019cc8-1e5e-4ea6-a82f-d15b96e3aff0` | Matches supplied actor/city |
| admin_provinsi `35999d8c-4ffb-4dae-854a-fede06b56afa` | `admin_provinsi` | NULL | No city fallback |
| admin_provinsi `f0ce2004-f35a-48cf-91a2-2ca218f5c8da` | `admin_provinsi` | NULL | No city fallback |
| admin_provinsi `29519a01-da0c-4977-b73f-e870967b151e` | `admin_provinsi`, `wasit` | NULL | No city fallback |
| wasit `55e551f2-5456-439e-8712-4d9d759bc4b1` | `wasit` | `0ce98228-ab31-480c-a212-6d5d540acff2` | Fixture role present |
| wasit `5cd22a8c-c79d-40d1-b39e-70088dffae5d` | `wasit` | `be019cc8-1e5e-4ea6-a82f-d15b96e3aff0` | Fixture role present |
| wasit `ce22c77c-1910-45d9-801d-77fd25b5b3b2` | `wasit` | `34db5222-5129-49ca-9e7c-2c076707cd18` | Fixture role present |

This baseline verifies stored profile/role rows only. It does **not** verify an authenticated session.

## 4. E1 — admin_kab_kota A — BLOCKED

Baseline role and city match the contract. No authenticated call to `get_admin_referees` or `get_admin_referee_count` was made. Therefore these remain unexecuted: own-city ALLOW and row-scope verification; city B DENY; NULL scope DENY. No returned rows were available for actor-scoped content verification.

`can_approve_registration(target_user_id)` authorization for an eligible same-city target, a known cross-city target, and an unauthenticated caller was not exercised. Approval was not attempted.

## 5. E2 — admin_kab_kota B — BLOCKED

Baseline role and city match the contract. No authenticated call to `get_admin_referees` or `get_admin_referee_count` was made. Therefore these remain unexecuted: own-city ALLOW and row-scope verification; city A DENY; NULL scope DENY.

`can_approve_registration(target_user_id)` same-city, cross-city, and no-session cases were not exercised. Approval was not attempted.

## 6. E3 — admin_provinsi Fail-Closed — BLOCKED (runtime)

Read-only TEST query found **0 active `public.pengurus` bindings at level `PROVINSI`**. The three supplied actors have the `admin_provinsi` role and NULL profile city. No binding was seeded or changed.

`private.get_actor_provinsi_id()` runtime `FORBIDDEN_SCOPE`, admin directory/count denial, and approve/reject denial were not called because no real actor sessions were available. No runtime fallback behavior was therefore observed. Each of these actor/capability checks remains unexecuted.

## 7. E4 — wasit Denial — BLOCKED

All three supplied IDs have a stored `wasit` role. No authenticated directory, count, approve, or reject request was made. All four expected denials for each actor remain unexecuted.

## 8. E5 — Response Projection — BLOCKED (runtime); STATIC SHAPE PASS

The live catalog declares `public.get_admin_referees(...)` result columns exactly as:

`id, full_name, kabupaten_kota_id, license_level, license_expiry, profile_photo_url, is_active, is_profile_complete, afk_origin, created_at`

The static function-definition check found no wildcard `SELECT` and no references to `whatsapp_number`, `password`, or `contact`. This supports the declared projection only. No successful authenticated response was obtained, so actual response keys, values, arbitrary extra fields, and serialized sensitive fields remain unverified.

## 9. E6 — Error Non-Disclosure — BLOCKED

No authenticated cross-city call was made, no target known to exist in another city was queried, and no equivalent nonexistent-target call was made. No denial response was available for comparison; target existence and private-detail non-disclosure remain unverified.

## 10. Static ACL / SECURITY DEFINER Verification — PASS (catalog only)

Read-only TEST catalog inspection reported:

| Function | SECURITY DEFINER | `search_path = ''` | EXECUTE `authenticated` | EXECUTE `anon` | `auth.uid()` reference |
|---|---:|---:|---:|---:|---:|
| `private.get_actor_provinsi_id()` | yes | yes | no | no | yes |
| `private.get_actor_kabupaten_kota_id()` | yes | yes | no | no | yes |
| `public.get_admin_referees(...)` | yes | yes | yes | no | yes |
| `public.get_admin_referee_count(...)` | yes | yes | yes | no | yes |
| `public.can_approve_registration(uuid)` | yes | yes | yes | no | yes |
| `public.approve_registration(uuid, app_role)` | yes | yes | yes | no | yes |
| `public.reject_registration(uuid, text)` | yes | yes | yes | no | yes |

The checked relation references for these functions were schema-qualified. The new one-argument `can_approve_registration(uuid)` exists with the expected grants. The old `can_approve_registration(uuid, uuid)` overload **still exists**, but catalog privilege checks report EXECUTE denied to both `authenticated` and `anon`, so it is not executable by authenticated browser clients. Its catalog settings are `SECURITY DEFINER` with `search_path = public` and its definition does not reference `auth.uid()`; its browser EXECUTE denial is therefore an important residual condition to preserve.

This is static catalog evidence only. It does not substitute for authenticated HTTP execution or prove runtime authorization decisions.

## 11. Evidence and Scope

- TEST project metadata confirmed the project ref before TEST queries.
- Read-only catalog query inspected function signatures, `prosecdef`, `proconfig`, effective role EXECUTE privileges, and `auth.uid()` references.
- Read-only catalog query confirmed the legacy two-argument overload is not executable by `authenticated` or `anon`.
- Read-only TEST queries checked only the listed actors' role and city identifiers, plus the count of active `PROVINSI` `pengurus` bindings.
- Read-only catalog query checked the declared directory result shape and searched its definition for wildcard selection and sensitive field terms.
- No actor RPC, approval, rejection, fixture mutation, migration, DDL, DML, impersonation, or production request was performed.

## 12. Per-Test Status Summary

| Test | Status |
|---|---|
| TEST environment identity | PASS |
| Actor stored role/city baseline | PASS (baseline only) |
| Real authenticated actor sessions | BLOCKED |
| E1 admin_kab_kota A runtime matrix | BLOCKED |
| E2 admin_kab_kota B runtime matrix | BLOCKED |
| E3 admin_provinsi runtime fail-closed matrix | BLOCKED |
| E4 wasit runtime denial matrix | BLOCKED |
| E5 declared static projection shape | PASS (static only) |
| E5 authenticated response projection | BLOCKED |
| E6 error non-disclosure comparison | BLOCKED |
| Static ACL / SECURITY DEFINER catalog checks | PASS (catalog only) |

## 13. Final Gate

**BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE**

Do not mark this phase PASS. Unexecuted tests include every actor-authenticated directory/count call; all actor-specific eligibility calls; no-session HTTP behavior; all province-admin and wasit denial requests; approval/rejection authorization requests; actual response projection; and cross-city versus nonexistent-target error comparison. Approval and rejection were not attempted, so no TEST data was mutated.