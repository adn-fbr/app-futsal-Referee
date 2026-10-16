# PHASE B.3.1-R — Live Schema & Authorization Verification

**Result: `PHASE B.3.1-R BLOCKED — DEPENDENCY UNRESOLVED`**

Live read-only catalog verification succeeded against the TEST project. The remaining blocker is the authoritative `admin_provinsi` → province mapping and the resulting province-scoped authorization predicate. No actor-level runtime requests were made.

## 1. Database Identity Evidence

Project metadata lookup and project-scoped SQL call:

| Evidence | Result |
|---|---|
| Supabase project name | `test APP` |
| Project ref | `shorsqyycpptxcutrqrb` |
| Project status | `ACTIVE_HEALTHY` |
| `current_database()` | `postgres` |
| `current_user` / `session_user` | `postgres` / `postgres` |
| `current_schema()` | `public` |
| PostgreSQL version | `PostgreSQL 17.6 on x86_64-pc-linux-gnu` |
| Request JWT role setting | `NULL` |
| Authenticated subject present | `false` |

The project ref is established by the selected project-scoped connector metadata and the SQL executed with that exact project ID. SQL ran as database role `postgres`, not as an authenticated application actor. This is catalog evidence, not actor-level authorization testing.

## 2. Environment Confirmation

- Only TEST project `shorsqyycpptxcutrqrb` was queried.
- Production project `xfscfjwapwnkiinkgbjg` was not queried or accessed.
- No credentials, secrets, application rows, email values, or WhatsApp/contact values were read.

## 3. Read-Only Confirmation

Every database statement in this phase was a `SELECT` over project metadata or PostgreSQL catalogs (`pg_catalog`, `pg_policies`, privilege metadata, `pg_get_functiondef`). No DDL, DML, grant, revoke, migration, or deployment was executed. The connector runs SQL as `postgres` and is not itself a read-only database role; the executed query set was restricted to reads by this phase.

## 4. Live Table / Column Inventory

All listed relations exist as ordinary tables (`relkind='r'`). Each has RLS enabled and `FORCE ROW LEVEL SECURITY` disabled.

| Relation | Columns (type; nullable `?`) |
|---|---|
| `public.profiles` | `id uuid`; `full_name text`; `birth_date date?`; `occupation text?`; `kabupaten_kota_id uuid?`; `afk_origin text?`; `license_level text?`; `license_expiry date?`; `profile_photo_url text?`; `license_photo_url text?`; `ktp_photo_url text?`; `is_active boolean?`; `is_profile_complete boolean?`; `registration_status text?`; `requested_role text?`; `rejected_reason text?`; `approved_at timestamptz?`; `approved_by uuid?`; `deleted_at timestamptz?`; `created_at timestamptz?`; `updated_at timestamptz?`; `email text?` |
| `public.user_roles` | `id uuid`; `user_id uuid`; `email text?`; `role app_role?` |
| `public.referee_contacts` | `id uuid`; `referee_id uuid`; `whatsapp_number text`; `created_at timestamptz`; `updated_at timestamptz` |
| `public.kabupaten_kota` | `id uuid`; `provinsi_id uuid?`; `name text`; `code text?`; `created_at timestamptz?`; `updated_at timestamptz?` |
| `public.provinsi` | `id uuid`; `name text`; `code text?`; `created_at timestamptz?`; `updated_at timestamptz?` |
| `public.event_assignments` | `id uuid`; `event_id uuid`; `referee_id uuid`; `role text?`; `status text?`; `cancelled_by uuid?`; `cancellation_reason text?`; `deleted_at timestamptz?`; `created_at timestamptz?`; `updated_at timestamptz?` |
| `public.pengurus` | `id uuid`; `user_id uuid`; `level pengurus_level`; `jabatan text`; `provinsi_id uuid?`; `kabupaten_kota_id uuid?`; `is_active boolean?`; `created_at timestamptz?`; `updated_at timestamptz?` |

No `phone` column exists in the live `profiles` column inventory. No contact values were queried.

## 5. PK / FK / Unique-Constraint Evidence

