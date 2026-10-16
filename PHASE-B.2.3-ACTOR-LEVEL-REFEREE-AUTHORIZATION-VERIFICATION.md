# PHASE B.2.3 — Actor-Level Referee Authorization Verification

## 1. Executive Summary

**PHASE B.2.3 BLOCKED — AUTHENTICATED ACTOR SESSION REQUIRED**

The prior B.2.2 artifact records that no approved sessions or frozen actor/target bindings are available. Accordingly, no authenticated, anonymous, REST, or RPC authorization request was executed in this phase. No connector retry was made. Actor behavior is **NOT VERIFIED**.

## 2. Test Environment and Identity

- Intended target: test project `shorsqyycpptxcutrqrb` only.
- Production project `xfscfjwapwnkiinkgbjg` was not accessed.
- Test environment selection was previously verified, but no live database identity was established for this phase.
- No database identity query or data API request was made.

## 3. Existing Sessions and Fixtures

`PHASE-B.2.2-FROZEN-ACTOR-FIXTURE-CONTRACT.md` records admin actors, referee A/B bindings, and authenticated sessions as unavailable or unverified. No credentials were read, no session was acquired, and no actor was impersonated.

`ACTOR BEHAVIOR = NOT VERIFIED`.

## 4. Actor-Level Request Matrix

No request was executed. `Actual` is therefore `NOT TESTED` for every case, including anonymous calls.

| Actor | Target | Boundary | Expected | Actual | Result |
|---|---|---|---|---|---|
| admin_provinsi | A | `profiles` | ALLOW | NOT TESTED | BLOCKED |
| admin_provinsi | B | `profiles` | ALLOW | NOT TESTED | BLOCKED |
| admin_kab_kota | A | `profiles` | ALLOW | NOT TESTED | BLOCKED |
| admin_kab_kota | B | `profiles` | DENY | NOT TESTED | BLOCKED |
| wasit A | own profile | `profiles` | ALLOW | NOT TESTED | BLOCKED |
| wasit A | other referee | `profiles` | DENY | NOT TESTED | BLOCKED |
| admin_provinsi | A contact | `referee_contacts` | ALLOW | NOT TESTED | BLOCKED |
| admin_provinsi | B contact | `referee_contacts` | ALLOW | NOT TESTED | BLOCKED |
| admin_kab_kota | A contact | `referee_contacts` | ALLOW | NOT TESTED | BLOCKED |
| admin_kab_kota | B contact | `referee_contacts` | DENY | NOT TESTED | BLOCKED |
| wasit A | own contact | `referee_contacts` | ALLOW if existing policy permits | NOT TESTED | BLOCKED |
| wasit A | other referee contact | `referee_contacts` | DENY | NOT TESTED | BLOCKED |
| anon | A | `profiles` | DENY | NOT TESTED | BLOCKED |
| anon | A contact | `referee_contacts` | DENY | NOT TESTED | BLOCKED |
| anon | list/detail | RPC/function | DENY | NOT TESTED | BLOCKED |
| ordinary authenticated | referee directory/detail | RPC/function | DENY absent explicit authorization | NOT TESTED | BLOCKED |

HTTP status, row visibility, and function error behavior are unavailable because no request was made.

## 5. Current Detail Path

Static frontend inspection identifies:

- List: `useReferees.ts` calls `get_referees()`.
- Detail: `useReferee()` directly queries `profiles` using `select("*")` plus the `kabupaten_kota` relation, then performs a separate `user_roles` check. That later client-side check is not an authorization boundary.
- `get_admin_referees()` is described in the supplied database baseline, but no frontend call to it was found in the inspected source.
- Contact self-service: `useRefereeContact()` queries explicit `referee_contacts` columns filtered to the signed-in user's own ID. It is not a referee-detail contact lookup.

No source was changed.

## 6. RPC and Function Tests

