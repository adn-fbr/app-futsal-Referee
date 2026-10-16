# PHASE B.3.4.5.10 — Static Consumer Cutover Implementation & Verification

**Pre-edit consumer inventory recorded before source changes.**

## 1. Environment

- Mode: TEST workspace / source-only remediation.
- No SQL query, RPC, migration, DDL, DML, fixture, grant, RLS, or function operation is authorized or performed in this phase. The only remote metadata access was read-only TypeScript type generation from TEST.
- Local Supabase configuration and `.env` reference prohibited production `xfscfjwapwnkiinkgbjg`; neither was used. Type metadata was obtained explicitly from TEST ref `shorsqyycpptxcutrqrb`; no production access occurred.

## 2. Timestamp

`2026-09-27T08:35:42Z` (UTC).

## 3. Pre-Edit Consumer Inventory

The exhaustive source search covered `src/`, `supabase/`, application source files, nested relation projections, direct `.from("profiles")` / single-quoted equivalents, wildcard and empty `.select()`, legacy RPC calls, public referee RPCs, and assignment-candidate names. The following are the referee/profile-relevant occurrences; broad wildcard selectors on unrelated tables are separately noted below.

| Classification | File / occurrence | Current query and purpose | Fields / authorization need | Target / reason |
|---|---|---|---|---|
| MIGRATE | `src/hooks/useReferees.ts` lines 64, 107 | `get_referees()` list and expiring-filter list | Directory fields; admin actor scope must be server-derived | `get_admin_referees()`; generic legacy list is not canonical |
| MIGRATE | `src/hooks/useReferees.ts` line 131 | `count_referees()` directory count | Count only; server-derived scope | `get_admin_referee_count()`; legacy count is not canonical |
| MIGRATE | `src/hooks/useReferees.ts` line 225 | `get_referees()` referee statistics | Counts by active/license state | `get_admin_referee_count()`; avoid pulling an unscoped list |
| RETAIN | `src/hooks/useReferees.ts` line 208 | Detail hook calls `get_referee_detail()` | Capability decides self/admin projection | Already migrated in prior phase; preserve |
| MIGRATE | `src/hooks/useReferees.ts` lines 289, 316 | Referee update/status writes return rows with `.select()` | Mutation consumers use only returned ID for cache invalidation | Change return to explicit `id` only; do not change write authorization |
| MIGRATE | `src/hooks/useEventAssignments.ts` line 196 | `get_referees()` feeds event-assignment candidates before schedule/duplicate filtering | Candidate fields: ID, name, license, photo, active state, city; needs event eligibility and schedule policy | Dedicated server candidate capability unavailable; stop candidate query behind a small helper, do not substitute admin directory |
| EXCEPTION | `src/hooks/useEventAssignments.ts` line 154 | Profile name lookup for `cancelled_by` assignment history | ID/name for an existing assignment actor | Retain explicit `id, full_name` display lookup; not a referee directory |
| MIGRATE | `src/hooks/useSmartAssignment.ts` line 65 | `get_referees()` feeds smart ranking | ID, name, license, photo, city, active; event/license/schedule eligibility | Same dedicated candidate capability unavailable; stop candidate query behind shared helper |
| MIGRATE | `src/pages/Referees.tsx` lines 72-80 via hooks | Admin directory, count, summary | Admin-safe referee list/count and filters | Hooks will route to admin capabilities; no client-side authorization |
| MIGRATE | `src/hooks/useOrganization.ts` line 350; `src/components/organization/WasitSection.tsx` | Direct Wasit lookup by requested city | ID, name, photo, license, active, city | `get_admin_referees()` with requested filter constrained by server actor scope |
| MIGRATE | `src/hooks/useAnalytics.ts` line 46; `src/pages/Analytics.tsx` line 77 | Direct profile list, then client-side role filtering for referee analytics | ID, name, photo, license, expiry, active, city, creation date | `get_admin_referees()`; stop post-fetch role filtering and derive city names separately |
| MIGRATE | `src/hooks/useAnnualReport.ts` line 28 | Direct active profile ID list for annual referee totals | Active referee IDs only | `get_admin_referees()`; keep event-assignment `referee:profiles(...full_name)` join explicit |
| RETAIN | `src/hooks/useProfile.ts` lines 55, 84 | Current-user profile read/update | Explicit self allowlist; both `.eq("id", user.id)` | Self-profile flow already explicit and bound to authenticated context |
| EXCEPTION | `src/hooks/useUsers.ts` lines 79, 99, 219; `src/components/users/BulkUserImportDialog.tsx` line 118 | User administration list/count/region mutation and import existence check | Explicit user identity/region fields; separate account administration | Not referee directory/detail; preserve and classify separately |
| EXCEPTION | `src/hooks/useIncompleteProfiles.ts` lines 21, 67 | Incomplete registration queue/count | Explicit registration fields and city label | Separate registration workflow; not a referee directory |
| EXCEPTION | `src/hooks/useOrganization.ts` lines 225, 321, 380 | Pengurus/profile display, available user list, current actor city lookup | Explicit ID/name/photo or self city | Organization/user administration and actor context; not referee directory |
| EXCEPTION | `src/hooks/useRefereeCard.ts` lines 75, 217, 272, 460 | Self card profile relation; target license expiry reads; bulk card candidates | Self display fields, license expiry, or admin candidate fields | Card lifecycle is a separate capability; migrate reads to existing detail/admin capabilities where safe, preserve card writes |
| EXCEPTION | `src/hooks/useEventAssignments.ts` line 112; `src/hooks/useAdminEventAssignments.ts` line 37 | Assigned-referee relation for existing event assignments | Explicit ID/name/license/photo | Existing assignment roster, not candidate discovery; retain narrow relation projection |
| EXCEPTION | `src/hooks/useAnnualReport.ts` line 24; `src/hooks/useHonors.ts` line 61 | Existing assignment/honor referee relation | Full name only | Domain-owned assigned/honor display data; retain explicit relation projection |
| EXCEPTION | `src/hooks/useEvents.ts` line 153 | Event approver relation | Approver ID/name | Event approval record display, not referee data boundary |
| EXCEPTION | `src/hooks/useDiscussions.ts` lines 99, 136, 194 | Discussion author display lookups | ID/name/photo | Discussion domain; explicit fields only |
| EXCEPTION | `src/hooks/useEvaluations.ts` lines 97, 99, 136, 138, 305 | Evaluated referee/evaluator display | Referee ID/name/photo; evaluator ID/name | Evaluation domain; explicit fields only |
| RETAIN | `src/hooks/usePublicReviews.ts` lines 29, 85, 173 | Public referee list/single/AFK lookup | Public-safe fields | Already uses `get_public_referees()` / `get_public_referee()` |
| RETAIN | `src/hooks/useSignedUrl.ts` | Generic storage signed-URL utility; no profile query | Caller-provided object path; separate storage policy | Not a referee profile consumer; detail page no longer supplies document paths |
| EXCEPTION | `src/repositories/auth/user-profile-repository.ts` line 14 | Auth/profile bootstrap lookup | Explicit auth/profile fields, keyed by user ID | Authentication repository; retain explicit projection |
| EXCEPTION | `src/hooks/useAdminEventAssignments.ts`, `useEvents.ts`, `useHonors.ts`, `useAnnualReport.ts` nested relation projections | Existing linked-record profile fields | Explicit name/ID/license/photo as listed above | Assignment/event/honor/report relationship display, not generic profile wildcard |
| EXCEPTION | `supabase/functions/_shared/authorization.ts` line 35 | Edge authorization reads actor city | City ID keyed by verified `auth.getUser()` | Server-side authorization path; not browser consumer |
| EXCEPTION | `supabase/functions/create-user/index.ts` line 122; `create-users-bulk/index.ts` line 184; `seed-database/index.ts` line 388 | Profile provisioning/update | Writes limited to profile completion and city | Server provisioning/seed implementation; not changed or run |
| EXCEPTION | `supabase/functions/delete-user/index.ts` line 97 | Audit context before account deletion | Name and city | Server account operation; not browser directory |
| EXCEPTION | `supabase/functions/send-license-reminder/index.ts` line 44 | Expiring license reminders | ID/name/license/expiry/status | Server reminder workflow; not browser directory |
| EXCEPTION | `supabase/functions/send-profile-reminder/index.ts` line 94 | Profile reminders | ID/name, caller-city constrained for city admins | Server reminder workflow; not browser directory |
| EXCEPTION | `supabase/functions/send-assignment-notification/index.ts` line 199 | Notification display name | ID/name | Server notification workflow; not candidate discovery |
| EXCEPTION | `supabase/functions/update-user-email/index.ts` lines 86, 106 | Scoped target-city and duplicate-email checks | City ID or ID only | Server account operation; not browser directory |
| EXCEPTION | `supabase/functions/seed-database/index.ts` line 678; `supabase/tests/seed-security-fixtures.ts` lines 71, 86, 90 | Development seed/fixture profile access | ID/name/city or fixture setup | Not run; fixture prohibition remains in force |

