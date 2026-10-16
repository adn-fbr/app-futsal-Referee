# PHASE B.3.4.5.13-D — Final Assignment Authorization Contract Closure

**FINAL GATE: BLOCKED — OWNER DECISION REQUIRED**  
**IMPLEMENTATION_READY = NO**

## 1. Environment

- TEST project: `test APP`, ref `shorsqyycpptxcutrqrb`; verified active before this phase’s artifact inspection.
- Timestamp: `2026-09-27T09:36:02Z` (UTC).
- Mode: contract closure only; no runtime actor tests.

## 2. Production Access Status

Production `xfscfjwapwnkiinkgbjg` was **NOT ACCESSED**. No production query, project connection, URL, credential, or browser access occurred.

## 3. Mutation Status

No DDL, DML, migration, RLS/grant/function/trigger change, fixture/role mutation, deployment, assignment write, impersonation, fabricated JWT, `auth.uid()` simulation, or source modification occurred.

## 4. Closed Region Contract

### D-REGION-001 — Admin Kab/Kota: CLOSED, MODEL C

```text
actor city = event city
AND
actor city = referee/candidate city
```

Actor city must come from `private.get_actor_kabupaten_kota_id()` using `auth.uid()`. No client-supplied city may authorize access. The present RLS policy checks event city using a legacy helper and does not check candidate city; implementation remains unaligned and must independently enforce both comparisons.

### D-REGION-002 — Admin Provinsi: CLOSED, FAIL-CLOSED

```text
auth.uid()
+ explicit admin_provinsi role
+ exactly one active PROVINSI pengurus binding
+ event province = actor province
+ referee province = actor province
```

Province comes from `private.get_actor_provinsi_id()`. With zero or multiple active bindings, return `FORBIDDEN_SCOPE`; no city fallback and no `LIMIT 1`. Current TEST active province binding count is 0, so current province fixtures remain denied.

## 5. Closed Actor Contract

| Actor | Contract |
|---|---|
| `admin_kab_kota` | Allow only when actor city, event city, and referee city all match; otherwise `FORBIDDEN_SCOPE`. |
| `admin_provinsi` | Allow only with exactly one authoritative binding and matching event/referee province; current zero-binding fixtures receive `FORBIDDEN_SCOPE`. |
| `wasit` | Assignment creation DENY unless a future authoritative owner decision changes this. |
| Ordinary authenticated | DENY. |
| Anonymous | DENY / ACL denial. |
| Panitia | UNRESOLVED; no capability is granted pending owner decision. |

Candidate discovery is not authorization for a later write. The write boundary must revalidate actor, event, referee, and all applicable eligibility rules atomically.

## 6. Panitia Contract — D-ASSIGN-001

`PANITIA_ASSIGNMENT_AUTHORITY = UNRESOLVED`.

No explicit owner decision selects `DENY`, `EVENT_OWNER_ONLY`, `EVENT_REGION`, `ROLE_ONLY`, or `OTHER`. Existing role description, broad role-only RLS, admin-only route, CTA mismatch, and event-owner notification check conflict. Current RLS permission is not approval. Interim/future contract: no Panitia capability until explicitly resolved.

## 7. Referee Eligibility Contract — D-ASSIGN-002

| Predicate | Decision | Evidence boundary |
|---|---|---|
| E1 `user_roles.role = 'wasit'` | UNRESOLVED | Existing helper/validator behavior is not an approved, attached write rule. |
| E2 `profiles.is_active = true` | UNRESOLVED | Helper checks active; no live INSERT validator and no assignment-specific owner decision. |
| E3 `registration_status = 'approved'` | UNRESOLVED | Public visibility behavior is not assignment authorization. |
| E4 `profiles.deleted_at IS NULL` | UNRESOLVED | No assignment-specific approved rule or active write enforcement. |
| E5 `is_profile_complete = true` | UNRESOLVED | No assignment-specific approved rule or active write enforcement. |

Every unresolved predicate blocks implementation. Do not infer assignment eligibility from public referee directory filters.

## 8. License Contract — D-ASSIGN-003

`ASSIGNMENT_LICENSE = UNRESOLVED`.

Phase 4.1 D-005 is authoritative only for the general license lifecycle: `license_expiry < CURRENT_DATE`, Asia/Makassar, equal-to-today remains active, and automatic deactivation after expiry. It does not approve assignment-time rejection based on expiry or a minimum license hierarchy. Existing smart-assignment scoring is not authorization evidence. Do not invent category/license mappings or eligibility rules.

## 9. Conflict Contract — D-ASSIGN-004

```text
CONFLICT_MODEL = UNRESOLVED
CONFLICT_BLOCKING_ASSIGNMENT_STATUSES = UNRESOLVED
CONFLICT_EXCLUDES_EVENT_STATUS = UNRESOLVED
CONFLICT_EXCLUDES_ASSIGNMENT_STATUS = UNRESOLVED
```

The current helper’s exact-date rule and the former UI’s date-range overlap are implementation evidence only. Owner decisions are also absent for pending, confirmed, declined, cancelled, deleted assignments, and DITOLAK/SELESAI/deleted events. Do not select `EXACT_DATE` merely because the helper uses it.

