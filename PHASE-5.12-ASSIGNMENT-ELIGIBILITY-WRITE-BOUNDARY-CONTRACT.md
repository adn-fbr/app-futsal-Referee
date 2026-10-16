# PHASE B.3.4.5.12 — Assignment Eligibility & Write-Boundary Contract Closure

**Final gate: BLOCKED — WRITE BOUNDARY GAP**

## 1. Environment

- Target: TEST Supabase project `test APP`, ref `shorsqyycpptxcutrqrb`.
- Mode: read-only contract resolution.
- Verification timestamp: `2026-09-27T08:42:32Z` (UTC).

## 2. Production Access Status

Production project `xfscfjwapwnkiinkgbjg` was **NOT ACCESSED**. All live catalog queries in this phase explicitly targeted TEST.

## 3. Mutation Status

| Operation | Performed |
|---|---|
| Migration / DDL / function or trigger change | NO |
| DML / assignment write / fixture mutation | NO |
| RLS or GRANT/REVOKE change | NO |
| Role mutation / impersonation / fabricated JWT | NO |
| Deployment | NO |

Only read-only TEST catalog queries and local source/migration inspection were performed. No RPC was invoked as an actor.

## 4. All Assignment Write Paths

| Path | Classification | Operation | Authorization / enforcement found |
|---|---|---|---|
| `useAssignReferee()` in `src/hooks/useEventAssignments.ts` | DIRECT_BROWSER_INSERT / RLS_ONLY | Inserts `{event_id, referee_id, role, status: "pending"}` through PostgREST | RLS only; no live INSERT validator. Event status and candidate list are client-side. |
| `useBatchAssignReferees()` in `src/hooks/useSmartAssignment.ts` | DIRECT_BROWSER_INSERT / RLS_ONLY | Loops over direct inserts with caller-provided event/referee/role | RLS and table constraints only; no eligibility recheck. |
| `useApplyTemplate()` -> `ApplyTemplateDialog` | MIXED / BYPASS | Reads local-storage template referee IDs and delegates to batch insert | Does not resolve IDs through candidate discovery or recheck eligibility. |
| `useUpdateAssignment()` in `src/hooks/useEventAssignments.ts` | DIRECT_BROWSER_UPDATE / RLS_ONLY | Updates assignment `role`; rejects client status changes and routes those to RPC | RLS protects the assignment row/event scope; no candidate eligibility applies to a role-only edit. |
| `useTransitionAssignmentStatus()`, `useRemoveAssignment()`, `useConfirmAssignment()` | SERVER_RPC | Calls `transition_event_assignment_status(uuid,text,text)` to update status | SECURITY DEFINER RPC derives actor from `auth.uid()` and validates existing assignment status/role scope; it is not a create/eligibility boundary. |
| `useChangeAdminAssignmentStatus()` in `src/hooks/useAdminEventAssignments.ts` | SERVER_RPC | Admin UI calls the same transition RPC after reauthentication/role checks | Status-only path; does not create assignments or validate candidate eligibility. |
| `import-database` Edge Function | EDGE_FUNCTION / SERVICE_ROLE BULK IMPORT | `event_assignments` is in `IMPORTABLE_TABLES`; service-role client inserts or upserts caller-provided records | Requires `admin_provinsi` role, but uses no province binding or assignment eligibility checks. Can bypass ordinary RLS and database candidate rules. |
| `seed-database` Edge Function | EDGE_FUNCTION / SEED | Service-role seed code inserts generated event assignments | Seed/admin-province path, not ordinary candidate selection; not invoked. It does not establish production assignment eligibility. |
| `supabase/tests/seed-security-fixtures.ts` | TEST FIXTURE PATH | Service-role test setup inserts fixture assignments | Not invoked; fixture mutation prohibited in this phase. |
| `auto-complete-events` Edge Function | EXCEPTION / READ-ONLY ASSIGNMENT ACCESS | Reads pending/confirmed rows to create honors/notifications | Does not modify `event_assignments` in the inspected block. |
| `notification-orchestrator`, `send-assignment-notification`, `send-event-reminders` | EXCEPTION / READ-ONLY ASSIGNMENT ACCESS | Reads assignment/event/referee details or creates notifications | No assignment insert/update found in the inspected paths. |
| `transition_event_assignment_status()` SQL function | SERVER_RPC | Updates an existing row after an allowed state transition | Does not create an assignment and does not validate candidate eligibility. |
| `validate_event_assignment_transition` trigger | TRIGGER_ENFORCED / UPDATE ONLY | Before UPDATE, validates status transitions | Not an INSERT guard. |
| Audit / updated-at triggers | TRIGGER_ENFORCED / SIDE EFFECT | Log changes or set timestamps | No candidate eligibility enforcement. |

