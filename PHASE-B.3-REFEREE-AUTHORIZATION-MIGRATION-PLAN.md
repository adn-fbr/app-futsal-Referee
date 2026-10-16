# PHASE B.3 — Referee Authorization Migration Plan

**Status: BLOCKED — SCHEMA DEPENDENCY UNVERIFIED**  
**Plan only. No executable migration SQL is included.**  
**Target, if separately authorized later: TEST `shorsqyycpptxcutrqrb` only. Production is excluded.**

This plan describes a conditional sequence. It is not approval to modify the database. The effective test schema, policies, function overloads, owners, search paths, and grants were not available for verification; no operation below is ready to execute.

## Migration Sequence

### 0. Read-only preflight — mandatory gate

Before drafting SQL, verify on the test database:

- exact table/column/FK/constraint definitions for `profiles`, `user_roles`, `referee_contacts`, `event_assignments`, `kabupaten_kota`, `provinsi`, and any admin-to-province relation such as `pengurus`;
- RLS enabled/forced flags and all effective policies, including permissive policy combinations;
- table and column privileges for anon/authenticated/service_role;
- every `get_referees` overload and the exact `get_admin_referees` signature/body;
- function owner, `prosecdef`, `proleakproof`, `search_path`, and EXECUTE privileges;
- all API/client dependencies, including update queries that request returned profile rows;
- a valid server-side resolver from `admin_provinsi` actor to province and from `admin_kab_kota` actor to kab/kota.

Stop if a province resolver is absent, ambiguous, nullable without a fail-closed rule, or not backed by verified constraints/data. Do not infer province membership from a null `kabupaten_kota_id`.

### 1. Freeze contract and dependency map

Approve the actor matrix, exact detail fields, public directory behavior, self-profile behavior, error/anti-enumeration behavior, and whether email/WhatsApp are authorized fields. Inventory each direct profile consumer and its required columns and actor role. This is required before changing table grants or policies.

### 2. Establish narrow endpoint dependencies

In a later implementation/release phase, prepare:

- a private detail RPC with explicit return fields and database-side actor scope;
- a verified role-scoped admin list boundary, reusing `get_admin_referees` only if its live implementation passes inspection and tests;
- public-safe list/detail endpoints that return only approved public fields, if the public review/list workflow must remain;
- explicit self-profile functionality for profile settings and authentication context.

Do not remove a legacy path until all dependent clients have moved and compatibility tests pass.

### 3. Function cutover

Conditionally harden/add the detail boundary after schema dependencies are proven. Replace client role-check-after-fetch logic with the private RPC. Normalize list consumers before retiring unsafe `get_referees` overloads.

Public RPCs must remain separate from private detail and must never return email, phone/WhatsApp, document URLs, or unrelated profile fields. The exact public function signatures and return lists must be verified against the live database before operation.

### 4. Direct-table policy cutover

After replacement endpoints and clients are ready:

- remove or narrow the public raw `profiles` SELECT policy; preserve approved public directory behavior through explicit safe RPCs;
- replace the broad `Admins can view all profiles`/`is_admin` row path with separately scoped access, or remove direct admin profile SELECT if all required flows use secure RPCs;
- ensure admin kab/kota cannot reach foreign-region rows through any other permissive policy;
- retain only approved self-profile direct access if its fields/RLS are proven safe, otherwise route it through a separate self-profile contract;
- retain `referee_contacts` owner-self policy; do not add a general admin table SELECT policy. Admin contact access, if approved, must occur through the authorized detail boundary.

RLS is row-level and does not itself provide column minimization. Any direct table or column grants must be justified per consumer and cannot substitute for the RPC's authorization checks.

### 5. Legacy `get_referees` handling

Inspect and enumerate live overloads before choosing `RESTRICTED`, `REPLACED`, or `REMOVED`:

- migrate consumers in `useReferees.ts`, `useEventAssignments.ts`, and `useSmartAssignment.ts`;
- account for list, count, stats, search, pagination, assignment and license filtering behavior;
- remove anon EXECUTE from every private/admin overload;
- do not drop an overload until exact identity, grants, dependencies, and rollback definition have been captured;
- do not keep an insecure overload callable as a compatibility shortcut.

The generated types and tracked migration signatures differ, so migration filenames alone cannot identify the deployed signature.

### 6. Grant cutover

Conditional target principles:

- anon: no table SELECT on private profile/contact tables and no EXECUTE on private RPCs;
- authenticated: only necessary table/column privileges after the dependency audit; private RPC EXECUTE only when the body enforces authorization for every actor;
- service_role: preserve only verified operational needs; never expose it to the browser;
- public-safe RPCs: anon EXECUTE only for fixed, reviewed public-safe projections.

`TO authenticated` is not an authorization decision. The function must still check `auth.uid()`, role, and server-derived scope.

## Policy Operations

Potential operations, all **conditional on live policy/grant inventory**:

