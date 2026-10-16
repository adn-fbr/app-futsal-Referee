# Phase 1.7 Schema Equivalence Report

## Result

BLOCKED. Database A and Database B were not created because the canonical baseline has not been approved or generated.

## Required comparison

The future A/B comparison must cover:

- extensions and managed roles/grants
- enums and enum values
- tables, columns, data types, nullability, and defaults
- primary, foreign-key, unique, and check constraints
- indexes and sequences
- function signatures, owners, search paths, and bodies
- views and security-invoker behavior
- triggers
- RLS enablement and policy definitions
- grants

## Current evidence

The application-generated contract identifies the expected public table/view/RPC names, but it cannot prove catalog equivalence. Historical SQL contains conflicting definitions and the current local migration chain fails before completion on `public.app_role`.

## Acceptance result

```text
DATABASE A ≡ DATABASE B: NOT EXECUTED
```

No claim of equivalence is made. The report must be rerun after two empty databases are initialized from the reviewed baseline.
