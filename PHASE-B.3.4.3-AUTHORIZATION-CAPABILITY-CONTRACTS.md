# PHASE B.3.4.3 — Authorization Capability Contracts & Consumer Reconciliation

**Status: `PHASE B.3.4.3 BLOCKED — CAPABILITY CONTRACTS NOT COMPLETE`**  
**Mode: static/source/artifact only.** No database execution or source modification was performed.  
**Target context:** TEST `shorsqyycpptxcutrqrb`; production `xfscfjwapwnkiinkgbjg` was not accessed.

This contract reconciles source consumers and the prior B.3.1-R catalog report. It is not executable SQL, actor-level evidence, or approval to apply a migration. Live province binding and actor behavior remain unresolved.

## 1. Evidence and Security Baseline

### Prior live TEST catalog evidence (from B.3.1-R)

- `profiles` has RLS enabled, anon/authenticated SELECT and broad DML table privileges; the public non-deleted SELECT policy and broad `Admins can view all profiles` policy are present.
- Live `is_admin(uuid)` includes `admin_provinsi` and `admin_kab_kota`; broad profile SELECT and UPDATE policies use it.
- Live `get_referees()` is SECURITY DEFINER, executable by anon/authenticated, has no actor/region authorization, includes `birth_date`, and has a NULL/unbounded default limit.
- Live `get_admin_referees()` enforces the city-admin region parameter against the actor's profile city. Its province-admin path accepts the supplied region or NULL/all and does not resolve actor province.
- `referee_contacts` SELECT is self-referee/wasit scoped; anon has no table privileges; authenticated has SELECT/INSERT/UPDATE table privileges subject to RLS.
- `pengurus` has province/city columns and FKs but no verified authoritative role binding/cardinality; `_resolve_admin_scope()` returns only city scope.

These are prior project-scoped catalog findings. This phase did not re-query them. Actor HTTP/RPC behavior remains **NOT VERIFIED**.

## 2. Capability Principles

- A capability is authorized in its backend boundary; route visibility, `useAuth()` checks, client IDs, and hidden inputs are UX only.
- Every target is resolved by the server from `auth.uid()` and trusted database relations.
- Client-supplied actor IDs, region IDs, role labels, storage paths, or approval flags are not authority.
- `is_admin()` is not a referee or region authorization primitive.
- Unknown scope, missing mapping, null region, duplicate binding, inactive binding, or scope mismatch fails closed.
- Profile, contact, document, card, registration, role, assignment, evaluation, and audit capabilities are separate. Permission in one does not imply another.
- `event_assignments` does not authorize private contact access without an explicit business rule.

## 3. Actor Contract Matrix

| Actor | Profile/detail read | Profile write | Contact | Documents | List |
|---|---|---|---|---|---|
| `admin_provinsi` | Only referee whose province equals a verified authoritative actor province; otherwise DENY | Capability-specific and province-scoped; otherwise DENY | DENY until a separate contact-sharing decision explicitly allows it | DENY until separate document scope is verified | Province-scoped only after mapping; otherwise DENY |
| `admin_kab_kota` | Target city must equal actor city resolved server-side | Specific allowed fields, same-city only; region transfer excluded | DENY until a separate contact-sharing decision explicitly allows it | DENY until separate document scope is verified | Same-city only; foreign/NULL/manipulated city DENY |
| `wasit` | Own profile only | Own allowlisted fields only | Own contact only | Own document access only if separately verified storage policy allows it | No directory |
| Ordinary authenticated | Own profile only through self-profile capability | No referee/admin writes | No other referee contact | No other referee documents | No directory |
| `anon` | No private profile | DENY | DENY | DENY | Public-safe directory only through an explicit approved public RPC, if retained |

Assignment-only access to another referee profile/contact/document is DENY absent a separately approved capability.

## 4. Explicit Read/Write Field Contract

