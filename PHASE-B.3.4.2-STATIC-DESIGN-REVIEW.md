# PHASE B.3.4.2 — Replacement Authorization Design Review

**Review result: `PHASE B.3.4.2 BLOCKED — DESIGN CONTRADICTIONS REQUIRE RESOLUTION`**  
**Mode: static/source/artifact only.** No database queries, migration execution, source edits, or production access occurred in this review.

## 1. Inputs and Evidence Boundaries

Reviewed:

- User-provided B.3.4.2 replacement authorization/policy migration design.
- `PHASE-B.3.1-R-LIVE-SCHEMA-AUTHORIZATION-VERIFICATION.md` (prior project-scoped live TEST catalog evidence).
- B.3.3 static validation findings.
- Current frontend consumers and tracked migration source.

The B.3.1-R artifact reports live TEST metadata for project `shorsqyycpptxcutrqrb`. No new live database facts were obtained here. Actor-level HTTP/API behavior, fixtures, and province actor binding remain unverified. Production `xfscfjwapwnkiinkgbjg` was not accessed.

## 2. Executive Result

Several core design choices are sound: do not use `is_admin()` as a referee authorization primitive; fail closed for unresolved province scope; keep referee contact separate; use explicit fields/RPCs; do not infer contact sharing from assignment; and do not immediately drop legacy functions.

The supplied design is **not internally consistent enough to approve for executable migration drafting**. Two paths explicitly re-enable access that the design otherwise declares unsafe:

1. rollback grants `authenticated` EXECUTE on live `get_referees()`, which is a SECURITY DEFINER function with no actor/region authorization and an unbounded default limit;
2. the design retains `get_admin_referees()` as an admin list boundary while the verified live function does not bind `admin_provinsi` to a province and accepts a caller-supplied region filter for that role.

Additional write, document, dependency, migration-order, and live-function verification gaps are listed below.

## 3. Actor Contract Validation

| Actor | Design result | Review |
|---|---|---|
| `admin_provinsi` | Province match only; otherwise fail closed | Correct intent; must be enforced on every list/detail/write path. Mapping remains unresolved. |
| `admin_kab_kota` | Server actor city equals server target city; foreign city denied | Correct intent. Must also cover profile UPDATE/status and list/count RPCs, not just detail. |
| `wasit` | Own profile/contact only | Correct intent. Assignment is not a contact grant. |
| ordinary authenticated | No directory/detail access | Correct intent, but rollback to authenticated `get_referees()` contradicts it. |
| `anon` | No private detail/contact/RPC | Correct target. Direct table grants and public-safe endpoint separation must be explicit. |

The proposal does not use `authenticated = authorized` as its intended rule, but one rollback clause effectively reintroduces this for referee listing.

## 4. Province Fail-Closed Validation

The live B.3.1-R evidence says:

- target profile city-to-province FK path exists, but `profiles.kabupaten_kota_id` and `kabupaten_kota.provinsi_id` are nullable;
- `pengurus` has `user_id`, `level`, `provinsi_id`, `kabupaten_kota_id`, and `is_active`, but no live constraint proves one authoritative active province binding per `admin_provinsi` role;
- `_resolve_admin_scope()` returns role and city ID only, not province ID;
- live `get_admin_referees()` does not enforce a province-admin actor/target province equality.

The B.3.4.2 fail-closed intent is correct. Before any implementation, the document should state the exact gate phrase `LIVE PROVINCE SCOPE VERIFICATION REQUIRED` and make every province-scoped list/detail/mutation path deny until actor and target mappings, cardinality, null, inactive, deletion, and mismatch behavior are verified. Do not create an assumed resolver.

## 5. `admin_kab_kota` Boundary

The proposed server-derived city equality rule is correct. It must be applied to:

- detail and list/count RPCs;
- direct profile access if any remains;
- profile edits, status changes, and any region transfer;
- document metadata/signed URL issuance;
- contact retrieval.

The UI edit form currently allows `kabupaten_kota_id` reassignment. The generic admin-update proposal excludes that field, but does not explicitly say whether the UI capability is removed or define a separately authorized region-transfer workflow. A city admin must not be able to move a target to a foreign city by supplying a new region value.

## 6. Wasit and Assignment Boundary

The design correctly states own profile/contact only and denies another referee absent an explicit rule. The live contact SELECT policy reported in B.3.1-R is self-referee/wasit scoped. No assignment-based contact-sharing rule was found in inspected source. Keep assignment access separate; `event_assignments` visibility is not private-contact authorization.

## 7. Direct `profiles` Exposure and Consumer Dependencies

The live B.3.1-R catalog report confirms:

- anon and authenticated table SELECT privileges on `profiles`;
- permissive `Public can view referee profiles` SELECT policy for non-deleted rows;
- `Admins can view all profiles` using `is_admin(auth.uid())`;
- live `is_admin(uuid)` includes `admin_provinsi` and `admin_kab_kota`;
- a broad authenticated `Admins can update all profiles` policy using the same helper;
- anon/authenticated table-level profile DML privileges were also reported, with RLS separately applying.

