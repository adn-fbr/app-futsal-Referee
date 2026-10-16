# Phase 1.8E.2 Runtime Schema Inventory

## Status

**Production reference PASS; test target BLOCKED.**

## Production reference

The Phase 1.8B read-only catalog established:

- 27 public tables.
- 3 security-invoker views.
- 47 public functions.
- 41 SECURITY DEFINER functions.
- 86 RLS policies.
- 5 `app_role` values: `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, `evaluator`.
- RLS enabled on all 27 public tables.
- Runtime relationships including `auth.users -> profiles -> user_roles`, regional hierarchy, events, assignments, honors, evaluations, cards, notifications, and audit/log tables.

## Test target

- Project: `test APP`.
- Ref: `shorsqyycpptxcutrqrb`.
- Status: `ACTIVE_HEALTHY`.
- PostgreSQL: `17.6.1.166`.
- Region: `ap-south-1`.
- Application table count: UNKNOWN.
- Production row count: UNKNOWN.
- Test row count: UNKNOWN.
- Test RLS/function/policy state: UNKNOWN.

The target was not linked or queried because no approved database password/connection channel was available. No assumption of emptiness is made.

## Required post-deployment inventory

Capture target schema-only metadata for tables/columns, enums, PK/FK/unique/check constraints, indexes, views, functions, triggers, RLS flags/policies, grants, and function search paths. Record `MATCH`, `EXPECTED DIFFERENCE`, `MISSING`, `EXTRA`, or `UNKNOWN` for each object.
