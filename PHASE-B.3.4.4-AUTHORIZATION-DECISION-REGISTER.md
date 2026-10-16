# PHASE B.3.4.4 — Authorization Contract Closure & Fail-Closed Decision Register

**Decision: `PHASE B.3.4.4 PASS — AUTHORIZATION CONTRACT CLOSED`**  
**Scope:** static/source/artifact decision register only.  
**Environment context:** TEST `shorsqyycpptxcutrqrb`; production `xfscfjwapwnkiinkgbjg` excluded.  
**Implementation:** NOT AUTHORIZED by this phase. No database/source operation was performed.

“Contract closed” means every capability now has an explicit `APPROVED`, `DENIED`, or `DEFERRED` disposition with its owner role, required decision, blocking dependency, and next phase. It does **not** mean all deferred capabilities are approved, live authorization passed, or a migration may be applied. Deferred capabilities remain unavailable until their decisions and evidence gates close.

## 1. Evidence Boundary

Inputs used:

- `PHASE-B.3.4.3-AUTHORIZATION-CAPABILITY-CONTRACTS.md`;
- `PHASE-B.3.4.2-STATIC-DESIGN-REVIEW.md`;
- `PHASE-B.3.1-R-LIVE-SCHEMA-AUTHORIZATION-VERIFICATION.md`;
- static frontend and tracked migration-source inspection from prior phases.

The B.3.1-R report contains project-scoped live TEST catalog evidence. It is not actor-level evidence. B.3.4.4 executed no SQL and did not independently revalidate that catalog snapshot. Actor HTTP/RPC behavior remains `NOT VERIFIED`. Tracked migration dependencies are source history, not a complete live dependency graph.

## 2. Binding Security Principles

1. Backend/database boundary authorizes every operation; UI guards are UX only.
2. `auth.uid()` determines actor identity; never trust a client actor ID, role, scope, or region as authority.
3. City scope compares server-derived actor and target `kabupaten_kota_id`.
4. Province scope is fail-closed until the authoritative actor-to-province binding is approved and verified.
5. Unknown fields, transitions, owners, scopes, or mappings default to deny.
6. Explicit projections only; no `SELECT *` for profile, contact, document, role, or card security contracts.
7. Read, update, status, license, region transfer, registration, document, contact, card, role, assignment, evaluation, and audit are separate capabilities.
8. `is_admin()` is not a referee authorization primitive and is not retired globally by this workstream.
9. Assignment existence does not grant private contact/document access.
10. Rollback must preserve deny-by-default; unsafe legacy access is never restored for symmetry.

## 3. Canonical Actor Decision Matrix

| Actor | Own profile | Scoped referee profile/list | Foreign-region referee | Profile write | Own contact | Other contact | Private document |
|---|---|---|---|---|---|---|---|
| `admin_provinsi` | ALLOW only through explicit self contract if also the target | DEFERRED until verified actor+target province binding; then scoped only | DENY | DEFERRED by capability; no generic lifecycle write | DENY unless also owner/wasit under self rule | DENY by default | DEFERRED; no access until document capability closes |
| `admin_kab_kota` | ALLOW through explicit self contract if also target | ALLOW only for target in server-derived own city | DENY | Common profile correction can be eligible in same city after field/audit contract; lifecycle fields denied pending separate capability | DENY unless also owner/wasit under self rule | DENY by default | DEFERRED; no access until city document contract closes |
| `wasit` | ALLOW via explicit own-referee projection | DENY directory access | DENY | ALLOW only own allowlisted fields; no privilege/scope/lifecycle fields | ALLOW own row under owner/wasit contract | DENY | DEFERRED; own document access still requires verified Storage rule |
| `panitia` | Own account only via self-profile contract | DENY referee directory/detail | DENY | DENY referee/profile lifecycle writes | DENY unless also contact owner | DENY | DENY pending separate business rule |
| `evaluator` | Own account only via self-profile contract | DENY referee directory/detail; evaluation flow is separate | DENY | DENY referee/profile lifecycle writes | DENY unless also contact owner | DENY | DENY pending separate business rule |
| Ordinary authenticated | Own account only via self-profile contract | DENY | DENY | DENY privileged fields | DENY unless own wasit contact | DENY | DENY |
| `anon` | No private profile | DENY private directory/detail; approved public-safe RPC only | DENY | DENY | DENY | DENY | DENY |

Role combinations do not broaden one capability implicitly. If a user has multiple roles, each operation must satisfy the specific capability predicate; role precedence is not itself scope.

