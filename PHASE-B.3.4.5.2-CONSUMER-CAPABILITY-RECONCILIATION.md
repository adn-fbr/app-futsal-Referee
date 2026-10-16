# PHASE B.3.4.5.2 — Consumer & Capability Reconciliation

**Result: `PHASE B.3.4.5.2 BLOCKED — CAPABILITY RECONCILIATION INCOMPLETE`**  
**Environment context:** TEST `shorsqyycpptxcutrqrb` only. Production `xfscfjwapwnkiinkgbjg` excluded.  
**Mode:** static/source/artifact reconciliation only. No database query, migration, source change, fixture creation, or deployment was performed.

## 1. Evidence Boundary

This report combines:

- static frontend source inspection performed in prior phases;
- the project-owner-supplied B.3.4.5.2 contract and current TEST observations;
- B.3.1-R project-scoped catalog evidence, which does not include actor runtime tests or a full trigger/consumer/dependency inventory.

The newly supplied claims about assignment transition functions, profile triggers, and the current three admin-province fixture bindings are recorded as **OWNER-SUPPLIED TEST BASELINE**, not independently re-queried in this phase. Actor behavior remains **NOT VERIFIED**. No test data or credentials were inspected.

## 2. Capability Reconciliation Matrix

| Capability | Current consumer/path | Required boundary | Decision | Owner / missing decision | Blocker and next step |
|---|---|---|---|---|---|
| Own referee detail | `useReferee()` in `useReferees.ts` directly selects `profiles.*`, then checks role client-side | Self-bound explicit projection; actor from `auth.uid()` | APPROVED in principle | Identity/profile owner | Replace wildcard/post-fetch role logic; verify self RLS and fields |
| Admin detail | `RefereeDetail.tsx` consumes `useReferee()` | Capability-scoped detail RPC; city same-city; province exact verified province | DEFERRED for province; city contract approved | Referee operations + security/data owner | Province actor mapping absent; actor tests not available |
| Own profile correction | `useProfile()` reads wildcard and updates self profile | `update_own_referee_profile()` with exact field allowlist and explicit return | APPROVED in principle | Identity/profile owner | Define profile-photo object ownership; reconcile live columns |
| Admin common profile correction | `useUpdateReferee()` direct UPDATE | Scoped capability RPC with field allowlist/audit | DEFERRED; direct write DENIED | Referee operations owner | Decide editable common fields and reason/audit requirements |
| Region transfer | `useUpdateReferee()` edit form includes `kabupaten_kota_id`; `useUpdateUserKabupatenKota()` updates profiles directly | Separate `transfer_referee_region` capability | DEFERRED; generic region mutation DENIED | AFP Sulsel governance/operations owner | Define who initiates/approves, source/target scope, side effects and audit |
| License update | Referee edit UI currently includes `license_level`; update hook also accepts license expiry | Separate license lifecycle capability | DEFERRED; generic write DENIED | Referee licensing owner | Define authority, transition/evidence validation and audit |
| Active status | `useToggleRefereeStatus()` directly updates `is_active` | Separate status-transition capability | DEFERRED; direct write DENIED | Referee operations owner | Define allowed transitions, target scope, reason, card/assignment effects, audit |
| Registration approval/rejection | `useRegistrations.ts` calls eligibility/approve/reject RPCs and performs client checks; passes `_admin_id` to eligibility RPC | Server derives actor from `auth.uid()`, validates target/scope/current state, audits transition | DEFERRED pending live function verification | Registration process owner | Inspect live function bodies/grants; client ID/check cannot authorize |
| Documents VIEW/DOWNLOAD | `RefereeDetail.tsx` consumes KTP/license paths; `useSignedUrl.ts` signs client-supplied paths | Separate target/document-kind/object-owner/scope checks before URL issue | DEFERRED; browser path signing DENIED until verified | Document/privacy and Storage security owners | Verify bucket policies/path ownership and define separate VIEW vs DOWNLOAD rules |
| Own WhatsApp | `useRefereeContact.ts` explicit own-ID SELECT/upsert | Owner-self contact contract | APPROVED subject to current RLS contract | Data/privacy owner | Preserve self-only semantics; verify runtime separately |
| Other referee WhatsApp | No approved admin-contact flow found | Separate explicit sharing capability, if business-approved | DENIED by default | Data/privacy/business owner | No admin or assignment-derived access until a separate decision |
| Cards | `useRefereeCard.ts` mixes self RPCs, admin table mutations, and direct profile lookups | Separate self and admin ISSUE/RENEW/REVOKE/VERIFY contracts, audit, scope | DEFERRED | Referee card operations owner | Inventory every live card RPC/table policy; protect verification code and transitions |
| Role administration | `useUpdateUserRole()` direct insert/update; user-admin Edge Functions | Dedicated privileged role/account boundary, allowed transitions, anti-escalation and audit | DEFERRED; generic browser role mutation DENIED | Identity/security owner | Inspect Edge Function bodies and effective role policy/grants |
| Event assignments | `useEventAssignments`, `useSmartAssignment`; supplied baseline reports state-machine functions | Event/region/assignment-specific contract; no private-contact implication | DEFERRED | Competition/event operations owner | Verify transition function/policy scopes; reconcile list consumer before retiring legacy RPC |
| Evaluations | `useEvaluations.ts` joins profiles for names/photos and uses evaluation tables | Evaluator assignment, event, referee submission and admin override rules | DEFERRED | Evaluation/technical committee owner | Define scope and migrate profile joins if raw profile access is narrowed |
| Audit/reports | `useAuditLogs`, analytics and annual-report profile/assignment joins | Separate role/region, pagination and sensitive-field redaction | DENIED pending contract | Audit/compliance owner | Inventory response fields, scope and redaction |
| Public referee list | Public review hooks call `get_public_referees()` / `get_public_referee()` | Fixed public-safe projection only | APPROVED as separate public capability, subject to live function verification | Public directory/product owner | Keep separate from private detail; no email/contact/document fields |
| Legacy `get_referees()` | `useReferees`, counts/stats fallback, `useEventAssignments`, `useSmartAssignment` | Scoped list/count/candidate capabilities | UNSAFE legacy; retire only after consumers move | Referee directory + security/data owners | Map exact filtering/pagination/fields; never restore current unscoped function |

