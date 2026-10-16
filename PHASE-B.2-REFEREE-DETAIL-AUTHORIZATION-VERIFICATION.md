# PHASE B.2 — Referee Detail Authorization Verification

## 1. Executive Summary

**PHASE B.2 BLOCKED — ACTOR TESTING BLOCKED — NO EXISTING TEST SESSIONS**

No actor credentials or sessions were available for safe authenticated requests, and no database connector was available in the preceding connectivity phase. No actor-level RPC, REST, or direct table test was performed. No fixture, user, role, profile, contact, or assignment was created or changed.

The authorization facts below are separated into (a) the test-database baseline supplied by the project owner and (b) actor-test results. The supplied baseline is not independently re-queried in this phase.

## 2. Test Environment

- Intended test project: `shorsqyycpptxcutrqrb` (`test APP`).
- Production project: `xfscfjwapwnkiinkgbjg`; not queried or used.
- Test-mode environment selection was verified in PHASE B.1.1.1.
- Database identity could not be re-established in this phase because the database connector was unavailable. No SQL was run.
- No secrets, passwords, API keys, email values, WhatsApp values, or tokens were read or included here.

## 3. Existing Actor Inventory

Repository evidence does not provide usable existing test sessions:

- `PHASE-4.2.1-FIXTURE-ACTOR-VERIFICATION.md` lists logical actor labels but records the actor/fixture check as blocked and exact identities as unverified.
- `docs/PHASE-4.1-TEST-FIXTURE-DESIGN.md` says candidate role populations historically existed, but exact actor-to-region bindings were not frozen.
- `supabase/tests/security.integration.test.ts` requires test-user email/password environment variables. Their values were not read or used; the test is not a reusable authenticated session supplied to this phase.
- `supabase/tests/fixtureProvisioningGuard.ts` defines synthetic fixture identities, but the fixture seed is a provisioning mechanism, not evidence that those accounts currently exist or that sessions are available.

`ACTOR TESTING BLOCKED — NO EXISTING TEST SESSIONS`

## 4. Existing Fixture Inventory

`docs/PHASE-4.1-TEST-FIXTURE-DESIGN.md` records:

- `REFEREE_A` and `REFEREE_B` as logical targets with exact target/region pairing not frozen.
- A second referee target in another region as not established by the documented seed.
- No approved actor-session binding or contact fixture manifest for this route.

`FIXTURE BLOCKED`. No rows or actors were queried or created. No UUIDs are reported.

## 5. Actual `profiles` Access

### Supplied test-database baseline

The project-owner-provided baseline reports RLS enabled and these policies:

- `Admin kab_kota can view profiles in their region`
- `Admin provinsi can view all profiles`
- `Admins can view all profiles`, using `is_admin(auth.uid())`
- `Public can view referee profiles`
- `Users can view their own profile`

The same baseline states that actual `is_admin(uuid)` includes `admin_provinsi` and `admin_kab_kota`. Therefore the `Admins can view all profiles` predicate is not independently region-scoped for `admin_kab_kota`. This is a **confirmed policy-level issue in the supplied baseline**, but no authenticated request was made to measure effective table access. Table grants and actor sessions were unavailable here.

### Actor requests

Direct profile SELECT requests for `admin_provinsi`, `admin_kab_kota`, `wasit`, ordinary authenticated, and anon were **NOT TESTED**. The presence of a public policy does not by itself establish whether anon has table-level SELECT privilege or which columns/rows are visible.

## 6. Actual `get_admin_referees` Access

The supplied baseline reports `get_admin_referees` as `SECURITY DEFINER`, executable by `authenticated` and not granted to `anon`. It reports that the function resolves admin scope and requires an `admin_kab_kota` requested region to equal the actor's own region.

Actor requests for own, foreign, and NULL regions were **NOT TESTED**. Exact error/empty-result behavior is unknown. The function is a candidate list boundary based on the supplied definition, but is not actor-verified in this phase.

## 7. Actual `get_referees` Access

