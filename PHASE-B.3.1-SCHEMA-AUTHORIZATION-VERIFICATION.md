# PHASE B.3.1 — Schema & Authorization Verification

**Result: `PHASE B.3.1 BLOCKED — DEPENDENCY UNRESOLVED`**

## 1. Environment Confirmation

- Intended target: TEST `shorsqyycpptxcutrqrb` (`test APP`).
- Production `xfscfjwapwnkiinkgbjg` was not accessed.
- Previously verified test-mode environment selection identifies the intended project, but that is not proof of a live database session.
- No database identity query or catalog query was run in this phase. The database connector was unavailable in the preceding phases; it was not retried.

## 2. Read-Only Execution Confirmation

- Database execution: **none**.
- Application data rows read: **none**.
- Schema/catalog metadata read from live DB: **none**.
- DDL, DML, grants, policies, functions, migration, source code, and deployment: **unchanged**.
- Findings below are labeled as migration/source evidence or project-owner-supplied baseline, not as fresh database verification.

## 3. Schema Evidence

### MIGRATION-SOURCE / GENERATED-TYPES ONLY

The tracked `20260103165842_remix_migration_from_pg_dump.sql` and generated Supabase types show the following candidate shape:

| Relation | Columns/keys found in source artifacts | Evidence status |
|---|---|---|
| `profiles` | `id` UUID; `kabupaten_kota_id` UUID; profile fields. A later migration adds `email`; generated types include it. | Not live-verified |
| `kabupaten_kota` | `id` UUID, `name`, nullable `provinsi_id` UUID. | Not live-verified |
| `provinsi` | `id` UUID, `name`, `code`. | Not live-verified |
| `event_assignments` | `id`, `event_id`, `referee_id`, role/status/timestamps/deleted marker in the source snapshot. | Not live-verified |
| `referee_contacts` | A later phase migration defines `id`, unique `referee_id`, `whatsapp_number`, timestamps. | Not live-verified |

No live column inventory, primary key inventory, nullability check, or constraint inventory was obtained. A `phone` column was not found in the inspected profile source/types, but live presence is not ruled out.

## 4. FK / Relationship Evidence

### MIGRATION-SOURCE ONLY

- `profiles.id` is a profile identity key and the initial schema references `auth.users(id)`.
- `profiles.kabupaten_kota_id` has a source FK to `kabupaten_kota.id`.
- `kabupaten_kota.provinsi_id` has a source FK to `provinsi.id`; the source column is nullable and its FK uses `ON DELETE SET NULL`.
- `event_assignments.referee_id` has a source FK to `profiles.id`.
- `referee_contacts.referee_id` is unique and has a source FK to `profiles.id`.
- Source artifacts also contain `pengurus.user_id`, `pengurus.level`, `pengurus.provinsi_id`, and `pengurus.kabupaten_kota_id`; no verified unique/active mapping from every `admin_provinsi` role to an authoritative province was established.

These migration relationships may differ from the deployed test schema. They cannot be treated as live FK evidence.

## 5. Province Mapping Conclusion

**Can `admin_provinsi` authorization be implemented safely from the currently verified schema without guessing province membership? NO.**

The source provides a possible target chain `profiles.kabupaten_kota_id -> kabupaten_kota.provinsi_id -> provinsi.id`, but:

- it is not verified against the live test schema;
- `kabupaten_kota.provinsi_id` is nullable in the migration source and can be set NULL by the FK action;
- no live, authoritative actor-to-province relation or resolver was verified;
- the presence of `pengurus.provinsi_id` in source does not prove the admin role is uniquely/actively bound to that row.

Do not infer province membership from a null city, role name, or client-supplied region. A live mapping and its constraints must be verified before finalizing the predicate.

## 6. Profiles Policy Analysis

### PROJECT-OWNER-SUPPLIED EFFECTIVE BASELINE (not independently re-queried)

The supplied baseline reports RLS enabled; anon and authenticated SELECT privileges; and these policies:

| Policy | Supplied expression/behavior | Live status in this phase |
|---|---|---|
| `Public can view referee profiles` | `deleted_at IS NULL` | Not re-verified |
| `Admins can view all profiles` | `is_admin(auth.uid())` | Not re-verified |
| `Admin kab_kota can view profiles in their region` | Region-scoped predicate | Not re-verified |
| `Admin provinsi can view all profiles` | Province-admin predicate | Not re-verified |
| `Users can view their own profile` | Own profile predicate | Not re-verified |

The supplied baseline plus supplied `is_admin()` definition indicates the broad admin policy may include `admin_kab_kota` without an independent region predicate. This is a potential direct-table bypass of a detail RPC, but no actor/API request was executed. Effective policy composition and actual direct access remain **NOT VERIFIED**.

## 7. Referee-Contact Policy Analysis

### PROJECT-OWNER-SUPPLIED EFFECTIVE BASELINE (not independently re-queried)