This is the proposed authorization baseline. Field existence in source is not permission. Every field and transition still requires live-schema reconciliation.

| Capability | Proposed fields/operation | Allowed actor/scope | Exclusions / gate |
|---|---|---|---|
| Referee detail read | `id`, `full_name`, `profile_photo_url`, `kabupaten_kota_id`, approved region label, `license_level`, `license_expiry`, `is_active`, `afk_origin` only if UI requires | Self wasit; city admin same city; province admin only verified same province | Explicit projection only. No email/contact by default, birth date, approval metadata, document paths, `SELECT *` |
| Own profile update | `full_name`, `birth_date`, `occupation`, `afk_origin`, profile-photo reference after storage ownership validation | `auth.uid() = target profile id` and actor is eligible wasit/own profile | Reject attempts to pass forbidden fields; no email, city, role, license, active/status, approval, deletion, document URLs |
| Admin common profile update | `full_name`, `birth_date`, `occupation`, `afk_origin`, profile-photo reference only if approved | City admin same city; province admin only verified province | No region transfer, license, status, approval, role, email, document path. Require audit record |
| Region transfer | Change `kabupaten_kota_id` | **UNRESOLVED; deny by default** until business approver, source/target scope, target province, transition and audit rules approved | Never part of generic admin/self update. City admins cannot move a referee into/out of foreign city |
| License change | `license_level`, `license_expiry` | **UNRESOLVED; deny by default** pending named authority, license validation, transitions and audit rule | Separate function; not generic profile update |
| Active status | `is_active` | **UNRESOLVED; deny by default** pending lifecycle and actor/scope rules | Separate status transition function; audit old/new state |
| Registration decision | approve/reject role, reason, registration status, approver/time | Existing dedicated RPC path only if live functions derive actor from `auth.uid()` and enforce scope | Client `_admin_id` and `can_approve_registration` response cannot be sole authorization. Live bodies/grants not verified |
| Contact read/write | `referee_contacts.whatsapp_number` | Wasit own row under self policy; admin access currently DENY pending explicit business authorization | Separate from profile detail; no assignment-implied sharing; never select arbitrary contact ID |
| Document view/download | License/KTP object capability, not raw path | Self own document only if storage policy permits; admin scope pending separate province/city rule | Separate VIEW/DOWNLOAD boundaries; signed URL generation must authorize target server-side; never include URLs in generic detail |
| Card lifecycle | issue/renew/revoke/suspend/regenerate/verify | Self-only RPCs where defined; admin operations require separate region/role contract | No raw admin card UPDATE/INSERT without backend authorization and audit. Never return verification secret from public response |
| Role management | Read/add/change/remove role | **UNRESOLVED; separate role-administration policy** | No inferred permission from profile/admin list access; no client direct `user_roles` mutation |
| Assignment | list/create/change/cancel for event and region scope | Existing assignment-specific event authorization only after live function/policy review | Does not grant contact/document/detail access to another referee |
| Evaluation | own/evaluator/admin record operations | Preserve specific evaluator/referee workflow after policy dependency review | `is_admin()` dependency cannot be globally removed without replacement |
| Audit/report | scoped logs/aggregates | Dedicated report/audit role and row scope | Do not inherit referee detail permissions automatically |

## 5. Capability Contracts

### 5.1 Referee detail read

Candidate `get_referee_detail(p_referee_id uuid)` accepts only the target ID. It must derive actor identity with `auth.uid()`, verify target is a referee, establish scope before reading any return value, and return explicit minimized fields. Denial/nonexistent behavior should avoid target enumeration.

- Self: allow only the actor's own referee profile.
- City admin: allow if trusted actor city equals target city.
- Province admin: allow only if both trusted province IDs are authoritatively resolved and equal; otherwise deny.
- Ordinary authenticated/anon: deny private detail.
- Another referee: deny absent a separate approved rule.