The supplied baseline reports that `get_referees` is `SECURITY DEFINER` and executable by both `anon` and `authenticated`, and that its authorization logic does not establish the required admin-region contract.

No anon or authenticated RPC was executed. Cross-region behavior and returned columns were **NOT TESTED**.

`CURRENT FUNCTION UNSAFE FOR ADMIN AUTHORIZATION BOUNDARY` — based on the supplied baseline; do not use it as the authorization boundary for a new contact-detail UI until remediated or replaced.

## 8. Actual `referee_contacts` Access

### Supplied test-database baseline

- RLS is enabled.
- The supplied SELECT predicate is `(auth.uid() = referee_id) AND has_role(auth.uid(), 'wasit')`.
- The supplied baseline says authenticated has table-level SELECT and anon SELECT is false.

This predicate does not authorize a generic admin to read another referee's contact. No actor query was run, and no contact value was read.

The baseline did not specify effective INSERT, UPDATE, or DELETE policies/grants; those operations are **NOT VERIFIED**. Migration-source policies are not substituted for actual DB evidence.

## 9. Email Exposure

Email is stored in `profiles.email` according to repository schema/types. The supplied baseline reports a public profile SELECT policy and a broad admin policy, but this phase did not establish effective table grants, inspect the effective policy expressions, or issue safe column-visibility requests.

| Actor | `email_column_visible` |
|---|---|
| anon | NOT TESTED |
| ordinary authenticated | NOT TESTED |
| wasit | NOT TESTED |
| admin_kab_kota | NOT TESTED |
| admin_provinsi | NOT TESTED |

No email addresses were read or printed.

## 10. WhatsApp Exposure

WhatsApp is stored in `referee_contacts.whatsapp_number` according to repository source. The supplied baseline's owner-and-wasit SELECT predicate indicates a self-only row predicate; admin contact access is not included in that predicate. No direct REST/RPC request or row-count test was performed. No WhatsApp number was read.

## 11. Assignment-Based Authorization

The inspected `useRefereeEvents` hook reads assignments filtered to the current referee's own `referee_id`, and loads event/honor information. No code or supplied contract authorizing contact sharing between referees because of a shared event, assignment, event-staff relationship, or other association was found.

`NOT AUTHORIZED BY CURRENT CONTRACT`. Assignment membership must not be treated as contact authorization without an approved rule.

## 12. ACTUAL Authorization Matrix

Actual actor requests were not made. Policy-level notes from the supplied baseline are shown separately and are not substituted for request results.

| Actor | Own profile | Same-region referee profile | Cross-region referee profile | Own contact | Same-region contact | Cross-region contact |
|---|---|---|---|---|---|---|
| admin_provinsi | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED |
| admin_kab_kota | NOT TESTED | NOT TESTED | NOT TESTED; supplied broad `is_admin` policy predicate is overbroad | NOT TESTED | NOT TESTED | NOT TESTED |
| wasit | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED |
| ordinary authenticated | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED |
| anon | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED |

RPC metadata from the supplied baseline: `get_admin_referees` is executable by authenticated and not anon; `get_referees` is executable by anon and authenticated. This is privilege metadata, not proof of returned row access.

## 13. DESIRED Authorization Matrix

This is the requested contract, not test evidence.

| Actor | Own profile | Same-region referee profile | Cross-region referee profile | Own contact | Same-region contact | Cross-region contact |
|---|---|---|---|---|---|---|
| admin_provinsi | ALLOW | ALLOW within province | ALLOW within province | ALLOW within scope | ALLOW within province | ALLOW within province |
| admin_kab_kota | ALLOW | ALLOW | DENY | ALLOW only if part of authorized detail contract | ALLOW | DENY |
| wasit | ALLOW | DENY absent an approved assignment rule | DENY absent an approved assignment rule | ALLOW | DENY | DENY |
| ordinary authenticated | ALLOW own account only | DENY | DENY | ALLOW own account only if applicable | DENY | DENY |
| anon | DENY private detail | DENY | DENY | DENY | DENY | DENY |

## 14. Secure Detail Endpoint Assessment