The source search covered `src/`, `supabase/functions/`, `supabase/tests/`, generated types, and SQL history for assignment table access and mutations. The function search found no existing approved assignment-creation RPC.

## 5. Template / Batch Bypass Analysis

`ApplyTemplateDialog` loads templates from local storage. A template stores `referee_id` strings and `role`; `useApplyTemplate()` maps those values directly into `useBatchAssignReferees()`, which inserts them into `event_assignments`. The page's candidate error banner does not disable the Template button, and the insert path does not call `getAssignmentCandidates()`.

| Question | Finding |
|---|---|
| Can arbitrary `referee_id` values be submitted? | YES, any locally stored UUID can be submitted. The FK only requires a matching profile row. |
| Does this path verify candidate eligibility? | NO. |
| Does it verify event authorization? | Only the INSERT RLS policy; no write RPC. The policy grants province-admin role, city-admin event-city scope, or any `panitia` role. |
| Does it verify duplicate assignment? | No application precheck in the batch path. The UNIQUE constraint rejects an existing `(event_id, referee_id)` pair, including a cancelled row. |
| Does it verify schedule conflict? | NO. |
| Does it verify referee active status? | NO. |
| Does it verify registration status? | NO. |
| Does it verify license requirements/expiry? | NO. |
| Does RLS alone prevent unauthorized inserts? | NO. It does not verify candidate role/status, target referee region, event approval, or schedule eligibility; Panitia has an unscoped write-policy branch. |
| Is an eligibility trigger attached on INSERT? | NO. Live trigger inventory contains no `validate_referee_assignment` trigger. |

Finding: **WRITE BOUNDARY GAP**. Candidate discovery failure is not sufficient fail-closed behavior while the template/batch write path remains usable.

## 6. Event Authorization Contract

The live TEST `event_assignments` RLS `Admins can manage assignments` policy permits:

- `admin_provinsi` by `is_admin_provinsi(auth.uid())` role check;
- `admin_kab_kota` when the event row's `kabupaten_kota_id` equals `get_user_kabupaten_kota(auth.uid())`;
- any `panitia` role, without an event-owner predicate.

The `Admins can view all assignments` SELECT policy grants province role, city admins scoped by the **event** city, and the assigned referee. It does not grant Panitia assignment-history visibility. Therefore the current candidate UI cannot assume Panitia can read the conflict data it uses.

The assignment route `/events/:id/assign-referees` is protected by `requireAdmin` (province/city admins); this is UI route access only. It does not constrain direct PostgREST writes. `events` has a public SELECT policy, while its update policy allows `is_admin(auth.uid()) OR has_role(auth.uid(),'panitia')`.

`send-assignment-notification` separately enforces city-admin event-city equality and requires a Panitia caller to own the event (`event.created_by = caller.user.id`). That notification authorization is not part of the browser INSERT or assignment RLS policy. Event visibility is not assignment authorization.

Required future chain:

```text
auth.uid()
-> explicit permitted role
-> authoritative role scope
-> event scope from stored event row
-> server-side assignment write authorization
```

The current sources do not define one consistent chain for every assignment writer.

## 7. Admin Province Contract

Required target:

```text
auth.uid()
-> admin_provinsi role
-> private.get_actor_provinsi_id()
-> event province / assignment authorization
```

Read-only TEST count: **0 active `PROVINSI` `pengurus` bindings**. Thus the target contract must return `FORBIDDEN_SCOPE` for current province-admin fixtures and must not fall back to profile city or all-province access.

Current `event_assignments` RLS instead checks `is_admin_provinsi(auth.uid())`, which is role-only. It does not call the authoritative province helper. The generic `import-database` Edge Function similarly requires the province-admin role but does not use the province-binding helper. These existing paths are not suitable authorization sources for a new boundary.