## 4. Decision Register

### 4.1 Referee profile/detail read

**Decision: APPROVED with explicit self and scoped-admin rules.**

- Own referee: allow through explicit self-bound projection.
- `admin_kab_kota`: allow only when trusted actor city equals trusted target city.
- `admin_provinsi`: deny until authoritative mapping is closed; after closure, allow only exact verified province match.
- Other referee, ordinary authenticated, anon: deny private detail.
- Contact and documents are not implied by profile read.

**Owner:** Security/data owner for implementation; referee product owner for field necessity.  
**Blocker:** live scope evidence, approved field list, actor sessions.  
**Next:** B.3.4.5 only after live-schema reconciliation; actor test phase before enabling.

### 4.2 Referee list

**Decision: APPROVED — `get_referees()` is not a final browser boundary.**

- City-admin list: scoped list contract may return only actor-city referees.
- Province-admin list: deny until actor province binding exists.
- Wasit/ordinary authenticated: no directory.
- Anon: no private directory; public listing may use the separate explicit public-safe projection only.
- No browser path may use arbitrary city/province filter as authority.

**Owner:** Security/data owner and directory product owner.  
**Blocker:** complete consumer replacement and province mapping.  
**Next:** list/count/suggestion capability design and migration plan.

### 4.3 Own profile update

**Decision: APPROVED — self-only, named allowlist.**

Allowed: `full_name`, `birth_date`, `occupation`, `afk_origin`, and profile-photo reference only after object ownership/path validation. The endpoint rejects unknown or forbidden fields. `email` is excluded from generic profile update; email changes use the separately authorized auth-email workflow.

Forbidden: IDs, `kabupaten_kota_id`, role, email, license fields, active/completion/registration/approval/rejection/deletion fields, KTP/license document paths, or arbitrary URLs.

**Owner:** Identity/profile product owner and security/data owner.  
**Blocker:** live field and Storage path verification.  
**Next:** own-profile RPC contract and static schema reconciliation.

### 4.4 Admin common profile correction

**Decision: DEFERRED, fail-closed until separate capability is specified.**

Potential common fields: name, birth date, occupation, AFK origin. City admin must be same-city; province admin remains disabled until mapping. No generic admin RPC may mutate lifecycle, scope, role, license, or documents.

**Decision owner:** Referee operations/business owner, with security/data owner approval.  
**Required decision:** exact editable fields by actor class, reason/audit requirements, and whether this capability remains needed.  
**Blocker:** region mapping, existing UI workflow, audit semantics.  
**Next:** B.3.4.5 capability function contract; until then admin profile write DENY.

### 4.5 Region transfer

**Decision: DEFERRED; direct/generic region updates DENIED.**

No actor may transfer a referee by generic `UPDATE profiles`. A dedicated transfer operation is required only if a business owner approves it. City admins are DENY by default. Province admin remains DENY until province mapping is resolved.

**Decision owner:** AFP Sulsel referee operations owner; security/data owner reviews.  
**Required decision:** initiating/approving roles, source/target region constraints, transfer state machine, assignment/card/organization consequences, audit and rollback.  
**Blocker:** no approved transfer business rule.  
**Next:** separate region-transfer contract phase; no implementation before approval.

### 4.6 License update

**Decision: DEFERRED; generic update DENIED.**

`license_level`, `license_expiry`, and license-document replacement require a separate license capability with actor scope, accepted transitions, evidence/document validation, and audit.

**Decision owner:** Referee licensing/business owner; security/data owner reviews.  
**Required decision:** who may set level/expiry, renewal/expiry transitions, and evidence review.  
**Blocker:** no license lifecycle contract approved.  
**Next:** license capability contract; no direct update meanwhile.

### 4.7 Active status

**Decision: DEFERRED; direct `is_active` update DENIED.**

A dedicated status transition must define roles, target scope, allowed transitions, reason, side effects on assignments/cards, and audit.

**Decision owner:** Referee operations owner; security/data owner reviews.  
**Required decision:** activation/deactivation authority and state machine.  
**Blocker:** current UI exposes toggle but no closed transition contract.  
**Next:** status lifecycle contract; no direct update meanwhile.

### 4.8 Registration approval/rejection

**Decision: DEFERRED to dedicated registration capability; generic profile writes DENIED.**

Frontend calls `can_approve_registration`, `approve_registration`, and `reject_registration`; it passes an `_admin_id` value to eligibility checking and also performs client-side checks. Those checks are not authorization. The server operation must derive actor from `auth.uid()`, validate target/current state/role/region, enforce province fail-closed, and audit status/reason/approver.

