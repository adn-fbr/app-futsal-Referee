# PRODUCTION-FULL-DEPENDENCY-NORMALIZATION v3.0.0

Offline schema-only normalization of production-schema.sql. No production connection, SQL execution, mutation, data extraction, migration, or deployment SQL occurred.

## Catalog validation

- tables: 27
- columns: 249
- primary_keys: 27
- unique_constraints: 7
- check_constraints: 3
- foreign_keys: 30
- functions: 47
- views: 3
- triggers: 22
- policies: 86
- indexes: 47
- extensions: 7
- enum_types: 2

## Identity validation

- Null schema identities: 0
- Numeric OID identities: 0
- Blank identities: 0
- Ambiguous canonical identities: 0
- False CHECK constraints (RLS WITH CHECK): 0

## Dependency resolution

- total: 351
- resolved: 282
- unresolved: 47
- not_exposed: 0
- external_managed: 22
- ambiguous: 0

The 47 unresolved records are explicit function-body static-analysis markers; no dependencies were inferred from unqualified identifiers, comments, or strings.

## Gate

FULL DEPENDENCY NORMALIZATION: **PASS**

FK canonical dependency: **PASS** (30/30).

Canonical Runtime Baseline: **AUTHORIZED**

Production Deployment: **NOT AUTHORIZED**
