# PHASE B.3.4.5.13 — Assignment Write Authorization Remediation Design

**Final gate: BLOCKED — REGION SEMANTICS UNRESOLVED**

## 1. Environment

- Target: TEST project `test APP`, ref `shorsqyycpptxcutrqrb`.
- Mode: read-only remediation design; no implementation.
- Timestamp: `2026-09-27T08:56:22Z` (UTC).

## 2. Production Access Status

Production ref `xfscfjwapwnkiinkgbjg` was **NOT ACCESSED**. Project metadata and catalog queries were explicitly scoped to TEST. No production URL or credential was used.

## 3. Mutation Status

| Operation | Performed |
|---|---|
| Migration / DDL / function or trigger change | NO |
| DML / assignment write / fixture mutation | NO |
| RLS change | NO |
| GRANT / REVOKE change | NO |
| Edge Function deployment / role change | NO |
| Impersonation / fabricated JWT / `auth.uid()` simulation | NO |

Only read-only TEST catalog inspection and source/migration review were performed.

## 4. Current Write Paths

| Path | Classification | Current behavior | Enforcement / issue |
|---|---|---|---|
| `useAssignReferee()` | DIRECT_BROWSER_INSERT / RLS_ONLY | Direct PostgREST insert of event, referee, role, `pending` | RLS only; no live INSERT eligibility trigger |
| `useBatchAssignReferees()` | DIRECT_BROWSER_INSERT / RLS_ONLY | Iterative direct inserts, collecting per-row results | Same gap; caller-provided IDs do not pass the candidate capability |
| `useApplyTemplate()` / `ApplyTemplateDialog` | DIRECT_BROWSER_INSERT / BYPASS | Local-storage IDs flow into batch inserts | Bypasses candidate discovery even when discovery is fail-closed |
| `useUpdateAssignment()` | DIRECT_BROWSER_UPDATE / RLS_ONLY | Directly changes the assignment role; status is rejected by the hook | Role value has no live DB check constraint; RLS allows Panitia role-only writes |
| `transition_event_assignment_status()` | SERVER_RPC | Changes an existing row's status and audit data | Authenticated-only state-transition boundary; not creation or eligibility validation |
| `import-database` | PRIVILEGED OPERATIONAL WRITE PATH | Service-role generic insert/upsert; `event_assignments` is importable | Admin-province role check, but no province binding or assignment validation; bypasses ordinary RLS |
| `seed-database` | PRIVILEGED OPERATIONAL / SEED | Service-role code creates generated assignment rows | Seed path, not normal authorization; no production/environment restriction was found in inspected source |
| `seed-security-fixtures.ts` | TEST FIXTURE PATH | Service-role assignment inserts | Not run; fixture operations prohibited |
| `auto-complete-events`, notification/reminder Edge Functions | READ-ONLY ASSIGNMENT ACCESS | Read assignments to create honors, notifications, or reminders | No `event_assignments` mutation found in inspected paths |
| Audit / updated-at triggers | TRIGGER SIDE EFFECT | Audit, timestamp maintenance | Not authorization/eligibility enforcement |
| `validate_event_assignment_transition` | TRIGGER_ENFORCED / UPDATE ONLY | Validates status transitions before UPDATE | Does not validate INSERTs or candidate eligibility |

Search also found no existing assignment-creation RPC. The only existing assignment mutation RPC is the status transition function.

## 5. Threat Model

Threats considered:

- A client can bypass the candidate UI and submit any existing profile UUID to a direct insert.
- A local-storage template is untrusted data and can contain stale or arbitrary referee IDs.
- Candidate discovery and a later insert are separate requests; eligibility or scope may change between them.
- Admin city/province RLS and Panitia RLS do not consistently express the intended event/candidate scope.
- The insert validator exists as a function but is not attached to the live table, so its body does not protect direct writes.
- Service-role import and seed paths bypass normal RLS and may write assignments without candidate checks.
- Concurrent writes can pass a read-only conflict check unless the final write serializes/checks atomically.

## 6. Actor Authorization Contract

Any eventual user-facing write capability must derive the actor exclusively from `auth.uid()`. It must not accept `actor_id`, `admin_id`, `_user_id` as the actor, `provinsi_id`, or `kabupaten_kota_id` as authoritative scope.

Proposed order inside the write transaction:

