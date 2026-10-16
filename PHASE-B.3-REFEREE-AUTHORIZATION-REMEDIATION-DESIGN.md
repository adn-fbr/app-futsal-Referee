# PHASE B.3 — Referee Detail Authorization Remediation Design

**Design status: `PHASE B.3 BLOCKED — SCHEMA DEPENDENCY UNVERIFIED`**  
**Actor-level authorization: NOT VERIFIED**  
**Scope: TEST project only; design documentation only.**

No database query, migration, source change, grant, policy, function, or deployment was performed. Effective database facts below are identified as project-owner-supplied baseline where applicable, not as independently queried evidence.

## Current State

### Supplied baseline

- `profiles` has RLS, anon/authenticated SELECT privileges, a public `deleted_at IS NULL` policy, and an `Admins can view all profiles` policy using `is_admin(auth.uid())`.
- Supplied `is_admin()` includes `admin_provinsi` and `admin_kab_kota`, so the broad admin predicate does not by itself enforce city scope.
- `get_admin_referees()` is reported as a `SECURITY DEFINER` list function, executable by authenticated only, with an explicit `admin_kab_kota` region predicate.
- `get_referees()` is reported as `SECURITY DEFINER`, executable by anon and authenticated, with insufficiently established region authorization.
- `referee_contacts` is reported to have RLS and a self-referee-scoped SELECT policy.
- B.2.3 actor-level requests were not executed. No exploit result is claimed.

### Static frontend and migration evidence

- `useReferee()` in `src/hooks/useReferees.ts` reads `profiles` with `select("*")`, then performs a client-side `user_roles` check. That check cannot authorize data already returned by the first request.
- The referee list calls `get_referees()`; other consumers include `useEventAssignments.ts` and `useSmartAssignment.ts`.
- `useRefereeContact()` in `src/hooks/useRefereeContact.ts` selects explicit contact fields for the signed-in user's own ID; it is not an admin detail boundary.
- Public list/review source uses `get_public_referees()` and `get_public_referee()`.
- Migration history has differing `get_referees` bodies/signatures; generated types and frontend expect pagination not present in the inspected migration definitions.
- No live database schema, grants, function body, or effective policy has been verified for this design.

## Threat Model

Protect referee email, contact data, and non-public profile columns against:

- anonymous direct Data API access;
- ordinary authenticated users without a referee/admin authorization role;
- `admin_kab_kota` targeting a referee outside the actor's actual region;
- `wasit` targeting another referee by guessed UUID;
- callers changing a region parameter to expand scope;
- overbroad or stale `SECURITY DEFINER` functions and direct-table policy paths;
- frontend role checks being mistaken for backend authorization.

A known UUID, shared event, assignment row, route guard, or client-supplied region is not authorization.

## Authorization Matrix

This is the target contract, not test evidence.

| Actor | Target | Profile fields | Email | WhatsApp/contact |
|---|---|---|---|---|
| `admin_provinsi` | Referee within actor's verified province | ALLOW, minimized | ALLOW | ALLOW |
| `admin_kab_kota` | Referee in actor's actual kab/kota | ALLOW, minimized | ALLOW | ALLOW |
| `admin_kab_kota` | Referee outside actor's kab/kota | DENY | DENY | DENY |
| `wasit` | Own profile | ALLOW, minimized | ALLOW subject to product contract | Own contact only |
| `wasit` | Another referee | DENY absent a separately approved rule | DENY | DENY |
| Ordinary authenticated | Referee directory/detail | DENY absent explicit authorization | DENY | DENY |
| `anon` | Private referee detail/contact | DENY | DENY | DENY |

## Current Boundary Inventory

| Boundary | Evidence | Design status |
|---|---|---|
| Direct `profiles` SELECT | Supplied baseline reports anon/authenticated grants and a public policy; broad admin policy uses `is_admin` | Must not be relied on for private detail; actual grants/policies need read-only revalidation |
| `get_referees()` | Supplied baseline reports anon/authenticated EXECUTE and insufficient scope | Unsafe as an authorization boundary until replaced or fully remediated |
| `get_admin_referees()` | Supplied baseline reports authenticated EXECUTE and city-region enforcement | Candidate list boundary only; body, owner, search path, grant and behavior still need test DB verification |
| `referee_contacts` | Supplied baseline reports authenticated SELECT and self-referee RLS | Keep self-service semantics; do not add broad admin table SELECT |
| Detail frontend path | Direct wildcard profile SELECT before client role lookup | Replace with explicit backend detail contract |
| Public directory | Uses public-safe RPCs in frontend | Preserve public-safe fields through a separately authorized public boundary |

## Target Boundary

