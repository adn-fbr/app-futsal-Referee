# PHASE 7.4J-D1-A POST-VALIDATION PLAN

## Required validation

A future reconstruction is not considered successful merely because migration execution finishes.

Validate:

- Tables: 27/27
- Columns: 249
- Functions: 47
- Views: 3
- Triggers: 22
- Indexes: 47
- RLS Policies: 86
- Extensions: 7
- Enum Types: 2
- FK 30/30
- PK 27/27
- UNIQUE 7/7
- CHECK 3/3
- canonical Events columns
- canonical Events FK
- canonical duplicate function
- RLS enforcement
- dependency graph consistency
- application contract compatibility
- TypeScript type compatibility
- build
- focused integration tests

## Failure rule

If reconstruction produces a schema mismatch, missing object, unexpected object, function drift, RLS drift, FK drift, dependency mismatch, or application contract mismatch, set EXECUTION_STATUS = FAILED and stop. Use rollback/recovery procedures.
