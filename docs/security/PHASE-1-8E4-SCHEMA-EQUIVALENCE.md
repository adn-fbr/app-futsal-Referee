# Phase 1.8E.4 Schema Equivalence

## Status

**BLOCKED — no baseline artifact created or deployed.**

## Comparison

```text
PRODUCTION RUNTIME CATALOG
        VS
TEST CANONICAL BASELINE
```

## Required object comparison

Compare every table/column/type/nullability/default, primary key, foreign key and delete/update action, unique/check constraint, index, enum/value, view/security-invoker mode, function signature/body/security mode/search path, trigger, RLS flag, policy expression, grant, extension, and sequence.

Classify each as `MATCH`, `MISSING`, `EXTRA`, `DIFFERENT`, or `INTENTIONALLY DIFFERENT`.

## Current result

| Object class | Expected | Actual test | Result |
| --- | ---: | ---: | --- |
| Tables | 27 | not deployed | BLOCKED |
| Views | 3 | not deployed | BLOCKED |
| Functions | 47 | not deployed | BLOCKED |
| SECURITY DEFINER | 41 | not deployed | BLOCKED |
| Policies | 86 | not deployed | BLOCKED |
| RLS-enabled tables | 27 | not deployed | BLOCKED |
| Enums | 2 types / 5 app roles | not deployed | BLOCKED |
| Constraints/indexes/triggers | runtime reference | not deployed | BLOCKED |

No unexplained difference can be assessed before deployment. No schema baseline was applied.
