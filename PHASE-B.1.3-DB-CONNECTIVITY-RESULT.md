# PHASE B.1.3 — DB Connectivity Result

## A. Connection Status

**BLOCKED**

- Connector: available database connector tool was previously invoked; it returned `Connection not found`.
- Selected database connection: none.
- Connection mode: none established.
- Read-only status: not established because no database connection is configured.
- Retry policy: no further attempts were made.
- CLI: project-list/link metadata can identify a project, but does not provide SQL access. The installed CLI exposes database dump and migration-list commands that require a database password. No password was requested.
- No authenticated SQL editor/connector with a usable connection was found.

## B. Target Identity Evidence

The required identity query was **NOT RUN** because there is no database connection:

```sql
select
  current_database() as current_database,
  current_user as current_user,
  version() as server_version;
```

No database identity result is available.

## C. Project Identity

**The database connection is NOT proven to target `shorsqyycpptxcutrqrb`.**

Previously verified environment and CLI link metadata identify the intended test project, but neither proves the identity of a database session. The production project was not queried.

## D. Effective Table Inventory

No live database metadata was queried. All fields below are **NOT VERIFIED**.

| Table | Exists | RLS enabled | Forced RLS | Columns / keys | Table privileges |
|---|---|---|---|---|---|
| `public.profiles` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `public.referee_contacts` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `public.user_roles` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `public.event_assignments` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `public.kabupaten_kota` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

## E. Effective Policy Inventory

Effective database policies for `profiles`, `referee_contacts`, `user_roles`, and `event_assignments` were **NOT INSPECTED**. Policy names, commands, roles, `USING`, and `WITH CHECK` expressions are unknown for the test database.

## F. Effective Function Inventory

Actual function definitions, owners, security modes, `search_path`, bodies, and privileges were **NOT INSPECTED**. This includes `get_referees`, `get_public_referee`, `get_public_referees`, `is_admin`, and role/region/assignment helpers.

## G. `get_referees` Contract

**DATABASE-ACTUAL: NOT VERIFIED.** No actual signature, parameters, return columns, body, authorization predicate, pagination behavior, region enforcement, or grants can be reported.

## H. `referee_contacts`

Effective table grants, RLS, policies, and direct authenticated access are **NOT VERIFIED**. No WhatsApp/contact values were read.

Migration source previously inspected describes self-service referee policies and a `REVOKE ALL` from `anon` and `authenticated`; this is **MIGRATION-SOURCE**, not effective database evidence.

## I. Critical Policy Verification

All answers below are **NOT DETERMINABLE** without inspecting the effective database policy and helper definition together:

1. Effective `Admins can view all profiles` policy: NOT DETERMINABLE.
2. Whether that policy calls `is_admin`: NOT DETERMINABLE.
3. Whether the effective `is_admin` includes `admin_kab_kota`: NOT DETERMINABLE.
4. Whether kabupaten/kota is independently enforced: NOT DETERMINABLE.

Migration files contain potentially relevant policy/helper definitions, but they are not treated as proof of deployed behavior.

## J. Secure Detail Endpoint

**NOT VERIFIED in the database.** No secure referee-detail endpoint was confirmed. The inspected frontend uses a direct profile query for detail and calls `get_referees` for list data; this source observation does not establish which functions exist in the database.

## K. Migration Drift

| Source | Evidence |
|---|---|
| DATABASE-ACTUAL | Not available; no database connection. |
| MIGRATION-SOURCE | Multiple `get_referees` definitions were found, including differing region predicates and a four-argument signature. |
| FRONTEND | `src/hooks/useReferees.ts` calls `get_referees` with `_limit` and `_offset` for paginated listing. The detail hook queries `profiles` directly. |
| GENERATED-TYPES | `src/integrations/supabase/types.ts` describes `_limit` and `_offset`, but its return shape differs from the migration source, including the region-name field. |

The actual drift cannot be resolved without the database definition.

## L. Final Gate

# PHASE B.1.3 BLOCKED

No database identity query or effective security inventory was performed. No database, migration, grant, policy, UI, or production configuration was changed. Do not proceed to PHASE B.2 until an approved read-only connection explicitly associated with `shorsqyycpptxcutrqrb` is available and its identity is verified.
