# PHASE B.3.4.5.13-B — Assignment Region & Authority Evidence Resolution

**REGION_DECISION: MODEL C**  
**IMPLEMENTATION_READY = NO**  
**FINAL GATE: BLOCKED — AUTHORITATIVE BUSINESS SOURCE STILL MISSING**

## 1. Environment

- Target verified before TEST catalog inspection: project `test APP`, ref `shorsqyycpptxcutrqrb`, status `ACTIVE_HEALTHY`, PostgreSQL 17.6.
- Evidence timestamp: `2026-09-27T09:05:32Z` (UTC).
- Scope: read-only TEST catalogs and repository source/documentation.

## 2. Production Access Status

Production `xfscfjwapwnkiinkgbjg` was **NOT ACCESSED**. No production project tool, database query, URL, credential, or browser connection was used.

## 3. Mutation Status

No migration, DDL, DML, RLS/grant change, function/trigger change, fixture or role mutation, deployment, impersonation, fabricated JWT, or `auth.uid()` simulation was performed. No assignment RPC/write was called.

## 4. Evidence Hierarchy

Findings are classified as:

1. `AUTHORITATIVE` — explicit approved business requirement or security contract applicable to assignment creation.
2. `DERIVED` — current database constraint or active server-side enforcement.
3. `HISTORICAL` — old migration/report/validator that is not current enforcement.
4. `UI_BEHAVIOR` — current frontend behavior, filtering, display, or ranking only.
5. `INCIDENTAL` — schema omissions, broad policy behavior, seed/import implementation, or accidental permission.
6. `UNKNOWN` — no source establishes the rule.

Current RLS policies are authoritative evidence of what the database policy currently permits, but are not automatically an approved product decision. Historical migrations, UI behavior, and broad grants do not establish intended business policy.

## 5. Database Evidence

Read-only TEST catalog findings:

| Object | Current schema/evidence |
|---|---|
| `public.events` | Columns include `id`, `date`, `start_date`, `end_date`, `category`, `status`, `kabupaten_kota_id`, `created_by`, `deleted_at`; **no `provinsi_id`, `start_time`, or `end_time` column**. `kabupaten_kota_id` references `kabupaten_kota.id`. Status CHECK is `DIAJUKAN`, `DISETUJUI`, `DITOLAK`, `SELESAI`. |
| `public.event_assignments` | `event_id`, `referee_id` are non-null; `role` and `status` are nullable text; has FKs to events/profiles; status CHECK allows `pending`, `confirmed`, `declined`, `cancelled`; UNIQUE `(event_id, referee_id)` has no status/deleted predicate. No live role CHECK constraint. |
| `public.profiles` | `kabupaten_kota_id` nullable FK to `kabupaten_kota.id`; profile fields include `is_active`, `registration_status`, `deleted_at`, `is_profile_complete`, `license_level`, `license_expiry`. |
| `public.kabupaten_kota` | Has `provinsi_id` FK to `provinsi.id`. This is the only event-to-province derivation path visible in the inspected schema. |
| `public.pengurus` | Has `user_id`, `level`, `provinsi_id`, `kabupaten_kota_id`, `is_active`; current TEST active `PROVINSI` binding count is **0**. |
| Existing assignment rows | Read-only grouped count found roles/statuses: `CADANGAN/confirmed` 5, `CADANGAN/pending` 30, `referee/pending` 2. No individual IDs or referee data were selected. |

### Constraints and triggers

- FKs: assignment `event_id -> events.id`, `referee_id -> profiles.id`; event `kabupaten_kota_id -> kabupaten_kota.id`; profile city -> `kabupaten_kota.id`; city `provinsi_id -> provinsi.id`.
- UNIQUE `(event_id, referee_id)` is enforced regardless of status, including cancelled rows.
- Live triggers: audit logging AFTER INSERT/UPDATE/DELETE; `set_updated_at` BEFORE UPDATE; `validate_event_assignment_transition` BEFORE UPDATE. No live INSERT eligibility trigger.
- Live event/assignment constraints do not encode candidate geography, referee role, active status, registration approval, profile completeness, license eligibility, or assignment role vocabulary.

