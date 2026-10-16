# PHASE B.3.4.5.11 — Assignment Candidate Capability Contract

**Final gate: BLOCKED — BUSINESS RULE SOURCE UNRESOLVED**

## 1. Environment

- Target: TEST project `test APP`, ref `shorsqyycpptxcutrqrb`; project metadata confirmed active, PostgreSQL 17.6.
- Production ref `xfscfjwapwnkiinkgbjg`: NOT ACCESSED.
- Mode: contract-first / read-only design validation.
- Timestamp: `2026-09-27T08:42:32Z` (UTC).

## 2. Production Access Status

Production was not accessed. All database catalog and metadata queries explicitly targeted TEST. No production URL, credential, project connection, or browser session was used.

## 3. Mutation Status

| Operation | Performed |
|---|---|
| DDL / migration | NO |
| DML / fixture changes | NO |
| RLS changes | NO |
| GRANT / REVOKE changes | NO |
| Function create/replace/drop | NO |
| Role or identity changes | NO |
| Deployment | NO |

Only read-only TEST catalog queries and source inspection were performed. No RPC was invoked as an actor.

## 4. Existing Assignment Architecture

### Candidate consumers

- `useAvailableReferees(eventId)` reads the event and requires `status === "DISETUJUI"`, then calls `getAssignmentCandidates()`. That helper currently throws `Assignment candidate capability unavailable; referee selection is blocked.` before candidate or conflict queries run.
- `useSmartRefereeSuggestions(eventId, eventCity, eventCategory)` reads the event and returns an empty list unless it is approved, then calls the same fail-closed helper.
- Their former client-side paths loaded `get_referees(_is_active: true)`, queried assignment/event rows, omitted candidates already assigned to the event except cancelled rows, and marked schedule conflicts.
- Smart assignment additionally calculates proximity, a category/license score, availability, and experience ranking in the browser.

### Existing mutation and enforcement paths

- `useAssignReferee`, `useBatchAssignReferees`, and `useApplyTemplate` insert directly into `public.event_assignments` from the browser.
- TEST has a unique constraint on `(event_id, referee_id)`, foreign keys from assignments to events and profiles, and a status check allowing `pending`, `confirmed`, `declined`, and `cancelled`.
- Current live user triggers on `event_assignments` are audit logging, `set_updated_at`, and `validate_event_assignment_transition` on UPDATE. There is **no live INSERT trigger** invoking `public.validate_referee_assignment()`.
- The function `validate_referee_assignment()` exists and calls `is_event_approved`, `is_referee_active`, and `has_schedule_conflict`, but the live trigger inventory shows it is not attached. Its body is not effective insert enforcement in the current TEST catalog.
- `transition_event_assignment_status()` is a state-transition function, not a candidate-list or insert-eligibility function.

## 5. Existing Business-Rule Sources