1. Require non-null `auth.uid()`.
2. Resolve an explicitly permitted role.
3. Resolve authoritative scope with the private helper for that role.
4. Load the target event and evaluate actor-to-event authority.
5. Load/validate the target referee and evaluate approved eligibility.
6. Resolve duplicate/reassignment and conflict semantics.
7. Insert the row with status set server-side to `pending`.

Any failed check must abort the transaction with no row inserted. A candidate API result is not an authorization token or write permission.

## 7. Admin Province Contract

Required target:

```text
auth.uid()
-> explicit admin_provinsi role
-> private.get_actor_provinsi_id()
-> event province
-> assignment permission
```

Current TEST has **0 active `PROVINSI` bindings**. Therefore the existing province-admin fixtures must receive `FORBIDDEN_SCOPE`; there is no fallback to profile city, arbitrary province, or all-province scope.

Current assignment RLS checks `is_admin_provinsi(auth.uid())` by role only. It does not use `private.get_actor_provinsi_id()`. The generic import Edge Function also checks the role without the province binding. Neither is an acceptable source for the new user-facing write boundary.

## 8. Admin City Contract

The eventual policy must call `private.get_actor_kabupaten_kota_id()` from the server-side actor and compare stored event/candidate regions. Current evidence does not resolve the allowed geography:

| Model | Existing evidence | Status |
|---|---|---|
| Model A: event in actor city; candidates may be from other cities | Current assignment RLS checks the event city; former candidate list is unfiltered by city; smart UI scores same-city candidates higher but retains other-city candidates | Supported by present UI/RLS behavior, not an approved business authorization rule |
| Model B: candidate must be in actor city | Required by an earlier proposed capability contract, but no existing assignment filter, RLS predicate, trigger, or helper enforces it | No authoritative source |
| Model C: both event and candidate must be in actor city | Event half exists in RLS; candidate half does not | No authoritative source |

Do not choose a model for implementation until the business/security owner resolves it. A caller-supplied region may not expand scope under any model.

## 9. Panitia Contract

| Source | Current behavior |
|---|---|
| `event_assignments` INSERT/ALL RLS | `has_role(auth.uid(),'panitia')` alone; no event owner or region comparison |
| `event_assignments` SELECT RLS | Does not include Panitia assignment-history visibility |
| Assignment route | `RefereeAssignment` is behind `ProtectedRoute requireAdmin`; Panitia is not included by `isAdmin()` |
| `send-assignment-notification` | Allows Panitia for notification processing, then checks `event.created_by === caller.user.id` |
| Generic import | Admin-province-only Edge Function; service-role writes, no event ownership check |

This does not establish whether Panitia authority should be `DENY`, `EVENT_OWNER_ONLY`, `EVENT_REGION`, or another explicit model. Do not inherit the broad role-only assignment RLS as proof of candidate/write authority.

**BLOCKED — PANITIA AUTHORITY UNRESOLVED.** Interim design should not add Panitia capability until an owner decides the scope and the write boundary enforces it.

## 10. Referee Eligibility Contract

| Rule | Existing evidence | Candidate discovery | Write enforcement | Status |
|---|---|---|---|---|
| `user_roles.role = 'wasit'` | `is_referee_active()` checks role; old list joins `user_roles` | Should filter only after eligibility is approved | Must be rechecked atomically | Defined in helper, not enforced on current INSERT path |
| `profiles.is_active = true` | `is_referee_active()` checks `true` | Likely candidate filter, pending owner confirmation | Must be rechecked atomically | Defined in helper, validator detached |
| `registration_status = 'approved'` | No assignment helper/trigger check found | Undecided | Undecided | UNKNOWN / UNDEFINED |
| `profiles.deleted_at IS NULL` | No live active-helper/validator check; current live `get_referees()` body does not filter it | Undecided | Undecided | UNKNOWN / UNDEFINED |
| `is_profile_complete = true` | No assignment helper/trigger/candidate consumer rule found | Undecided | Undecided | UNKNOWN / UNDEFINED |

No client-side role/status filter can substitute for the eventual write-time checks.

## 11. Event Eligibility Contract

`events.status` is constrained to `DIAJUKAN`, `DISETUJUI`, `DITOLAK`, and `SELESAI`. Both candidate hooks require `DISETUJUI`; `is_event_approved(uuid)` returns that status comparison. However, the validator that calls it is detached from INSERT, and event status is not enforced by the current assignment INSERT RLS policy.

The proposed write design should require `event.status = 'DISETUJUI'` server-side if the existing UI rule is confirmed as authoritative. Until enforcement/business ownership is confirmed, classify it as **defined in consumer/helper code but not effectively enforced**.