## 10. Reassignment Contract — D-ASSIGN-005

```text
CURRENT_DATABASE_ENFORCEMENT = UNIQUE(event_id, referee_id), regardless of status
PRODUCT_INTENT = UNRESOLVED
REASSIGNMENT = UNRESOLVED
```

Current enforcement prevents a second row after cancellation; there is no cancelled-to-pending transition. This does not establish intended product behavior. Preserve the UNIQUE constraint and do not infer `PERMANENT_UNIQUE`, reactivate, or new-row semantics without owner approval.

## 11. Assignment Role Contract — D-ASSIGN-006

```text
CANONICAL_ASSIGNMENT_ROLES = UNRESOLVED
LEGACY_ASSIGNMENT_ROLE_VALUES = referee, wasit_utama, wasit_kedua, wasit_ketiga, wasit_cadangan
ASSIGNMENT_ROLE_CONTRACT = UNRESOLVED
```

The UI uses `UTAMA` and `CADANGAN`; live TEST has nullable text and no role CHECK; read-only data includes `CADANGAN` and legacy `referee`; historical SQL has a `UTAMA`/`CADANGAN` check; seed values differ. Do not choose by frequency, normalize rows, or add a constraint here.

## 12. Batch Contract — D-ASSIGN-007

```text
BATCH_SEMANTICS = UNRESOLVED
INVALID_TEMPLATE_REFEREE = UNRESOLVED
```

Current UI behavior is per-row `PARTIAL_SUCCESS`, but this is not owner-approved business intent. Templates contain untrusted local-storage referee IDs. Decide whether an invalid template row fails individually or blocks the whole batch. Every future batch row must be independently authorized server-side.

## 13. Import Contract — D-ASSIGN-008

```text
IMPORT_ASSIGNMENT_AUTHORITY = UNRESOLVED
```

`import-database` can insert/upsert `event_assignments` with service-role access after a role check, but has no explicit project/environment allowlist and no assignment eligibility validation. Keep it classified as a privileged operational write path requiring separate remediation; do not treat it as the normal user-facing write API.

## 14. Seed Contract — D-ASSIGN-009

```text
SEED_ASSIGNMENT_AUTHORITY = UNRESOLVED  # seed-database
seed-security-fixtures.ts = TEST_ONLY  # guarded by exact non-production ref/URL and env checks
```

The fixture guard does not constrain the generic `seed-database` Edge Function. Neither path was executed. Do not infer production or test deployment status from source alone.

## 15. Final Authorization Matrix

| Actor | Event scope | Candidate scope | Assignment creation |
|---|---|---|---|
| `admin_provinsi` | Event province must equal helper-derived actor province | Referee province must equal actor province | ALLOW only if all predicates pass; current zero-binding fixtures -> `FORBIDDEN_SCOPE` |
| `admin_kab_kota` | Event city equals helper-derived actor city | Referee city equals actor city | ALLOW only if all predicates pass (Model C) |
| Panitia | Owner scope unresolved | Candidate scope unresolved | No capability until owner decision |
| Wasit | Self/assignment relation does not authorize creation | N/A | DENY |
| Ordinary authenticated | None | None | DENY |
| Anonymous | None | None | DENY / ACL denial |

## 16. Future Write RPC Contract

No implementation in this phase. Provisional contract, not a finalized SQL signature:

```text
assign_referee_to_event(
    p_event_id uuid,
    p_referee_id uuid,
    p_role text
)
```

Required invariant: actor is `auth.uid()`; no actor/city/province/status authorization inputs; initial status is server-controlled `pending`; event scope, candidate scope, eligibility, license rule, conflict, duplicate/reassignment, and role must be revalidated in the same transaction before INSERT. Any failure means no insert. Preserve the unique constraint.

Future security shape: SECURITY DEFINER, `SET search_path = ''`, schema-qualified objects, explicit result, authenticated EXECUTE only, anon/PUBLIC denied, authorization implemented inside the function. Business blockers mean the write contract is not yet closed.

## 17. Future Candidate RPC Contract

No implementation in this phase. Provisional read API:

```text
get_assignment_referee_candidates(p_event_id uuid)
```

Admin city uses Model C. Province scope requires the authoritative helper and exact event/referee province match. Panitia remains unresolved; wasit, ordinary authenticated, and anon are denied. Return a minimal explicit projection only. Candidate results never authorize a later write.

## 18. Error Contract

Retain this proposed taxonomy; no implementation here:

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

Normalize errors without exposing hidden referee/event existence, region bindings, assignment history, or authorization internals.

## 19. RLS Closure Requirements

No RLS change in this phase. Future closure must:

- prevent direct browser assignment INSERT from providing an alternate authorization path after the write RPC is implemented and verified;
- review direct UPDATE/DELETE separately from the status-transition RPC;
- not preserve the current Panitia role-only INSERT branch as implied approval;
- keep service-role import/seed outside ordinary browser authorization;
- retain RLS as defense in depth, not as the sole eligibility check.

## 20. Consumer Closure Status