| Rule | Classification | Evidence and contract effect |
|---|---|---|
| Assignment event must be approved | UNKNOWN / UNDEFINED as effective insert enforcement | `is_event_approved(uuid)` returns whether `events.status = 'DISETUJUI'`; the detached `validate_referee_assignment()` calls it. UI also checks this status, but direct inserts have no attached validation trigger. |
| Candidate has `wasit` role and `profiles.is_active = true` | UNKNOWN / UNDEFINED as effective insert enforcement | `is_referee_active(uuid)` checks exactly these two predicates. It does not check registration status, deletion, or license. The validator that calls it is not attached. |
| Registration must be approved | UNKNOWN / UNDEFINED | `registration_status` exists on profiles, but the live assignment helper/validator does not check it. The current live `get_referees(...)` body also does not filter it. |
| Profile must not be deleted | UNKNOWN / UNDEFINED | `profiles.deleted_at` exists. The live active-referee helper and assignment validator do not test it; the live `get_referees(...)` body does not filter it. |
| License level is compatible with event category | CONSUMER-ONLY RULE | Smart assignment assigns a ranking score from client constants. No authoritative server-side minimum-license rule was found. Do not convert this score into a rejection rule without a business decision. |
| License expiry makes candidate ineligible | UNKNOWN / UNDEFINED | `license_expiry` exists but neither the live active-referee helper nor the assignment validator checks it. The two candidate consumers do not use expiry. Exclude it from the proposed response pending a decision. |
| Event date conflict | UNKNOWN / UNDEFINED as effective insert enforcement | `has_schedule_conflict(uuid,uuid)` compares `events.date` equality for another event and counts every status other than `cancelled`; it does not filter soft-deleted assignments. The detached validator calls it. |
| Date-range overlap | CONSUMER-ONLY RULE | Both former candidate consumers compare `start_date`/`end_date` intervals for display/ranking. This differs from the existing helper's exact `events.date` comparison. No authoritative decision reconciles the difference. |
| Duplicate `(event_id, referee_id)` | DERIVED FROM SCHEMA | TEST has a unique constraint independent of assignment status. Client code treats cancelled rows as not assigned, but the unique constraint still prevents a second row. Reassignment semantics require a decision/state-machine path. |
| Assignment status values | DERIVED FROM SCHEMA | Live check constraint allows `pending`, `confirmed`, `declined`, `cancelled`. Existing conflict helper excludes only `cancelled`, so `declined` remains a conflict by that helper's current logic. |
| Event approval state enum | DERIVED FROM SCHEMA | Live events status constraint includes `DIAJUKAN`, `DISETUJUI`, `DITOLAK`, `SELESAI`; consumer and helper treat `DISETUJUI` as assignable. Effective insert enforcement remains unresolved because the validator trigger is absent. |
| Event category | CONSUMER-ONLY RULE | Smart ranking consumes `events.category`; it is not a candidate endpoint argument and no server eligibility rule was found. |
| Region eligibility | UNKNOWN / UNDEFINED | Assignment RLS scopes city admins by the event's city, not by candidate profile city. The current client deliberately ranks other-city candidates. The requested candidate contract requires exact actor/candidate city. Existing sources do not reconcile these policies. |

## 6. Candidate Capability Contract

No function named `public.get_assignment_referee_candidates` exists in the live TEST catalog, and the TEST-generated types contain no candidate RPC. The existing consumer boundary is deliberately fail-closed.

### Provisional signature

```text
public.get_assignment_referee_candidates(p_event_id uuid)
```

`p_event_id` is the only demonstrated input: both candidate consumers already have the event ID. The function must load event date(s), category, status, and city from `public.events`. It must not accept actor ID, role, candidate ID, city, province, license requirement, or date as an authorization input. This signature is a design proposal, **not** an approved implementation specification until the unresolved rules in Section 15 are decided.

The function must be distinct from `get_referee_detail`, `get_admin_referees`, and public referee RPCs. It must enumerate candidates server-side and use the actor from `auth.uid()`.

## 7. Authorization Matrix

| Actor | Proposed authorization | Current TEST evidence | Status |
|---|---|---|---|
| `admin_provinsi` | `auth.uid()` -> role -> `private.get_actor_provinsi_id()` -> event/candidate scope; fail closed for missing/multiple binding | Province helper is SECURITY DEFINER with empty search path; EXECUTE denied directly to anon/authenticated. TEST has 0 active province bindings. Existing assignment RLS instead checks role with `is_admin_provinsi(auth.uid())` and does not use the binding helper. | Target requirement clear; existing assignment policy is not aligned; implementation must not copy it |
| `admin_kab_kota` | `auth.uid()` -> role -> `private.get_actor_kabupaten_kota_id()` -> event and candidate scope | City helper has empty search path and no direct anon/authenticated EXECUTE. Existing assignment RLS constrains the event city to `get_user_kabupaten_kota(auth.uid())`, not the candidate referee city. | Candidate-city boundary conflicts with present consumer/RLS behavior; unresolved |
| `panitia` | DENY until a separately approved event-scoped candidate capability is documented | Assignment ALL policy allows any `panitia` role without `created_by` restriction. Assignment SELECT policy does not grant Panitia assignment-row visibility. `send-assignment-notification` separately rejects Panitia when `event.created_by != caller.user.id`. | Conflicting authorization sources; unresolved, do not grant by inference |
| `wasit` | DENY | Self/assignment access is not candidate-directory authority. | DENY |
| Ordinary authenticated | DENY | No candidate capability found. | DENY |
| `anon` | DENY | No candidate capability exists. Existing helper functions are separately executable by anon and should not be exposed through the new boundary. | DENY |

