# PHASE B.3.3 — Static Authorization Validation

**Result: `PHASE B.3.3 BLOCKED — AUTHORIZATION CONTRACT INCONSISTENT`**

## 1. Input Artifacts

- `PHASE-B.3.2-REFEREE-AUTHORIZATION-CONTRACT.md`
- `PHASE-B.3.2-REFEREE-AUTHORIZATION-MIGRATION-SPEC.md`
- `PHASE-B.3.1-R-LIVE-SCHEMA-AUTHORIZATION-VERIFICATION.md`
- Current frontend source and generated Supabase types
- Tracked migration source, used only as historical/static context

## 2. Environment Restriction

- No database query, migration, source edit, or production access was performed in B.3.3.
- Project context remains TEST `shorsqyycpptxcutrqrb`; production `xfscfjwapwnkiinkgbjg` was not accessed.
- Live catalog facts below are taken from the prior B.3.1-R artifact, which records project-scoped read-only queries. They are not newly verified in this phase.
- Actor-level behavior remains **NOT VERIFIED**.

## 3. Static Validation Methodology

Compared the two B.3.2 artifacts against the B.3.1-R live catalog report and source consumers. Checked actor-by-actor allow/deny rules, unresolved province behavior, field projections and live UI dependencies, direct-table/RPC bypasses, mutation paths, SECURITY DEFINER/grant controls, rollback safety, and source-level credential patterns. No source or migration was changed.

## 4. Actor Contract Validation

The core read/detail matrix is explicit and avoids treating `authenticated` or `is_admin()` alone as authorization:

- `admin_kab_kota`: same-city allow; foreign-city deny from server-derived actor and target city IDs.
- `admin_provinsi`: allow only on verified province match; otherwise deny.
- `wasit`: own profile/contact only; other referee denied.
- ordinary authenticated: no directory/detail access.
- anon: no private detail/contact access.
- assignment alone grants no private contact access.

**Result: PARTIAL PASS.** Read/detail actor rules are internally consistent. They do not yet cover the live profile UPDATE paths described in section 7.

## 5. Fail-Closed Validation

The contract says unresolved actor or target province mapping must deny and forbids inventing a resolver. The migration spec says do not implement province helper until the relationship is verified and fail closed if unresolved.

Required behavior is represented correctly:

- actor province unresolved: DENY;
- target province unresolved: DENY;
- mismatch: DENY;
- verified match: eligible for ALLOW.

**Result: PASS as design intent.** The live B.3.1-R report confirms the target's city→province path is nullable and reports no authoritative admin-province mapping. No executable province predicate can be finalized yet.

## 6. Field Minimization

The proposed detail contract rejects `SELECT *`, separates email and WhatsApp as sensitive, excludes phone unless verified, and excludes unrelated approval/document fields. This is directionally least-privilege.

**Blocking mismatch with current screen:** `src/pages/RefereeDetail.tsx` currently consumes:

- `birth_date` for the birth display;
- `created_at` for join date;
- `is_profile_complete` for the profile badge/info tab;
- `license_photo_url` and `ktp_photo_url` to request signed URLs and power document preview/download;
- `kabupaten_kota_name` for region display.

The B.3.2 detail contract excludes birth date, created-at, profile-complete, and document paths, and only conditionally permits a region display name. It does not specify separate secure endpoints/contracts for the current document workflow or explicitly state that these screen features will be removed. Returning document paths through the general detail RPC would be inappropriate, but silently omitting them breaks existing behavior. A separate authorized document metadata/signed-URL contract and field scope is required.

`email` and WhatsApp are marked “if approved” but actor/product approval is not resolved. This is acceptable as a gate only if the eventual endpoint omits them until that approval exists.

## 7. Direct-Table Bypass and Consumer Inventory

The B.3.2 sequence correctly delays SELECT-policy restriction until replacement consumers and actor tests are ready. However, the current design does not cover all live/static direct profile operations or the separately exposed UPDATE path.

### A — Must migrate or retain an explicitly scoped contract before direct SELECT restriction

- `src/hooks/useUsers.ts`: profile listing, count, and profile region update.
- `src/components/users/BulkUserImportDialog.tsx`: profile ID scan.
- `src/hooks/useAnalytics.ts` and `src/pages/Analytics.tsx`: cross-profile analytics/identity inputs.
- `src/hooks/useAnnualReport.ts`: referee IDs and joined profile name through assignments.
- `src/hooks/useDiscussions.ts`: profile name/avatar joins for authors.
- `src/hooks/useEvaluations.ts`: referee/evaluator name/avatar joins.
- `src/hooks/useEventAssignments.ts`: profile joins, including cancellation actor identity.
- `src/hooks/useIncompleteProfiles.ts`: registration/profile queue reads.
- `src/hooks/useOrganization.ts`: pengurus profile joins, candidate users, referees-by-region, and current actor region reads.
- `src/hooks/useRefereeCard.ts`: license expiry/profile selection for renew/generate/bulk generation.
- `src/hooks/useReferees.ts`: referee list/detail and update/status operations.
- `src/repositories/auth/user-profile-repository.ts`: self-profile fields for auth context.