**NOT VERIFIED in the database.** No secure detail endpoint was confirmed from the available database connection (none was available). In inspected frontend source, no private detail RPC is used: list code calls `get_referees`; detail code directly queries `profiles`. `get_admin_referees` is described in the supplied baseline as a list function, not a detail/contact function. Public detail/list RPCs are not a substitute for an authorized private-contact endpoint.

## 15. Wildcard Query Assessment

Source inspection found:

- UI data-minimization risk: `src/hooks/useReferees.ts` uses `profiles.select("*")` for referee detail and `.select()` without explicit columns after referee profile updates.
- Profile self-service overfetch: `src/hooks/useProfile.ts` selects `*` for the current user's own profile and uses unqualified `.select()` after update.
- Authorization risk: UI role checks or post-query role checks cannot replace RLS/RPC authorization. The detail query relies on direct profile-table authorization.
- Contact hook: `src/hooks/useRefereeContact.ts` selects explicit contact columns and filters to the current user; this is not an admin detail flow and still depends on effective RLS/grants.
- Migration dependency: direct profile queries depend on effective table grants and policies; the supplied baseline includes broad/public profile policies that require remediation design.

No source changes were made.

## 16. Confirmed Findings

Based on the test-database baseline explicitly supplied with the task (not independently re-queried here):

1. The `Admins can view all profiles` policy uses `is_admin(auth.uid())`, and the supplied actual helper definition includes `admin_kab_kota`; its policy predicate is not region-limited.
2. `get_referees` is executable by anon and authenticated and does not establish the required admin-region contract; it is unsafe as the list authorization boundary.
3. `referee_contacts` SELECT is described as owner-and-wasit scoped; authenticated table SELECT alone does not bypass that RLS predicate.

Actor-level allow/deny results remain untested. The above must not be presented as successful authorization tests.

## 17. Unverified Findings

- Direct profile visibility and email visibility for each actor, including anon.
- Effective table grants and complete policy expressions for the target tables.
- `get_admin_referees` behavior for own, foreign, and NULL requested regions, including exact errors.
- `get_referees` anon/non-admin/cross-region RPC results and returned field set.
- Direct contact REST results for referee, admin, and ordinary authenticated actors.
- Effective INSERT/UPDATE/DELETE access to `referee_contacts`.
- Existence and behavior of a database-only secure detail endpoint.
- Assignment-based contact-sharing authorization.

## 18. Required Remediation

Before contact UI work:

1. Narrow the effective profile SELECT authorization so `admin_kab_kota` cannot obtain cross-region referee rows; remove or replace broad/public profile access as appropriate. Do not broaden public SELECT.
2. Keep `get_referees` out of the security boundary until its actual authorization, grants, and output are remediated and verified; restrict anonymous execution as part of an approved migration design if the supplied grant is confirmed.
3. Use a backend-enforced detail boundary returning explicit, minimized fields and enforcing province, kabupaten/kota, and self-only actor scope. Do not grant raw contact-table access to admins merely for UI convenience.
4. Define whether `profiles.email` and `referee_contacts.whatsapp_number` are authorized contact fields, then test direct REST/RPC paths as well as UI paths.
5. Do not grant assignment-based contact sharing without an explicit approved business rule.

No remediation was implemented in this phase.

## 19. Migration Preconditions

Before drafting or applying any authorization migration:

- obtain a read-only connection whose database identity proves the test project;
- capture effective policies, table grants, function bodies, owners, `search_path`, and execute privileges from that database;
- obtain approved, existing test actor sessions and frozen same-/cross-region referee fixture bindings, or separately authorize a fixture phase;
- test the current behavior and preserve exact baseline evidence;
- design and review rollback separately.

Do not use production as fallback. Do not create fixtures or credentials in this phase.

## 20. Final Gate

`B.2 ACTOR TESTING BLOCKED`

# PHASE B.2 BLOCKED

The required actor-level tests could not be performed because no existing test sessions or frozen actor/target fixture bindings are available, and database connectivity remains unavailable. No authorization PASS is claimed. No migration SQL or UI was created.