## 3. Cross-Capability Decisions

### 3.1 `admin_provinsi`

All referee list/detail/write/document/contact capabilities remain **DENY** until one authoritative active `PROVINSI` binding per actor and a reliable target province are proven. Do not derive province from a null profile city or client parameter. The current supplied fixture note says the three existing province-admin fixtures have no active binding; no fixture repair is authorized here.

### 3.2 `admin_kab_kota`

For any approved scoped capability, server-side actor city must equal server-side target city. A foreign city, null scope, or caller-supplied city mismatch is DENY. No generic `is_admin()` decision is sufficient.

### 3.3 `wasit`

Own profile/contact only through separate owner-bound contracts. Another referee's profile/contact/document is DENY. Assignment is not authorization for private data.

### 3.4 Ordinary authenticated and anon

Ordinary authenticated users receive no referee directory/detail or other-referee private capability. Anon receives no private profile/contact/document and no privileged RPC; public-safe RPCs are a separate fixed projection.

## 4. Required Source Cutover Map

Before direct table grants/policies are restricted, every consumer must map to one of: capability RPC, explicit self-profile path, public-safe RPC, independently scoped domain boundary, or removed feature.

Known consumers from static source:

- `useReferees.ts`: list, count, stats, expiry fallback; direct wildcard detail; direct profile edit/status writes.
- `useProfile.ts` and `user-profile-repository.ts`: self profile; wildcard must be narrowed.
- `useUsers.ts` and `BulkUserImportDialog.tsx`: user/profile/role/region operations; direct role and region mutations require separate contracts.
- `useRegistrations.ts`: eligibility, approve/reject and queue/history RPCs; server bodies need actor/scope review.
- `useRefereeContact.ts`: self contact only; preserve.
- `useSignedUrl.ts` / `RefereeDetail.tsx`: client-supplied document paths; separate storage authorization required.
- `useRefereeCard.ts`: self RPCs mixed with direct admin lifecycle mutations/profile reads.
- `useEventAssignments.ts` / `useSmartAssignment.ts`: list and assignment candidate dependencies on `get_referees()`.
- analytics/reports, discussions, evaluations, organization, incomplete-profile, and audit flows: explicit query fields and actors must be reconciled independently.