`SECURITY INVOKER` is preferred if verified RLS/grants can enforce this. If `SECURITY DEFINER` is required, use a deliberately controlled `search_path` (prefer empty), schema-qualify all references, derive auth internally, bound inputs, return explicit columns, and restrict EXECUTE. Owner and RLS-bypass properties require live verification.

### 5.2 Self profile update

Candidate `update_own_referee_profile(...)` uses `auth.uid()` as the target and accepts only named allowlisted fields. The API rejects forbidden/unknown fields instead of silently ignoring them. It cannot change `kabupaten_kota_id`, roles, email, license, status/approval fields, deletion markers, or KTP/license document references.

Profile-photo changes require matching an approved storage-object ownership/path contract; a caller-provided arbitrary URL is not sufficient.

### 5.3 Admin common profile update

Candidate `admin_update_referee_profile(...)` derives the actor and target server-side. City admin scope is exact same city. Province admin is disabled until authoritative mapping is verified. Only common non-privileged fields from the matrix are eligible. Require audit logging and reject fields outside the function signature/allowlist.

### 5.4 Region transfer

Separate capability, currently **DENY / unresolved**. Before design approval specify:

- permitted actor role and whether province mapping is mandatory;
- source city/province and target city/province validation;
- whether the target must be active/non-deleted/approved;
- handling of assignments, cards, organization membership, and registration records;
- audit event and rollback semantics;
- whether city admin can initiate or approve a transfer.

No generic profile mutation may change `kabupaten_kota_id`.

### 5.5 License and active status

Use distinct capabilities only after business approval:

- `update_referee_license`: authorized actor, accepted license values/date transitions, evidence requirements, audit record, region scope.
- `set_referee_active_status`: allowed transition matrix, target scope, reason/audit, effect on assignment eligibility.

Neither capability is complete merely because a dedicated RPC name is proposed. Live enum/check constraints and workflow dependencies must be inventoried.

### 5.6 Registration

Frontend source calls `can_approve_registration`, `approve_registration`, `reject_registration`, `get_pending_registrations`, and `get_registration_history`. Caller-side helper passes `_admin_id` into eligibility RPC and also checks scope in the client. The database function must independently derive `auth.uid()`, ignore/reject actor spoofing, enforce target scope, and protect status/role/audit fields.

The live function bodies, overloads and grants are **NOT VERIFIED** in the available B.3.1-R report. Preserve current workflow only after this audit; no generic profile update may set registration status or approval metadata.

### 5.7 Document VIEW/DOWNLOAD

Current `RefereeDetail` reads `license_photo_url`/`ktp_photo_url`, then `useSignedUrl` and `createSignedDownloadUrl` call Storage `createSignedUrl` with a browser-supplied path. Route visibility and client `isAdminProvinsi()` checks do not authorize the request.

Required future contract: authenticate actor, bind the object to the target referee and document type server-side, apply self/admin scope, and issue short-lived URLs only after authorization. No generic detail RPC returns document paths. Storage bucket policies, path conventions, service privileges, and existing object dependencies require separate live review.

### 5.8 WhatsApp contact

Preserve live self-referee/wasit direct policy for the owner's contact, subject to eventual role tests. Admin contact sharing is **DENY by default** until an explicit business decision is approved. `event_assignments` membership does not provide contact access.

### 5.9 Cards

Source has self-scoped `issue_my_referee_card` and `regenerate_my_referee_card` RPC use, but admin flows include direct `referee_cards` update/insert, `generate_card_number`, bulk generation, status update, and search/count RPCs. Contract requirements:

- separate self issue/regenerate from admin issue/renew/revoke/suspend;
- derive actor server-side and authorize target/scope for each admin operation;
- protect `verification_code` from list/detail/public verify responses;
- audit lifecycle changes and verify allowed status transitions;
- do not let raw profile/detail permissions imply card privileges.

Live function/policy/grant behavior for each card operation remains **LIVE VERIFICATION REQUIRED**.

### 5.10 Roles