## 6. Function Evidence

| Function | Inputs | Auth source | Region/event/candidate scope | Enforcement type | `search_path` / SECURITY DEFINER / EXECUTE |
|---|---|---|---|---|---|
| `private.get_actor_kabupaten_kota_id()` | none | Internally `auth.uid()` | Requires `admin_kab_kota`; reads actor `profiles.kabupaten_kota_id` | Authoritative helper for actor city only; no event/candidate check | `''`; SECURITY DEFINER; no direct anon/authenticated EXECUTE |
| `private.get_actor_provinsi_id()` | none | Internally `auth.uid()` | Requires `admin_provinsi`; counts exactly one active, non-null PROVINSI pengurus binding | Fail-closed province actor scope only | `''`; SECURITY DEFINER; no direct anon/authenticated EXECUTE |
| `_resolve_admin_scope()` | N/A | N/A | No matching TEST function found | Absent | N/A |
| `public.is_admin_provinsi(uuid)` | caller-supplied UUID | No internal `auth.uid()`; checks role for argument | No authoritative province binding or target/event scope | Role predicate only | `public`; SECURITY DEFINER; PUBLIC/anon/authenticated EXECUTE |
| `public.is_admin(uuid)` | caller-supplied UUID | No internal `auth.uid()`; checks role for argument | Returns true for province or city admin; no scope | Generic role predicate | `public`; SECURITY DEFINER; PUBLIC/anon/authenticated EXECUTE |
| `public.is_event_approved(uuid)` | event ID | None | Returns whether event status is `DISETUJUI`; no actor authorization | Boolean status helper | `public`; SECURITY DEFINER; PUBLIC/anon/authenticated EXECUTE |
| `public.is_referee_active(uuid)` | referee ID | None | Joins profile/role; requires `wasit` and `is_active=true`; no deleted/registration/completeness/license check | Boolean eligibility helper, but not attached to live INSERT | `public`; SECURITY DEFINER; PUBLIC/anon/authenticated EXECUTE |
| `public.has_schedule_conflict(uuid,uuid)` | referee ID, event ID | None | Exact `events.date` equality; another event; any status except cancelled; no soft-delete/time/event-status exclusion | Boolean conflict helper, but not attached to live INSERT | `public`; SECURITY DEFINER; PUBLIC/anon/authenticated EXECUTE |
| `public.validate_referee_assignment()` | trigger `NEW` row | None | Calls event-approved, active-referee, conflict helpers | Trigger function exists but no live trigger invokes it | `public`; SECURITY DEFINER; PUBLIC/anon/authenticated EXECUTE |
| `public.validate_event_assignment_transition()` | trigger `OLD/NEW` rows | Internally `auth.uid()` | UPDATE status only; province role check or city event-city comparison using legacy city helper; referee self transition | Live BEFORE UPDATE trigger | `public`; SECURITY DEFINER; owner-only EXECUTE |
| `public.transition_event_assignment_status(uuid,text,text)` | assignment ID, target status, reason | Internally `auth.uid()` | Existing-row transition; province/city role and event-city check, or assigned referee | SECURITY DEFINER state-transition RPC, not create/eligibility boundary | `public`; SECURITY DEFINER; `public`; authenticated EXECUTE, anon/PUBLIC denied |

The legacy eligibility helpers and detached validator are **DO NOT REUSE AS-IS** for a new write boundary because of non-empty search paths and PUBLIC/anon EXECUTE. `_resolve_admin_scope()` is absent.

## 7. RLS Evidence

Live `pg_policies` evidence, with geography classification:

