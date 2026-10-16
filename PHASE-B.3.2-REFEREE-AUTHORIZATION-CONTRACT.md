# PHASE B.3.2 — Referee Authorization Contract

**Design status: READY FOR STATIC VALIDATION**  
**Live schema/RLS/grants: NOT VERIFIED**  
**Actor-level runtime behavior: NOT VERIFIED**  
**Scope: design only; no SQL, migration, source, or database change.**

All schema-dependent details carry the label **LIVE VERIFICATION REQUIRED**. Prior migrations, generated types, and owner-supplied baselines are not treated as proof of deployed state.

## Current State

Static frontend inspection shows:

- `useReferee()` in `src/hooks/useReferees.ts` reads `profiles` using `select("*")` and checks `user_roles` afterward in the client. That post-fetch check is not authorization.
- List/count/stats use `get_referees()`; `useEventAssignments.ts` and `useSmartAssignment.ts` also consume it.
- `useRefereeContact()` reads explicit contact columns for the signed-in actor's own ID; it is a self-service flow, not an admin detail boundary.
- Public review/list paths use `get_public_referees()` / `get_public_referee()`.
- Source migrations and types show historical drift in `get_referees()`; actual overloads and grants are **LIVE VERIFICATION REQUIRED**.
- Prior B.3.1-C connector discovery returned `Connection not found`; no live database query was made.

The supplied baseline reports potentially broad `profiles` access and a self-only contact policy. Treat these as risk inputs pending live confirmation, not current verified facts.

## Threat Model

The boundary must prevent:

- anon/ordinary authenticated directory or detail access;
- `admin_kab_kota` accessing foreign-region referee profile/email/contact through direct REST, a function, or a manipulated filter;
- a caller substituting a client-supplied region for server-derived actor scope;
- `wasit` using a known/guessed referee ID to read another person's profile/contact;
- assignment existence, route guards, or frontend role checks being mistaken for authorization;
- stale/overloaded `SECURITY DEFINER` list functions or permissive direct-table policies bypassing the detail endpoint.

A target UUID is an identifier, not an authorization grant. `authenticated` describes a session class, not a business role.

## Authorization Matrix

This is the required contract, not a live result.

| Actor | Own referee profile | In-scope referee profile | Foreign/out-of-scope profile | Own contact | In-scope contact | Other referee contact |
|---|---|---|---|---|---|---|
| `admin_provinsi` | Allow only if the actor is also the target referee; otherwise province-scoped rule | ALLOW only after actor and target province are authoritatively resolved | DENY | Allow only as own referee under self rule | ALLOW only after province scope and contact-field approval | DENY unless the target is in verified province scope and contact is explicitly approved |
| `admin_kab_kota` | Allow only if also target referee; otherwise own-city rule | ALLOW when target city equals actor's server-derived city | DENY | Own self-service only | ALLOW when same-city and contact field is approved | DENY for cross-region; same-city contact only through detail endpoint |
| `wasit` | ALLOW | DENY for another referee | DENY | ALLOW under verified self-service policy | DENY | DENY; assignment alone does not authorize |
| Ordinary authenticated | Own account only through separate self-profile contract; no referee directory grant | DENY | DENY | No referee contact access except own wasit self-service if actor is a referee | DENY | DENY |
| `anon` | DENY private detail | DENY | DENY | DENY | DENY | DENY |

**Province scope: `NOT LIVE VERIFIED`.** Until an authoritative actor-to-province mapping and target-to-province relation are verified, fail closed for `admin_provinsi` detail authorization. Do not invent a resolver or infer scope from role name/null city.

## Field-Level Contract

Proposed detail response is deliberately minimized. Fields not justified for the detail experience are excluded. This is a design contract; existence, nullability, and display necessity remain **LIVE VERIFICATION REQUIRED**.

