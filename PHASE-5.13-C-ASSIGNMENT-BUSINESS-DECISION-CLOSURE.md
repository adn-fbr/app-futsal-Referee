# PHASE B.3.4.5.13-C — Assignment Business Decision Closure

**FINAL GATE: BLOCKED — OWNER DECISION REQUIRED**  
**IMPLEMENTATION_READY = NO**

## 1. Environment

- TEST project: `test APP`, ref `shorsqyycpptxcutrqrb`; re-confirmed active before the read-only TEST catalog query.
- Production ref: `xfscfjwapwnkiinkgbjg`.
- Timestamp: `2026-09-27T09:30:30Z` (UTC).
- No actor sessions, impersonation, or `auth.uid()` simulation used.

## 2. Production Access Status

Production was **NOT ACCESSED**. No production project tool, connection, URL, credential, or browser was used.

## 3. Mutation Status

No migration, DDL, DML, RLS/grant/function/trigger change, assignment write, fixture/role mutation, deployment, JWT fabrication, or source change occurred. Inspection was read-only.

## 4. Existing Model C Region Decision

`REGION_DECISION = MODEL C`.

- Live TEST `event_assignments` RLS constrains an `admin_kab_kota` event to the actor’s city (current policy uses legacy `get_user_kabupaten_kota(auth.uid())`).
- Owner-approved Phase 4.1 D-007 explicitly allows same-region and denies foreign-region referee LIST results. Candidate discovery returns a referee list, and no assignment-specific cross-region exception was found.
- Therefore the assignment target is both: event city = actor city AND candidate/referee city = actor city.
- Future implementation must use `private.get_actor_kabupaten_kota_id()` and independently enforce both comparisons. This decision does not mean the current DB function/RLS implementation enforces candidate-city scope.

## 5. Panitia Decision (D-ASSIGN-001)

**PANITIA_ASSIGNMENT_AUTHORITY = UNRESOLVED — OWNER DECISION REQUIRED.**

Evidence conflicts: canonical RBAC describes “assignment coordination”; assignment RLS allows the `panitia` role without event ownership/region; the assignment route is `requireAdmin` and excludes Panitia; a visible CTA was documented as a route/capability mismatch; the notification Edge Function checks event ownership. No approved source selects `DENY`, `EVENT_OWNER_ONLY`, `EVENT_REGION`, `ROLE_ONLY`, or another model. Interim design must not add Panitia capability.

## 6. Referee Eligibility Decisions (D-ASSIGN-002)

| Rule | Authoritative source found? | Result |
|---|---|---|
| E1 `user_roles.role = 'wasit'` | No assignment-specific owner decision; helper/validator is detached from live INSERT | UNRESOLVED |
| E2 `profiles.is_active = true` | D-004 defines active labels, not assignment eligibility; helper is detached | UNRESOLVED |
| E3 `registration_status = 'approved'` | Public visibility/onboarding behavior only; no assignment authority | UNRESOLVED |
| E4 `profiles.deleted_at IS NULL` | No assignment-specific decision/enforcement | UNRESOLVED |
| E5 `is_profile_complete = true` | No assignment-specific decision/enforcement | UNRESOLVED |

Do not infer assignment eligibility from public-directory filters. No single authoritative predicate is ready to freeze.

## 7. License Decision (D-ASSIGN-003)

**Assignment-time license decision: UNRESOLVED.** Smart assignment’s event-category/license scoring is `SOFT_RANKING_ONLY` UI behavior; no approved hard minimum/license hierarchy was found. Phase 4.1 D-005 is authoritative for general license lifecycle (`license_expiry < CURRENT_DATE`, Asia/Makassar, today remains active, automatic deactivation after expiry), but it does not state an assignment-time license rule. No assignment expiry predicate or automatic profile deactivation implementation was found in source. Do not invent a hierarchy or rejection rule.

## 8. Conflict Decision (D-ASSIGN-004)

**CONFLICT = UNRESOLVED.** `has_schedule_conflict()` uses exact `events.date`, counts every assignment status except `cancelled`, does not filter deleted assignments, and ignores event status. Former UI uses `start_date`/`end_date` overlap. TEST events have no `start_time`/`end_time` columns. No owner source chooses `EXACT_DATE`, `DATE_RANGE`, `DATE_TIME`, or `OTHER`, or decides pending/confirmed/declined/cancelled, deleted assignment, DITOLAK/SELESAI/deleted event behavior.

