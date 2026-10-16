# PHASE B.2.1 — Existing Actor & Fixture Readiness

## 1. Test Target Verification

**BLOCKED — database identity not verified in this phase.** The intended target is `shorsqyycpptxcutrqrb`. Prior test-mode selection evidence and CLI linkage identify the intended project, but do not establish the identity of a live database session.

The database connector was unavailable in the preceding phase. No SQL or database API request was made for this report. Production project `xfscfjwapwnkiinkgbjg` was not accessed.

## 2. Existing Role Counts

No role rows were queried. Counts are **NOT VERIFIED**.

| Role | Existing count |
|---|---|
| `admin_provinsi` | NOT VERIFIED |
| `admin_kab_kota` | NOT VERIFIED |
| `wasit` | NOT VERIFIED |
| `panitia` | NOT VERIFIED |
| `evaluator` | NOT VERIFIED |

## 3. Admin Actor Availability

No actor rows or UUIDs were queried. Existing documentation identifies logical actor labels but says exact actor/session bindings are not frozen.

```text
ADMIN_PROVINSI_ACTOR
available: NOT VERIFIED
user_id: REDACTED

ADMIN_KAB_KOTA_ACTOR
available: NOT VERIFIED
user_id: REDACTED
kabupaten_kota_id: REDACTED
```

## 4. Referee Fixture Availability

The fixture design says exact referee-to-region targets are not frozen and a second referee in a distinct region is not established by the documented seed. No profiles or role rows were queried.

```text
REFEREE_A
user_id: NOT VERIFIED
kabupaten_kota_id: NOT VERIFIED

REFEREE_B
user_id: NOT VERIFIED
kabupaten_kota_id: NOT VERIFIED
```

`FIXTURE BLOCKED`.

## 5. Contact Fixture Availability

No `referee_contacts` rows were queried. Row existence for Referee A and Referee B is **NOT VERIFIED**. No WhatsApp value was read.

| Referee | Contact row exists |
|---|---|
| A | NOT VERIFIED |
| B | NOT VERIFIED |

## 6. Assignment Fixture Availability

No `event_assignments` rows were queried. Existing assignment presence for either referee is **NOT VERIFIED**. No event names or assignment UUIDs are reported.

| Referee | Has assignment |
|---|---|
| A | NOT VERIFIED |
| B | NOT VERIFIED |

## 7. Session Infrastructure

`SESSION_NOT_AVAILABLE`.

Repository discovery found:

- `supabase/tests/security.integration.test.ts` has a sign-in helper that requires test email/password environment values; this is not an existing authenticated session, and the values were not read or used.
- `supabase/tests/fixtureProvisioningGuard.ts` and `supabase/tests/seed-security-fixtures.ts` describe guarded fixture provisioning. The seed can mutate users and database rows, so it was not run.
- `docs/PHASE-4.1-TEST-FIXTURE-DESIGN.md` says actor/target pairings are not frozen and provisioning authorization is not provided.
- `PHASE-4.2.1-FIXTURE-ACTOR-VERIFICATION.md` records actor and fixture verification as blocked.

No credential, token, password, or session was exposed. No actor was impersonated.

## 8. Actor Testing Readiness Matrix

| Requirement | Status | Evidence |
|---|---|---|
| `admin_provinsi` actor exists | NOT VERIFIED | No database query/session |
| `admin_kab_kota` actor exists | NOT VERIFIED | No database query/session |
| `wasit` actor exists | NOT VERIFIED | No database query/session |
| Same-region referee exists | NOT VERIFIED | Exact fixture pairing not frozen |
| Cross-region referee exists | NOT VERIFIED | Second target not established in fixture design |
| Contact fixture exists | NOT VERIFIED | No database query |
| Assignment fixture exists | NOT VERIFIED | No database query |
| Authenticated test session available | NO | No reusable session supplied; harness requires credential values unavailable to this phase |

`ACTOR TESTING = BLOCKED`.

## 9. Security Preconditions

The following are recorded as the project-owner-provided effective-security baseline. They were **not independently re-queried** during B.2.1:

- `profiles`: RLS enabled; authenticated SELECT privilege true; anon SELECT privilege true; an effective `Public can view referee profiles` policy uses `deleted_at IS NULL`.
- `Admins can view all profiles` uses `is_admin(auth.uid())`; the supplied effective `is_admin()` includes `admin_provinsi` and `admin_kab_kota`.
- `get_admin_referees()` is `SECURITY DEFINER`, executable by authenticated and not anon, and enforces the `admin_kab_kota` region scope according to the supplied baseline.
- `referee_contacts`: RLS enabled; anon SELECT false; the supplied SELECT policy is self-referee scoped.

These observations were not changed. They do not establish the availability of actor sessions or fixtures. No actor-level access test was run.

## 10. Final Gate

`PHASE B.2.1 BLOCKED — ACTOR SESSION REQUIRED`

Database identity, role counts, actor IDs, referee pairings, contact/assignment row existence, and actor sessions are not established. No users, roles, profiles, contacts, assignments, schema, policies, grants, or migrations were created or changed. Do not proceed to actor-level authorization testing until an approved existing test session and frozen fixture pairing are available.
