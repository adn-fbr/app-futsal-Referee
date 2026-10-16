# Production Catalog Evidence Gate

## Gate decision

**CATALOG EXTRACTION: BLOCKED**

The workspace does not contain the complete production catalog extraction. The stored extraction artifact records `catalog_status = BLOCKED`, has no captured extraction timestamp, and contains empty object arrays for the required catalog domains.

The SQL package is a query plan, not runtime evidence. It cannot satisfy this gate until its result sets are executed through an authorized read-only production SQL channel and supplied as evidence.

## Evidence boundary

- Raw production catalog evidence must remain unchanged.
- The supplied `comments` result set covering 37 objects is retained verbatim in `PRODUCTION-CATALOG-RAW-COMMENTS.json` as metadata-only evidence.
- Managed and system objects in `auth`, `storage`, `vault`, `extensions`, `pg_toast`, and `public` comments are not deleted or filtered from raw evidence.
- Counts, query text, project metadata, and partial inventories do not substitute for exact result-set evidence.
- No canonical baseline, drift output, migration, or deployment was generated.

## Result-set label mapping

| Required domain | Package result-set label | Evidence status |
| --- | --- | --- |
| `database_metadata` | `metadata` | Missing captured result |
| `schemas` | `schemas` | Missing captured result |
| `tables` | `tables` | Missing captured result |
| `columns` | `columns` | Missing captured result |
| `constraints` | `constraints` | Missing captured result |
| `foreign_keys` | `foreign_keys` | Missing captured result |
| `indexes` | `indexes` | Missing captured result |
| `sequences` | `sequences` | Missing captured result |
| `types` | `types` | Missing captured result |
| `domains` | `domains` | Missing captured result |
| `functions` | `functions` | Missing captured result |
| `procedures` | `procedures` | Missing captured result |
| `views` | `views` | Missing captured result |
| `materialized_views` | `materialized_views` | Missing captured result |
| `triggers` | `triggers` | Missing captured result |
| `rls` | `rls_table_configuration` | Missing captured result |
| `rls_policies` | `rls` | Missing captured result |
| `extensions` | `extensions` | Missing captured result |
| `ownership` | `ownership` | Missing captured result |
| `privileges` | `schema_privileges`, `table_privileges`, `column_privileges`, `routine_privileges` | Missing captured result |
| `dependencies` | `dependencies` | Missing captured result |
| `comments` | `comments` | Captured in `PRODUCTION-CATALOG-RAW-COMMENTS.json` for the supplied 37-object result set |

Original package labels are preserved; mapping does not rename or delete raw result sets.

## Completeness matrix

| Domain | Present | Exact | Complete | Status | Missing exact fields/evidence |
| --- | --- | --- | --- | --- | --- |
| Database metadata | No | No | No | BLOCKED | Identity query result, server version, database, user, read-only state, extraction timestamp |
| Schemas | No | No | No | BLOCKED | Schema rows, owners, ACLs, comments, classifications |
| Tables | No | No | No | BLOCKED | Relation identity, kind, owner, persistence, partition/parent, replica identity, RLS flags |
| Columns | No | No | No | BLOCKED | Every column, type/OID, formatted type, defaults, identity/generated state, collation, precision, comments |
| Constraints | No | No | No | BLOCKED | Exact definitions, local/reference columns, actions, deferrability, validation |
| Foreign keys | No | No | No | BLOCKED | Composite ordinal mappings and referenced schema/table/columns |
| Indexes | No | No | No | BLOCKED | Exact definitions, method, uniqueness, validity, ordering, expressions, predicates, included columns |
| Sequences | No | No | No | BLOCKED | Sequence parameters, owner, association, ownership dependency |
| Types | No | No | No | BLOCKED | Enum labels/order, custom type metadata, ownership/comments |
| Domains | No | No | No | BLOCKED | Base type, default, NOT NULL, exact domain constraints |
| Functions | No | No | No | BLOCKED | Every signature, identity arguments, result, body, owner, ACL, settings, security attributes |
| Procedures | No | No | No | BLOCKED | Every signature, identity arguments, definition, owner, ACL, settings |
| Views | No | No | No | BLOCKED | Exact definitions, owners, options, columns, dependencies |
| Materialized views | No | No | No | BLOCKED | Exact definition, owners, columns, indexes, storage, dependencies |
| Triggers | No | No | No | BLOCKED | Exact definitions, timing/events, enabled state, function, arguments, constraint semantics |
| RLS | No | No | No | BLOCKED | Per-table `relrowsecurity` and `relforcerowsecurity` |
| RLS policies | No | No | No | BLOCKED | Every policy name, command, permissiveness, roles, USING, WITH CHECK |
| Extensions | No | No | No | BLOCKED | Name, version, schema, relocatable state, configuration, dependencies |
| Ownership | No | No | No | BLOCKED | Owners for schemas, relations, routines, types, sequences, and other objects |
| Privileges | No | No | No | BLOCKED | Schema ACL expansion, table/column/routine grants, grantors, grantees, grantability |
| Dependencies | No | No | No | BLOCKED | `pg_depend` rows and resolved dependent/referenced identities |
| Comments | Yes | Yes, supplied rows | Yes, supplied result set only | PASS FOR DOMAIN | No database-wide execution metadata beyond the supplied rows |

## Public schema classification

The supplied `public` schema comment is retained as raw evidence but remains:

- `scope = UNKNOWN`
- `baseline_inclusion = false`
- `classification_status = REVIEW_REQUIRED`

No application ownership is inferred from the schema name. Owner, extension membership, object type, and dependency evidence are required before any public object can enter application baseline scope.

## Raw comments artifact

`PRODUCTION-CATALOG-RAW-COMMENTS.json` is the immutable copy of the supplied comments result set. It is not a normalized replacement for a future complete catalog extraction and must not be used to infer ownership or baseline inclusion.

## Missing evidence required to pass

1. A captured `metadata` result proving production identity and read-only transaction state.
2. Complete result sets for all 22 required domains.
3. Exact rows and definitions, not only counts or successful query status.
4. Owner and dependency evidence sufficient to classify public objects.
5. Complete comments evidence while retaining all managed/system objects in raw form.
6. Evidence-transfer metadata identifying the extraction timestamp and source transaction.

## Safety status

- Production mutation: NONE
- Production data copied: NONE
- Permission escalation: NOT ATTEMPTED
- Baseline generation: NOT PERMITTED
- Drift generation: NOT PERMITTED
- Migration: NOT EXECUTED
- Deployment: NOT EXECUTED

## Next gate

Execute the prepared extraction package in an authorized read-only production SQL console, preserve every labelled result set exactly, and supply the result sets to this workspace. Re-run this evidence gate before any baseline conversion.