Thus direct-table read exposure is not only a hypothetical risk. The design must explicitly remove/narrow both SELECT and UPDATE policy paths and control table grants, while preserving required scoped behavior through replacement contracts. Also remove/replace `Admin provinsi can view all profiles` before claiming province access is protected by a fail-closed RPC.

### Static consumer classes

- **Must migrate or receive a separate scoped contract:** referee list/detail/stats; event assignment selection/suggestions; analytics and annual reports; discussions/evaluations identity joins; user administration/import; incomplete-profile queue; organization/pengurus profile joins; referee-card generation/renewal; region/user updates; registration queues/history.
- **Own-profile candidate:** `user-profile-repository.ts` selects a narrow current-user projection. `useProfile.ts` is self-filtered but uses `select("*")` and an unqualified returning `.select()`; it needs explicit columns and verified self access.
- **Dedicated referee boundary:** `useReferee()` currently selects `profiles.*` before a client role lookup; it must use the authorized detail boundary.
- **Public-safe:** public review hooks call `get_public_referees()` / `get_public_referee()`; preserve only their reviewed explicit projections.

A global SELECT restriction must be sequenced after consumer mapping/cutover. The design's conceptual sequence should not remove policies before clients/functions are ready.

## 8. Detail, Document, and Mutation Field Gaps

The proposed detail RPC baseline includes `birth_date`, `occupation`, and multiple operational profile fields. These should be justified by actor/use case and minimized; they are not automatically safe simply because the response is explicit.

Current `RefereeDetail.tsx` uses:

- `birth_date`, `created_at`, `is_profile_complete`, and `kabupaten_kota_name`;
- `license_photo_url` and `ktp_photo_url` to fetch signed URLs, preview, and download documents;
- profile edit fields `full_name`, `license_level`, `kabupaten_kota_id`, `afk_origin`;
- status toggle `is_active`.

The proposed response excludes document URLs and the generic admin update fields exclude license/region/status. That is an appropriate least-privilege direction only if it explicitly defines separate contracts or removes those UI capabilities. Required follow-ups:

- separate document authorization/signed-URL boundary, including province fail-closed scope and storage-policy validation;
- decide whether birth/join/profile-complete fields remain, are moved to another response, or are removed from UI;
- a license-level/expiry workflow with explicit role, scope, validation, and audit behavior;
- a status-change workflow with explicit role, scope, state transition, and audit behavior;
- a region-transfer workflow or explicit removal of `kabupaten_kota_id` editing;
- self profile-photo update must validate the storage path/ownership contract, not accept arbitrary URL authority.

No detail function should return KTP/license document paths just to preserve the current screen.

## 9. Profile UPDATE and Approval/Status Workflows

The design correctly rejects direct client UPDATE and proposes allowlisted RPCs, but needs more precise scope and transition rules.

Static source shows direct mutations in `useUpdateReferee()`, `useToggleRefereeStatus()`, and `useUpdateUserKabupatenKota()`. The live broad `Admins can update all profiles` policy includes city admins through `is_admin()`. Therefore migration must revoke direct `anon`/authenticated INSERT/UPDATE/DELETE privileges as appropriate and replace every required write path before relying on RLS alone.

Approval RPC references do exist in `useRegistrations.ts`: `can_approve_registration`, `approve_registration`, and `reject_registration`. The client passes `_admin_id` to the eligibility RPC and performs a client comparison as well. Their live function bodies/grants were not included in the B.3.1-R function inventory. Any retained approval workflow must independently derive the actor from `auth.uid()` and authorize target scope server-side; a caller-provided `_admin_id` is not proof. Do not replace a presumed workflow or assert it is safe until live definitions are inspected.

`set_referee_active_status(...)` must not be treated as authorized merely because the name is dedicated; specify actor scope, allowed transitions, audit event, and treatment of province scope.

## 10. Legacy RPC and `is_admin()` Retirement

### `get_referees()`

Static consumers found:

- `useReferees()` list, expiry-filter list/count fallback, and stats;
- `useEventAssignments.ts` active referee candidates;
- `useSmartAssignment.ts` active candidates.

The verified live six-argument `get_referees()` is SECURITY DEFINER, anon/authenticated executable, has no role/region authorization, returns `birth_date`, does not filter deleted profiles, and has an unbounded NULL limit. Restoring EXECUTE to **authenticated only** still lets any ordinary authenticated user invoke it. That rollback is unsafe and contradicts the matrix.

**Required correction:** never re-enable the current legacy function for anon or ordinary authenticated clients. Rollback should keep it revoked/retired and restore a secure scoped replacement or keep dependent functionality disabled until fixed. The safe rollback cannot be “restore EXECUTE authenticated” unless the exact function body is first replaced with one meeting the new contract.

Replacement mapping also needs separate list contracts for admin city, admin province (blocked until scope exists), statistics/count, and assignment selection. The live `get_admin_referees()` enforces city scope but its province path is not safe for admin province yet.

### `is_admin()`

