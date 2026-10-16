# PHASE B.3.2 — Referee Authorization Migration Specification

**Status: DESIGN-LEVEL ONLY — NOT AN APPLIED MIGRATION**  
**Environment context: TEST `shorsqyycpptxcutrqrb` only. Production `xfscfjwapwnkiinkgbjg` is excluded.**  
**No executable SQL is included. No database/source change was performed.**

`LIVE SCHEMA VERIFICATION`, `LIVE RLS VERIFICATION`, `LIVE GRANT VERIFICATION`, and `ACTOR-LEVEL RUNTIME VERIFICATION` remain unresolved. Every operation below is conditional and must not be implemented until its live dependencies are captured.

## Preconditions and Evidence Gate

Before writing migration SQL, a read-only connection must prove the TEST project identity. Then record the exact pre-state for:

- table/column definitions, nullability, primary/foreign/unique/check constraints, RLS and FORCE RLS;
- all relevant policies, including role lists, commands, `USING`, and `WITH CHECK`;
- table, column, routine, PUBLIC, and default privileges;
- all overloads of affected functions, including identity arguments/defaults, return type/columns, owner, security mode, volatility, `proconfig`/`search_path`, body, dependencies, and grants;
- province actor binding, target province relationship, city actor binding, and fail-closed missing/duplicate behavior;
- view/trigger/RPC and application consumers.

Do not use migration files or generated types as substitutes for deployed schema evidence. If province actor scope cannot be resolved authoritatively, block the province-scoped implementation; do not invent a helper or infer scope from a role name/null city.

## Target Contract Summary

The design target is a private, explicit-field referee detail boundary equivalent to `get_referee_detail(p_referee_id uuid)`.

- `admin_provinsi`: allow only when both actor and target province are authoritatively resolved and equal; otherwise deny.
- `admin_kab_kota`: allow only when server-derived actor and target kab/kota IDs match.
- `wasit`: own profile/contact only; another referee denied absent a separately approved rule.
- ordinary authenticated and anon: private referee detail/contact denied.
- no client-supplied region is authorization input; no `SELECT *`; no assignment-implied contact access.
- email and WhatsApp are separate sensitive fields; include only for actor/target scopes explicitly approved in the contract.

## Migration Sequence

The labels below are conceptual migration stages, not filenames or executable SQL. Each stage requires separate approval when execution is proposed.

### Stage 0 — Capture immutable pre-state

**Previous state:** unknown until live test catalog capture. The supplied baseline reports broad profile exposure, but is not verified live evidence.

**Forward action:** none; read-only snapshot only.

**Rollback:** not applicable. Preserve the snapshot securely without secrets or application row values.

**Dependencies:** verified connector target and catalog access.

**Safety gate:** stop if exact function overloads, policies, grants, or province mapping are unavailable.

### Stage A — Scope helper decision

**Previous state:** live role/scope helpers and actor-region relations unknown.

**Forward action:** reuse a live helper only after proving its signature, owner, security mode, `search_path`, role semantics, and scope source. If no authoritative province mapping exists, do not implement a province helper; the `admin_provinsi` path remains denied/blocked. Add a helper only in a later approved design if schema evidence proves the inputs and constraints.

**Rollback design:** if a newly approved helper is later created, remove/revert only its exact captured signature after dependent functions stop using it. No helper removal is planned in this design phase.

**Dependencies:** verified `user_roles`, `profiles`, region relation, province actor mapping, constraints, and dependency catalog.

### Stage B — Private detail boundary

**Previous state:** no live private detail RPC has been verified. The supplied baseline and frontend evidence are not proof of current deployed functions.

**Forward action:** add or replace one private detail boundary with explicit return columns, authorization-before-return, server-derived actor/target scope, self-only referee access, and generic non-enumerating denial behavior. Return contact only when the separately approved field/actor contract allows it. No caller-provided region may widen scope.

**Security mode:** decide `SECURITY INVOKER` versus `SECURITY DEFINER` only after live grants/RLS/ownership analysis. Invoker is preferred if it can enforce the same contract without broad table access. If definer is necessary, require safe pinned `search_path`, schema-qualified dependencies, reviewed least-privilege owner, explicit `auth.uid()` authorization, explicit columns, and restricted execute.

**Rollback design:** first stop/repoint consumers; then revoke execute and remove the exact new boundary only if no dependent object/client remains. If replacing a function, restore the captured prior definition only if security review confirms it is safe. Never restore a known vulnerable public/admin boundary as a convenience rollback.

**Dependencies:** verified table/column/FK schema, role/scope helpers, province mapping, target state semantics, contact source, owner/RLS interaction, and approved field list.