**Decision owner:** Registration/business process owner; security/data owner reviews.  
**Required decision:** actor/region rules, valid transitions, role assignment authority, rejection reason, audit contract.  
**Blocker:** live function bodies/grants and province mapping not verified; no approval owner decision recorded.  
**Next:** registration boundary verification and contract closure; preserve dedicated RPC interface only after server audit.

### 4.9 License/KTP documents

**Decision: DEFERRED; browser access DENIED until document contract closes.**

VIEW and DOWNLOAD are separate operations. Profile read does not authorize either. Signed URL creation must validate actor, target, document kind, storage object ownership/path and scope server-side. Generic referee detail returns no document paths.

**Decision owner:** Document/privacy owner and referee operations owner; security/storage owner reviews.  
**Required decision:** roles permitted to view/download each document, self access, city/province scope, retention, signed URL TTL, audit.  
**Blocker:** existing UI uses client Storage `createSignedUrl` against profile-provided paths; Storage policy/path contract not verified.  
**Next:** document capability contract and read-only Storage policy inventory.

### 4.10 WhatsApp/contact

**Decision: APPROVED — owner self-contact only; all other contact sharing DENIED by default.**

Wasit owner may access their own row under the current self-service contract. Admin province, admin city, panitia, evaluator, ordinary authenticated, anon, and other wasit are denied another referee's WhatsApp absent a separately approved contact-sharing rule. Assignment alone grants no contact access.

**Owner:** Data/privacy owner for any future sharing request.  
**Blocker:** no admin/contact-sharing business approval.  
**Next:** remain self-only; new sharing proposal requires separate decision.

### 4.11 Referee cards

**Decision: DEFERRED by operation; no card privilege inferred from referee/profile access.**

- Self issue/regenerate may be allowed only through an audited self-bound RPC with verified eligibility.
- Admin issue, renew, revoke, suspend, regenerate, and bulk issue require explicit actor/scope/state/audit contract.
- Public verification may return only minimal verification result; never verification codes or unnecessary counters/internal fields.

**Decision owner:** Referee card product/operations owner; security/data owner reviews.  
**Required decision:** operation-specific actor scope, transitions, bulk limits, audit, public projection.  
**Blocker:** source mixes self RPCs and direct admin table mutations; live function/policy details not reconciled.  
**Next:** card capability contract and migration consumer map.

### 4.12 User role and account administration

**Decision: DENIED through generic browser table access; dedicated privileged capability DEFERRED.**

Ordinary browser clients cannot grant/change/revoke roles or modify their own role. Existing source contains direct `user_roles` update/insert, plus Edge Function calls for user create/delete/password/email. Those functions require separate body/auth/config review. Role changes need anti-escalation, actor scope, allowed transitions, and audit.

**Decision owner:** Identity/security owner.  
**Required decision:** which administrator may perform each operation and on what target scope.  
**Blocker:** complete live Edge Function and role-policy audit.  
**Next:** identity administration capability review.

### 4.13 Event assignments

**Decision: DEFERRED to the existing assignment/state-machine contract; no profile/contact inference.**

City admin requires event city equal trusted actor city. Province admin is disabled until mapping. Wasit may act on own assignment transitions only. Assignment membership does not authorize another referee's contact/document.

**Decision owner:** Competition/event operations owner; security/data owner reviews.  
**Required decision:** role/scope for list/create/cancel/transition and fields visible in roster.  
**Blocker:** full live function/policy dependency verification and province mapping.  
**Next:** assignment capability cross-check with B.3.1-R findings.

### 4.14 Evaluation

**Decision: DEFERRED; browser access DENIED except a separately verified evaluation workflow.**

Evaluator assignment, event relation, referee submission, scoring, and admin override must each have explicit scope. `is_admin()` or arbitrary referee ID is not sufficient.

**Decision owner:** Evaluation/technical committee owner; security/data owner reviews.  
**Required decision:** evaluator-target assignment rule, region restriction, referee visibility, override role, score transitions.  
**Blocker:** no complete capability contract in this phase.  
**Next:** evaluation authorization contract.

### 4.15 Audit and reports

**Decision: DENIED by default until data minimization, role, region, filters, redaction and pagination are approved.**

Audit records may contain old/new profile values and metadata. Audit access is not inherited from profile read or admin role.