## 12. Conflict Contract

Current `has_schedule_conflict(referee_id,event_id)` semantics:

- exact equality of `events.date`;
- another event ID;
- assignment status other than `cancelled` blocks (`pending`, `confirmed`, and `declined` all count);
- no `deleted_at` exclusion;
- no time-of-day comparison;
- no linked event status exclusion, so completed-event assignments still participate.

Former browser logic instead tests `start_date`/`end_date` interval overlap, excludes only cancelled assignments, and does not exclude soft-deleted rows. This conflict helper is called by the detached validator and is not effective INSERT enforcement.

Canonical choice remains open among `EXACT_DATE`, `DATE_RANGE`, `DATE_TIME_RANGE`, or another owner-defined rule. The status treatment for pending/confirmed/declined/cancelled, soft-deleted rows, and completed events must be specified. Do not turn the UI heuristic into an authoritative rule without approval.

Concurrency: conflict check and insert must run in one transaction with per-referee serialization/locking sufficient to prevent two overlapping writes from both passing. The exact lock mechanism belongs in implementation design after conflict semantics are approved.

## 13. Duplicate / Reassignment Contract

TEST has `UNIQUE(event_id, referee_id)` with no status/deleted predicate. The state-transition RPC does not permit `cancelled -> pending`; the browser candidate filter, however, treats cancelled assignments as assignable again. Thus an insert after cancellation fails the unique constraint.

The current schema implies “cancelled row remains unique and cannot be recreated” unless a separate reactivation/reassignment operation is approved. Do not drop or weaken the unique constraint. Confirm the product contract before implementation. Duplicate and schedule conflict are separate errors/conditions.

## 14. Template / Batch Contract

Current batch code executes one insert per row, catches row errors, accumulates results, and reports aggregate success/failure counts. That is **partial success**, not all-or-nothing; `RefereeAssignment` currently ignores detailed row results after the mutation returns. Templates are local-storage IDs and must be treated as untrusted input.

Design recommendation from observed behavior: preserve per-assignment validation and partial outcomes, but return/display an explicit result for every referee. Each row must pass through the same server write boundary; no browser authorization loop or template shortcut may authorize a row. If product owners require all-or-nothing batches, that is a separate behavior change and must be decided explicitly.

## 15. Write-Boundary Architecture

No existing approved assignment-creation RPC was found. `transition_event_assignment_status()` is an existing-row status mutation and remains conceptually separate.

Provisional create contract, subject to business decisions:

```text
public.assign_referee_to_event(
  p_event_id uuid,
  p_referee_id uuid,
  p_role text
)
```

These inputs are demonstrated by current browser operations. The function must not accept actor/admin/user ID or client city/province. It must derive actor from `auth.uid()`, assign `status='pending'` itself, validate all authoritative predicates, serialize conflict checks, insert atomically, and return only an explicit assignment result projection. No status parameter is needed for the initial write.

This name/signature is **provisional**, not approved for migration. The live `role` column is nullable `text` with no live role CHECK constraint. UI types use `UTAMA`/`CADANGAN`, while seed source uses `wasit_utama`/`wasit_kedua`/other lowercase values. Allowed roles must be settled before a database constraint or input contract is frozen.

Single and batch/template consumers must route to this same server boundary. Current batch UX indicates per-item partial results; each insert still gets its own transaction and independent server validation. Candidate discovery remains a separate read API and never authorizes a write.

## 16. SECURITY DEFINER Contract

Any new user-facing write RPC should be `SECURITY DEFINER`, `SET search_path = ''`, schema-qualified, explicit in parameters/result, use `auth.uid()`, and grant EXECUTE only to `authenticated` (no PUBLIC/anon). Authorization must be inside the function; `TO authenticated` alone is insufficient.

Do not attach or reuse `validate_referee_assignment()` as-is: it uses `search_path=public`, has PUBLIC/anon/authenticated EXECUTE in TEST, and is not attached to the live INSERT path. Do not globally rewrite `is_admin_provinsi()` or unrelated helpers.

## 17. Error Contract

The following is the proposed normalized contract for the future write capability. Existing assignment creation does not currently implement these normalized errors.