### Stage C — Private function privileges

**Previous state:** exact routine and default privileges unknown.

**Forward action:** no anon/PUBLIC execute on private detail/list functions; authenticated execute only when the function body fully authorizes callers. Do not grant execute to a role merely because the endpoint is needed by a screen. Public-safe RPCs may remain anon-callable only with a separately reviewed safe projection.

**Rollback design:** restore captured privileges only after review. If the prior state granted anon or PUBLIC execution to a private function, do not restore that privilege; keep a secure fallback and document any compatibility loss.

**Dependencies:** exact function identities/overloads and grants, including PUBLIC/default privileges.

### Stage D — Frontend consumer cutover

**Previous state:** source currently includes a direct wildcard detail query and multiple list/profile consumers; exact deployed dependencies unknown.

**Forward action in a separately reviewed application release:**

- switch `useReferee()` to the secure detail contract and remove post-fetch role check as security logic;
- preserve `useProfile()` as a distinct self-profile contract and narrow returned fields;
- preserve `useRefereeContact()` as own-contact only;
- migrate all `get_referees()` consumers (list, count/stats, assignment suggestions/selection) to scoped list contracts;
- retain public review/list on explicit public-safe endpoints;
- replace or otherwise account for all direct profile readers and write-returning selections before restricting direct SELECT.

**Rollback design:** revert only to an application version compatible with the secure server contract. Do not roll back to code requiring unrestricted profile/contact access. Keep the secure endpoint available until clients are confirmed moved.

**Dependencies:** exhaustive source/deployed client inventory, type contract, compatible API deployment plan, and static/runtime tests.

### Stage E — Static and actor verification

**Previous state:** B.2.3 actor behavior is not verified; actor sessions/fixtures are unavailable in existing reports.

**Forward action:** static tests first, then read-only authenticated API tests using approved existing actor sessions and frozen fixtures. Test direct REST and every RPC path, not just UI. Validate same-city allow/cross-city deny, province scope after mapping is verified, own referee access, unauthorized other-referee denial, contact visibility, anon denial, ordinary-auth denial, ID/region tampering, and generic denial behavior.

**Rollback design:** no data rollback. If tests fail, do not cut over direct table policies; disable the new endpoint via reviewed safe execute control or keep it inaccessible until fixed. Do not broaden access to make tests pass.

**Dependencies:** proven test DB identity, valid fixtures, approved sessions, and no production actor/session.

### Stage F — Direct-table exposure cutover

**Previous state:** supplied baseline reports broad `profiles` SELECT/public policy and `is_admin` policy; live policy composition/grants are not verified.

**Forward action, only after endpoint/client coverage and actor tests pass:**

- remove/narrow public raw `profiles` SELECT while preserving the public directory through safe explicit RPCs;
- remove/replace any broad all-admin SELECT predicate that permits city-admin cross-region access;
- retain only explicitly required self-profile direct access, with minimized fields and verified RLS/grants, or move it to a separate self-profile boundary;
- keep `referee_contacts` direct access owner-self only; never add broad admin table SELECT for the detail UI;
- confirm no other permissive policy, grant, view, function, or overload recreates the exposure.

**Rollback design:** do not restore a known insecure `Public can view referee profiles` or broad `is_admin` policy. If a dependent workflow fails, roll back/repoint the dependent client while keeping private access closed, or restore only a previously reviewed secure scoped policy. If no safe compatibility state exists, stop rollout and preserve deny-by-default behavior.

**Dependencies:** full profile consumer migration, verified public-safe RPC behavior, exact policy/grant snapshot, and successful actor tests.

### Stage G — Retire legacy `get_referees()` overloads

**Previous state:** supplied migration/frontend evidence indicates signature drift; live overloads and grants are unknown.

**Forward action:** after every consumer moves, restrict/retire all unsafe overloads by exact identity. Target state: no anon privileged list execution, no ambiguous overload, explicit fields, explicit actor scope and grants. Keep only a verified replacement list contract. Do not drop by function name alone.

**Rollback design:** restore an exact captured overload only if it passes the authorization contract. If its prior body/grants are unsafe, do not restore it; keep the scoped replacement, even if a consumer must remain unavailable until repaired.

**Dependencies:** live overload inventory, dependency scan, all consumer cutover, replacement tests, and exact function/grant snapshot.

## Policy Operations

Conceptual only; exact policy operations require live inventory:

1. Replace/remove the public raw profile SELECT policy after public consumers use safe RPCs.
2. Replace/remove broad all-admin profile SELECT; city scope must be independently enforced from trusted actor and target scope.
3. Preserve a minimized own-profile path only if its separate contract is validated.
4. Preserve contact self-service RLS; no broad contact-table admin SELECT.
5. Check every permissive policy combination and table/column privilege after cutover.