Source `useUpdateUserRole()` directly mutates `user_roles`; user management also uses Edge Functions for create/delete/reset-password/email/bulk create. Role mutation must be a separate privileged capability with actor-derived authorization, validated role transitions, scope, audit, and protection against last-admin/self-escalation. No `is_admin()` broad helper or UI gate alone is sufficient. Edge Function bodies and deployment configuration are out of scope and need separate verification.

### 5.11 Assignment, evaluation, audit/report

Preserve independent domains. Assignment RPCs/policies must authorize by event and region; they do not grant private referee contact. Evaluation rules must preserve evaluator/referee submission behavior. Audit/report reads need their own scoped query contracts. All live policies/functions depending on `is_admin()` must be enumerated before its privilege or implementation changes.

## 6. `get_admin_referees()` Province-Safe Replacement

The live `get_admin_referees()` city branch compares requested city to server-derived actor city. The live province branch does not resolve actor province and permits caller-selected city or NULL/all. Therefore:

- city admins may use it only after actor behavior tests confirm the live city branch;
- `admin_provinsi` use must fail closed/deny until authoritative mapping exists;
- do not pass `NULL` for a province admin as a shortcut;
- eventual replacement must derive actor province internally and compare target province from verified relations;
- include bounded pagination, explicit return fields, search/filter semantics, and no email/contact/document fields.

## 7. Legacy RPC and `is_admin()` Dependency Map

### `get_referees()`

Known static callers:

- `useReferees()` list;
- `useRefereesCount()` expiry-filter full-list fallback;
- `useRefereeStats()`;
- `useEventAssignments.ts` candidate list;
- `useSmartAssignment.ts` suggestions.

Retirement prerequisites: replacement list/count/stats/assignment contracts, consumer migration, static search, actor matrix. The current live unscoped function must never be re-enabled, even for authenticated. During rollback, keep the insecure RPC inaccessible and roll back consumers to a secure replacement or disable that feature.

### `is_admin()`

Tracked migrations show dependencies across policies/functions for events, approvals, assignment, honor, audit, discussion, evaluation, learning, cards, and official-document issuance, besides profiles/user roles. This is migration-source inventory, not proof of every current live use.

Retirement prerequisites:

1. capture **all live** policies and function bodies that reference `is_admin()` or related broad helpers;
2. assign replacement authorization per domain;
3. migrate/replace every live consumer and test it;
4. only then revoke public/anon/authenticated EXECUTE as justified;
5. drop only when no dependency remains.

A referee migration must not globally rewrite/drop/revoke `is_admin()` as a shortcut.

## 8. Consumer Reconciliation Map

| Consumer | Current source behavior | Required target capability |
|---|---|---|
| `useReferees` list/count/stats | `get_referees`; client expiry filter may request unbounded rows | Scoped list/count/stat RPCs; city scope server-derived; province disabled until mapping; bounded pagination; preserve search/license/status/expiry behavior |
| `useReferee` / `RefereeDetail` | `profiles.select("*")`, then client role lookup; edit/status writes direct; signed document path use | detail RPC; separate common edit, license, status, region transfer and document capabilities; remove post-fetch auth logic |
| `useProfile` / auth profile repository | self profile, one explicit auth-context projection but `useProfile` wildcard | explicit self-read/update contract; retain only owner scope |
| `useRefereeContact` / `RefereeProfile` | own contact explicit select/upsert | preserve own-only; no arbitrary target argument |
| `useEventAssignments` / `useSmartAssignment` | direct assignment access plus `get_referees` candidate selection | event/region-authorized assignment API and scoped referee candidate list; no contact permission inheritance |
| `useRegistrations` / `UserApprovals` | calls `can_approve_registration`, `approve_registration`, `reject_registration`; client passes admin ID and checks region | verify live functions; server derives actor and target scope; keep status mutation dedicated |
| `useRefereeCard` / card pages | self RPCs mixed with direct admin insert/update, generate, renew, status, bulk | separate self and admin lifecycle APIs, scopes, audit and transitions |
| `useOfficialDocument` | issue RPC receives optional client `issuedBy`; source migration body uses `is_admin(v_actor)` with `COALESCE(auth.uid(), p_issued_by)` | verify actual body; client-supplied issuedBy must not authorize; preserve separate official document capability |
| `useUpdateUserRole` / `useUpdateUserKabupatenKota` / user Edge Functions | direct role/profile mutation and privileged function invocations | separate role/region/user-admin contract, actor scope, audit, no self-escalation |
| Analytics, reports, discussions, evaluations, organization, incomplete profiles | direct profile joins/queries with varying columns | per-domain least-privilege RPC/view/own row contracts; preserve behavior before revoking SELECT |
| Audit logs | `get_audit_logs` RPC and other source consumers | separate audit scope; do not inherit referee-detail access |

