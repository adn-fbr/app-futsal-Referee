# Production Catalog Extraction

## Result

**CATALOG EXTRACTION: BLOCKED**

The production channel is reported as independently verified for project `xfscfjwapwnkiinkgbjg`, database `postgres`, PostgreSQL `17.6`, user `postgres`, with `transaction_read_only = on`. This agent could not access that SQL channel and therefore did not execute a production query.

This is an **AGENT EXECUTION CHANNEL LIMITATION**, not a claim that the production channel does not exist.

## Safety

- Production mutation: NONE
- Production data copied: NONE
- DDL/DML executed: NONE
- Application functions executed: NONE
- Baseline generated: NO
- Drift output generated: NO
- Deployment performed: NO

## Completeness matrix

| Category | Exact evidence | Status |
| --- | --- | --- |
| Schemas | Not available | BLOCKED |
| Tables | Not available | BLOCKED |
| Columns/defaults | Not available | BLOCKED |
| Constraints/FKs | Not available | BLOCKED |
| Indexes | Not available | BLOCKED |
| Sequences | Not available | BLOCKED |
| Custom types | Not available | BLOCKED |
| Functions/procedures | Not available | BLOCKED |
| Views/materialized views | Not available | BLOCKED |
| Triggers | Not available | BLOCKED |
| RLS policies | Not available | BLOCKED |
| Extensions | Not available | BLOCKED |
| Privileges/ownership | Not available | BLOCKED |
| Dependencies | Not available | BLOCKED |
| Comments | Not available | BLOCKED |

## Missing evidence

The workspace does not contain the exact metadata-only results required from `pg_namespace`, `pg_class`, `pg_attribute`, `pg_attrdef`, `pg_type`, `pg_enum`, `pg_constraint`, `pg_index`, `pg_proc`, `pg_policies`, `pg_extension`, `pg_depend`, information_schema, and the relevant `pg_get_*` functions.

Existing partial inventories provide counts and names only. They explicitly lack exact function bodies, policy expressions, column defaults, constraint definitions, index definitions, trigger definitions, privileges, extension ownership, and complete dependencies. Those artifacts cannot be used to reconstruct the runtime schema.

## Baseline readiness

`CATALOG_STATUS = BLOCKED`

Canonical Runtime Baseline generation is not permitted until the complete metadata-only extraction is available and locally validated.
