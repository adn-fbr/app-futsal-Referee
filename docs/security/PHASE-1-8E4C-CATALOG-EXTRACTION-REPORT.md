# Phase 1.8E.4C Catalog Extraction Report

## Status

**BLOCKED.** The prior runtime reference establishes object counts and partial relationships, but the complete authorized live PostgreSQL catalog required for baseline generation is not available in the workspace.

## Completeness

| Category | Expected | Counted | Complete | Status |
| --- | ---: | ---: | ---: | --- |
| Tables | 27 | 27 | 0 | BLOCKED |
| Views | 3 | 3 | 0 | BLOCKED |
| Application functions | 47 | 47 | 0 | BLOCKED |
| SECURITY DEFINER | 41 | 41 | 0 | BLOCKED |
| RLS policies | 86 | 86 | 0 | BLOCKED |
| `app_role` values | 5 | 5 | 5 labels only | BLOCKED |

## Required missing evidence

- Production SQL identity result.
- Complete per-column table catalog and owners.
- Complete constraints, indexes, sequences, and extension catalog.
- `pg_get_functiondef` for all 47 functions.
- Function owners, `proconfig`, raw/expanded ACLs, and dependencies.
- Exact view definitions and dependencies.
- Exact policy roles, permissive/restrictive flags, USING, and WITH CHECK expressions.
- Trigger definitions.
- Grants/default privileges.
- Complete dependency graph and application/system classification.

## Safety

Production and test remain read-only. No data rows, secrets, credentials, or executable baseline SQL were created or copied. Historical migrations were not executed.