These have differing roles and field requirements; one generic detail RPC cannot replace them all without behavior changes. The artifact needs an explicit per-consumer target (scoped RPC, self path, or separately scoped write/read boundary) before global SELECT restriction.

### B — Self-profile access that may be preserved narrowly

- `user-profile-repository.ts` selects `id, full_name, is_profile_complete, kabupaten_kota_id, registration_status, requested_role` for the current actor.
- `useProfile.ts` is filtered to the current user ID, but selects `*` and has unqualified `.select()` after update. It needs an explicit self-profile field set and verified self RLS; do not preserve its wildcard as-is.

### C — Must move to a dedicated/refined referee boundary

- `useReferee()` in `useReferees.ts`: direct `profiles.select("*")`, followed by a separate client role check.
- `useReferees`, stats/count, `useEventAssignments`, and `useSmartAssignment`: legacy `get_referees()` consumers; migrate to explicit scoped list contracts.
- Public review/list calls already use separate public RPCs; preserve only those explicit public-safe projections.

### D — Live consumer authorization/scope still requires mapping

Analytics, discussions, evaluations, organization, incomplete-profile, event assignment, card workflows, and user administration need per-actor/per-region purpose review before changing privileges. Static field lists alone do not establish each caller's required business authorization.

### Confirmed write-boundary gap

`useUpdateReferee()` and `useToggleRefereeStatus()` in `src/hooks/useReferees.ts` update `profiles` by supplied ID and request `.select()` results. The B.3.1-R live report confirms `Admins can update all profiles` uses `is_admin(auth.uid())`, and live `is_admin()` includes `admin_kab_kota`. That policy permits cross-region UPDATE at the policy level, in addition to broad SELECT. B.3.2 Stage F addresses direct SELECT but does not define replacement server-side authorization for these UPDATE/status actions or explicitly remediate the broad UPDATE policy. This is a security-completeness blocker; actor-level write behavior was not tested.

## 8. Legacy RPC Analysis

Tracked source has these `get_referees()` consumers:

| Consumer | Requested arguments / requirement |
|---|---|
| `useReferees()` list | license, active, city, search, limit, offset; UI also needs region name, list/export uses birth date and created date |
| `useRefereesCount()` | filters; uses `count_referees` unless client-side expiry filtering causes full list fetch |
| `useRefereeStats()` | all referees; client counts total/active/license bands |
| `useEventAssignments.ts` | `_is_active: true`; candidate list for assignments/conflict processing |
| `useSmartAssignment.ts` | `_is_active: true`; suggestion/scoring inputs |

The live B.3.1-R artifact reports one six-argument SECURITY DEFINER overload, executable by anon and authenticated, with no role/region authorization, `birth_date` in output, no `deleted_at` predicate, and NULL `_limit` unbounded. This is unsafe as an authorization boundary. The B.3.2 target to retire it after consumers migrate is appropriate, but the replacement mapping is not sufficiently specified for province list access, count/stats, city lists, and assignment suggestions. Live `get_admin_referees()` enforces city scope but does not enforce province scope; it cannot serve as a province-secure replacement without a verified province resolver.

## 9. SECURITY DEFINER Validation

The B.3.2 future-function requirements include explicit auth, scope, columns, restricted execute, and schema qualification; this is a sound checklist. It also recognizes that SECURITY INVOKER is preferable if RLS can satisfy least privilege.

The live B.3.1-R report records existing definer functions with `search_path=public`; `get_referees()` contains unqualified `profiles`/`user_roles` references. The draft spec must explicitly distinguish existing unsafe functions from required controls for the new function and specify a deliberately controlled path (prefer empty path plus fully qualified objects), not merely repeat `search_path=public` as “pinned.”

**No new function is proposed or created in this phase.**

## 10. Grant Validation

The spec explicitly addresses `anon`, `PUBLIC`, and authenticated execution for future private RPCs, and does not treat authenticated role membership as authorization. This is directionally correct.

Gaps to resolve before SQL drafting:

- Capture/handle existing PUBLIC grants and default privileges for every overload; exact live ACL provenance is not stated as an operation.
- Include the existing anon-executable helper functions reported by B.3.1-R (`is_admin`, role and city resolvers accept caller-supplied user IDs). Decide whether direct helper EXECUTE remains necessary for RLS policies or is replaced with non-enumerating/auth-bound helpers; do not blindly revoke and break policy evaluation.
- The live RPC grant facts should replace stale “unknown” statements in the B.3.2 artifacts before the migration draft phase.

## 11. Province Dependency Validation