## 8. Admin Kab/Kota Contract

Required target:

```text
auth.uid()
-> admin_kab_kota role
-> private.get_actor_kabupaten_kota_id()
-> event / assignment authorization
```

Existing TEST RLS scopes assignment writes using the **event's** city and `get_user_kabupaten_kota(auth.uid())`; it does not constrain candidate `profiles.kabupaten_kota_id`.

| Model | Existing evidence | Conclusion |
|---|---|---|
| Model A: event in actor city; candidates may be other-city | RLS scopes the event city; former candidate list was unfiltered by city; smart UI gives same-city candidates a higher proximity score and still ranks other-city candidates | Strongest current UI/RLS evidence, but not an approved business authorization rule |
| Model B: candidates only from actor city | Proposed by the prior capability contract; no current candidate filter, RLS predicate, trigger, or write helper enforces it | No authoritative existing source |
| Model C: both event and candidate must be actor city | Combines the current event-scope RLS with the proposed candidate scope; no source enforces the candidate half | No authoritative existing source |

**BLOCKED — REGION SEMANTICS UNRESOLVED.** Do not select a model in implementation without a business/security decision. Any implementation must use the private city helper, not a client region value or `get_user_kabupaten_kota()` as its authorization primitive.

## 9. Panitia Contract

| Source | Current behavior |
|---|---|
| Assignment INSERT/ALL RLS | `has_role(auth.uid(),'panitia')` alone; no event ownership or city scope |
| Assignment SELECT RLS | Panitia is not included in the assignment-history SELECT policy |
| Assignment UI route | Admin-only; Panitia is not admitted by `requireAdmin` |
| Assignment notification Edge Function | Allows the Panitia role but checks `event.created_by === caller.user.id` before sending |
| Direct browser assignment insert | RLS admits Panitia by role alone; does not reuse the notification ownership check |

Evidence maps to `ROLE_ONLY` for the live write RLS policy and `EVENT_OWNER_ONLY` for the notification side effect. Those behaviors conflict; neither may be silently chosen as the candidate/write policy.

**BLOCKED — PANITIA AUTHORITY UNRESOLVED.** Until the event-owner rule is approved and enforced on assignment writes, Panitia candidate access should not be granted by inference.

## 10. Referee Eligibility Contract

| Rule | Existing source | Classification / status |
|---|---|---|
| `user_roles.role = 'wasit'` | `is_referee_active(uuid)` checks the role; legacy `get_referees()` joins `user_roles` | Defined in helper/list code, but `validate_referee_assignment` is not attached to INSERT; **not effective write enforcement** |
| `profiles.is_active = true` | `is_referee_active(uuid)` checks this | Defined in helper, but not effective write enforcement due missing trigger |
| `registration_status = 'approved'` | No assignment helper, trigger, or direct insert check found | **UNKNOWN / UNDEFINED** |
| `profiles.deleted_at IS NULL` | No active-referee helper check; current live `get_referees()` body does not filter it | **UNKNOWN / UNDEFINED** |
| `is_profile_complete = true` | No assignment helper/trigger or candidate consumer requirement found | **UNKNOWN / UNDEFINED** |
| Event must be `DISETUJUI` | `is_event_approved()` and detached `validate_referee_assignment()` contain the rule; UI checks status | **Defined but not enforced on current direct INSERT path** |

The candidate API or write capability must not elevate any helper body into an enforced rule until the write boundary is attached/implemented and owners confirm whether approval, deletion, and profile-completeness are requirements.

## 11. License Contract

- The candidate consumers use `license_level` for display and smart-assignment scoring.
- Smart assignment maps event categories to license ranks in client constants. This is **consumer-only ranking**, not authoritative eligibility.
- `license_expiry` is not checked by `is_referee_active()`, `validate_referee_assignment()`, or candidate UI.
- No authoritative server rule was found for minimum level, expiry behavior, grace periods, or event-category mapping.

Classification: `license_level` is **SOFT RANKING** in current smart UI; hard eligibility and license expiry are **UNDEFINED**. Do not add a server rejection rule without approval.

## 12. Conflict Contract

Current helper `has_schedule_conflict(referee_id,event_id)`:

- joins `event_assignments` to `events`;
- compares exact `events.date` equality, not `start_date`/`end_date` overlap;
- checks another `event_id`;
- counts any assignment status other than `cancelled`, including `pending`, `confirmed`, and `declined`;
- does not exclude `event_assignments.deleted_at` or completed event rows.

Former candidate UI instead compares date ranges (`start_date`/`end_date`), also excludes only `cancelled`, and does not filter soft-deleted assignments. No time-of-day conflict logic exists in these sources. The helper is called by `validate_referee_assignment()`, but that validator is not attached to a live INSERT trigger.

| Conflict model | Evidence | Status |
|---|---|---|
| Exact `events.date` | Existing helper body | Defined but not enforced on INSERT |
| Date-range overlap | Former browser consumer | Consumer-only rule |
| Date-range + time | No source found | Undefined |

**BLOCKED — conflict semantics are not authoritative/effectively enforced.** A future owner decision must separately define whether `declined`, soft-deleted assignment rows, and assignments for completed events block a new assignment.

## 13. Duplicate / Reassignment Contract

- TEST has `UNIQUE(event_id, referee_id)`. It applies regardless of assignment status and does not condition on `deleted_at`.
- Candidate UI previously removed same-event rows only when their status was not `cancelled`; this makes cancelled assignments appear available even though a new insert will violate the unique constraint.
- `transition_event_assignment_status()` supports status transitions for existing rows; its current transition graph does not provide a cancelled-to-pending reactivation path.
- No other create-again/reactivate RPC was found.

Current schema/state-machine behavior is closest to **Model B: cancelled row remains unique and cannot be recreated**. The UI disagrees. Confirm whether the product wants reactivation or permanent non-reassignment before implementing; do not weaken/drop the unique constraint to satisfy the UI.

## 14. Existing Validator Analysis

Read-only TEST catalog values:

| Function | SECURITY DEFINER / `search_path` | EXECUTE ACL | Semantics / callers | Decision |
|---|---|---|---|---|
| `public.is_event_approved(uuid)` | yes / `search_path=public` | PUBLIC, anon, authenticated: YES | Returns whether event status is `DISETUJUI`; called by `validate_referee_assignment()` | DO NOT REUSE AS-IS for a new security boundary |
| `public.is_referee_active(uuid)` | yes / `search_path=public` | PUBLIC, anon, authenticated: YES | Checks `wasit` role and `profiles.is_active=true`; no registration/deletion/license checks; called by validator | DO NOT REUSE AS-IS |
| `public.has_schedule_conflict(uuid,uuid)` | yes / `search_path=public` | PUBLIC, anon, authenticated: YES | Exact date equality, non-cancelled status, no soft-delete filter; called by validator | DO NOT REUSE AS-IS |
| `public.validate_referee_assignment()` | yes / `search_path=public` | PUBLIC, anon, authenticated: YES | Trigger body calls the three helpers and raises for unapproved event/inactive referee/conflict | Function exists, but there is no live trigger dependency; DO NOT treat as enforcement or reuse as-is |
| `public.validate_event_assignment_transition()` | yes / `search_path=public` | owner-only EXECUTE | Live BEFORE UPDATE trigger; validates status transitions from `auth.uid()` | UPDATE status only; not an INSERT/candidate validator |
| `public.transition_event_assignment_status(uuid,text,text)` | yes / `search_path=public` | authenticated: YES; anon/PUBLIC: NO | Derives actor from `auth.uid()`; allows current status transitions and writes audit data | Existing status mutation RPC only; not a creation boundary |

All three eligibility helpers and the detached validator use a non-empty search path and are publicly/anon executable in TEST. Their present existence does not supply a safe write boundary.

## 15. INSERT Trigger Status

Live TEST `pg_trigger` inventory for `public.event_assignments`:

- `log_referee_assignment_trigger`: AFTER INSERT/UPDATE/DELETE, audit function.
- `set_updated_at_event_assignments`: BEFORE UPDATE.
- `validate_event_assignment_transition`: BEFORE UPDATE only.

There is no live INSERT trigger invoking `validate_referee_assignment()`. The historical migration snapshot contains `validate_assignment_trigger BEFORE INSERT OR UPDATE`, but the current TEST catalog does not. Current status: **NO DATABASE INSERT ELIGIBILITY ENFORCEMENT**.