| Function | Supplied baseline | Actor/API result |
|---|---|---|
| `get_referees()` | Reported `SECURITY DEFINER`, executable by anon and authenticated, and lacking the required admin-region authorization contract | NOT TESTED |
| `get_admin_referees()` | Reported `SECURITY DEFINER`, authenticated execute only, with explicit kab/kota region enforcement | NOT TESTED |
| Other referee-detail function | No private detail endpoint found in inspected frontend source; database-only endpoint status unknown | NOT VERIFIED |

No anonymous EXECUTE request, ordinary-user request, actor RPC call, alternate-region argument, or database-owner test was performed.

## 7. Field Exposure

No detail response was captured. Exact response columns and actual actor visibility are **NOT VERIFIED**.

Static source requests all `profiles` columns for detail, plus the region relation. Based on the supplied baseline, `profiles.email` is among the profile fields; the wildcard would request it if present and the row is visible. This is not proof of a successful response.

| Field category | Actual exposure |
|---|---|
| Email | NOT TESTED |
| Phone | NOT TESTED |
| WhatsApp number | NOT TESTED; current detail hook does not query `referee_contacts` |
| Sensitive/unnecessary profile fields | NOT TESTED; detail query uses a wildcard projection |

No field values were read or included.

## 8. Anonymous, Direct-API, and BOLA Checks

All checks are **NOT TESTED**:

- anon direct `profiles` SELECT;
- anon `referee_contacts` SELECT;
- anon referee detail boundary and `get_referees()` EXECUTE;
- admin kab/kota direct profile lookup for referee B;
- admin kab/kota direct contact lookup for referee B;
- detail RPC lookup for referee B;
- alternate-region RPC parameter.

The supplied baseline reports an anon SELECT grant and a `Public can view referee profiles` policy using `deleted_at IS NULL`. These are preserved as supplied metadata, not represented as results from a request in this phase.

## 9. Contact and Assignment Authorization

The supplied baseline reports a self-referee-scoped `referee_contacts` SELECT policy. No actor request verified its effective response. No contact value was read.

Static assignment code reads the current referee's own assignments; no explicit rule authorizing one referee to access another referee's contact was identified. Assignment-based contact authorization is **NOT ESTABLISHED** and was not tested.

## 10. Supplied Security Baseline (Not Re-tested)

The following is the project-owner-provided database baseline, not a fresh query or actor test:

- `profiles`: RLS enabled; authenticated and anon SELECT privileges reported true; public policy reported with `deleted_at IS NULL`.
- `Admins can view all profiles` reportedly calls `is_admin(auth.uid())`; `is_admin()` reportedly includes `admin_provinsi` and `admin_kab_kota`.
- `get_admin_referees()` reportedly enforces kab/kota scope and is executable only by authenticated.
- `get_referees()` reportedly grants EXECUTE to anon and authenticated without the required admin-region authorization contract.
- `referee_contacts`: RLS enabled, anon SELECT false, self-referee-scoped SELECT policy.

These observations were not altered. Their actor-visible effect was not tested here.

## 11. Security Findings

- `profiles` wildcard detail query: **PASS/FAIL NOT ASSESSED**; it requests more profile columns than a minimized detail contract should require.
- Possible public profile/email exposure: **NOT VERIFIED by actor request**; supplied baseline indicates a public policy and anon table SELECT privilege.
- `admin_kab_kota` cross-region access through direct profile API: **NOT VERIFIED by actor request**; supplied baseline indicates a broad `is_admin` policy that includes this role.
- `get_referees()` as authorization boundary: **FAIL per supplied function baseline**; no actor call was made.
- `get_admin_referees()` region behavior: **NOT VERIFIED by actor request**.
- Contact access by province/city admins: **NOT VERIFIED by actor request**.
- Assignment-based contact sharing: **NOT ESTABLISHED**.

No remediation was performed.

## 12. Final Gate

`PHASE B.2.3 BLOCKED — AUTHENTICATED ACTOR SESSION REQUIRED`

The required authenticated sessions and frozen actor/referee bindings are unavailable. The actor matrix and API behavior remain unverified. No authorization PASS is claimed; no database, policy, function, grant, migration, or UI change was made.