The supplied baseline reports RLS enabled, anon SELECT false, authenticated table SELECT, and a SELECT policy equivalent to:

`auth.uid() = referee_id AND has_role(auth.uid(), 'wasit')`.

The migration-source schema has unique `referee_id` referencing `profiles.id` and `whatsapp_number`. No contact values were read. Live INSERT/UPDATE/DELETE policies, grants, other policies, constraints, and actual direct-table visibility were not verified. The supplied self-only predicate does not itself authorize admin contact access, but its effective runtime outcome was not tested.

## 8. Role-Helper Analysis

### MIGRATION-SOURCE ONLY

| Helper | Source evidence | Live signature/security/grants |
|---|---|---|
| `has_role(_user_id uuid, _role app_role)` | Initial migration defines SQL `SECURITY DEFINER`, `STABLE`, `search_path=public`; queries `user_roles` using passed user ID and role. It does not derive the user ID internally from `auth.uid()`. | NOT VERIFIED |
| `is_admin(_user_id uuid)` | Migration defines SQL `SECURITY DEFINER`, `STABLE`, `search_path=public`; source role set includes `admin`, `admin_provinsi`, and `admin_kab_kota`. | NOT VERIFIED |
| `is_admin_provinsi(_user_id uuid)` | Migration source checks `admin`/`admin_provinsi`. | NOT VERIFIED |
| `is_admin_kab_kota(_user_id uuid)` | A migration defines a role check for `admin_kab_kota`. | NOT VERIFIED |
| `get_user_kabupaten_kota_id(_user_id uuid)` | Migration source reads the user's `profiles.kabupaten_kota_id`. | NOT VERIFIED |
| `get_user_kabupaten_kota(_user_id uuid)` | Referenced by migration-source policies/functions and generated types; its effective deployed definition was not obtained. | NOT VERIFIED |
| `_resolve_admin_scope()` | No definition was found in the inspected tracked migration/frontend search. Supplied `get_admin_referees` baseline describes scope resolution, but does not establish this helper exists. | NOT VERIFIED / existence unknown |

No live EXECUTE privileges, owners, `proleakproof`, exact volatility/search path, overloads, or bypass behavior were queried. Do not reuse these helpers for a new privileged boundary until live definitions and call semantics are inspected. In particular, `is_admin()` alone is not an adequate city-region predicate according to the supplied role membership.

## 9. Existing RPC Inventory

### DATABASE-ACTUAL

All signatures, bodies, return columns, security modes, owners, search paths, overloads, dependencies, and EXECUTE grants: **NOT VERIFIED in this phase**.

### MIGRATION-SOURCE / SUPPLIED BASELINE

| RPC | Evidence and current conclusion |
|---|---|
| `get_referees` | Tracked migrations contain differing definitions, including four-argument definitions and differing region logic. Frontend/generated types expect pagination arguments. The supplied effective baseline describes a six-argument `SECURITY DEFINER` function executable by anon/authenticated with insufficiently established admin-region authorization. Treat as `BASELINE AUTHORIZATION DESIGN FAILURE`; actual actor behavior remains not tested. Do not use as the new auth boundary. |
| `get_admin_referees` | Not found in tracked active migration source/frontend consumer search. Supplied baseline gives a six-argument signature, `SECURITY DEFINER`, authenticated EXECUTE, anon denied, and explicit `admin_kab_kota` region enforcement. Actual definition/body/grants are not verified. |
| `get_admin_referee_count` | No definition/consumer found in inspected tracked migration/frontend search. Live existence is unknown. |
| `get_public_referee(s)` | Migration source defines public-safe explicit return columns and `SECURITY DEFINER` with `search_path=public`; public review frontend calls these RPCs. Live body/grants/search path are not verified. |
| `is_admin` | Migration-source definition is described in section 8. Supplied baseline states actual role inclusion; live definition is not independently verified. |

`get_referees()` has conflicting historical/source contracts. Its actual deployed overload set cannot be determined from migration filenames or generated types.

## 10. Frontend Consumer Inventory

Static source search only:

| Consumer/path | Access pattern | Authorization observation |
|---|---|---|
| `src/hooks/useReferees.ts` list/count/stats | Calls `get_referees()` with filters and, in paginated paths, `_limit`/`_offset`. | Client does not establish server authorization. |
| `src/hooks/useReferees.ts` / `useReferee()` | Direct `profiles.select("*")` plus kabupaten relation; then separately queries `user_roles` for `wasit`. | Wildcard detail is excessive; role check occurs after profile data retrieval and is not a security boundary. |
| `src/pages/RefereeDetail.tsx` | Consumes `useReferee`; page/admin guards are UX routing controls. | Must not be treated as backend authorization. |
| `src/hooks/useProfile.ts` | `profiles.select("*")` for own profile and unqualified returning `.select()` after update. | Self path by user ID; wildcard/return projection should be narrowed independently. |
| `src/hooks/useRefereeContact.ts` | Explicit fields from `referee_contacts`, filtered by current user's own ID; upsert own row. | Self-service only; frontend filter does not replace RLS. |
| `src/hooks/useEventAssignments.ts`, `src/hooks/useSmartAssignment.ts` | Additional `get_referees()` consumers. | Must be migrated/contract-checked before retiring the RPC. |
| Public review/list hooks | Use `get_public_referees()` and `get_public_referee()`; also query review stats. | Preserve safe public behavior through explicit public projections, subject to live RPC verification. |
| Other source modules | Direct profile queries appear in users/import, analytics/reports, discussions, evaluations, assignment, incomplete-profile, organization, referee-card, and auth/profile repositories. | Exact actor, fields, and policy dependency must be inventoried before table grant/policy restriction. |