| Table / policy | Operation / roles | USING | WITH CHECK | Geography classification |
|---|---|---|---|---|
| `event_assignments` / `Admins can manage assignments` | ALL / authenticated | Province role OR city admin with event city equal to `get_user_kabupaten_kota(auth.uid())` OR Panitia role | Same predicate | `EVENT_SCOPE` for city branch; role-only for province/Panitia; **no candidate scope** |
| `event_assignments` / `Admins can view all assignments` | SELECT / authenticated | Province role OR city admin scoped by event city OR `referee_id=auth.uid()` | N/A | `EVENT_SCOPE`; no candidate profile-city predicate |
| `event_assignments` / `Referees can update their own assignment status` | UPDATE / public | Own referee row and not deleted | Own referee row and status in `confirmed`,`declined` | `NONE` for event/candidate geography |
| `event_assignments` / `Referees can view their own assignments` | SELECT / public | `auth.uid()=referee_id` | N/A | `NONE` |
| `events` / `Admins can create events` | INSERT / public | N/A | `is_admin(auth.uid()) OR has_role(...,'panitia')` | `NONE` |
| `events` / `Admins can delete events` | DELETE / public | `is_admin(auth.uid())` | N/A | `NONE` |
| `events` / `Admins can update events` | UPDATE / public | `is_admin(auth.uid()) OR has_role(...,'panitia')` | N/A | `NONE` |
| `events` / `Everyone can view events` | SELECT / public | `true` | N/A | `NONE` |
| `profiles` / `Admin kab_kota can update profiles in their region` | UPDATE / public | City role and profile city equals `get_user_kabupaten_kota(auth.uid())` | No expression reported | `CANDIDATE/PROFILE_SCOPE` for that profile operation only |
| `profiles` / `Admin kab_kota can view profiles in their region` | SELECT / public | City role and profile city equals `get_user_kabupaten_kota(auth.uid())` | N/A | `CANDIDATE/PROFILE_SCOPE` for direct profile reads, not assignment authority |
| `profiles` / `Admin provinsi can insert profiles` | INSERT / public | N/A | `is_admin_provinsi(auth.uid())` | Role-only |
| `profiles` / `Admin provinsi can update all profiles` | UPDATE / public | `is_admin_provinsi(auth.uid())` | No expression reported | Role-only |
| `profiles` / `Admin provinsi can view all profiles` | SELECT / public | `is_admin_provinsi(auth.uid())` | N/A | Role-only |
| `profiles` / `Admins can update all profiles` | UPDATE / authenticated | `is_admin(auth.uid())` | No expression reported | Role-only |
| `profiles` / `Admins can view all profiles` | SELECT / authenticated | `is_admin(auth.uid())` | N/A | Role-only |
| `profiles` / `Public can view referee profiles` | SELECT / public | `deleted_at IS NULL` | N/A | No actor/candidate region scope |
| `profiles` / self insert/update/select policies | INSERT/UPDATE/SELECT / public | `auth.uid()=id` for reads/updates | Self insert check `auth.uid()=id` | Self scope |

The active assignment RLS establishes event-city scope for the city-admin policy branch, but says nothing that affirmatively allows or denies candidate-city mismatch. The Panitia branch is unscoped by event owner/region.

## 8. Application Evidence

| Finding | Classification |
|---|---|
| `useAvailableReferees` calls the fail-closed `getAssignmentCandidates()` helper; its former implementation called `get_referees(_is_active:true)` without city restriction, then marked schedule conflicts | `UI_BEHAVIOR` |
| Smart assignment gives same-city candidates a proximity score bonus but still ranks other-city candidates | `UI_BEHAVIOR`, not authorization |
| Assignment page checks event status `DISETUJUI` before candidate UI; both single and batch insert endpoints can be called independently | `UI_BEHAVIOR` only |
| `RefereeAssignment` route uses `requireAdmin`, which admits province/city admins, not Panitia | `UI_BEHAVIOR` / route guard only |
| Event detail shows a Panitia assignment CTA while the route is admin-only; Phase 8.3B says this is a role/route mismatch whose shared policy depends on an approved contract | `HISTORICAL` evidence that Panitia scope is unresolved |
| No explicit `lintas kabupaten/kota`, `wasit luar daerah`, event-city/candidate-city authorization statement found in source | `UNKNOWN` |
| Existing app test coverage checks status transition behavior and route guard; no test asserts assignment candidate A/B/C geography or Panitia write authority | `DERIVED` from source-test search |