Tracked migrations contain many policy/function references beyond profiles (events, approvals, assignments, honors, audit logs, evaluation, learning, discussion, and official documents, among others). A broad static search returned 61 migration-source matches across 11 files. This is source history, not a live dependency inventory.

The supplied sequence revokes `is_admin()` before static dependency verification, and the proposal aims to drop it entirely. That ordering is unsafe: policies/functions may fail when the helper is no longer executable or removed. **Required correction:** first enumerate effective live policies/functions and all body dependencies; replace each relevant consumer; run tests; then revoke/drop only when no live dependency remains. If unrelated domains still need a helper, replace it with domain-scoped semantics rather than globally dropping it as part of the referee-only cutover.

## 11. SECURITY DEFINER and Grant Contract

The desired controls—fixed `search_path=''`, schema-qualified relations, `auth.uid()`, explicit authorization/return columns, restricted execution, no anon execution, and no client scope authority—are appropriate for a definer function.

The current design must be more specific that:

- use a deliberately controlled path plus qualification for **all** functions/operators/types and avoid mutable `public` name resolution;
- execution should be revoked from `PUBLIC` and `anon` for private RPCs, then granted only to the required role; authenticated execute still requires in-function authorization;
- default privileges and every overload must be checked;
- existing anon-executable `is_admin`, `has_role`, and city-scope helpers accept caller-supplied user IDs per live B.3.1-R evidence. Their privilege disposition must account for policy/function dependencies, not indiscriminately revoke them while policies still call them.

## 12. Migration Order and Rollback Validation

The proposed is_admin sequence is out of order: it revokes EXECUTE before static dependency verification. Move comprehensive live dependency inventory and replacement before revoke/drop.

The proposed profile-policy sequence also needs to preserve a working secure contract while migrating clients; do not remove direct access before all consumers have replacements and actor tests pass.

Rollback statements conflict:

- “restore previous known policy definitions/grants” must never restore the live public non-deleted SELECT or broad `is_admin` SELECT/UPDATE paths;
- the explicit authenticated-only `get_referees()` regrant is unsafe, as above;
- rollback must preserve deny-by-default and may require feature rollback/temporary denial rather than restore a vulnerable API.

Also define rollback for document access and dedicated license/status/region mutations. Record pre-state of exact function overloads, default privileges, policies, and callers; B.3.1-R notes `pg_depend` does not capture all function-body references.

## 13. Source-Level Secret Check

Static search of browser source/config for `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `DATABASE_URL`, `DB_PASSWORD`, and `JWT_SECRET` produced no matches in this review. No secret values were opened or printed. This is a pattern check, not a full secret scan.

## 14. Findings and Blockers

Blocking contradictions/gaps:

1. **Unsafe rollback:** regranting authenticated EXECUTE on the live unscoped `get_referees()` exposes referee directory data to every authenticated caller.
2. **Unsafe province list path:** `get_admin_referees()` currently accepts arbitrary/null region for `admin_provinsi`; the design retains it as admin list boundary without explicitly denying that role until province mapping exists.
3. **Unsafe retirement order:** revoke/drop `is_admin()` precedes complete dependency inventory/replacement, despite many other policy/function consumers in tracked source.
4. **Write-policy coverage:** live broad profile UPDATE path and direct UI/user-region updates need scoped replacements and explicit privilege revocation; status, license, and region-transfer authorization is incomplete.
5. **Document behavior:** KTP/license viewing uses direct profile document URLs and signed URL flow; no replacement secure document contract or explicit feature removal is defined.
6. **Approval workflow evidence:** source references approval RPCs, but the live RPC bodies/grants and whether they derive actor from `auth.uid()` are not verified. `_admin_id` is passed by client to an eligibility RPC.
7. **Rollback wording:** generic restoration of previous policy/grant state conflicts with the no-public/no-cross-region rule unless explicitly limited to captured safe states.
8. **Stale phase language:** the design says live schema is unverified; B.3.1-R now has live TEST catalog evidence, while province binding and actor runtime remain unresolved. Reconcile evidence labels and rely on the latest report.

## 15. Next Phase Recommendation

Do not proceed to executable migration SQL yet. Revise the design to:

1. remove the authenticated-only `get_referees()` rollback path;
2. block `admin_provinsi` in list/detail until authoritative province mapping is available, including the existing `get_admin_referees()` route;
3. move `is_admin()` dependency inventory ahead of revocation and enumerate live RLS policies/functions across the schema;
4. specify scoped profile mutation, status, license, region-transfer, and document access contracts, or explicitly remove those UI capabilities;
5. verify actual approval RPC bodies/grants and server-derived actor checks;
6. correct rollback so it never restores public or broad admin profile access;
7. update live-vs-unverified evidence labels;
8. only then draft SQL, preflight assertions, and rollback scripts for TEST after separate authorization.

## Gate

`PHASE B.3.4.2 BLOCKED — DESIGN CONTRADICTIONS REQUIRE RESOLUTION`

No migration, database operation, source change, or production access occurred. No actor-level authorization PASS is claimed.
