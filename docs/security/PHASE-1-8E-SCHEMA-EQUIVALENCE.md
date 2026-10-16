# Phase 1.8E Schema Equivalence

## Status

**BLOCKED**. No test project exists and no baseline has been applied.

## Comparison target

```text
PRODUCTION RUNTIME CATALOG (read-only reference)
                         VS
AFP SULSEL SECURITY TEST CATALOG
```

## Required comparison

For every object classify `MATCH`, `MISSING`, `EXTRA`, or `DIFFERENT`:

- schema and extension;
- tables and columns;
- nullability/defaults/identity/generated fields;
- PK, FK, unique, check, and exclusion constraints;
- indexes and sequences;
- enums and values;
- functions, signatures, definitions, owners, security mode, search path;
- views and security-invoker mode;
- triggers;
- RLS enablement and policies;
- grants and default privileges.

## Acceptance

Any missing/different security-critical table, enum, function, view, trigger, policy, grant, FK, or RLS flag blocks fixture creation and Phase 1.8F. Extra test-only objects must be explicitly documented.

## Required evidence

Record baseline version, target test ref, command, timestamp, object counts, differences, reviewer, and final result. Do not compare or copy data rows.