This map is static and incomplete for deployed consumers. Final source inventory and all RPC/Edge Function bodies are prerequisites before changing table grants.

## 9. Read/Write Field Matrix

| Field/capability | Wasit self | City admin same city | Province admin verified province | Ordinary/anon |
|---|---|---|---|---|
| Identity/detail allowlisted fields | Read own; update only named self allowlist | Read; update only approved common fields | Same only after binding | Own identity via self contract only; anon deny |
| `email` | Own only if product requires | DENY by default pending approval | DENY by default pending approval | DENY |
| `whatsapp_number` | Own contact only | DENY pending separate business approval | DENY pending separate business approval | DENY |
| `kabupaten_kota_id` | No self update | Not generic update; region transfer separate and DENY pending contract | Region transfer only through approved capability; province mapping required | DENY |
| `license_level`, `license_expiry` | No self update | Dedicated license capability only after rule approval | Dedicated capability after verified scope | DENY |
| `is_active` | No self update | Dedicated status transition only after approval | Dedicated status transition after province scope | DENY |
| approval/role/deletion fields | DENY | Dedicated workflow only; scope/field-specific | Dedicated workflow only after province scope | DENY |
| KTP/license document metadata/object | Own only if separately authorized storage path | Separate document capability; city scope rule required | Separate capability; province binding required | DENY |

Unknown or unapproved fields default to DENY/excluded.

## 10. Province Binding Requirement

`LIVE PROVINCE SCOPE VERIFICATION REQUIRED`.

Before any province authorization implementation, establish:

- actor → exactly one authoritative province relation;
- target referee → province relation;
- authority/source of both mappings;
- cardinality and uniqueness;
- NULL/missing/duplicate behavior;
- inactive/deleted binding behavior;
- mismatch and transfer behavior.

Current B.3.1-R evidence does not establish actor binding. `pengurus` is only a candidate relation and is not assumed authoritative. Until complete: `admin_provinsi` detail/list/profile/document/contact/write branches all DENY or remain unavailable.

## 11. `is_admin()` Dependency Migration Map

| Domain | Tracked source dependency examples | Required contract before helper retirement |
|---|---|---|
| Profiles/user roles | broad profile SELECT/UPDATE, roles management | self/admin scoped read/write and role-management contracts |
| Events/approvals | event create/update/approval policies | province/city/event-specific scope and transition authorization |
| Assignments | manage/view policies | event/region-specific access; referee own assignment separate |
| Honors | view/update policies | referee self, verifier, scoped admin, transition/audit rules |
| Audit logs | audit read policy | audit-specific actor/region permissions |
| Discussions | manage/edit policies | author self/admin moderation scope |
| Evaluations | criteria/scores/evaluation policies | evaluator assignment and referee submission workflow |
| Learning | learning material policies | published/public versus moderator/admin scope |
| Referee cards | card management policies/functions | self versus scoped admin card lifecycle |
| Official documents | `issue_official_document` migration source uses `is_admin(v_actor)` | server-derived actor, source-entity scope, issue/revoke/audit contract |