## 9. Documentation Evidence

| Artifact | Finding | Classification / scope |
|---|---|---|
| `PHASE-4.1C-OWNER-DECISION-FORM.md` + `PHASE-4.1D-DECISION-VALIDATION.md` D-007 | Owner chose same-region ALLOW / foreign-region DENY for referee LIST, DETAIL, EDIT, ACTIVATE, DEACTIVATE, document view/download, export; province-wide YES | `AUTHORITATIVE` for those enumerated referee actions. Candidate discovery returns a list of referee records and no approved assignment-specific foreign-region exception was found, so apply the LIST boundary to candidate rows |
| Same Phase 4.1D D-005 | Owner approved `license_expiry < CURRENT_DATE`, Asia/Makassar, equal-to-today remains active, automatic `is_active=false` after expiry | `AUTHORITATIVE` general license lifecycle; no assignment-specific license threshold or direct expiry check was approved |
| `docs/PHASE-2-REFEREES-DESIGN-SPECIFICATION.md` | States expired-license assignment behavior, boundary and timezone were unknown at that time | `HISTORICAL`; partially superseded by D-005 for expiry lifecycle, not assignment eligibility |
| `docs/security/CANONICAL-RBAC-MODEL.md` | Describes Panitia as event/competition operator with “assignment coordination” in typical resources | `AUTHORITATIVE` role vocabulary/intent only; not a global/event-owner/region write grant |
| `docs/PHASE-8.3B-UI-UX-GAP-AUDIT.md` | Panitia sees assignment CTA but route is `requireAdmin`; says a shared capability policy is needed | `HISTORICAL` UI gap; explicitly not an authorization decision |
| `docs/PHASE-8.5G.2-RLS-REMEDIATION-REPORT.md` | Describes Admin Kab/Kota assignment access by event `kabupaten_kota_id`, preserves Panitia path; its remediation was recorded blocked on migration-history drift | `HISTORICAL` design evidence; current live RLS independently confirms event-city predicate, not candidate-city semantics |
| Phase 4.1A/B decision artifacts | D-007 referee-data region boundary was open/unresolved before D-007 validation | `HISTORICAL`; D-007 owner matrix supersedes the earlier open state for listed referee-data actions only |
| Repository search for assignment-specific owner requirement | No approved assignment-specific A/B/C, Panitia owner-scope, license threshold, conflict, reassignment, or batch decision found | `UNKNOWN` |

## 10. Region Evidence Matrix

| Evidence | Classification | Supports A | Supports B | Supports C | Authoritative for assignment? |
|---|---|---:|---:|---:|---|
| Live assignment RLS: city admin event city equals legacy actor city | `AUTHORITATIVE` current enforcement | Event half only | No | Event half only | Establishes event-city write predicate; does not specify candidate city |
| Live city helper: role + actor profile city from `auth.uid()` | `AUTHORITATIVE` actor-scope primitive | No model by itself | No | No | Defines actor city, not assignment event/candidate relation |
| `event_assignments.event_id -> events.id`; `events.kabupaten_kota_id` exists; event has no `provinsi_id` | `DERIVED` schema relationship | No | No | No | Resource linkage only |
| Former `get_referees()` candidate call had no city filter; smart UI ranks cross-city candidates lower | `UI_BEHAVIOR` | Suggests A historically | No | Contradicts B/C as UI behavior | Not authoritative |
| Phase 4.1D owner D-007 same-region referee LIST ALLOW / foreign-region DENY | `AUTHORITATIVE` for referee list access | No | Yes | Candidate API is a referee list; no approved cross-region assignment exception found |
| Current live assignment RLS event-city predicate | `AUTHORITATIVE` current enforcement | Event half | No | Yes, event half only |
| Combined D-007 list boundary + live event-city assignment predicate | `AUTHORITATIVE` business list boundary plus active RLS | No | No | **Yes: Model C** |
| Historical 8.5G.2 regional RLS design | `HISTORICAL` | Event half | No | Event half | Consistent with event half; not needed to infer candidate scope |
| Tests | `DERIVED` test inventory | No | No | No | No assignment geography assertion exists |
| Explicit assignment-specific product/business documentation | `UNKNOWN` | No | No | No | Not found |