**Provisional preference: Option A, a dedicated `get_referee_detail(p_referee_id uuid)` RPC.** It gives one narrow, explicit result contract and avoids exposing the profile/contact tables as the private detail interface. This is a design direction, not a final function signature or SQL definition.

The endpoint must authorize the caller before returning any target row or contact field. Unauthorized, missing, or out-of-scope targets should have a non-enumerating response consistent with the API's error contract.

### Province scope dependency

Static migration/type artifacts show a candidate relationship:

`profiles.kabupaten_kota_id -> kabupaten_kota.id -> kabupaten_kota.provinsi_id -> provinsi.id`.

They also show a `pengurus` table with `user_id`, `level`, and `provinsi_id`. This does **not** prove that every `admin_provinsi` role has a unique, valid, active province binding, nor that the live database has the same constraints. No final province predicate may be implemented until the live schema, foreign keys, actor mapping, cardinality, and resolver behavior are verified. Do not infer province membership solely from an absent/null city value.

## Field Exposure Contract

Proposed minimum private detail fields, subject to product confirmation and live schema verification:

- `id` (or `referee_id`)
- `full_name`
- `profile_photo_url`
- `email`
- `license_level`
- `license_expiry`
- `kabupaten_kota_id` and approved region display name
- `is_active`
- `afk_origin` only if the UI needs it
- `whatsapp_number`, from the authorized `referee_contacts` row

No `phone` field was found in the inspected profile types/migration excerpt; do not invent one. Confirm the live schema before deciding whether a separate phone field exists.

Exclude `birth_date`, KTP/license document URLs, occupation, approval/rejection metadata, and unrelated profile columns unless a separately approved workflow requires them. Do not return tokens, credentials, provider configuration, or `profiles.*`.

## Direct-Table Policy Strategy

A secure RPC is insufficient if raw table reads bypass it. The target state must:

1. remove anonymous raw `profiles` access and the broad public row policy; retain the public directory only through explicit, public-safe endpoints;
2. remove the broad `is_admin` all-profile SELECT path or replace it with separately scoped, role-specific authorization;
3. prevent city admins from using direct SELECT to cross their own kab/kota;
4. deny ordinary authenticated directory access and preserve only explicitly required self-profile behavior;
5. keep `referee_contacts` table reads self-scoped; admin contact access, if approved, goes through the authorized detail boundary rather than a broad direct-table policy;
6. inventory/replace dependent direct profile consumers before revoking table or column privileges.

Static search found direct profile reads in auth/profile, users/import, analytics/reports, discussions, evaluations, assignments, incomplete-profile management, organization, referee card, and referee detail hooks/pages. The precise columns, actor roles, write-returning `.select()` behavior, and public/authenticated dependencies must be mapped before finalizing policy operations. A table-wide revocation without that dependency work may break unrelated workflows; retaining broad SELECT may preserve exposure. This tradeoff is unresolved.

## RPC Strategy

The detail RPC should accept only the target referee ID; it must derive caller identity and scope from trusted database state, not a caller-supplied region. It should:

- reject unauthenticated callers;
- validate that the target is an active, non-deleted referee as required by the approved product contract;
- allow self access only under the approved referee self-service contract;
- allow `admin_provinsi` only after resolving and comparing authoritative province scope;
- allow `admin_kab_kota` only when the target's actual `kabupaten_kota_id` equals the actor's trusted region;
- deny ordinary users and other referees absent an approved business rule;
- return explicit fields only and join contact data only after the authorization predicate succeeds;
- avoid distinguishing out-of-scope from nonexistent targets if that would permit enumeration.

Do not use `is_admin()` alone because the supplied definition includes regional admins. `get_admin_referees()` is a candidate for list calls only after actual function inspection and actor testing; it is not a detail/contact endpoint as currently evidenced.

## Contact Strategy

Join `referee_contacts.whatsapp_number` inside the same authorized detail operation only after the target scope is established. Return no contact field for unauthorized callers. Keep direct self-service reads under owner-scoped RLS. Do not infer sharing permission from `event_assignments`; assignment-based access remains denied unless an explicit business rule is separately approved and implemented.

## `get_referees()` Strategy

Classify the supplied baseline as `BASELINE AUTHORIZATION DESIGN FAILURE; ACTUAL ACTOR BEHAVIOR NOT VERIFIED`.

Static migration definitions include differing four-argument implementations; frontend consumers pass pagination arguments, and generated types describe a six-argument contract. Consumers include `useReferees.ts`, `useEventAssignments.ts`, and `useSmartAssignment.ts`. The actual database may have another definition, including the supplied six-argument version. Therefore:

- do not depend on a migration filename to choose the live body;
- capture all live overloads, grants, owners, search paths and consumers before changing anything;
- migrate each consumer to a role-scoped list boundary;
- remove anon execution from any private/admin list RPC;
- retire or replace the unsafe function only after dependency compatibility is proven; do not leave a callable unsafe overload.