The B.3.1-R function/policy inventory covered only selected objects, not every live object. Full live dependency inventory required. `pg_depend` is insufficient alone because SQL/PLpgSQL function-body references may not be catalog dependencies.

## 12. Rollback Contract

- Never restore `anon` or authenticated EXECUTE on the current unscoped `get_referees()`; keep it inaccessible during rollback.
- Never restore public non-deleted profile SELECT, broad `is_admin` profile SELECT/UPDATE, or cross-region access.
- If a replacement fails, keep sensitive capability denied and roll back/disable the dependent feature, or restore a previously verified secure replacement.
- Restore grants/policies only from an exact captured pre-state and only if independently shown to satisfy the target contract; a prior state is not automatically safe.
- Keep `is_admin()` for unrelated verified consumers until each domain is migrated; do not revoke globally as part of this work.
- Roll back document/card/license/status/approval features independently, preserving storage and audit safety.

## 13. Static Validation Checklist

Before executable SQL drafting:

- detail/read/write RPCs have exact parameter and field allowlists;
- no RPC accepts client actor/region as authority;
- every actor/target pair has an explicit deny/allow rule;
- `admin_provinsi` remains denied until mapping is verified;
- `admin_kab_kota` cannot transfer region or reach foreign targets;
- profile direct SELECT and UPDATE policies/grants have a safe replacement sequence;
- legacy `get_referees()` is not used or restored; every caller has a replacement;
- all `is_admin()`/helper live dependencies are enumerated before any ACL/lifecycle change;
- registration, document, card, role, assignment, evaluation, audit and report capabilities have separate reviewed scopes;
- public-safe RPC output excludes contact and private fields;
- definer functions use fixed safe `search_path`, qualified dependencies, explicit auth and controlled owner;
- no service-role secret or password enters browser source;
- rollback preserves deny-by-default and does not restore known broad access.

## 14. Unresolved Decisions / Blockers

1. Province actor mapping is absent/unverified; province-admin capabilities remain deny.
2. Admin contact access is not approved; default deny.
3. Region-transfer approver/rules and interactions with assignments/cards/organization remain undefined.
4. License modification authority and validation rules remain undefined.
5. Status transition and audit requirements remain undefined.
6. Document VIEW/DOWNLOAD authorization and Storage path ownership remain undefined.
7. Card admin lifecycle actor scope/audit remains undefined.
8. Role-management and account administration scopes remain undefined.
9. Existing approval RPC live bodies/grants and caller-supplied `_admin_id` semantics remain unverified.
10. Full live `is_admin()` dependent policy/function set remains unverified; tracked source is not a live dependency inventory.
11. Exhaustive list/detail/profile consumers and output needs require source and deployed-client reconciliation.
12. No actor sessions/fixtures currently prove runtime outcomes.

## 15. Next Phase Recommendation

Continue B.3.4.3 capability completion before any executable migration draft:

1. Freeze field/actor decision for profile, email, WhatsApp, documents, and public-safe directory.
2. Decide/remove or define region transfer, license update, active status, role management, and card lifecycle contracts.
3. Inspect live definitions/grants of registration, document, card, role, and list functions in TEST; no production access.
4. Complete full live policy/function dependency inventory for `is_admin()` and helper functions.
5. Map every frontend consumer to its replacement capability and preserve business behavior explicitly.
6. Obtain authoritative province binding or keep all province-admin target capabilities denied.
7. Acquire approved actor sessions and run the read-only actor matrix in a later phase.
8. Only after static consistency and live schema reconciliation, draft SQL/preflight/rollback; do not apply it in this phase.

# Gate

`PHASE B.3.4.3 BLOCKED — CAPABILITY CONTRACTS NOT COMPLETE`

No migration, database mutation, source change, or production access occurred. No actor-level authorization PASS is claimed.