**REGION_DECISION = MODEL C.** The current live assignment policy requires the event to be in the actor city. Separately, the owner-approved D-007 contract denies foreign-region referee LIST access; candidate discovery returns a list of referee records, and no assignment-specific exception is documented. Therefore the candidate list is restricted to the actor city as well. A/B are rejected by these combined sources. This does not make the current DB function/RLS implementation sufficient: the future write boundary must use the private city helper and independently enforce both event and candidate city.

## 11. Admin City Conclusion

- **Event authorization:** current live assignment RLS requires event `kabupaten_kota_id` to equal `get_user_kabupaten_kota(auth.uid())` for the city-admin branch. This is current enforcement evidence, but the active policy does not use `private.get_actor_kabupaten_kota_id()`.
- **Candidate authorization:** no live assignment policy/function compares candidate `profiles.kabupaten_kota_id` to actor city.
- **Decision:** Model C. Active assignment RLS supplies event-city scope; approved D-007 supplies same-region-only referee LIST scope for candidate rows. No explicit exception for assignment candidate lists exists.

## 12. Panitia Conclusion

`PANITIA_ASSIGNMENT_AUTHORITY = UNRESOLVED`.

Evidence conflicts: canonical RBAC describes assignment coordination; UI exposes an assignment CTA; route denies Panitia; live assignment RLS allows Panitia role-only writes; notification function limits Panitia to event owner. None is an approved assignment-create rule establishing `DENY`, `EVENT_OWNER_ONLY`, `EVENT_REGION`, or `ROLE_ONLY` as intended authority.

## 13. Referee Eligibility Conclusion

| Rule | Evidence classification | Candidate discovery | Write enforcement | Result |
|---|---|---|---|---|
| `user_roles.role='wasit'` | `HISTORICAL` validator/helper code | No active candidate RPC | Detached trigger validator only | `UNRESOLVED` as approved assignment rule |
| `profiles.is_active=true` | `HISTORICAL` validator/helper code; D-004 defines active labels | No active candidate RPC | Not enforced by live INSERT path | `UNRESOLVED` as assignment eligibility |
| `registration_status='approved'` | `UNKNOWN`; appears in public visibility/onboarding paths, not assignment validator | Not established | Not enforced by live INSERT path | `UNRESOLVED` |
| `profiles.deleted_at IS NULL` | `UNKNOWN` for assignment; present in unrelated read/public predicates | Not established | Not enforced by live INSERT path | `UNRESOLVED` |
| `is_profile_complete=true` | `UNKNOWN` for assignment; public RPC filters are not assignment rules | Not established | Not enforced by live INSERT path | `UNRESOLVED` |

## 14. License Conclusion

- `license_level`: `SOFT_RANKING_ONLY` as current smart-assignment UI behavior; no authoritative minimum-license hierarchy for event categories was found. This is not a hard server eligibility rule.
- `license_expiry`: Phase 4.1D owner decision is authoritative for general lifecycle (`< CURRENT_DATE`, Asia/Makassar, auto-deactivation; today remains active). Assignment-specific behavior is not separately stated. Source search found no code that automatically flips profile `is_active` based on expiry; current related migrations sync referee-card expiry only.
- **Assignment license decision: UNRESOLVED.** Do not invent a level hierarchy or reject candidates based solely on ranking.

## 15. Conflict Conclusion