## `SECURITY DEFINER` Analysis

A dedicated RPC may require `SECURITY DEFINER` if direct grants/RLS cannot provide the required field-level contract. Do not use it merely to bypass an RLS error. If selected, the later implementation must use a fixed empty or otherwise safely pinned `search_path`, schema-qualified relations/functions, explicit auth checks, explicit return columns, a reviewed least-privilege owner, and narrow EXECUTE grants. Inspect RLS/FORCE RLS, ownership, helper behavior and function privileges in the live test database first. A `SECURITY INVOKER` alternative is preferable only if it can meet the same row and column boundaries without broad direct-table privileges.

## Grant Strategy

- Private detail/list RPCs: no anon EXECUTE; authenticated EXECUTE only when the function itself enforces actor scope.
- Public-safe list/detail RPCs: anon EXECUTE only if they return an explicitly approved safe projection and exclude email/contact/private fields.
- `referee_contacts`: no broad raw admin SELECT grant; preserve only the verified owner-self access needed by the existing self-service flow.
- `profiles`: remove unrestricted anon/table-wide SELECT; authenticated grants and any column-level grants remain conditional on the complete consumer/RLS dependency audit.
- Do not rely on `TO authenticated` as authorization; function body/RLS must authorize each caller.

Actual pre-state grants are unknown here, so no exact grant operations are finalized.

## BOLA / IDOR Controls

- Detail RPC accepts only `p_referee_id`; no caller-selected region scope.
- Derive city/province from verified actor-side relations.
- Apply authorization before returning row/contact values.
- Direct `profiles?id=eq.<target>` must not bypass the policy boundary.
- Raw contact lookup by known referee ID must remain self-scoped.
- Test same-region allow, cross-region deny, another-referee deny, anon deny, ordinary-auth deny, and altered region/ID cases with actual actor sessions.
- Use generic denial/not-found behavior to reduce UUID enumeration.

## Frontend Contract

- Replace `useReferee()` direct `profiles.select("*")` and the subsequent client-side role query with the authorized detail RPC.
- Use explicit typed response fields; treat null/no-row as unavailable without exposing database policy errors.
- Keep UI role checks only for UX; backend remains authoritative.
- Change `useProfile()` to an explicit self-profile contract and remove wildcard/returning-profile projections where not needed.
- Migrate `get_referees()` consumers (`useReferees`, stats/count, `useEventAssignments`, `useSmartAssignment`) to verified, scoped list contracts before retiring the old RPC.
- Audit all other profile readers and write-returning `.select()` calls before changing direct-table grants.
- Keep public review directory on safe public RPCs, not raw profile SELECT.

## Static Test Contract

Before a migration is approved, add/test contracts for:

- profiles: anon deny; ordinary authenticated deny; province-scoped admin allow; city same-region allow/cross-region deny; referee own allow/other deny;
- detail RPC: same actor matrix, including IDOR and unauthorized/nonexistent indistinguishability;
- contacts: anon/ordinary deny; province in-scope allow; city same-region allow/cross-region deny; referee own allow/other deny;
- RPC EXECUTE: anon denied for private functions; ordinary authenticated invocation returns no protected data; each authorized role is scoped by database-side predicates;
- public-safe list/detail responses never include email, WhatsApp, document URLs or unrelated profile fields;
- no direct API path bypasses the RPC through `profiles` or `referee_contacts`.

Actor execution is a later phase because B.2.3 sessions are unavailable. Static tests do not constitute actor-level proof.

## Open Questions

1. What is the live schema, including `profiles.email`, any phone field, region foreign keys, `pengurus` constraints, and `FORCE ROW LEVEL SECURITY` state?
2. How is an `admin_provinsi` actor authoritatively mapped to a province, and can that mapping be null, multiple, or inactive?
3. What are the live policy expressions and grants, including every permissive `profiles` SELECT policy?
4. What are all live `get_referees` overloads, exact return fields, owners, `search_path`, grants, and consumers' actual argument requirements?
5. What is the live `get_admin_referees` body and whether its behavior matches the supplied baseline?
6. Which direct profile queries are intended public, self-only, same-region, or admin-only, and which fields does each need?
7. Is `email` an approved contact field for each actor category? Is WhatsApp distinct from phone in the current product contract?
8. What approved existing actor sessions and frozen fixtures can run the negative tests?

## Final Gate

`PHASE B.3 BLOCKED — SCHEMA DEPENDENCY UNVERIFIED`

This document is a conditional design, not deployment-ready authorization SQL. The live test schema, province actor mapping, effective grants/policies, and function definitions are unverified. Do not draft/apply a migration or implement contact UI until those dependencies are verified.