## 9. Reassignment Decision (D-ASSIGN-005)

**Product intent: UNRESOLVED.** Current TEST enforcement is `UNIQUE(event_id, referee_id)` regardless of status; a cancelled row still blocks a second row, and the transition graph has no cancelled-to-pending transition. Current enforcement is `PERMANENT_UNIQUE`; do not infer that this is the desired product behavior and do not alter the constraint.

## 10. Assignment Role Decision (D-ASSIGN-006)

**ASSIGNMENT_ROLE = UNRESOLVED.** Current UI/types use `UTAMA` / `CADANGAN`; live role is nullable `text` with no CHECK; read-only TEST aggregate found `CADANGAN` and legacy `referee`; historical SQL had a `UTAMA`/`CADANGAN` CHECK; seed uses `wasit_utama`, `wasit_kedua`, `wasit_ketiga`, `wasit_cadangan`. These sources conflict. Do not select by frequency or normalize in this phase.

## 11. Batch / Template Decision (D-ASSIGN-007)

Observed behavior is `PARTIAL_SUCCESS`: per-row inserts catch errors and aggregate results; the page does not show detailed per-referee results. Local-storage templates feed referee IDs directly to batch insertion and are untrusted input. No owner/test authority chooses `PARTIAL_SUCCESS` versus `ALL_OR_NOTHING`, or whether one invalid template ID fails one row or the entire batch. **BATCH INTENT = UNRESOLVED.** Future writes must validate every row server-side.

## 12. Import Decision (D-ASSIGN-008)

**IMPORT_ASSIGNMENT_AUTHORITY = UNRESOLVED.** `import-database` explicitly allows `event_assignments`, uses service role for insert/upsert, and checks `admin_provinsi` role without province binding or assignment validation. No TEST/production project allowlist or environment guard was found. No document approves production assignment import. Classify as a **PRIVILEGED OPERATIONAL WRITE PATH** until an owner sets production/break-glass/nonproduction/retire authority.

## 13. Seed Decision (D-ASSIGN-009)

**SEED_AUTHORITY = UNRESOLVED** for `seed-database`: service-role assignment writes exist, but this function has no explicit project/environment guard. `seed-security-fixtures.ts` is `TEST_ONLY` by source guard (requires `TEST_ENVIRONMENT=non-production`, exact TEST URL/ref, service-role key, fixture password); it was not run. The fixture guard does not constrain `seed-database`.

## 14. Normalized Assignment Authorization Contract

```text
ASSIGNMENT_AUTHORIZATION_CONTRACT

Actor:
    auth.uid()

Allowed actor roles:
    admin_kab_kota — Model C: actor city = event city = candidate city
    admin_provinsi — explicit role + private.get_actor_provinsi_id()
                            event province (events.kabupaten_kota_id -> kabupaten_kota.provinsi_id)
                                 = actor province = candidate province
                     exactly one active authoritative binding required

Panitia:
    UNRESOLVED — no new capability until owner decision

Wasit:
    DENY assignment creation

Ordinary authenticated:
    DENY

Anonymous:
    DENY / ACL denial
```

TEST currently has zero active `PROVINSI` bindings; province-admin fixtures therefore remain fail-closed with `FORBIDDEN_SCOPE`.

## 15. Final Eligibility Contract

```text
REFEREE_ASSIGNMENT_ELIGIBILITY

role:             UNRESOLVED (wasit is helper/history evidence, not active write enforcement)
active:           UNRESOLVED (helper checks true; validator is detached)
registration:      UNRESOLVED
 deleted:          UNRESOLVED
profile complete:  UNRESOLVED
license:           UNRESOLVED for assignment; D-005 lifecycle is separate
schedule conflict: UNRESOLVED
 event status:     DISETUJUI in UI/helper; not enforced by live INSERT boundary
```
deleted:           UNRESOLVED

Every write-time predicate must be explicitly approved and rechecked atomically. No detached function body counts as enforcement.

## 16. Future Write RPC Contract

Do not implement. Provisional target:

```text
assign_referee_to_event(
    p_event_id uuid,
    p_referee_id uuid,
    p_role text
)
```