`CONFLICT_DECISION = UNRESOLVED`.

Live helper behavior is exact event-date equality, excludes only cancelled status, and includes deleted assignments/completed events; the former UI uses date-range overlap. TEST has no `start_time`/`end_time` columns. No approved business source chooses `EXACT_DATE`, `DATE_RANGE`, `DATE_TIME_RANGE`, or another policy, nor resolves whether pending/confirmed/declined/cancelled, deleted assignments, DITOLAK/SELESAI/deleted events block.

## 16. Reassignment Conclusion

`REASSIGNMENT = PERMANENT_UNIQUE (DERIVED CURRENT ENFORCEMENT); PRODUCT INTENT UNRESOLVED`.

The live UNIQUE `(event_id, referee_id)` rejects a second row regardless of status, including after cancellation; the state transition graph has no cancelled-to-pending path. No product artifact documents reactivate/new-row-after-cancel behavior. Preserve the constraint; do not infer an alternative.

## 17. Assignment Role Conclusion

`ASSIGNMENT_ROLE_CONTRACT = UNRESOLVED`.

- Current UI/types use `UTAMA` and `CADANGAN`.
- Current live `role` is nullable text with no CHECK constraint.
- Read-only TEST aggregate shows `CADANGAN` and legacy `referee` values.
- Historical dump had a `UTAMA`/`CADANGAN` check; this is `HISTORICAL`, not the live schema.
- Seed code uses `wasit_utama`, `wasit_kedua`, `wasit_ketiga`, `wasit_cadangan`; that is operational seed behavior, not an approved normal UI role contract.

## 18. Batch / Template Conclusion

Current observed behavior is `PARTIAL_SUCCESS`: batch mutation inserts each row separately, catches per-row errors, and shows aggregate success/failure counts. The page does not display a detailed per-referee result list; template application delegates to the same batch hook. No authoritative business/test artifact explicitly approves partial versus all-or-nothing behavior.

Classification: `UI_BEHAVIOR = PARTIAL_SUCCESS`; `BATCH INTENT = UNRESOLVED`. Template referee IDs remain untrusted and bypass candidate lookup on the existing direct batch path.

## 19. Import / Seed Conclusion

| Path | Classification | Evidence / limitation |
|---|---|---|
| `import-database` | `UNRESOLVED` operational status; privileged write path | Explicitly importable `event_assignments`, service-role insert/upsert, admin-province role check, no TEST/project environment guard; no document approves importing assignment rows as a production operational capability |
| `seed-database` | `UNRESOLVED` environment status; seed tooling | Service-role assignment writes and role check; no environment allowlist in function source. Technical-debt doc says production UI/bundle seed exposure was removed but function remains; does not prove deployed environment or a TEST-only function guard |
| `seed-security-fixtures.ts` | `TEST_ONLY` | Guard requires `TEST_ENVIRONMENT=non-production`, exact TEST project ref/URL, service-role key, fixture password; it has a dry-run mode. It was not executed |

No production deployment inventory was queried. No environment safeguards were added.

## 20. Security-Preservation Check

| Check | Result |
|---|---|
| Active Supabase project verified TEST | PASS; project ref `shorsqyycpptxcutrqrb` |
| Production accessed | NO |
| `get_referees()` browser RPC consumers | 0; generated declaration remains |
| `count_referees()` browser RPC consumers | 0; generated declaration remains |
| Candidate helper | Still fail-closed; throws capability-unavailable |
| Direct assignment INSERT | Unchanged; no fallback/source mutation in this phase |
| Province bindings seeded | NO; live count remains 0 |
| Anonymous assignment write capability added | NO |
| Migration/RLS/grant/function/trigger changes | NONE |
| Actor session/JWT/auth.uid simulation | NONE |

## 21. Decision Closure Table