| Field | Source (candidate) | admin_provinsi in verified province | admin_kab_kota same city | wasit own | ordinary auth / anon | Notes |
|---|---|---:|---:|---:|---:|---|
| `id` | `profiles.id` | YES | YES | YES | NO | Internal target key; returned only after authorization |
| `full_name` | `profiles.full_name` | YES | YES | YES | NO | Identity field |
| `profile_photo_url` | `profiles.profile_photo_url` | YES | YES | YES | NO | Include only if the UI needs it |
| `license_level` | `profiles.license_level` | YES | YES | YES | NO | Referee qualification |
| `license_expiry` | `profiles.license_expiry` | YES | YES | YES | NO | Needed to show current license state |
| `kabupaten_kota_id` | `profiles.kabupaten_kota_id` | YES | YES | YES | NO | Needed to represent scope/region; display name may be joined only if verified |
| `is_active` | `profiles.is_active` | YES | YES | YES | NO | Operational status |
| `afk_origin` | `profiles.afk_origin` | YES only if product requires it | YES only if product requires it | YES only if product requires it | NO | Include only after UI necessity is confirmed |
| `email` | `profiles.email` (candidate) | YES, if approved | YES, if approved | Own only | NO | Sensitive contact; existence/source and per-role approval are LIVE VERIFICATION REQUIRED |
| `whatsapp_number` | `referee_contacts.whatsapp_number` (candidate) | YES, if approved | YES, if approved | Own only | NO | Separate sensitive field; join only after authorization |
| `phone` | Unknown | NO until verified | NO until verified | NO until verified | NO | No verified phone column; do not invent or alias it |
| `is_profile_complete` | Candidate profile field | EXCLUDE | EXCLUDE | EXCLUDE | EXCLUDE | Not required by stated detail contract |
| `created_at` | Candidate profile field | EXCLUDE | EXCLUDE | EXCLUDE | EXCLUDE | Not required absent an explicit UI need |
| `birth_date`, occupation, KTP/license document URLs, approval/rejection fields | Candidate profile fields | EXCLUDE | EXCLUDE | EXCLUDE | EXCLUDE | Personal/document/admin data not required for detail |

Unauthorized callers receive no detail row/contact fields. For an authorized profile-only response where contact approval is absent, omit contact fields or return null according to the final API schema; do not fetch contacts first and redact only in the browser.

## Direct-Table Exposure Contract

The private RPC must not coexist with an equivalent unrestricted direct path. The desired end state is:

- no anon raw `profiles` SELECT for private referee records;
- no generic broad `is_admin` policy that gives regional admins cross-region access;
- city-admin direct reads, if any remain for unrelated workflows, are independently city-scoped;
- ordinary authenticated users cannot enumerate the referee directory through raw table access;
- referee self-profile reads remain a distinct, minimized self-service contract;
- direct `referee_contacts` access remains self-only; admin detail contact access is through the authorized detail boundary;
- public list/review behavior uses public-safe explicit-field RPCs, never raw `profiles` access.

The supplied baseline describes possible public and broad admin policies, but their live presence and composition are **LIVE VERIFICATION REQUIRED**. Do not remove policies/grants until consumer dependencies are mapped, replacement flows are ready, and actor tests pass.

## RPC Strategy

Candidate private boundary: `get_referee_detail(p_referee_id uuid)`. It is not created in this phase.

Contract requirements:

1. Derive caller from `auth.uid()`; reject unauthenticated requests.
2. Resolve role and actor scope from trusted server-side relations.
3. Resolve target identity, role, active/deleted state, and region server-side.
4. Authorize before returning any target profile/contact field.
5. For city admin, compare actual actor city to actual target city; ignore any client-provided region as authority.
6. For province admin, compare actual actor province to target province only after both relations are proven; otherwise deny.
7. For wasit, allow self only. No other-referee access absent a separate approved rule.
8. Deny ordinary authenticated users and anon.
9. Return explicit columns only; no wildcard, tokens, credentials, document paths, or unrelated admin metadata.
10. Use generic not-found/denial semantics where required to prevent target enumeration.

No client role check or route guard is a security predicate.

## Contact Strategy

`email` and `whatsapp_number` are separate sensitive fields. The target contract permits them only to:

- `admin_provinsi` for a referee in the actor's verified province, after explicit field approval;
- `admin_kab_kota` for a referee in the actor's own city, after explicit field approval;
- a `wasit` for their own record/contact only.

All other actors/targets are denied. Keep the self-service contact hook from accepting arbitrary target IDs. Never infer cross-referee contact sharing from `event_assignments`.

## `get_referees()` Strategy

Target state: **D. Retire after consumers migrate**, replacing its uses with appropriately scoped list contracts. Do not remove it before compatibility/dependency work is complete.

- No anonymous privileged directory RPC.
- No ambiguous overloads or wildcard outputs.
- No caller-selected region as authorization.
- Explicit role scope, fields, pagination/search contract, and EXECUTE grants on replacement list RPCs.
- Public directory may remain on separate safe public RPCs.
- Inventory all live overloads/consumers before retiring; signatures and grants are **LIVE VERIFICATION REQUIRED**.

`get_admin_referees()` may be reused only if its live body, owner, `search_path`, return projection, grants, and actor behavior are verified. It is not assumed safe from its name.

## `SECURITY DEFINER` vs `SECURITY INVOKER`

**Final implementation choice: `PENDING LIVE POLICY VERIFICATION`.**

- `SECURITY INVOKER` is preferred if authenticated table access/RLS can enforce the same row scope and required fields without granting broad profile/contact access.
- A narrowly owned `SECURITY DEFINER` detail RPC may be justified if the invoker path cannot provide the minimized contract. Definer status is not proof of safety and must not be used merely to bypass RLS.

