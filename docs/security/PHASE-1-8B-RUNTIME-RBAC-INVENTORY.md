# Phase 1.8B Runtime RBAC Inventory

## Status

**PASS for runtime enum recovery; assignment and membership rows were intentionally not queried.**

## Static candidate

The runtime `public.app_role` enum contains exactly `admin_provinsi`, `admin_kab_kota`, `panitia`, `wasit`, and `evaluator`. No `admin` or `referee` values exist in the runtime enum definition. Historical role-row assignments were not queried.

## Required runtime checks

- `public.app_role` enum values from `pg_enum`;
- `user_roles` role type, PK/unique/FK constraints, and RLS;
- role assignment mechanism and grants;
- orphan role assignments without auth/profile records, reported as counts only;
- actual profile/region relationship without PII;
- role membership metadata from `pg_roles` without password fields.

## Gate

Canonical role vocabulary: **PASS for enum definition; BLOCKED for live assignment validation**. No role was changed.