### Pre-Edit Search Findings

- Browser-source legacy calls: six `get_referees()` calls in `useReferees.ts`, `useEventAssignments.ts`, and `useSmartAssignment.ts`; one `count_referees()` call in `useReferees.ts`.
- Generated types retain legacy function declarations. Migration history and SQL definitions also contain legacy references; these are not application consumers and must remain physically present.
- No application source call to `get_admin_referees()` / `get_admin_referee_count()` was found before edits. Their declarations were absent from the workspace generated types.
- TEST type generation (read-only, TEST ref only) returned actual signatures: `get_admin_referees` with `_is_active`, `_kabupaten_kota_id`, `_license_level`, `_limit`, `_offset`, `_search`, and an 11-field row; `get_admin_referee_count` with the four filters and numeric return. No assignment-candidate RPC was present.
- No direct profile wildcard projection (`profiles.select("*")`, `.select()` on a profile read, or wildcard nested profile relation) was found. `useReferees.ts` status-toggle `.select()` returns the full updated profile row and is separately targeted for an explicit `id` return. Other workspace wildcard/empty `.select()` matches refer to non-profile tables.
- Other wildcard/empty `.select()` occurrences classified as **EXCEPTION** (unrelated entity contracts, not profile projections): notification context/preferences/notifications; admin learning and learning materials; auth logs; discussion topics/replies; evaluations/scores; event assignments/events; honors; organization pengurus/province/city records; public referee review stats/reviews; referee-card/card-verification records; and `useUsers`' kabupaten/kota list. Inserts/updates returning complete rows in these domains remain outside this referee-profile cutover.
- Public directory consumers already use public-safe RPCs.