| Relation | Live constraints |
|---|---|
| `profiles` | PK `(id)`; FK `id -> auth.users(id)`; FK `kabupaten_kota_id -> public.kabupaten_kota(id)` |
| `user_roles` | PK `(id)`; FK `user_id -> auth.users(id)`; no unique constraint was returned for `(user_id, role)` |
| `referee_contacts` | PK `(id)`; UNIQUE `(referee_id)`; FK `referee_id -> public.profiles(id)`; CHECK `whatsapp_number ~ '^62[0-9]{9,13}$'` |
| `kabupaten_kota` | PK `(id)`; FK `provinsi_id -> public.provinsi(id)`; `provinsi_id` nullable |
| `provinsi` | PK `(id)` |
| `event_assignments` | PK `(id)`; UNIQUE `(event_id, referee_id)`; FK `event_id -> public.events(id)`; FK `referee_id -> public.profiles(id)`; CHECK on `status` values `pending`, `confirmed`, `declined`, `cancelled` |
| `pengurus` | PK `(id)`; FK `user_id -> auth.users(id)`; FK `provinsi_id -> public.provinsi(id)`; FK `kabupaten_kota_id -> public.kabupaten_kota(id)`; no unique or scope-consistency check constraint returned |

No profile phone column or separate phone relationship was found.

## 6. Province Mapping

The target referee path exists structurally:

`profiles.kabupaten_kota_id -> kabupaten_kota.id -> kabupaten_kota.provinsi_id -> provinsi.id`.

### A. Can the target referee's province be determined reliably?

**Only conditionally.** For a target whose `profiles.kabupaten_kota_id` and referenced `kabupaten_kota.provinsi_id` are non-null, the live FKs lead to a valid province row. Both region columns are nullable, so schema alone does not guarantee every referee has a province. No data rows were inspected to determine fixture population.

### B. Can the acting `admin_provinsi`'s province be determined reliably?

**NO — NOT VERIFIED / no authoritative binding established.** `pengurus` has `user_id`, `level`, `provinsi_id`, and `is_active`, with FKs for user and province, but no unique binding, no constraint tying `level` to the corresponding non-null scope column, and no FK from `pengurus.user_id` to `user_roles.user_id`. No actor rows were queried. The live `_resolve_admin_scope()` function does not consult `pengurus` and returns only the actor's kabupaten/kota ID.

### C. Can the scopes be compared server-side without client-supplied authority?

**NO with the current verified helper/function design.** The target province can be resolved conditionally, but there is no verified authoritative actor province resolver. The supplied region parameter in admin referee RPCs is not checked against a province derived for `admin_provinsi`.

`PROVINCE SCOPE UNRESOLVED`.

## 7. `profiles` RLS / Policies / Grants

Live table flags: **RLS enabled = true; FORCE RLS = false**.

Live table privileges from `has_table_privilege`:

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---:|---:|---:|---:|
| `anon` | true | true | true | true |
| `authenticated` | true | true | true | true |
| `service_role` | true | true | true | true |

These are table privileges, not proof that a row operation passes RLS. No write was attempted.

Live policies (`roles={public}` means the policy applies to public roles, including anon/authenticated):

| Policy | Command | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Public can view referee profiles` | SELECT | `{public}` | `deleted_at IS NULL` | — |
| `Admins can view all profiles` | SELECT | `{authenticated}` | `is_admin(auth.uid())` | — |
| `Admin kab_kota can view profiles in their region` | SELECT | `{public}` | `has_role(auth.uid(),'admin_kab_kota') AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())` | — |
| `Admin provinsi can view all profiles` | SELECT | `{public}` | `is_admin_provinsi(auth.uid())` | — |
| `Users can view their own profile` | SELECT | `{public}` | `auth.uid() = id` | — |
| `Admins can update all profiles` | UPDATE | `{authenticated}` | `is_admin(auth.uid())` | omitted; defaults to USING |
| `Admin kab_kota can update profiles in their region` | UPDATE | `{public}` | `has_role(...admin_kab_kota) AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())` | omitted; defaults to USING |
| `Admin provinsi can update all profiles` | UPDATE | `{public}` | `is_admin_provinsi(auth.uid())` | omitted; defaults to USING |
| `Users can update their own profile` | UPDATE | `{public}` | `auth.uid() = id` | omitted; defaults to USING |
| `Users can insert their own profile during signup` | INSERT | `{public}` | — | `auth.uid() = id` |
| `Admin provinsi can insert profiles` | INSERT | `{public}` | — | `is_admin_provinsi(auth.uid())` |

The actual `is_admin(uuid)` body includes both `admin_provinsi` and `admin_kab_kota`. Because permissive policies combine, the broad authenticated policy permits an `admin_kab_kota` role to read foreign-city profiles even when the separate city policy is scoped. The public policy also permits anon and ordinary authenticated callers to read any non-deleted profile row, subject only to the table's RLS filter. Since `email` is a live profile column and the policy is row-level rather than column-level, raw SELECT can expose email and other profile columns for qualifying rows.

For UPDATE policies where `WITH CHECK` is omitted, PostgreSQL applies the `USING` expression as the default check expression; the table records the catalog's null `with_check` value and the effective default here.

**Direct profiles SELECT bypass: CONFIRMED at live policy/grant level.** No actor HTTP request was made.

## 8. `referee_contacts` RLS / Policies / Grants

Live table flags: **RLS enabled = true; FORCE RLS = false**.

Live table privileges:

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---:|---:|---:|---:|
| `anon` | false | false | false | false |
| `authenticated` | true | true | true | false |
| `service_role` | true | true | true | true |

Live policies (`{public}` applies to public roles; the `auth.uid()`/`has_role` predicates still restrict rows):

| Policy | Command | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Referees can view their own whatsapp contact` | SELECT | `{public}` | `auth.uid() = referee_id AND has_role(auth.uid(),'wasit')` | — |
| `Referees can insert their own whatsapp contact` | INSERT | `{public}` | — | `auth.uid() = referee_id AND has_role(auth.uid(),'wasit')` |
| `Referees can update their own whatsapp contact` | UPDATE | `{public}` | `auth.uid() = referee_id AND has_role(auth.uid(),'wasit')` | same predicate |