**Decision owner:** Audit/compliance owner; security/data owner reviews.  
**Required decision:** actor classes, event types, redacted fields, region scope, retention, pagination.  
**Blocker:** existing audit/report RPCs and views require full inventory.  
**Next:** audit/report capability contract.

## 5. `is_admin()` Decision

**Decision: retain for unrelated domains; do not use as referee authorization; no global revoke/drop in this workstream.**

The user-provided B.3.4.4 baseline reports 27 policy dependencies across 15 tables. Tracked migration source also shows many `is_admin()` references, including events, approvals, assignments, honors, audit, evaluation, learning, discussions, cards, and official documents. The latter is migration-source evidence, not a complete live dependency inventory.

**Owner:** Platform/security owner.  
**Required decision:** domain-by-domain replacement or explicit retained usage.  
**Blocker:** complete effective live policy/function dependency inventory.  
**Next:** separate `is_admin()` dependency migration stream: inventory → replacement → consumer migration → runtime tests → ACL change → removal only if unused.

## 6. `get_referees()` Decision

**Decision: DENIED as final browser boundary; retire only after consumers move. Never restore current live function execution.**

Known source consumers: `useReferees()` list/count/expiry fallback/stats, `useEventAssignments.ts`, and `useSmartAssignment.ts`. Prior live TEST evidence reports the current function is SECURITY DEFINER, anon/authenticated callable, has no actor/region authorization, returns birth date, and has unbounded NULL limit.

Required replacements: scoped admin list, count/stats, and assignment candidate contracts. Province list remains DENY until scope mapping exists. The rollback contract must not grant authenticated execution to the current unscoped function.

**Owner:** Referee directory/product owner and security/data owner.  
**Blocker:** consumer-by-consumer output/filter/pagination compatibility and province scope.  
**Next:** legacy RPC dependency map and scoped list contract.

## 7. `get_admin_referees()` Decision

- `admin_kab_kota`: own city only; use only after actor tests confirm the live function behavior.
- `admin_provinsi`: DENY until an authoritative province binding exists and the function compares actor-derived province to target-derived province.
- NULL region must not mean all provinces for province admin.
- Caller-supplied region is a filter only after actor scope has been independently resolved; it never establishes authority.

**Owner:** Referee directory/security owners.  
**Blocker:** authoritative province binding and server-side province enforcement.  
**Next:** province-scope resolver decision followed by RPC contract update.

## 8. Direct Profile and Browser Access Decisions

- Raw `profiles` wildcard reads: DENIED; replace with capability-specific projections.
- Direct `profiles` UPDATE for referee/admin/lifecycle fields: DENIED as the application boundary; replace with capability RPCs.
- Own profile direct read: allowed only if the final explicit self projection and row policy are verified; `useProfile()` wildcard is not approved.
- Public referee listing: only explicit public-safe RPC projection; raw public profile SELECT is not approved.
- Direct `referee_contacts`: owner-self only.
- Direct document Storage URL creation from arbitrary profile path: DENIED until storage ownership/scope contract is verified.

Static source consumers include auth/self-profile, users/import, analytics/annual reporting, discussion/evaluation identity joins, organization, incomplete-registration views, referee detail/edit/status, assignment joins, and referee-card workflows. Each requires a scoped replacement or explicit self/public contract before privileges change.

## 9. Required Direct Access and RPC Dependency Inventory

| Surface | Contract decision | Evidence/next dependency |
|---|---|---|
| `profiles` SELECT | Self-only explicit projection; public/admin directory uses RPC | Replace all consumers; remove broad/public paths only after compatibility/actor tests |
| `profiles` UPDATE/INSERT/DELETE | No generic browser writes to privileged/profile lifecycle fields | Enumerate all live grants/policies; dedicated capability operations only |
| `referee_contacts` | Owner-self only | Preserve live self RLS; no admin access by default |
| `user_roles` | No ordinary browser role mutations | Dedicated role administration boundary; audit direct `useUpdateUserRole` |
| `get_referees()` | No browser execution as final state; never restore current unscoped RPC | Migrate all known callers; verify all live overloads/dependencies |
| `get_admin_referees()` | City admin same-city; province admin deny until fixed | Verify function and actor tests; implement province mapping first |
| Public referee RPCs | Allow only exact public-safe fields | Keep separate from private/email/contact paths |
| approval RPCs | Dedicated registration state machine | Inspect live body/grants; actor derived with `auth.uid()`, not client `_admin_id` |
| document Storage | Separate VIEW/DOWNLOAD | Verify bucket/object policies, path ownership, and signed URL contract |
| card RPC/table operations | Per-operation scope | Replace raw admin mutations and check secret code projection |