## 4. Files Changed

- `src/integrations/supabase/types.ts`: exact TEST-generated declarations for `get_admin_referees` and `get_admin_referee_count`.
- `src/repositories/admin-referee-directory.ts` (new): typed list/count boundary, city-name hydration, and pagination.
- `src/repositories/assignment-candidate-repository.ts` (new): explicit fail-closed boundary while no candidate capability exists.
- `src/hooks/useReferees.ts`: list, count, expiring-filter, and summary consumers use admin capabilities; update/status responses select only `id`; CSV no longer exports birth date from an admin directory result.
- `src/hooks/useEventAssignments.ts` and `src/hooks/useSmartAssignment.ts`: candidate fetches fail closed instead of calling `get_referees()`.
- `src/hooks/useOrganization.ts`: city Wasit listing uses the actor-scoped admin directory with complete pagination.
- `src/hooks/useAnalytics.ts`, `src/pages/Analytics.tsx`, and `src/hooks/useAnnualReport.ts`: referee analytics/report reads use the actor-scoped admin directory; city-name mapping uses the returned/hydrated directory field.
- `src/hooks/useRefereeCard.ts`: license-expiry reads use `get_referee_detail`; bulk candidates use the admin directory.
- `PHASE-5.10-STATIC-CONSUMER-CUTOVER-REPORT.md`: this source-only evidence report.