## 16. Proposed Write-Boundary Design

No existing approved assignment-creation RPC was found. `transition_event_assignment_status()` cannot be extended conceptually to create a new row without changing its mutation contract; no implementation decision is made here.

The eventual write capability should receive only values demonstrated by the existing browser write contract: event ID, referee ID, and assignment role. It must derive actor only from `auth.uid()` and set initial status server-side to `pending`. It must atomically revalidate actor/event scope, event status, candidate role/active status, approved/deleted/license rules once decided, duplicate/reassignment semantics, and conflict semantics before inserting. Candidate discovery must not be trusted as proof for a later write.

Single, batch, and template application must converge on that same server-side write boundary. The generic service-role import and seed paths need separately approved safeguards or explicit exclusion from routine assignment operations; no current design closes them.

## 17. Candidate Capability Dependencies

`get_assignment_referee_candidates(p_event_id)` remains **unimplemented and unfinalized**. A candidate endpoint is downstream of the resolved write/eligibility contract. A provisional response may contain only consumer-required fields, but exact candidate filtering and `has_conflict` meaning cannot be frozen until region, license, duplicate, and schedule decisions are resolved.

The candidate endpoint is discovery only. It must not return assignment histories, contact data, documents, credentials, role lists, or authorization decisions that a caller can reuse as a write token.

## 18. Security Requirements

- Actor is always `auth.uid()`; no actor/admin/user ID, province ID, or city ID supplied by a caller can authorize the operation.
- Admin province requires `private.get_actor_provinsi_id()` and fails closed with zero bindings; no profile-city fallback and no `LIMIT 1`.
- Admin city requires `private.get_actor_kabupaten_kota_id()`; event and candidate geography decisions remain unresolved.
- Panitia is not granted candidate/write access until event scope is explicitly settled.
- Ordinary authenticated users, wasit, and anon are denied candidate discovery and unauthorized writes.
- Neither candidate data, UI route guards, nor existing assignment RLS alone can authorize an assignment write.
- Any eventual security-definer write function must use `SET search_path = ''`, schema-qualified references, explicit projections, restricted EXECUTE (no PUBLIC/anon), and independent authorization/eligibility checks.
- Generic `import-database` and `seed-database` service-role operations remain privileged write paths outside ordinary RLS and need explicit operational controls.

## 19. Runtime Verification

**BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE.** No real TEST actor sessions were available. No actor request, direct insert, role impersonation, fabricated JWT, or `auth.uid()` simulation was made. Runtime matrix remains unexecuted for province-admin zero-binding denial, city scope, Panitia event ownership, wasit/ordinary/anon denials, candidate projections, and write-boundary eligibility.

## 20. Unresolved Decisions

1. Does city-admin authority constrain event city only (Model A), candidate city only (Model B), or both (Model C)? Existing UI/RLS do not agree.
2. Is Panitia global, event-owner-only, event-region-limited, role-only, or denied for assignment writes? RLS and Edge Function behavior conflict.
3. Are `registration_status='approved'`, `deleted_at IS NULL`, and `is_profile_complete` hard write-eligibility requirements?
4. Is license compatibility hard eligibility, soft ranking, display-only, or undefined? Is license expiry relevant?
5. Are conflicts exact-date, date-range, or date/time overlap? Do declined, deleted assignments, and completed-event assignments block?
6. Does a cancelled assignment remain permanently unique (current schema/state machine), or should a server mutation reactivate it?
7. Is the detached validator intended to be the source of business rules, and why is it not attached in current TEST?
8. How are privileged import/seed operations controlled so they cannot bypass the eventual write boundary?
9. Real authenticated TEST sessions remain unavailable for runtime authorization verification.

## 21. Final Gate

**BLOCKED — WRITE BOUNDARY GAP**

Direct browser inserts, template/batch bypass, and privileged import/seed writes can reach `event_assignments` without an effective INSERT eligibility validator. The current source does not provide one authoritative, consistently enforced event/referee/Panitia/region/conflict contract. Do not implement a candidate RPC or claim contract closure until write authorization and business rules are resolved and enforced independently of candidate discovery.