No DELETE policy was found. Authenticated has direct table SELECT privilege but the only live SELECT policy is self-referee/wasit-scoped; there is no admin contact SELECT policy. Therefore schema/policy analysis denies other-row contact access for ordinary users/admins, but this was not actor-tested. No WhatsApp values were queried.

## 9. Role Helper Definitions

All listed function owners are `postgres`; all are `SECURITY DEFINER`, `proleakproof=false`, and have `proconfig={search_path=public}`. `STABLE` functions are marked `s`; `VOLATILE` functions are `v`.

| Function | Signature / return | Volatility | EXECUTE anon | EXECUTE authenticated |
|---|---|---:|---:|---:|
| `has_role` | `(_user_id uuid, _role app_role) -> boolean` | STABLE | true | true |
| `is_admin` | `(_user_id uuid) -> boolean` | STABLE | true | true |
| `is_admin_provinsi` | `(_user_id uuid) -> boolean` | STABLE | true | true |
| `is_admin_kab_kota` | `(_user_id uuid) -> boolean` | STABLE | true | true |
| `get_user_kabupaten_kota` | `(_user_id uuid) -> uuid` | STABLE | true | true |
| `get_user_kabupaten_kota_id` | `(_user_id uuid) -> uuid` | STABLE | true | true |
| `_resolve_admin_scope` | `() -> TABLE(user_id uuid, admin_role app_role, kabupaten_kota_id uuid)` | STABLE | false | false |

Live helper body behavior:

- `has_role` checks `public.user_roles` for exactly the caller-supplied `_user_id` and `_role`; it does not internally require `_user_id=auth.uid()`.
- `is_admin` checks `user_roles.role IN ('admin_provinsi','admin_kab_kota')`. Thus **YES**, both roles are included.
- `is_admin_provinsi` checks only `admin_provinsi`; `is_admin_kab_kota` checks only `admin_kab_kota`.
- Both city-region getters return `profiles.kabupaten_kota_id` for the supplied `_user_id`; neither requires that argument to equal `auth.uid()`.
- `_resolve_admin_scope` derives `v_uid := auth.uid()`, rejects null/non-admin callers, selects role/profile city for the authenticated actor, prioritizes `admin_provinsi` if multiple roles exist, and returns only `user_id`, `admin_role`, `kabupaten_kota_id`. It has no province field and does not inspect `pengurus`.

Since `has_role`, `is_admin`, `is_admin_provinsi`, `is_admin_kab_kota`, and city getters are executable by anon and accept arbitrary user IDs, they expose role/scope lookup behavior to callers who can guess/know a UUID. This is a metadata disclosure/boundary concern; no function was invoked with an arbitrary actor ID in this phase.

## 10. Existing Referee RPCs

One live overload each was found for `get_referees`, `get_admin_referees`, `get_admin_referee_count`, `get_public_referee`, and `get_public_referees`. All are owned by `postgres`, `SECURITY DEFINER`, `proleakproof=false`, `search_path=public`.