| Error | Proposed condition | Current source support |
|---|---|---|
| `UNAUTHORIZED_ACTOR` | `auth.uid()` is null | Existing status-transition RPC emits this; there is no create RPC |
| `FORBIDDEN` | Actor role is not permitted | No normalized create-path error; direct writes rely on RLS |
| `FORBIDDEN_SCOPE` | Province/city binding is missing or the event is outside actor scope | P0 helpers fail closed, but current assignment RLS does not use both authoritative helpers |
| `INVALID_TARGET` | Null/malformed event or referee target | No normalized create-path error; FK/trigger errors are currently lower-level |
| `INELIGIBLE_REFEREE` | A confirmed authoritative referee eligibility rule fails | Detached validator raises text for event/active checks; it is not attached |
| `ASSIGNMENT_CONFLICT` | A confirmed canonical conflict rule fails | Detached validator/helper have text/boolean behavior only; no active insert enforcement |
| `DUPLICATE_ASSIGNMENT` | Unique `(event_id, referee_id)` conflict after reassignment policy is resolved | Current database returns a uniqueness violation; it is not normalized by the hooks |
| `INVALID_ASSIGNMENT_ROLE` | Role not in the owner-approved role set | Live role is nullable text without a CHECK constraint; no normalized error exists |

For unauthenticated or out-of-scope actors, perform actor/scope checks before target-specific detail and avoid distinguishing nonexistent from inaccessible resources where that reveals existence. Do not include region bindings, referee profiles, assignment history, or helper internals in error payloads. Exact normalization must follow the unresolved eligibility, region, and reassignment decisions; the table is a design target, not a claim about current runtime behavior.

## 18. RLS Defense-in-Depth

Current TEST table privileges report INSERT/UPDATE/DELETE for `authenticated` and INSERT for `anon`; current RLS policy is what limits normal requests. The assignment ALL policy is broader for Panitia and does not check referee eligibility. Future migration design must close direct browser creation independently of the RPC, for example by revoking direct INSERT from `anon`/`authenticated` and removing the permissive direct INSERT path while preserving only explicitly approved read/update capabilities.

Do not remove RLS. SECURITY DEFINER write code may insert using its owner privileges, but must perform every authorization and eligibility check itself. Direct role updates/deletes must either receive their own approved boundary or be denied; status transitions continue only through the existing status RPC after its scope is reviewed.

## 19. Import / Seed Operational Paths

### `import-database`

This Edge Function explicitly allows `event_assignments`, uses a service-role client, and supports insert/upsert from import records. It checks the caller for `admin_provinsi` role but does not use the authoritative province helper or validate assignment event/referee eligibility. Service role bypasses ordinary RLS. Source search found no explicit TEST/production project allowlist or environment guard in this Edge Function.

Classification: **PRIVILEGED OPERATIONAL WRITE PATH**. Recommended disposition: remove assignment rows from generic imports, or define a separate break-glass restore procedure with explicit authorization, validation, audit, and environment safeguards. It must not be represented as the normal assignment capability.

### `seed-database`

The Edge Function seeds assignment rows using service role after creating events/users. It is operational seed tooling, not normal assignment authorization. Source search found no explicit TEST/production project allowlist or environment guard in this function. Preserve it only as an explicitly nonproduction operational tool; do not use it to bypass normal authorization.

### Fixture seeder

`supabase/tests/seed-security-fixtures.ts` is test-only setup. It was not run. Fixture writes remain prohibited in this phase.

## 20. Migration Specification (Not Executed)

No migration file was created. A future narrowly scoped migration, after decisions are closed, should specify:

1. A dedicated authenticated write RPC with atomic server validation and explicit return fields.
2. Any minimal private helper functions needed for event authorization/eligibility, each with `SECURITY DEFINER`, empty search path, qualified references, and restricted EXECUTE.
3. Direct table INSERT closure for anon/authenticated; review direct UPDATE/DELETE and the Panitia policy so alternate browser writes cannot bypass the boundary.
4. Authenticated-only EXECUTE on the write RPC; revoke PUBLIC/anon.
5. Reuse of `transition_event_assignment_status()` only for existing-row status changes; do not create assignments through it.
6. A separate decision for the assignment role constraint (`UTAMA`/`CADANGAN` vs legacy seed values); do not invent values.
7. No changes to `get_referees()` or `count_referees()` in this phase.
8. A separate source/deployment change to remove or secure generic assignment import and seed operations; do not silently leave them as ordinary writes.

An optional batch RPC should only be added if it validates every candidate itself and returns an explicit per-row result consistent with the approved partial/atomic product contract.

## 21. Privilege Specification (Future)