The design correctly rejects a guessed resolver and requires actor→province and target→province mapping. B.3.1-R verifies the target city-to-province FKs but reports nullable region fields and no authoritative/unique admin-province binding; `_resolve_admin_scope()` returns only city ID. Province fail-closed behavior is sound, but the policy stage must explicitly replace both broad `Admins can view all profiles` and `Admin provinsi can view all profiles` paths. Otherwise direct SELECT could bypass a fail-closed detail RPC while the latter policy remains active.

## 12. BOLA / IDOR Coverage

The contract covers city same/foreign region, direct profile/contact ID, altered region, province same/foreign after mapping, unresolved province, referee self/other/contact, assignment-only denial, ordinary-auth denial, and anon denial. This is adequate as a future read/detail test outline.

Missing coverage: city-admin cross-region profile UPDATE/status mutation; province update scope; unauthorized document metadata/signed URL access; and list/count RPC parameter abuse for each consumer. Add these before claiming remediation test coverage complete. No tests were executed here.

## 13. Rollback Validation

Rollback spec avoids restoring known public/broad-admin policies and calls for compatible consumers and secure scoped fallback. This preserves least privilege in principle.

It must also capture and restore/retain scoped UPDATE behavior and document/document-storage access. If a profile UPDATE or document feature fails, do not restore broad `is_admin` UPDATE or expose document paths; keep those operations denied until a secure fallback is available.

## 14. Source Security Validation

A static text search in the inspected browser source/config patterns found no matches for `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `DATABASE_URL`, `DB_PASSWORD`, or `JWT_SECRET`. No credential values were printed. This is a limited pattern search, not a complete secret-scanning guarantee.

## 15. Findings

- **PASS:** Actor classes and core read/detail rules are explicit; no `authenticated = allowed` or `is_admin = allowed` fallback is prescribed.
- **PASS:** Province scope is fail-closed when unresolved.
- **PASS:** Assignment alone is not treated as private contact authorization.
- **PASS:** Future private RPC design requires explicit fields, caller identity, server-derived scope, and no anon/PUBLIC execute.
- **BLOCKER:** Current detail UI requires fields and document workflows omitted from the proposed response, with no separate secure document contract or explicit approved feature removal.
- **BLOCKER:** Direct profile UPDATE/status and region-update consumers lack a defined scoped backend replacement; live broad `Admins can update all profiles` includes city admins.
- **BLOCKER:** Direct-table strategy explicitly covers broad/public SELECT but does not explicitly remove/replace live `Admin provinsi can view all profiles`, which can bypass a fail-closed province RPC.
- **BLOCKER:** Replacement list contracts are not mapped per `get_referees()` consumer, and live `get_admin_referees()` lacks province enforcement.
- **BLOCKER:** Existing anon-executable role/scope helper grant behavior is not included in the grant remediation decision.
- **BLOCKER:** B.3.2 artifacts contain stale statements that live schema/RLS/grants and RPC overloads are unverified, despite B.3.1-R catalog evidence. Reconcile evidence labels before using those documents as migration inputs.

## 16. Blockers

The contract is not yet complete enough to proceed to executable SQL drafting because it does not define secure replacements or deliberate removals for current document viewing, profile updates/status changes, and direct region/profile consumers. It also does not explicitly close every live broad SELECT/UPDATE policy path or disposition public-executable helper functions. These gaps could leave bypasses or break current behavior if policies are changed.

Live province actor mapping remains unresolved. This need not weaken the fail-closed rule, but prevents enabling province-scoped access in an executable contract. Actor-level runtime verification also remains unperformed.

## 17. Next Phase Recommendation

Revise the two B.3.2 artifacts before B.3.4 to:

1. Add explicit server-side contracts for referee profile update/status and any user-region update path; include same/foreign-region write tests.
2. Specify a separate authorization boundary for license/KTP document metadata and signed URL issuance, or explicitly remove those UI features before table restriction.
3. Explicitly handle both `Admins can view all profiles` and `Admin provinsi can view all profiles`, plus the broad UPDATE policy, after dependent consumers are mapped.
4. Map each direct profile consumer and each `get_referees()` use to a scoped endpoint/own-profile path, preserving required list/count/stats/assignment behavior.
5. Decide how anon-executable user-ID role/scope helpers are contained without breaking policy evaluation.
6. Replace stale “live unverified” labels in B.3.2 with the B.3.1-R verified facts, while retaining unresolved province and actor-runtime labels.
7. Keep province access denied until an authoritative actor-to-province mapping is verified.
8. Add static tests for all read, write, document, legacy RPC, grant, and rollback paths; then draft SQL only after reconciliation to live test schema.

# Gate

`PHASE B.3.3 BLOCKED — AUTHORIZATION CONTRACT INCONSISTENT`

No database operation, source change, migration, or production access occurred. No actor-level authorization PASS is claimed.