Static inventory does not prove deployed consumer or database dependencies complete.

## 5. Helper, Trigger, and Workflow Dependencies

- `is_admin()` remains available for unrelated domains until its **complete live** dependency inventory is reconciled. It must not be used for referee regional authorization.
- The supplied TEST baseline reports `approve_registration`, `can_approve_registration`, and `reject_registration` as SECURITY DEFINER; exact live definitions/grants and `_admin_id` behavior remain **NOT VERIFIED** by B.3.1-R evidence. Require `auth.uid()` inside each server boundary.
- The supplied TEST observation names `log_registration_approval`, `sync_card_expiry`, and `set_updated_at_profiles` triggers. Their live definitions, transition side effects, and exact attached columns were not independently inspected in this phase. Treat as owner-supplied evidence and verify before drafting.
- License expiry must not be changed as an isolated field until the card-expiry trigger contract is reviewed.
- Approval changes must use the dedicated registration state machine; generic profile updates cannot modify approval/status fields.

## 6. Explicit Decision Owners and Remaining Gates

| Deferred capability | Decision owner role | Required closure | Current gate |
|---|---|---|---|
| Province binding | AFP Sulsel governance/business owner; security/data owner validates | Authoritative source, one active binding, enum value, null/duplicate/inactive behavior, target mapping | DENY until verified |
| Admin common profile correction | Referee operations owner | Exact fields by role, same-city/province rules, reason/audit | Direct write DENY |
| Region transfer | Governance/competition operations owner | Initiator/approver, source/target validation, assignment/card/organization effects, audit | DENY |
| License lifecycle | Referee licensing owner | Who sets level/expiry, evidence and transition rules, audit | DENY |
| Status lifecycle | Referee operations owner | State machine, role/scope, reason, side effects and audit | DENY |
| Registration | Registration process owner | Actor/region/state/role/reason/audit rules; server identity derivation | Preserve only after live function review |
| Documents | Document/privacy owner and Storage security owner | Separate VIEW/DOWNLOAD roles, object ownership/path, scope, TTL, audit | DENY |
| Admin contact sharing | Data/privacy and business owner | Explicit actor scope and purpose for email/WhatsApp | DENY |
| Cards | Card operations owner | Operation-specific scope, transitions, bulk authority, secret projection, audit | DEFER |
| Role/account admin | Identity/security owner | Actor/target scope, role transitions, anti-escalation, Edge Function review | Generic browser write DENY |
| Assignments | Competition/event operations owner | Event/region transitions and visible fields; no implied private contact | DEFER |
| Evaluation | Evaluation owner | Evaluator/event/referee relation and override scope | DEFER |
| Audit/report | Audit/compliance owner | Actor scope, event/field allowlist, redaction, pagination, retention | DENY pending closure |

## 7. Migration / Rollback Constraints

No migration is authorized or drafted here. Any later package must:

- keep province-admin operations denied until mapping is verified;
- never grant the current unscoped `get_referees()` to anon or authenticated as rollback;
- not restore public raw profile SELECT, broad `is_admin` profile SELECT/UPDATE, or cross-region paths;
- preserve self-contact only and avoid assignment-derived contact access;
- keep `is_admin()` for unrelated consumers until each live dependency is migrated/tested;
- replace consumers before restricting their direct table/API dependency;
- if a replacement fails, disable the feature or retain a verified secure predecessor rather than restore an insecure path.

## 8. Final Gate

**Status: `PHASE B.3.4.5.2 BLOCKED — CAPABILITY RECONCILIATION INCOMPLETE`**

The register defines safe defaults, but owner/business decisions for several capabilities and the authoritative province binding are still open. No migration/source changes, fixture actions, database access, or actor tests were performed. The appropriate next phase is `PHASE B.3.4.5.3 — Capability Contract Closure & Consumer Cutover Specification`, beginning with named owner decisions and an exhaustive consumer/capability map.