If definer is selected later, require: pinned safe `search_path` (prefer empty plus schema-qualified names), explicit `auth.uid()` resolution, server-derived scope, explicit schema-qualified relations/functions, explicit return fields, non-public execute, reviewed least-privilege owner, and tests for every bypass path. Avoid mutable objects or untrusted name resolution in the function path. Owner/RLS-bypass assumptions are **LIVE VERIFICATION REQUIRED**.

## EXECUTE Grant Contract

- Private detail/list RPCs: no `anon` or `PUBLIC` EXECUTE; authenticated EXECUTE only when each function performs its own complete authorization.
- Public-safe RPCs: anon EXECUTE only for fixed, reviewed, non-sensitive projections.
- `service_role`: not used as a browser or actor-session substitute; exact grants/default privileges are **LIVE VERIFICATION REQUIRED**.
- Authenticated EXECUTE does not grant business authorization; the function body must deny ordinary authenticated users and enforce each actor's scope.

## BOLA / IDOR Contract

Required later runtime cases:

- City admin: same city allow; foreign city deny through detail, direct profile ID, direct contact `referee_id`, and altered region parameter.
- Province admin: same province allow and other province deny, only after actor/target mapping is verified.
- Wasit: own profile/contact allow; another referee profile/contact deny; assignment-only attempt deny.
- Ordinary authenticated: referee detail deny.
- Anon: private detail/contact and private RPC deny.
- Changing UUID or caller-supplied city/province cannot expand scope.

All are future tests, not current PASS results.

## Frontend Contract

- `useReferee()` consumes the private detail RPC and removes `profiles.select("*")` plus post-fetch role check as security logic.
- `RefereeDetail.tsx` may retain route/UI gating for UX; server authorization remains authoritative.
- `useReferees.ts` list/count/stats move to verified role-scoped list contracts before legacy RPC retirement.
- `useProfile.ts` remains separate self-profile functionality; replace wildcard and unqualified returning projections with explicit fields where practical.
- `useRefereeContact()` remains owner-self only; no arbitrary referee ID support.
- Public review/list hooks remain on public-safe functions with explicit return fields.
- Audit remaining profile consumers and their required fields/roles before changing direct table permissions.

## Static Security Test Contract

Static checks before any migration proposal:

- referee detail code contains no `profiles.select("*")` and no contact wildcard;
- detail authorization is not implemented solely by frontend role checks/ProtectedRoute;
- private RPC return columns are explicit and exclude unapproved fields;
- anon/PUBLIC cannot execute private RPCs; only reviewed public-safe RPCs are anon-callable;
- no broad `is_admin()`-only predicate is used for city scope;
- city scope compares server-derived actor and target regions;
- province scope remains fail-closed until actor and target province mapping is verified;
- wasit access is self-only; assignment does not imply private contact access;
- any definer RPC pins `search_path`, schema-qualifies dependencies, has reviewed owner, and includes explicit authorization;
- no service-role key is referenced in browser source or bundle;
- legacy list consumers/overloads are accounted for before retirement.

Static tests do not establish live RLS/grants or actor-level behavior.

## Mandatory Uncertainty Labels

The following remain **LIVE VERIFICATION REQUIRED**: all FK relationships, deployed columns/nullability, policy expressions/composition, RLS/FORCE RLS, grants/default privileges, function signatures/overloads/owners/security mode/search paths, admin province mapping, admin city resolver, actual RPC behavior, and actor runtime behavior.

## Open Questions

1. Which live relation authoritatively maps an `admin_provinsi` role to exactly one province, including inactive/missing/multiple cases?
2. Are `email` and WhatsApp approved for both admin classes for in-scope referees, or should either be owner-only?
3. Does a phone field exist in the deployed schema, and is it distinct from WhatsApp?
4. Which exact profile consumers require each proposed field and under which backend authorization?
5. Can the live invoker/RLS architecture meet the detail projection, or is a carefully owned definer RPC necessary?
6. Which exact list RPC replaces each `get_referees()` use without changing event assignment, stats, search, or pagination behavior?
7. What are live function and policy grants, including PUBLIC/default privileges?
8. Which approved existing actor sessions/fixtures will prove runtime behavior later?

## Gate

`PHASE B.3.2 READY FOR STATIC VALIDATION`

The contract is internally consistent as a static specification. `LIVE SCHEMA VERIFICATION`, `LIVE RLS VERIFICATION`, `LIVE GRANT VERIFICATION`, and `ACTOR-LEVEL RUNTIME VERIFICATION` remain unresolved. No migration has been created/applied and no authorization PASS is claimed.