| Consumer/path | Current status |
|---|---|
| `get_referees()` browser consumers | 0; generated declaration remains |
| `count_referees()` browser consumers | 0; generated declaration remains |
| `useAvailableReferees()` | Fail-closed until candidate capability exists |
| `useSmartRefereeSuggestions()` | Fail-closed until candidate capability exists |
| `useAssignReferee()` | Not migrated; direct INSERT unchanged |
| `useBatchAssignReferees()` | Not migrated; direct INSERT unchanged |
| `useApplyTemplate()` | Not migrated; local IDs still feed batch insert |

No source modification was made. Candidate/write implementations and current insert callers remain blocked by the unresolved contract.

## 21. Runtime Verification Status

`NOT EXECUTED`. No authenticated actor sessions or actor RPC calls were used. Future verification matrix is a target only: city A/B own-event and own-city-referee allow; cross-city event or referee deny; province zero binding -> `FORBIDDEN_SCOPE`; Panitia per approved decision; wasit/ordinary/anon deny.

## 22. Final Decision Register

| ID | Decision | Result | Authority | Status |
|---|---|---|---|---|
| D-REGION-001 | Admin Kab/Kota | MODEL C | Owner-approved D-007 referee LIST rule + current event-city enforcement | CLOSED |
| D-REGION-002 | Admin Provinsi | Exact active binding; event/referee province match; zero -> `FORBIDDEN_SCOPE` | Explicit supplied security contract + private helper | CLOSED |
| D-ACTOR-001 | Wasit creation | DENY | Explicit supplied actor contract | CLOSED |
| D-ACTOR-002 | Ordinary authenticated | DENY | Explicit supplied actor contract | CLOSED |
| D-ACTOR-003 | Anonymous | DENY | Explicit supplied actor contract / ACL target | CLOSED |
| D-BOUNDARY-001 | Candidate vs write | Write independently revalidates | Explicit supplied security contract | CLOSED |
| D-ASSIGN-001 | Panitia | No authority chosen | No owner decision | UNRESOLVED |
| D-ASSIGN-002-E1 | Wasit role eligibility | No owner decision | Helper/history only | UNRESOLVED |
| D-ASSIGN-002-E2 | Active eligibility | No owner decision | Helper/adjacent active labels | UNRESOLVED |
| D-ASSIGN-002-E3 | Registration | No owner decision | No assignment-specific rule | UNRESOLVED |
| D-ASSIGN-002-E4 | Deleted profile | No owner decision | No assignment-specific rule | UNRESOLVED |
| D-ASSIGN-002-E5 | Profile completeness | No owner decision | No assignment-specific rule | UNRESOLVED |
| D-ASSIGN-003 | Assignment license | D-005 is lifecycle only | No assignment-specific decision | UNRESOLVED |
| D-ASSIGN-004 | Conflict | No canonical model/status set | Helper and UI conflict | UNRESOLVED |
| D-ASSIGN-005 | Reassignment | Current DB unique; product intent absent | Constraint is enforcement, not product approval | UNRESOLVED |
| D-ASSIGN-006 | Assignment role | Conflicting UI/live/history/seed values | No approved canonical role list | UNRESOLVED |
| D-ASSIGN-007 | Batch/template | Current partial behavior only | No owner decision | UNRESOLVED |
| D-ASSIGN-008 | Import | Privileged path; operational authority absent | No approved operational contract | UNRESOLVED |
| D-ASSIGN-009 | Seed | Generic seed authority absent; fixture seeder guarded TEST-only | Source guard only for fixture seeder | UNRESOLVED |

## 23. Implementation Readiness

```text
IMPLEMENTATION_READY = NO
REGION = CLOSED (MODEL C)
PROVINCE = CLOSED (zero-binding fail-closed)
ACTOR DENIALS = CLOSED (wasit / ordinary / anon)
CANDIDATE != WRITE AUTHORIZATION = CLOSED
PANITIA = UNRESOLVED
E1-E5 = UNRESOLVED
ASSIGNMENT LICENSE = UNRESOLVED
CONFLICT + BLOCKING STATUS SET = UNRESOLVED
REASSIGNMENT PRODUCT INTENT = UNRESOLVED
CANONICAL ROLE VALUES = UNRESOLVED
BATCH/TEMPLATE FAILURE SEMANTICS = UNRESOLVED
IMPORT AUTHORITY = UNRESOLVED
SEED AUTHORITY = UNRESOLVED
```

## 24. Remaining Blockers

- Panitia authority.
- E1-E5 assignment eligibility predicates.
- Assignment-specific license semantics.
- Conflict model and blocking status/event exclusions.
- Reassignment behavior despite current permanent unique enforcement.
- Canonical role values.
- Batch atomicity and invalid-template behavior.
- Import/seed operational authority.
- Runtime verification remains unexecuted.

## 25. Final Gate

**BLOCKED — OWNER DECISION REQUIRED**

The supplied region and actor decisions are closed and preserved. Multiple other security-relevant D-ASSIGN decisions lack explicit owner approval. Current RLS, helper code, UI behavior, historical constraints, seed values, and row frequency were not used to manufacture owner decisions. Do not implement SQL/RPCs, change RLS/grants, or modify source until the remaining decision register is closed.