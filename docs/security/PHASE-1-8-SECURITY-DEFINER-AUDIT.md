# Phase 1.8 SECURITY DEFINER Audit

## Status

**RUNTIME BLOCKED.** Function metadata was not yet exported from the linked database. No function was created, altered, granted, revoked, or executed for this audit.

## Static function inventory

Historical SQL contains SECURITY DEFINER helpers and reporting/access functions including `has_role`, `is_admin`, `is_admin_provinsi`, `is_admin_kab_kota`, `can_access_region`, `get_accessible_regions`, `get_user_kabupaten_kota`, `get_referees`, reporting functions, signup/trigger functions, and validation/audit functions. Exact live existence, owner, signatures, search paths, and privileges are unknown.

Static code commonly passes identifiers such as `_user_id`, target `user_id`, `kabupaten_kota_id`, event IDs, assignment IDs, and role values. The shared Edge resolver obtains identity from the bearer token, but this does not prove database RPC safety.

## Required runtime inventory

| Function | Definer | Owner | Search path | anon EXECUTE | authenticated EXECUTE | service_role EXECUTE | Caller/RLS/trigger | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| all `prosecdef = true` functions | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BLOCKED |

Use `pg_proc`, `pg_namespace`, `pg_roles`, `pg_get_functiondef`, and routine privilege metadata through a read-only catalog path. Do not execute sensitive functions with production identities.

## Immediate conceptual risks

- exposed-schema SECURITY DEFINER functions with mutable or unset `search_path`;
- authenticated EXECUTE on functions that accept caller identity/tenant arguments;
- functions returning cross-region aggregates or sensitive rows;
- audit or role mutation functions callable by ordinary clients.

## Gate

SECURITY DEFINER safety is **BLOCKED**, not PASS, until live metadata and definitions are captured.