## 5. Files Not Changed by This Phase

- `src/hooks/useProfile.ts`: already has explicit self fields and uses the authenticated `useAuth().user.id`; unchanged. RLS remains the server authorization boundary.
- `src/hooks/useUsers.ts`, `src/hooks/useRegistrations.ts`, `src/hooks/useSignedUrl.ts`, `src/repositories/auth/user-profile-repository.ts`, `src/hooks/useDiscussions.ts`, `src/hooks/useEvaluations.ts`, and `src/hooks/usePublicReviews.ts`: unchanged; profile fields are explicit and their user/account, registration, discussion, evaluation, auth, storage, or public-safe contracts are separately classified above.
- `src/pages/Referees.tsx`, `src/pages/RefereeDetail.tsx`, `src/pages/PublicRefereeList.tsx`, and `src/pages/PublicRefereeDetail.tsx`: unchanged by this phase. Some are already modified in the worktree by prior/user changes; those changes were preserved.
- No test files, `.env` files, package scripts, Edge Functions, SQL migrations, RLS policies, grants, database functions, or fixtures were modified.
- The worktree contained unrelated pre-existing changes (including `.env.test`, `package.json`, `src/hooks/useProfile.ts`, `src/hooks/useRegistrations.ts`, `src/pages/Referees.tsx`, and prior phase artifacts); none were reverted or edited by this phase.

## 6. Implementation / Cutover Results


## 7. Required Consumer Matrix
| `useReferee()` | Direct/detail profile query | `get_referee_detail()` | RETAINED |
| Referee detail page | Direct detail | `get_referee_detail()` | RETAINED |
| Admin directory | `get_referees()` | `get_admin_referees()` | MIGRATED |
| Admin count | `count_referees()` | `get_admin_referee_count()` | MIGRATED |
| Admin statistics | `get_referees()` | `get_admin_referee_count()` | MIGRATED |
| City Wasit section | Direct roles + profiles | `get_admin_referees()` | MIGRATED |
| Referee analytics | Direct profiles + roles | `get_admin_referees()` | MIGRATED |
| Annual report referee IDs | Direct profiles | `get_admin_referees()` | MIGRATED |
| Card license expiry | Direct profile query | `get_referee_detail()` | MIGRATED |
| Bulk card candidates | Direct profiles | `get_admin_referees()` | MIGRATED |
| Event assignment candidates | `get_referees()` | Assignment-candidate capability | BLOCKED; capability unavailable, fail closed |
| Smart assignment candidates | `get_referees()` | Assignment-candidate capability | BLOCKED; capability unavailable, fail closed |
| Self profile | Explicit self projection | Explicit self projection | RETAINED |
| Referee update | Direct update + broad return | Direct update + `id` only | MIGRATED |
| Status toggle | Direct update + wildcard return | Direct update + `id` only | MIGRATED |
| Public directory | Public-safe RPCs | Public-safe RPCs | RETAINED |
| `get_referees()` / `count_referees()` | Legacy functions | Retain physically; retire after cutover | RETIRE-PENDING |

## 8. Remaining Legacy References and Wildcards