Frontend changes will be required before removing any direct SELECT privileges/policies on which these consumers rely. No source was modified.

## 11. Event-Assignment Authorization Analysis

Migration-source `event_assignments.referee_id` references `profiles.id`; source includes assignment status and deletion markers. Static `useRefereeEvents()` filters assignments to the current referee's own ID. No explicit business rule was found authorizing a referee to receive another referee's private contact merely because an assignment exists.

**Conclusion: `ASSIGNMENT RELATIONSHIP INSUFFICIENT/AMBIGUOUS`.** The schema/source relationship alone does not establish contact-sharing authorization, and live assignment rows/policies were not inspected. Cross-referee sharing remains denied unless a separately approved rule is established.

## 12. Required Detail-RPC Dependencies

A dedicated `get_referee_detail(p_referee_id uuid)` is a suitable candidate boundary, but its schema dependencies are not sufficiently verified to finalize it. A later implementation would need, at minimum:

- `auth.uid()` and verified role resolution via `user_roles`;
- target referee identity/profile and role membership;
- target region through `profiles.kabupaten_kota_id` and `kabupaten_kota`;
- a verified authoritative admin kab/kota region resolver;
- a verified admin-province-to-province resolver and target province relation;
- `referee_contacts` only after authorization passes;
- explicit columns, no wildcard; no client-supplied region used as authority;
- verified function ownership, RLS interaction, search path, and restricted EXECUTE grants.

`wasit` should receive own-profile/own-contact access only; other-referee access remains denied absent an explicit approved business rule. Whether the final function is `SECURITY DEFINER` or `SECURITY INVOKER` cannot be selected until live grants/RLS and owner behavior are known.

## 13. Authorization Matrix

No cell below is an actor-level test result. Since this phase has no verified live catalog and no authenticated sessions, uncertain cells remain `NOT VERIFIED`.

| Actor | Own profile | Own contact | Same-region referee | Foreign-region referee | Other referee contact |
|---|---|---|---|---|---|
| `admin_provinsi` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED; province actor mapping unresolved | NOT VERIFIED |
| `admin_kab_kota` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED by request; supplied broad profile policy is a potential bypass | NOT VERIFIED |
| `wasit` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED; target is another referee | NOT VERIFIED; target is another referee | NOT VERIFIED |
| Ordinary authenticated | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `anon` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

## 14. BOLA / IDOR Test Prerequisites

After live schema/target and approved actor fixtures are available, test read-only paths:

1. direct `profiles` query by foreign `id`;
2. direct `referee_contacts` query by foreign `referee_id`;
3. `get_referee_detail(foreign_id)` after the function exists in a later approved implementation;
4. each live `get_referees()` overload;
5. `get_admin_referees()`;
6. altered kabupaten parameter;
7. altered province parameter, only if the verified schema has an authoritative province scope.

No actor-level test was executed here.

## 15. Unresolved Dependencies

- Live test DB identity and schema/catalog evidence.
- Exact deployed columns, nullability, PK/FK/unique/check constraints and RLS/FORCE RLS.
- Authoritative admin-province actor-to-province relation and cardinality.
- Effective policy expressions and all permissive policy interactions.
- Effective table/column grants and function EXECUTE grants.
- Live definitions/overloads of role, region, list, count, and detail functions; owners and safe `search_path`.
- Exact consumer dependencies and replacement contracts for direct `profiles` queries.
- Existing authenticated test sessions/fixtures for subsequent actor-level verification.

## 16. Exact Recommendation for the Next Phase

First establish an approved read-only database connection that proves project ref `shorsqyycpptxcutrqrb`; then query only catalog/schema metadata to verify the items above. In particular, resolve the authoritative `admin_provinsi` scope before finalizing a province predicate. After schema, policy, function, grant, and consumer inventories are evidenced, update the B.3 remediation design and migration plan. Do not draft/apply migration SQL or implement contact UI before that gate passes.

# Gate

`PHASE B.3.1 BLOCKED — DEPENDENCY UNRESOLVED`

No migration was produced or applied. No actor-level authorization PASS is claimed. No database or source code was changed.
