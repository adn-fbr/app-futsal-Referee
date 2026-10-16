# Production Catalog Extraction SQL Package Report

## Result

**EXTRACTION SQL PACKAGE: PASS**

This package prepares, but does not execute, a metadata-only PostgreSQL catalog extraction for an authorized production administrator. No production connection was attempted from this workspace.

## Included sections

1. Database/server metadata
2. Schemas
3. Tables, partitions, persistence, replica identity, and RLS flags
4. Columns, exact defaults, identity/generated metadata, types, domains, enums, and comments
5. Constraints
6. Foreign-key ordinal mappings and actions
7. Indexes, expressions, predicates, included columns, and storage parameters
8. Sequences and ownership dependencies
9. Enums and custom types
10. Domains and domain constraints
11. Functions with identity arguments and exact `pg_get_functiondef()` output
12. Procedures with identity arguments and exact definitions
13. Views with exact `pg_get_viewdef()` output
14. Materialized views
15. Non-internal triggers and exact `pg_get_triggerdef()` output
16. RLS table configuration
17. RLS policies with exact `USING` and `WITH CHECK` expressions
18. Extensions
19. Ownership
20. Schema, table, column, and routine privileges
21. `pg_depend` relationships
22. Schema, relation, column, and routine comments

## Catalog sources

The package reads only PostgreSQL metadata sources and metadata functions:

- `pg_namespace`
- `pg_class`
- `pg_attribute`
- `pg_attrdef`
- `pg_type`
- `pg_enum`
- `pg_constraint`
- `pg_index`
- `pg_sequence`
- `pg_proc`
- `pg_language`
- `pg_views`-equivalent relation metadata
- `pg_matviews`-equivalent relation metadata
- `pg_trigger`
- `pg_policies`
- `pg_extension`
- `pg_depend`
- `pg_collation`
- `information_schema.columns`
- `pg_namespace.nspacl` with `aclexplode()` and `acldefault()` for schema privileges
- `information_schema.table_privileges`
- `information_schema.column_privileges`
- `information_schema.routine_privileges`
- `pg_get_constraintdef()`
- `pg_get_expr()`
- `pg_get_functiondef()`
- `pg_get_function_identity_arguments()`
- `pg_get_function_arguments()`
- `pg_get_function_result()`
- `pg_get_indexdef()`
- `pg_get_triggerdef()`
- `pg_get_viewdef()`

## Safety analysis

- Every executable statement is a `SELECT`.
- No `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, or `TRUNCATE` is present.
- No `CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE`, `VACUUM`, `ANALYZE`, or `REFRESH MATERIALIZED VIEW` is present.
- No application tables are selected as data rows; relation metadata is read from catalogs.
- No application functions are invoked. `pg_get_*` calls only render catalog definitions.
- No credentials, tokens, passwords, API keys, PII, or connection strings are requested or returned.
- The package does not include `BEGIN`, `COMMIT`, or `ROLLBACK`; the administrator must run it inside an explicitly read-only transaction as described in the SQL header.
- The package does not generate a baseline, drift register, migration, or deployment.

## Manual execution instructions

1. Open an approved production SQL console.
2. Confirm the connection identity and read-only state without displaying secrets.
3. Execute:

   ```sql
   BEGIN;
   SET TRANSACTION READ ONLY;
   ```

4. Run `PRODUCTION-CATALOG-EXTRACTION.sql` unchanged.
5. Capture every labelled result set, including empty result sets.
6. Verify the transaction remained read-only.
7. Execute `ROLLBACK;`.
8. Supply the metadata-only result sets to the workspace through the approved evidence-transfer process.

Do not run this package through an application RPC, migration runner, seed command, or data dump command.

## Result-set conversion

Map the `result_set` column to the JSON evidence structure as follows:

| Result set | JSON section |
| --- | --- |
| `metadata` | `metadata` |
| `schemas` | `schemas` |
| `tables` | `tables` |
| `columns` | `columns` |
| `constraints` | `constraints` |
| `foreign_keys` | `foreign_keys` |
| `indexes` | `indexes` |
| `sequences` | `sequences` |
| `types` | `types` |
| `domains` | `domains` |
| `functions` | `functions` |
| `procedures` | `procedures` |
| `views` | `views` |
| `materialized_views` | `materialized_views` |
| `triggers` | `triggers` |
| `rls_table_configuration` | `rls.table_configuration` |
| `rls` | `rls.policies` |
| `extensions` | `extensions` |
| `ownership` | `ownership` |
| `schema_privileges`, `table_privileges`, `column_privileges`, `routine_privileges` | `privileges` |
| `dependencies` | `dependencies` |
| `comments` | `comments` |

Preserve PostgreSQL `NULL`s, arrays, OIDs, enum ordering, composite-key ordinal mappings, exact expressions, exact generated definitions, and overloaded routine identity arguments. Do not replace result sets with counts.

## Gate

This is a prepared SQL package only. It does not prove production SQL access and does not constitute a completed catalog extraction.