- `get_referees()` browser application RPC calls: **0**.
- `count_referees()` browser application RPC calls: **0**.
- The only source matches are the generated type declarations. Existing migration/function definitions remain physically present and were not touched.
- Profile wildcard reads (`profiles.select("*")`, empty `.select()` returning profile rows, wildcard nested `profiles(*)`): **0** after cutover.
- Remaining direct profile lookups are explicit self, actor, assigned-record display, user/account, registration, discussion/evaluation, and server Edge Function workflows classified in Section 3. No generic referee detail/list remains on direct profile queries.
- Other entity wildcards/empty mutation returns are classified as domain **EXCEPTION** in Section 3; this phase changes only referee profile mutation return projections.

## 9. Generated Types

TEST-generated type metadata includes `get_referee_detail`, `get_admin_referees`, and `get_admin_referee_count`. The two admin RPC declarations were added from the read-only TEST-generated output; the existing detail declaration was retained. The updated workspace types compile. No assignment candidate function is present in TEST-generated types.

## 10. Static Security Assertions

| Assertion | Result | Evidence |
|---|---|---|
| `useReferee()` -> `get_referee_detail()` | PASS | Hook source |
| Admin list -> `get_admin_referees()` | PASS | Typed shared repository; no legacy call |
| Admin count -> `get_admin_referee_count()` | PASS | Typed shared repository; no legacy call |
| Assignment -> dedicated candidate capability | BLOCKED | No such RPC; helper fails closed |
| Smart assignment -> dedicated candidate capability | BLOCKED | No such RPC; helper fails closed |
| Public list/single -> public-safe RPCs | PASS | Public review hooks use public RPCs |
| Profile wildcard reads | PASS | None found after migration; remaining profile reads are explicit |
| Directory excludes birth date/email/contact/document/approval fields | PASS | TEST-generated admin RPC row type and consumer fields |
| Browser service-role key guard | PASS | Browser client rejects a service-role key; no credential in application browser code |
| No database changes | PASS | No SQL/migration tools used; TEST type generation was read-only |

## 11. Tests and Quality Gates

Final validation results:

- `npm run typecheck`: **PASS**.
- `npm run test`: **PASS**, 31 files and 138 tests.
- `npm run lint`: **FAIL**, repository-wide existing backlog: 163 errors and 26 warnings (189 findings), primarily `no-explicit-any` plus regex/style findings. No cutover-specific type errors were reported.
- ESLint on changed files: **FAIL**, 17 existing `no-explicit-any` errors across analytics, card, smart-assignment, and Analytics page code; none are in the new repositories or edited cutover expressions, and unrelated findings were not altered.
- Post-edit source search: 0 browser RPC calls to `get_referees()` / `count_referees()`; no direct profile wildcard; public capability calls remain present; no assignment candidate capability exists.
- No tests were edited.

## 12. Blockers and Exact Next Phase

The only capability blocker is secure event-assignment candidate retrieval: the existing TEST schema/type output has no dedicated candidate RPC. Both assignment consumers now fail closed and do not fall back to `get_referees()` or `get_admin_referees()`.

**Exact next phase:** `B.3.4.5.11 — Assignment Candidate Capability Contract and Consumer Cutover`, to define/implement a server-authorized candidate capability, then restore these two consumers and run assignment business-rule/regression tests. Legacy `get_referees()` / `count_referees()` retirement remains deferred until that capability and all runtime consumers are verified.

## 13. Final Gate

```text
PHASE: B.3.4.5.10

ENVIRONMENT:
TEST ONLY

DATABASE MUTATION:
NONE

SOURCE CUTOVER:
CONDITIONAL

LEGACY get_referees:
0 browser RPC calls / 1 generated type declaration

LEGACY count_referees:
0 browser RPC calls / 1 generated type declaration

WILDCARD profiles:
0 / 0 remaining wildcard profile projections

TYPECHECK:
PASS

LINT:
FAIL (existing repository lint findings)

TEST:
PASS (31 files, 138 tests)

ASSIGNMENT CAPABILITY:
BLOCKED

FINAL GATE:
CONDITIONAL
```

No legacy function retirement or database modification is authorized in this phase.