1. Drop or replace `Public can view referee profiles` so anonymous clients cannot query arbitrary profile rows. First verify public-list/detail consumers and retain safe public RPC behavior.
2. Drop/replace broad `Admins can view all profiles` if the live predicate uses an `is_admin` helper that includes regional admins. Avoid additive permissive policies that leave the old broad policy effective.
3. Define separate city/province/self semantics only where direct access remains necessary. City scope must derive from the actor's trusted region; province scope requires a proven province mapping.
4. Keep contact rows self-scoped for direct table access. Do not widen contact RLS for convenience.
5. Verify no remaining permissive policy or inherited grant recreates the removed access.

Exact policy names, commands, roles, `USING`, and `WITH CHECK` expressions must be snapshotted from the test database; no policy operation is approved by this document.

## Function Operations

Potential operations, conditional on complete signature inventory:

- add/replace a private detail function with explicit fields and authorization-before-return;
- inspect/reuse or replace `get_admin_referees` for admin list use;
- retire or restrict every unsafe `get_referees` overload after all consumers move;
- preserve or harden public-safe `get_public_referee(s)` without adding private fields;
- review helper functions so `is_admin()` is never the sole city-admin scope test.

For any `SECURITY DEFINER` function, require a fixed empty or otherwise safe `search_path`, schema-qualified objects and auth helpers, explicit caller validation, a reviewed least-privilege owner, explicit return columns, and restricted EXECUTE grants. Prefer `SECURITY INVOKER` only if it meets the same data and row boundary without granting broad direct access. No definer function may be justified solely as an RLS bypass.

## Grant Operations

Potential operations, conditional on the captured effective grants:

- remove anon EXECUTE on private/list admin functions, including all overloads;
- grant authenticated EXECUTE only to functions whose bodies explicitly authorize every permitted actor;
- retain anon EXECUTE only on reviewed public-safe functions;
- remove raw anon profile SELECT and broad authenticated table SELECT where consumer replacement permits;
- keep direct `referee_contacts` SELECT limited to the verified self-service contract.

Do not write exact GRANT/REVOKE statements until role names, overloads, existing grants, default privileges, and dependencies are captured. Do not assume grants from migration source.

## Dependency Order

1. Verify live test schema, region relations, policies, grants, functions and all overloads.
2. Verify `admin_provinsi`→province and `admin_kab_kota`→kab/kota actor mappings; fail closed if unresolved.
3. Freeze public, self-profile, admin-list, detail and contact data contracts.
4. Map every profile-table consumer and replace incompatible consumers in a separately reviewed application release.
5. Add/harden the narrow RPC and test it before relying on it.
6. Repoint detail/list clients; remove wildcard reads and unnecessary `.select()` return projections.
7. Cut over raw table policies/grants and legacy functions only after dependent clients are ready.
8. Run static, catalog, and actor-level tests in test project; capture evidence and rollback snapshot.
9. Seek explicit approval for any later test migration. Production remains out of scope.

## Validation Queries and Tests

Before any migration, use read-only catalog queries against the verified test target to capture:

- table existence, columns, nullability, primary/foreign keys, RLS enabled/forced;
- `pg_policies` for all relevant tables;
- table/column privileges for anon, authenticated, service_role;
- all function identities/signatures, owners, `prosecdef`, `proleakproof`, `proconfig`/search path, source definitions and routine privileges;
- dependent views, triggers, and client consumers.

Do not execute these queries until a read-only connection proves `shorsqyycpptxcutrqrb`. Do not select application contact/profile values during metadata inventory.

After a separately approved implementation, test direct REST and RPC paths for anon, ordinary authenticated, admin province, same-region/cross-region admin city, referee self, and referee-other. Include altered UUID/region parameters, public list safety, email/WhatsApp visibility, null contact, generic denial behavior, and all legacy overloads. Actor testing remains blocked until approved sessions and frozen fixtures are available.

## Rollback Plan

Exact rollback is impossible to specify safely before capturing live pre-state. Before implementation, archive:

- complete definitions and names of every affected policy, including roles, command, `USING`, and `WITH CHECK`;
- all affected function overloads, argument defaults/names, return types, body, owner, security mode, `search_path`, and EXECUTE grants;
- table/column grants and relevant default privileges;
- frontend version/dependency map and public/self-service endpoint behavior.

A later rollback must reverse only the approved operations, restore the captured exact definitions/grants/signatures in dependency order, and re-run the security tests. Do not use `DROP ... CASCADE`. Restoring a vulnerable pre-state can reintroduce exposure; rollback approval must explicitly account for that risk. No rollback SQL is written here.

## Final Gate

`PHASE B.3 BLOCKED — SCHEMA DEPENDENCY UNVERIFIED`

The province actor mapping, live policies/grants, function overloads, owners, and search paths are not verified. This is a plan only; no migration, database change, frontend change, or deployment was performed.