Never rely on a new narrow policy to cancel an old permissive policy; PostgreSQL permissive policies combine unless explicitly designed otherwise. **Exact live policy composition is LIVE VERIFICATION REQUIRED.**

## Function Operations

- Provisional private endpoint: `get_referee_detail(p_referee_id uuid)`; not created in this phase.
- Provisional list path: reuse `get_admin_referees()` only if its live definition and actor behavior are verified; otherwise define a scoped replacement.
- `get_referees()` target: retire after consumers migrate; no anonymous privileged use and no unsafe overload left callable.
- Public list/detail RPCs remain separate, explicit-field, non-contact projections.
- Do not add `_resolve_admin_scope()` or any province resolver by assumption.

## Grant Operations

Conceptual target only:

- private detail/admin list: no `anon` or `PUBLIC` execute; authenticated execute only when the body enforces authorization;
- public-safe read RPC: anon execute only for explicit, approved public fields;
- direct `profiles`: narrow/restrict anon and authenticated SELECT only after consumer cutover;
- `referee_contacts`: retain owner-self direct access only; no broad admin SELECT;
- service role: do not use as browser/test-actor replacement. Exact privileges/default grants need live review.

No exact grant statements are included or approved.

## Dependency Order

1. Prove read-only TEST identity.
2. Capture live schema, province mapping, policies, grants, function bodies/overloads/owners/search paths.
3. Resolve field/actor contract and freeze actor fixtures/sessions.
4. Audit and classify every direct profile/contact consumer.
5. Implement and verify role/region helpers only if the schema supports them; fail closed if province binding is unresolved.
6. Implement the detail/list RPC contract and grants in TEST under separate authorization.
7. Migrate consumers and generated types in a separately reviewed source change.
8. Run static tests, then actual actor-level API tests.
9. Restrict direct policies/grants only after compatibility and authorization tests pass.
10. Retire unsafe `get_referees()` overloads after every consumer is moved.
11. Capture post-change catalog state and rollback evidence; do not deploy production.

## Static Validation Contract

Before applying a separately approved migration, verify:

- no wildcard profile/detail/contact projections remain in those flows;
- no client-side check is the security decision;
- every private RPC has explicit output and authorization logic;
- no anon/PUBLIC execute on private functions;
- no broad role-only admin predicate grants city-wide/cross-region access;
- city scope comes from database-side actor and target rows;
- province access remains denied until actor and target mappings are both verified;
- `wasit` is self-only and assignment does not imply private contact access;
- public endpoints exclude email/contact/document fields;
- any definer function uses safe search path, schema-qualified references, reviewed owner, and explicit auth checks;
- there is no service-role credential in browser code/bundle;
- every list/detail/profile consumer is accounted for before direct SELECT changes.

Static validation is not live RLS/grant verification or actor-level PASS.

## Rollback Requirements

For every future operation, the pre-migration snapshot must record exact policy identities/expressions, function overload signatures/bodies/owners/security/search paths/grants, table/column/default privileges, and dependencies.

- Helper rollback: remove only a newly introduced, unused helper with its exact signature; never replace an unknown existing helper.
- Detail RPC rollback: stop dependent clients, revoke its execute, and remove/revert only the captured exact function after dependency checks.
- Grant rollback: restore only reviewed safe privileges; never restore PUBLIC/anon execution for a private endpoint.
- Frontend rollback: return only to a compatible version that does not depend on broad direct-table access.
- Policy rollback: do not restore known insecure public or broad-admin policies. Use a reviewed secure scoped fallback; if none exists, keep the boundary closed and roll back the dependent feature.
- Legacy RPC rollback: restore only if the captured overload is secure; otherwise keep it retired and retain the replacement.

This cannot specify exact pre-state statements yet because live policies/functions/grants are unknown. No `DROP ... CASCADE` or rollback SQL is provided.

## Explicit Uncertainty Register

- `LIVE SCHEMA VERIFICATION`: unresolved.
- `LIVE RLS VERIFICATION`: unresolved.
- `LIVE GRANT VERIFICATION`: unresolved.
- `ACTOR-LEVEL RUNTIME VERIFICATION`: unresolved.
- Admin province actor mapping: unresolved; fail closed.
- Deployed function overloads/security owners/search paths: unresolved.
- Existing consumers and required fields outside inspected frontend source: requires final exhaustive review.

## Gate

`PHASE B.3.2 READY FOR STATIC VALIDATION`

This is a design-level specification only. It is not executable SQL, an applied migration, a deployment, or proof of authorization. All live verification items above remain unresolved.