| Principal/path | Future design requirement |
|---|---|
| `authenticated` | EXECUTE approved RPC; no direct candidate-creation INSERT. Other direct update/delete rights must be separately reviewed. |
| `anon` | No write RPC EXECUTE and no assignment table DML privileges/policy path. |
| `PUBLIC` | No write RPC EXECUTE. |
| `service_role` | Keep server-only; generic import must not be an unvalidated assignment bypass. Break-glass/import authority requires a separate operational contract and audit. |
| Status RPC | Retain as separate state-transition path; review its search path/scope in a distinct hardening decision without changing unrelated functions here. |

`has_table_privilege` in TEST reports direct table INSERT available to anon/authenticated before RLS. RLS currently denies anon rows and scopes ordinary authenticated writes, but privileges and policies should both be deliberately closed in the eventual migration.

## 22. Rollback Plan

Rollback must preserve the security improvement:

- Keep direct browser INSERT denied and candidate UI fail-closed if the new RPC fails.
- Do not restore direct `useAssignReferee`, batch/template inserts, `get_referees()`, or `get_admin_referees()` as write/candidate fallbacks.
- Revert only objects/ACLs introduced by the future migration; do not restore permissive policies or anon/public EXECUTE.
- Preserve event-assignment RLS and actor helpers.
- Keep import/seed paths disabled for routine assignment changes until their separate operational contract is approved.
- No rollback is required in this phase because no mutation occurred.

## 23. Test Matrix (Design Only; Not Executed)

| Actor / case | Expected after implementation |
|---|---|
| Admin city A / own authorized event / eligible referee | ALLOW |
| Admin city A / cross-city event | `FORBIDDEN_SCOPE` |
| Admin city B / own authorized event / eligible referee | ALLOW |
| Admin city B / cross-city event | `FORBIDDEN_SCOPE` |
| Province admin with zero binding | `FORBIDDEN_SCOPE` |
| Panitia | Decision blocked until event scope is approved |
| Wasit | `FORBIDDEN` |
| Ordinary authenticated | `FORBIDDEN` |
| Anonymous | ACL/authentication denial |
| Inactive, non-wasit, unapproved, deleted, incomplete, or license edge case | Execute only after eligibility rules are approved; expected status currently unresolved |
| Conflict/duplicate/cancelled row | Execute only after those semantics are approved |

Real TEST sessions are required for runtime verification. No sessions were used or fabricated here.

## 24. Static Verification

- `get_referees()` browser consumers: 0; no fallback restored.
- `count_referees()` browser consumers: 0.
- Two direct browser INSERT call sites remain (`useAssignReferee()` and `useBatchAssignReferees()`); the template path reaches the batch site.
- No `profiles.select("*")`/empty profile projection was found in the assignment candidate/write consumer search.
- No service-role credential is present in browser source; the Supabase browser client rejects a `service_role` key. Service-role usage found is confined to Edge Functions/seed tooling.
- Candidate helper remains fail-closed.
- `useApplyTemplate()` still bypasses candidate lookup through batch direct inserts; this is documented, not changed.
- Existing assignment creation is not protected by a live INSERT eligibility trigger.
- `transition_event_assignment_status()` is the only existing assignment mutation RPC found; it updates existing status only.
- No actor runtime test, production access, DDL, DML, migration, RLS/grant change, or deployment occurred.

## 25. Unresolved Business Decisions

1. Admin city Model A/B/C (event city vs candidate city).
2. Panitia: global, event-owner-only, event-region, role-only, or denied.
3. Approved-registration, deleted-profile, and profile-completeness eligibility.
4. License level/expiry hard eligibility versus soft ranking.
5. Exact-date vs date-range vs date-time conflict; status/deleted/completed-event treatment.
6. Cancelled/declined duplicate and reassignment behavior; current unique constraint prevents second rows.
7. Assignment role values: UI `UTAMA`/`CADANGAN`, live `text` without check, legacy seed values differ.
8. Whether batch remains partial-success and how per-row errors are presented.
9. How generic service-role import and seed are operationally authorized, audited, and excluded from normal assignment writes.
10. Runtime verification using real authenticated TEST sessions remains pending.

## 26. Final Gate

**BLOCKED — REGION SEMANTICS UNRESOLVED**

The write API security shape and migration prerequisites are documented, but Model A/B/C cannot be selected from authoritative current behavior. Panitia, eligibility, conflict, role, and reassignment rules also require decisions. Do not implement the write or candidate RPC until these contracts are approved and the direct-write bypasses can be closed together.