| Function | Live signature and return columns | Volatility | EXECUTE anon/authenticated |
|---|---|---:|---|
| `get_referees` | `(_license_level text, _is_active boolean, _kabupaten_kota_id uuid, _search text, _limit integer, _offset integer)` → `id, full_name, birth_date, kabupaten_kota_id, license_level, license_expiry, profile_photo_url, is_active, is_profile_complete, afk_origin, created_at` | VOLATILE | true / true |
| `get_admin_referees` | `(_license_level text, _is_active boolean, _kabupaten_kota_id uuid, _search text, _limit integer, _offset integer)` → `id, full_name, kabupaten_kota_id, license_level, license_expiry, profile_photo_url, is_active, is_profile_complete, afk_origin, created_at` | VOLATILE | false / true |
| `get_admin_referee_count` | `(_license_level text, _is_active boolean, _kabupaten_kota_id uuid, _search text)` → `bigint` | VOLATILE | false / true |
| `get_public_referee` | `(_referee_id uuid)` → `id, full_name, profile_photo_url, license_level, afk_origin, kabupaten_kota_name, is_active` | STABLE | true / true |
| `get_public_referees` | `(_search text, _is_active boolean)` → same public-safe columns as above | STABLE | true / true |

### Live authorization/source findings

- `get_referees` has one live six-argument overload (no live conflicting overload). It is `SECURITY DEFINER`, callable by anon/authenticated, and has no role/region authorization. The only public/auth distinction is `(auth.role()='authenticated' OR p.is_active=true)`. `_kabupaten_kota_id` is merely a filter. It does not filter `deleted_at`. It returns `birth_date`. **UNSAFE as an authorization boundary.**
- Its `_limit` defaults to NULL and is passed directly to `LIMIT`; a NULL limit is unbounded. `_offset` defaults to zero. There is no server-side maximum page size in this function.
- `get_admin_referees` and `get_admin_referee_count` call `_resolve_admin_scope()`. For `admin_kab_kota`, they require a non-null requested `_kabupaten_kota_id` equal to the actor's server-derived city; otherwise raise `FORBIDDEN_REGION_SCOPE`. For `admin_provinsi`, they set `v_region := _kabupaten_kota_id` without resolving or comparing province. NULL means all regions; any supplied city is accepted as a filter. City scope is enforced, province scope is not.
- `get_admin_referees` clamps limit to 1–100 and offset to >=0; filters role `wasit`, excludes deleted profiles, and supports license, active, and name search. `get_admin_referee_count` applies the same role/region/filter logic without pagination.
- `get_public_referee(s)` return explicit public fields, filter to referee role and approved/complete/non-deleted profiles; list optionally filters active/search. They do not return email or WhatsApp.
- No live `get_referee_detail` function was found.

A catalog dependency probe using `pg_depend` returned no rows for the inspected routines. Function-body inspection does reveal dependencies, which are listed here: referee list/count functions use `profiles`, `user_roles`, and `_resolve_admin_scope`; that resolver uses `user_roles`, `profiles`, and `auth.uid()`; public referee functions use `profiles`, `user_roles`, and `kabupaten_kota`; role/region helpers use `user_roles` or `profiles`. PostgreSQL does not record every SQL/PLpgSQL body reference as a catalog dependency, so the empty `pg_depend` result is not evidence of no dependencies.

The `get_referees` live signature has six arguments, while tracked migration history includes older four-argument definitions. Generated types/front-end use the six-argument form; live return columns differ from the UI's expected `kabupaten_kota_name` field and include `birth_date`.

## 11. Event Assignment Relationship

Live `event_assignments` has FK `referee_id -> profiles.id`, FK `event_id -> events.id`, unique `(event_id, referee_id)`, nullable text `role` (default `referee`), nullable text `status` (default `pending`; check permits `pending`, `confirmed`, `declined`, `cancelled`), and nullable `deleted_at`.

Policies allow authenticated admin management under province/city/panitia predicates and referees to view/update their own assignments. The schema/policies establish assignment row access, not permission to read another referee's private contact.

**`ASSIGNMENT RELATIONSHIP DOES NOT AUTHORIZE PRIVATE CONTACT`.** No assignment rows were read.

## 12. Frontend Consumer Cross-Check

Static source inspection only; no code changed:

- `useReferees.ts` calls `get_referees()` for list/count/stats; it sends the six live arguments including pagination where applicable.
- `useReferee()` directly calls `profiles.select("*")` with a kabupaten relation, then separately checks `user_roles`; that post-fetch client check is not authorization.
- `useEventAssignments.ts` and `useSmartAssignment.ts` also call `get_referees()`; no frontend consumer of `get_admin_referees()` was found.
- `useRefereeContact()` selects explicit contact fields for the signed-in user's own ID and upserts own contact; it is not an arbitrary-ID admin detail path.
- `useProfile.ts` reads `profiles.select("*")` for the current profile and uses an unqualified `.select()` after update.
- Public review list/detail use `get_public_referees()` / `get_public_referee()`.
- Other direct profile reads exist in users/import, analytics/reports, discussions, evaluations, assignments, incomplete-profile, organization, referee-card, and auth/profile flows.