## 10. Province Authority Decision

**Status: unresolved; province-admin access to referee records is DENY.**

Required relationship: `actor_user_id -> exactly one authoritative provinsi_id`. Target province must resolve from verified target-region relation. The B.3.1-R report states the target path is nullable and `pengurus` lacks constraints proving role-linked uniqueness/authority; `_resolve_admin_scope()` returns no province ID.

**Owner:** AFP Sulsel governance/business owner names the authoritative scope source; database/security owner verifies constraints/cardinality and implements only after approval.  
**Required decisions:** authoritative table/source; uniqueness; null/multiple rows; inactive/deleted rows; province transfer; target null scope.  
**Blocker:** no authoritative binding decision.  
**Next:** read-only province-binding evidence phase and owner-approved mapping contract. Until then deny list/detail/write/document/contact for province admins.

## 11. Static Source Reconciliation Checklist

Source evidence recorded for the next implementation phase:

- `profiles.select("*")`: `useReferees.ts` detail; `useProfile.ts` self profile.
- Direct profile updates: `useReferees.ts` generic edit/status; `useUsers.ts` region assignment; `useProfile.ts` self update.
- Direct role mutation: `useUsers.ts` update/insert `user_roles`.
- Contact: `useRefereeContact.ts` explicit owner-filtered select/upsert.
- Registration: `useRegistrations.ts` calls eligibility/approve/reject RPCs; frontend passes admin ID and performs client checks.
- Documents: `RefereeDetail.tsx` consumes profile document paths; `useSignedUrl.ts` creates Storage signed URLs using client-supplied path.
- Cards: `useRefereeCard.ts` mixes self RPCs with direct admin card mutations and profile lookups.
- Assignments: `useEventAssignments.ts`, `useSmartAssignment.ts`, and related pages consume `get_referees()` and profile joins.
- Official documents: `useOfficialDocument.ts` passes optional `issuedBy`; migration-source function uses `is_admin(v_actor)` with `COALESCE(auth.uid(), p_issued_by)`. Actual deployed body is not re-verified here.
- Evaluation, report, audit, organization and discussion flows have separate profile/evaluation/audit joins requiring independent purpose/scope mapping.

This is source inventory, not a complete live dependency inventory. No source secret values were accessed.

## 12. Migration Gate and Rollback Contract

No migration is authorized in B.3.4.4. A later package must:

1. assert live TEST object/signature/policy/grant preconditions;
2. create the verified replacement capability functions before client cutover;
3. keep province-admin paths denied until the resolver is authoritative;
4. migrate/disable each consumer before restricting its dependency;
5. never regrant the current unscoped `get_referees()` for anon or authenticated rollback;
6. never restore public raw profile SELECT, broad admin profile SELECT/UPDATE, or unsafe role/contact/document paths;
7. restore only a captured secure prior state; if no secure compatible state exists, roll back/disable the feature and preserve denial;
8. retire `is_admin()` only in a separate complete dependency stream and only after every live consumer is replaced/tested.

A failed replacement may reduce availability. It must not restore known exposure to preserve availability.

## 13. Authorization Test Contract (Future; NOT RUN)

- Own wasit profile/contact allow; other referee profile/contact deny.
- City admin same-city allow; foreign-city profile/list/write/contact/document deny; supplied foreign region cannot widen access.
- Province admin remains denied while actor mapping unresolved; after verified binding, same-province allow and other-province deny.
- Ordinary authenticated referee directory/detail/contact deny.
- Anon private detail/contact and private RPC deny; only public-safe RPC projection allowed.
- Direct profile update/status/region/license/approval writes deny outside their dedicated capability.
- Approval actor spoof via client-supplied `_admin_id` cannot authorize.
- Document VIEW and DOWNLOAD each enforce their own rule.
- Card operations enforce operation-specific self/admin scope and never expose verification secrets.
- Assignment-only and shared-event access do not disclose private contact.

These are future actor tests, not PASS results.

## 14. Final Gate

**Contract decisions are closed as explicit allow/deny/defer records.** Deferred capabilities remain unavailable until named owner decisions and required evidence are supplied.

`PHASE B.3.4.4 PASS — AUTHORIZATION CONTRACT CLOSED`

This gate authorizes only transition to the next design/migration-package phase under its own authorization. It does not authorize database changes, migration execution, source changes, province-admin access, or claim actor-level PASS. Production remains excluded.