For admin city requests, no client city parameter is needed. If a city filter is later required, it may only narrow server-derived scope; mismatch behavior must be decided and must not widen results. For province admins, zero active binding must return `FORBIDDEN_SCOPE`; no profile-city fallback is allowed.

## 8. Candidate Projection

Observed consumer fields:

- `useAvailableReferees`: `id`, `full_name`, `license_level`, `profile_photo_url`, `is_active`, `kabupaten_kota_id`, city name, conflict marker.
- `useSmartRefereeSuggestions`: same display/ranking fields plus conflict marker; experience is computed from assignment counts.

Provisional minimal response keys:

```text
id
full_name
kabupaten_kota_id
kabupaten_kota_name
license_level
profile_photo_url
is_active
has_conflict
```

`license_expiry` is not consumed by either candidate UI and is excluded unless an owner approves an authoritative expiry rule. The meaning of `has_conflict` is unresolved: the current client uses date-range overlap, while the server helper uses exact `events.date` equality. A future implementation must not return raw assignment histories merely to populate this flag.

Never return birth date, email, WhatsApp, document paths, approval metadata, deleted state, credentials, roles, or wildcard profile data.

## 9. Event-Scope Contract

| Parameter/data | Source | Purpose | Authorization relevance | Business-rule relevance |
|---|---|---|---|---|
| `p_event_id` | Existing hooks already receive `eventId` | Select the event for candidate selection | Must be checked against server-derived actor scope; not actor identity | Required to load event status/date/category |
| Event city | `public.events.kabupaten_kota_id` | Compare event against admin's authorized scope; possible candidate proximity | Server-read only; never caller-supplied | Current city-admin assignment RLS checks event city |
| Candidate city | `public.profiles.kabupaten_kota_id` | City display/proximity; possible exact-city restriction | Must not be authorized by client filter | Exact-city requirement conflicts with current cross-city scoring |
| Event status | `public.events.status` | Candidate UI currently requires `DISETUJUI` | Server-side resource state | Validator helper describes approved-only, but insert trigger is absent |
| `date`, `start_date`, `end_date` | `public.events` | Existing same-day helper and client overlap calculation | Not actor scope | Semantics conflict; owner decision needed |
| Category | `public.events.category` | Smart ranking uses client-side category/license score | Not actor scope | Consumer scoring only; no authoritative eligibility threshold found |
| Assignment status/history | `public.event_assignments` | Exclude already-assigned candidates and compute conflict/experience | Server capability must avoid leaking unrelated assignment rows | Unique constraint and conflict behavior need reconciliation |

No `assignment_id`, requested role (`UTAMA`/`CADANGAN`), client date, client category, or caller-supplied region is justified as a candidate endpoint parameter by the current consumer contract.

## 10. Error Contract

Required error classes for an eventual implementation:

| Condition | Contract |
|---|---|
| No authenticated actor | `UNAUTHORIZED_ACTOR` |
| Authenticated role not permitted | `FORBIDDEN` |
| Missing/null event input | `INVALID_TARGET` after actor validation |
| Admin-province actor has no authoritative binding | `FORBIDDEN_SCOPE` |
| Event/candidate region outside authorized scope | `FORBIDDEN_SCOPE` |
| Panitia event ownership not authorized | `FORBIDDEN` or `FORBIDDEN_SCOPE` after owner policy is settled |
| Anon | ACL denial; no candidate data |

Do not distinguish nonexistent and out-of-scope event/resource IDs when that would reveal existence. The exact ordering and error normalization for authorized role vs event existence remains part of the unresolved authorization decision.