| Decision | Evidence | Authority level | Status |
|---|---|---|---|
| Admin city region | Live RLS scopes event city; owner-approved D-007 denies foreign-region referee LIST; candidate API returns referee list | `AUTHORITATIVE` combined event + candidate scope | CLOSED — MODEL C |
| Panitia | Role description, route mismatch, role-only RLS, event-owner notification check conflict | Mixed; no approved assignment policy | UNRESOLVED |
| Referee role | Detached historical validator requires wasit; no live INSERT enforcement | `HISTORICAL` | UNRESOLVED |
| Active status | Detached helper requires active; D-004 defines labels but not assignment eligibility | `HISTORICAL` / adjacent owner decision | UNRESOLVED |
| Registration approved | No assignment-specific source | `UNKNOWN` | UNRESOLVED |
| Deleted profile exclusion | No assignment-specific source | `UNKNOWN` | UNRESOLVED |
| Profile complete | No assignment-specific source | `UNKNOWN` | UNRESOLVED |
| License | D-005 expiry lifecycle approved; no assignment minimum/expiry rule | `AUTHORITATIVE` lifecycle only; assignment link absent | UNRESOLVED |
| Conflict | Exact-date helper vs range-overlap UI; no active validator or owner choice | `DERIVED`/`UI_BEHAVIOR`, conflict | UNRESOLVED |
| Reassignment | Unique constraint blocks another row regardless of status | `DERIVED` current enforcement | PERMANENT_UNIQUE currently; product intent unresolved |
| Assignment role | UI values, live legacy row values, seed values, historical check disagree | `DERIVED`/`HISTORICAL`/`UI_BEHAVIOR` conflict | UNRESOLVED |
| Batch | Per-row inserts and aggregate result handling | `UI_BEHAVIOR` | PARTIAL_SUCCESS observed; intent unresolved |
| Import | Service-role path, no project guard; purpose not approved | `INCIDENTAL` privileged operation | UNRESOLVED |
| Seed | Service-role tool without environment guard; UI removed from production bundle only | `INCIDENTAL`; not deployment proof | UNRESOLVED |

## 22. Implementation Readiness

```text
IMPLEMENTATION_READY = NO
REGION_DECISION = MODEL C (EVENT CITY AND CANDIDATE CITY MUST MATCH ACTOR CITY)
PANITIA_ASSIGNMENT_AUTHORITY = UNRESOLVED
ELIGIBILITY = UNRESOLVED
LICENSE_ASSIGNMENT_RULE = UNRESOLVED
CONFLICT = UNRESOLVED
REASSIGNMENT = CURRENTLY PERMANENT UNIQUE; PRODUCT INTENT UNRESOLVED
ASSIGNMENT_ROLE = UNRESOLVED
BATCH_INTENT = UNRESOLVED
IMPORT_OPERATIONAL_AUTHORITY = UNRESOLVED
SEED_ENVIRONMENT_AUTHORITY = UNRESOLVED
```

## 23. Remaining Blockers

1. Panitia’s broad RLS branch conflicts with route and event-owner notification checks.
2. Referee-role/active/registration/deleted/profile-completeness eligibility lacks one live, attached server write contract.
3. License expiry owner rule is adjacent lifecycle authority, but assignment eligibility is not stated and no deactivation automation was found in source.
4. Schedule conflict models and blocking statuses disagree between helper and former UI.
5. Reassignment product intent and assignment role vocabulary remain undocumented despite current database behavior/data values.
6. Batch partial-success is observed but not owner-approved; local templates bypass fail-closed candidate discovery through direct inserts.
7. Import/seed service-role write environment and operational authorization are not explicitly restricted by source guard.
8. Authenticated actor runtime verification remains unavailable and was not attempted.

## 24. Final Gate

**BLOCKED — AUTHORITATIVE BUSINESS SOURCE STILL MISSING**

Implementation readiness is NO. Region semantics are resolved to Model C, but Panitia authority, assignment eligibility, license-to-assignment rules, conflict semantics, batch intent, role vocabulary, and import/seed authority remain unresolved. Do not create candidate/write RPCs or migration SQL until those remaining authoritative sources are recorded.
