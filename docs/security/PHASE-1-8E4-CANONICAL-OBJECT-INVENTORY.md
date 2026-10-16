# Phase 1.8E.4 Canonical Object Inventory

## Status

**PARTIAL / BLOCKED.** The production runtime reference establishes the expected application counts, but the complete repository-local object-definition extraction required for an executable baseline is incomplete.

## Application objects

- Tables: 27.
- Views: 3 security-invoker views.
- Functions: 47 public functions.
- SECURITY DEFINER: 41.
- RLS policies: 86.
- Application enum values: five `app_role` labels; `pengurus_level` also exists.

## Extension objects

Extension-provided functions and types must not be manually recreated. `pg_trgm` is an extension dependency; internal extension functions are excluded from the application baseline.

## Supabase system objects

Managed `auth`, `storage`, and PostgreSQL infrastructure objects are excluded from the application baseline. No production Auth/storage rows are included.

## Classification gaps

| Definition | Status |
| --- | --- |
| Table names and major relationships | PASS |
| Table columns/defaults/identity metadata | BLOCKED for complete local artifact |
| Enum labels | PASS |
| Function names/count/security-definer count | PASS |
| Complete function definitions | BLOCKED |
| Function owners/ACLs | BLOCKED |
| View names/security-invoker status | PASS |
| Complete view definitions/dependencies | BLOCKED |
| Trigger definitions | BLOCKED |
| Index definitions/predicates | BLOCKED |
| Constraint definitions/order | BLOCKED |
| Exact RLS policy expressions/roles | BLOCKED |
| Grants/default privileges | BLOCKED |
| Extension dependency classification | BLOCKED |

## Decision

Do not generate or deploy a canonical migration until every blocked catalog field is extracted from the production runtime reference through an authorized read-only channel and stored/reviewed without data rows.