## 11. Consumer Inventory

| Consumer | Current source/path | Classification | Decision |
|---|---|---|---|
| `useAvailableReferees` in `src/hooks/useEventAssignments.ts` | `getAssignmentCandidates()` throws before candidate queries | BLOCKED | Retain fail-closed behavior; do not call legacy list or admin directory |
| `useSmartRefereeSuggestions` in `src/hooks/useSmartAssignment.ts` | Same fail-closed helper before ranking | BLOCKED | Retain fail-closed behavior; no browser authorization reconstruction |
| `useAssignReferee` | Direct insert with `event_id`, `referee_id`, role, `pending` | BLOCKED / WRITE PATH | RLS is not equivalent to candidate eligibility; DB insert-validation trigger is absent |
| `useBatchAssignReferees` | Direct insert loop | BLOCKED / WRITE PATH | Same missing server-side eligibility and candidate provenance |
| `useApplyTemplate` / `ApplyTemplateDialog` | Local-storage template referee IDs feed batch insert | BLOCKED / BYPASS | This path can bypass the fail-closed candidate query; template button remains available on `RefereeAssignment` when candidate queries error |
| `get_referees()` source declarations | Generated types and SQL migration history | EXCEPTION | No current application call sites; retain function physically pending later retirement phase |
| `count_referees()` source declarations | Generated types and SQL migration history | EXCEPTION | No current application call sites; retain function physically pending later retirement phase |
| Event-assignment roster reads | Explicit nested profile fields in assignment relation | RETAIN | Existing assignments only; not candidate discovery |

The application-source search after Phase B.3.4.5.10 found zero browser RPC call sites to `get_referees()` and `count_referees()`. Their generated declarations and database definitions remain. No candidate RPC consumer is wired because no function exists.

## 12. Legacy Dependency Status

- `get_referees()` application consumers: 0; generated type and database function remain.
- `count_referees()` application consumers: 0; generated type and database function remain.
- Neither legacy function was dropped, altered, or invoked in this phase.
- Do not restore them as a candidate fallback. Later retirement must separately close EXECUTE and verify dependencies.

## 13. Static Security Verification

| Check | Result | Evidence |
|---|---|---|
| Candidate RPC exists in TEST | NO | Catalog lookup returned NULL for proposed UUID signatures; function-name catalog search found none |
| No assignment hook calls `get_referees()` | PASS | Post-cutover source search: 0 application call sites |
| Assignment/smart candidate helper fails closed | PASS (static) | `getAssignmentCandidates()` throws capability-unavailable error |
| Template/batch path also fails closed | FAIL | Local template IDs proceed directly to batch insert; it bypasses candidate helper |
| Candidate query uses profile wildcard | PASS | No candidate profile query; no `profiles.*` candidate projection |
| Client actor ID/region in candidate authorization | PASS (no candidate API yet) | No candidate RPC exists; eventual signature should accept event ID only |
| Province helper state | PASS (static only) | Empty search path, SECURITY DEFINER; 0 active TEST province bindings |
| City helper state | PASS (static only) | Empty search path, SECURITY DEFINER |
| Existing schedule/eligibility helper safety for reuse | FAIL / DO NOT REUSE AS-IS | `has_schedule_conflict`, `is_event_approved`, `is_referee_active` are SECURITY DEFINER with `search_path=public` and anon EXECUTE granted |
| Insert validation trigger exists | NO | Live trigger list contains audit, updated-at, and UPDATE transition triggers; no INSERT validator |
| Browser service-role credential | PASS (source scan) | Browser client guards against service-role key; no credential found in browser source |
| `LIMIT 1` authority resolution | PASS (source/catalog) | No candidate function; proposed contract forbids it |

This is contract/static evidence only; it does not establish runtime authorization.

## 14. Runtime Verification Status

**BLOCKED — AUTHENTICATED ACTOR SESSION UNAVAILABLE.** No real authenticated actor sessions were made available. No candidate RPC exists, no runtime call was attempted, and no actor/anon response was fabricated or simulated. The prior TEST runtime report also records actor sessions unavailable. Required actor matrix remains unexecuted:

- city-admin A/B in-scope and out-of-scope event/candidate cases;
- each province-admin fixture with zero active binding -> `FORBIDDEN_SCOPE`;
- Panitia event ownership cases after its authority is defined;
- wasit and ordinary authenticated denial;
- anonymous ACL denial;
- candidate key set and forbidden-field checks;
- error non-disclosure across invalid and out-of-scope events.

## 15. Unresolved Dependencies

1. **Business eligibility:** registration-approved and not-deleted are requested baseline conditions but absent from the live active-referee helper and detached assignment validator. Owners must decide whether these are hard eligibility rules.
2. **License rule:** the smart hook uses a client-side score; there is no authoritative minimum license/expiry rule. Decide whether ranking alone is intended or a rule must be defined by the business owner.
3. **Schedule semantics:** live helper compares the required event date for equality; consumers use start/end interval overlap. Decide canonical multi-day conflict semantics and whether `declined`, soft-deleted assignments, and other statuses conflict.
4. **Cancelled duplicate:** unique `(event_id, referee_id)` includes cancelled rows, while client filtering treats cancelled as assignable. Decide whether cancelled assignments are reactivated, remain permanently non-reassignable, or need a different future mutation contract.
5. **Region semantics:** city-admin RLS scopes the event to actor city; current UI intentionally ranks referees from other cities. The proposed capability requirement says candidate city must equal actor city. Decide whether city scope constrains event, candidate, or both.
6. **Panitia scope:** assignment RLS allows Panitia broad assignment writes; a notification Edge Function restricts Panitia to events they created; assignment SELECT RLS does not show Panitia assignment histories. Define whether Panitia may select candidates and the event ownership boundary.
7. **Write enforcement:** `validate_referee_assignment()` has business checks but no live INSERT trigger. The direct insert path therefore lacks those checks at the database boundary. A candidate list alone cannot authorize or validate a later write.
8. **Template bypass:** local assignment templates can submit arbitrary stored referee IDs to direct batch inserts despite candidate-list failure.

## 16. Implementation Prerequisites

Before implementation is authorized:

- Business owner resolves the eligibility, event-date/conflict, cancelled-duplicate, city-candidate, and Panitia-scope questions above.
- Security owner approves a single server-side event-bound policy: actor from `auth.uid()`, city/province helper scopes, Panitia treatment, unauthorized-role denial, and error non-disclosure.
- Database owner designs an insert/write authorization boundary that enforces candidate eligibility independently of a previously fetched list; candidate selection alone is not a write guarantee.
- Candidate result fields are frozen from the actual consumers; do not add expiry, contact, document, approval, role, or credential fields without an approved reason.
- `RefereeAssignment` template application and all direct batch/single insert paths are made fail-closed or routed through the approved write capability in the later implementation phase.
- Only after those decisions should a migration and TEST static preflight be drafted. No migration is created in this phase.

## 17. Rollback / Security Considerations

- Keep both assignment candidate consumers blocked until the approved capability and write boundary exist.
- Do not route candidates through `get_referees()`, `get_admin_referees()`, `get_referee_detail()`, direct `profiles` queries, or broad assignment-table reads.
- Do not make `panitia` globally authorized merely to preserve the UI. Do not use profile city as province authority.
- Preserve `get_referees()` and `count_referees()` physically until the separate retirement phase; never restore them as fallback.
- The current template/batch write path is a bypass risk and must be included in later cutover, not treated as a harmless UI convenience.
- No rollback operation is needed because this phase changed no source, schema, data, ACL, RLS, or deployed function.

## 18. Final Gate

**BLOCKED — BUSINESS RULE SOURCE UNRESOLVED**

The provisional event-only input and minimal projection can be derived from current consumers, but authoritative candidate eligibility, Panitia event scope, city candidate geography, schedule conflict semantics, and insert-time enforcement conflict or are absent in TEST. Runtime actor sessions are also unavailable. Do not implement or claim contract closure until these sources are resolved.