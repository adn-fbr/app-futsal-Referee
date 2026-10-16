# PHASE 4.1 - Test Fixture Design

Status: **BLOCKED - TEST FIXTURE / AUTHORIZATION REQUIRED**  
Target: test APP `shorsqyycpptxcutrqrb` only  
Production: explicitly forbidden

## 1. Evidence of Existing Fixture Capability

### Guarded provisioning exists

- [supabase/tests/fixtureProvisioningGuard.ts](../supabase/tests/fixtureProvisioningGuard.ts) requires `TEST_ENVIRONMENT=non-production`, the exact test URL/ref, `SUPABASE_SERVICE_ROLE_KEY`, and `FIXTURE_ADMIN_PASSWORD`.
- [supabase/tests/seed-security-fixtures.ts](../supabase/tests/seed-security-fixtures.ts) can create/update Auth users, profiles, roles, two regions, events, and assignments.
- The seed has a `--dry-run` path that reports zero mutations when all required environment guards pass.

### Availability conclusion

- Historical aggregate evidence records candidate role populations in test APP.
- Exact actor-to-target pairs are not frozen for this Phase 4.1 route.
- Current readiness evidence says synthetic Auth capability is unavailable and no fixture creation has been authorized.
- No license/KTP Storage object fixture manifest was found for this route.

Therefore fixtures are **designed but not available for execution**.

## 2. Required Actors

Logical identities only; do not record passwords, service-role keys, or reusable tokens.

| Logical actor | Role | Region | Required capability | Current availability |
|---|---|---|---|---|
| `PROVINCE_ADMIN` | `admin_provinsi` | none/all approved | list/detail/edit/status, approved document capabilities | Candidate population historically exists; exact session not frozen |
| `KABKOTA_ADMIN_A` | `admin_kab_kota` | `REGION_A` | same-region operations; foreign-region denial | Candidate population historically exists; exact binding not frozen |
| `KABKOTA_ADMIN_B` | `admin_kab_kota` | `REGION_B` | reciprocal region test | Candidate population historically exists; exact binding not frozen |
| `AUTHENTICATED_NON_ADMIN` | `wasit` or other non-admin | approved test region | direct RPC denial and route denial | Candidate role population exists; exact actor not frozen |
| `ANONYMOUS` | no JWT | none | direct RPC/object denial | Logical only; no credential required |

## 3. Required Targets

| Logical target | Type | Region | Required properties | Current availability |
|---|---|---|---|---|
| `REFEREE_A` | `profiles` + `wasit` role | `REGION_A` | active, complete, approved synthetic profile | Exact target not frozen |
| `REFEREE_B` | `profiles` + `wasit` role | `REGION_B` | active, complete, approved synthetic profile | Existing seed creates only one named referee; second target not established |
| `NON_REFEREE_TARGET` | `profiles` without `wasit` role | approved region | direct detail must not disclose as referee | Not established |
| `UNKNOWN_UUID` | no object | none | malformed/unknown object behavior | Can be generated locally without remote mutation |

## 4. Required Regions

```text
REGION_A = existing canonical test region A
REGION_B = existing canonical test region B
```

Selection requirements:

- distinct `kabupaten_kota.id` values;
- both belong to the approved test project;
- no Production identifiers;
- region names/IDs recorded only in a protected execution manifest, not this document.

## 5. Required Document Objects

Synthetic objects only, never copied from Production:

| Object | Bucket | Owner target | Region | Required test |
|---|---|---|---|---|
| `LICENSE_A` | `documents` or approved bucket | `REFEREE_A` | `REGION_A` | view/download and replay |
| `KTP_A` | `documents` or approved bucket | `REFEREE_A` | `REGION_A` | view/download and replay |
| `LICENSE_B` | `documents` or approved bucket | `REFEREE_B` | `REGION_B` | foreign-region isolation |
| `KTP_B` | `documents` or approved bucket | `REFEREE_B` | `REGION_B` | foreign-region isolation |

Object paths, contents, and signed URLs must not be placed in committed documentation. The bucket and policy must be read-only inventoried first. If no authorized Storage fixture mechanism exists, status is `STORAGE VERIFICATION = BLOCKED`.

## 6. Provisioning Safety Contract

Fixture provisioning is allowed only when all conditions hold:

- target ref is exactly `shorsqyycpptxcutrqrb`;
- `TEST_ENVIRONMENT=non-production`;
- explicit operator authorization exists;
- service-role key and fixture password are supplied directly through controlled environment channels;
- fixture names are deterministic and owned by this test phase;
- no Production URL/ref is present;
- precondition snapshot and rollback/cleanup plan are approved;
- mutations are limited to synthetic test records and objects.

No fixture is created by Phase 4.1. The existing seed is not run, including dry-run, because credentials/authorization availability is not established in this session.

## 7. Fixture Pairing Map

| Actor | Target A | Target B | Expected relation |
|---|---|---|---|
| `PROVINCE_ADMIN` | A | B | Owner-approved all-region administrative behavior |
| `KABKOTA_ADMIN_A` | A | B | Same-region result versus foreign-region denial |
| `KABKOTA_ADMIN_B` | B | A | Reciprocal same/foreign check |
| `AUTHENTICATED_NON_ADMIN` | A | B | Administrative RPC/detail denial |
| `ANONYMOUS` | A | B | Public RPC/object denial unless separately approved |

Expected behavior remains a **product/security decision**, not a verified fact.

## 8. Required Precondition Checks Before Execution

Read-only checks only:

- exact project ref and URL;
- actor role and region binding;
- target role and region binding;
- target `is_active`, `registration_status`, and profile completeness;
- document object existence and ownership metadata where policy allows;
- no target belongs to Production;
- no actor is a real Production identity;
- no fixture name collision outside the approved namespace.

Abort on any mismatch. Do not repair a mismatch by mutating data without separate approval.

## 9. Fixture Gate

```text
FIXTURE DESIGN: COMPLETE
EXACT ACTOR/TARGET PAIRING: NOT FROZEN
DOCUMENT OBJECTS: NOT AVAILABLE
PROVISIONING AUTHORIZATION: NOT PROVIDED
STATUS: BLOCKED - TEST FIXTURE / AUTHORIZATION REQUIRED
```