Actor derives only from `auth.uid()`; no actor or region argument; server sets initial status to `pending`; write must atomically authorize actor/event, validate referee eligibility, role, duplicate/reassignment, and conflict, then insert or abort with no row. Preserve the unique constraint. Use SECURITY DEFINER, `search_path=''`, qualified references, explicit result, authenticated EXECUTE only, and anon/PUBLIC denied. Signature/name/role remain provisional until decisions close.

## 17. Future Candidate RPC Contract

Do not implement. Provisional read API: `get_assignment_referee_candidates(p_event_id uuid)`. Apply the authorization contract in Section 14 and return only approved minimal candidate fields. Candidate discovery is not a write authorization token; the write boundary must repeat critical checks.

## 18. Error Contract

Future taxonomy, not implemented here:

```text
UNAUTHORIZED_ACTOR
FORBIDDEN
FORBIDDEN_SCOPE
INVALID_TARGET
INELIGIBLE_REFEREE
ASSIGNMENT_CONFLICT
DUPLICATE_ASSIGNMENT
INVALID_ASSIGNMENT_ROLE
```

Normalize unauthorized/out-of-scope errors without leaking hidden event/referee existence, assignment history, region bindings, or authorization internals. Current direct writes expose lower-level RLS/constraint errors and do not meet this contract.

## 19. Decision Register

| ID | Decision | Result | Authority | Status |
|---|---|---|---|---|
| D-ASSIGN-001 | Panitia authority | No owner-selected scope; do not add capability | Conflicting role description, RLS, route, notification behavior | UNRESOLVED |
| D-ASSIGN-002-E1 | Referee role | Helper/validator only; detached | Historical/implementation | UNRESOLVED |
| D-ASSIGN-002-E2 | Active | Helper only; detached | Historical/adjacent D-004 | UNRESOLVED |
| D-ASSIGN-002-E3 | Registration | No assignment-specific source | Unknown | UNRESOLVED |
| D-ASSIGN-002-E4 | Deleted | No assignment-specific source | Unknown | UNRESOLVED |
| D-ASSIGN-002-E5 | Profile complete | No assignment-specific source | Unknown | UNRESOLVED |
| D-ASSIGN-003 | License | D-005 lifecycle only; no assignment threshold | Authoritative lifecycle, not assignment | UNRESOLVED |
| D-ASSIGN-004 | Conflict | Helper/UI differ; no owner choice | Derived/UI only | UNRESOLVED |
| D-ASSIGN-005 | Reassignment | Unique blocks duplicate in current DB | Derived enforcement; intent absent | UNRESOLVED |
| D-ASSIGN-006 | Role | UI, DB rows, history, seed conflict | Mixed implementation evidence | UNRESOLVED |
| D-ASSIGN-007 | Batch | Partial success observed | UI behavior only | UNRESOLVED |
| D-ASSIGN-008 | Import | Service-role import path; operational purpose absent | Incidental implementation | UNRESOLVED |
| D-ASSIGN-009 | Seed | Service-role path without explicit guard | Incidental implementation | UNRESOLVED |

## 20. Remaining Blockers

- Panitia assignment scope.
- E1–E5 assignment eligibility predicates.
- Assignment-specific license behavior.
- Conflict model and blocking statuses/event states.
- Product reassignment semantics.
- Canonical assignment roles.
- Batch/template atomicity and per-row failure behavior.
- Import/seed operational authority.
- Runtime verification remains unexecuted; no actor sessions were used.

## 21. Implementation Readiness

```text
IMPLEMENTATION_READY = NO
REGION = CLOSED (MODEL C target; implementation not aligned/verified)
PANITIA = UNRESOLVED
E1-E5 ELIGIBILITY = UNRESOLVED
LICENSE ASSIGNMENT RULE = UNRESOLVED
CONFLICT = UNRESOLVED
REASSIGNMENT = UNRESOLVED product intent
ROLE = UNRESOLVED
BATCH = UNRESOLVED
IMPORT = UNRESOLVED
SEED = UNRESOLVED
```

## 22. Final Gate

**BLOCKED — OWNER DECISION REQUIRED**

Model C and general license expiry are supported by explicit evidence within their stated scope. The remaining user-facing assignment authorization and eligibility decisions lack authoritative owner evidence. Do not implement SQL/RPCs, alter RLS/grants, or modify source until the decision register is closed.