A dedicated `get_referee_detail(p_referee_id uuid)` can replace the referee detail hook, but direct-table policy changes will require auditing/migrating all other consumers and their required columns first.

## 13. Authorization Matrix

The following are **policy/function conclusions from live metadata**, not actor request results. Runtime behavior with actor sessions remains untested.

| Actor | Own profile | Own contact | Same-region referee profile | Foreign-region referee profile | Other referee contact |
|---|---|---|---|---|---|
| `admin_provinsi` | Policy ALLOW | NOT VERIFIED as role-combination; contact policy requires `wasit` | Policy ALLOW | **Policy ALLOW** via all-profile admin/province policies; no province predicate | Policy DENY unless target is own ID and actor also has `wasit` |
| `admin_kab_kota` | Policy ALLOW | NOT VERIFIED as role-combination; contact policy requires `wasit` | Policy ALLOW | **Policy ALLOW** via broad `Admins can view all profiles` + live `is_admin` | Policy DENY |
| `wasit` | Policy ALLOW | Policy ALLOW for own ID | **Policy ALLOW** via public non-deleted profile policy | **Policy ALLOW** via public non-deleted profile policy | Policy DENY |
| Ordinary authenticated | Policy ALLOW for own profile | DENY unless also `wasit` and own ID | **Policy ALLOW** via public non-deleted profile policy | **Policy ALLOW** via public non-deleted profile policy | Policy DENY |
| `anon` | N/A as no subject; any known non-deleted profile row is policy-visible | DENY (no table SELECT privilege) | **Policy ALLOW** for non-deleted profiles | **Policy ALLOW** for non-deleted profiles | DENY |

No authenticated actor or anon REST request was issued. These are structural policy results; they do not substitute for actor-level testing.

## 14. BOLA / IDOR Test Preconditions

Required later read-only actor tests:

1. direct `profiles` query by foreign profile ID;
2. direct `referee_contacts` query by foreign `referee_id`;
3. `get_referee_detail(foreign_id)` after a future approved implementation;
4. anon/ordinary/admin/wasit calls to live `get_referees()`;
5. admin calls to `get_admin_referees()` with own, foreign, and NULL city IDs;
6. alternate province parameter for `admin_provinsi`;
7. same/cross-region calls with verified fixtures and authenticated sessions.

No actor sessions/fixture rows were used or created. No BOLA request was executed.

## 15. Unresolved Dependencies

- Authoritative binding of an `admin_provinsi` actor to a province; `pengurus` is not constrained as a unique/role-linked mapping, and `_resolve_admin_scope` does not use it.
- Whether every referee has a non-null city/province mapping; the live columns allow nulls. No application rows were read.
- Actor-level runtime behavior and exact HTTP outcomes; this catalog connection ran as `postgres`, not as anon/authenticated actor sessions.
- Exhaustive consumer requirements before direct profile grants/policies are restricted.
- Safe `SECURITY DEFINER` owner/search-path hardening; live functions use `search_path=public`, and several call helpers unqualified within that path.

## 16. Exact Next-Phase Recommendation

1. Treat public/broad direct profile access and `get_referees()` as confirmed live design exposures; keep contact access self-scoped.
2. Do not finalize province authorization until an authoritative admin-to-province relationship and non-null/unique scope semantics are verified. Current `get_admin_referees()` does not enforce province scope.
3. Freeze approved actor sessions/fixtures and run the BOLA/API tests without database-owner credentials.
4. Map all direct `profiles` consumers and move detail/list/self/public paths to explicit, appropriately authorized contracts before restricting direct SELECT.
5. Design and statically validate remediation only after the above dependencies are resolved; do not apply a migration in this phase.

# Final Gate

`PHASE B.3.1-R BLOCKED — DEPENDENCY UNRESOLVED`

Live test identity, catalog metadata, policies, table privileges, function definitions, and overloads are verified. The unresolved critical dependency is an authoritative, server-verifiable `admin_provinsi` → province binding; the current admin list functions accept caller-supplied province/city filtering for province admins rather than enforce actor province scope. No actor-level authorization PASS, migration, or production operation is claimed.
