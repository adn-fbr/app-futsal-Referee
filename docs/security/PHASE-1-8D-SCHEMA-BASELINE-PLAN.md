# Phase 1.8D Schema Baseline Plan

## Objective

Reproduce production's security-relevant schema in the dedicated test project without copying production data.

## Source

Use the Phase 1.8B schema-only runtime catalog as the reference: 27 public tables, 3 security-invoker views, 47 public functions, 41 SECURITY DEFINER functions, 86 policies, RLS enabled on all 27 public tables, enums, constraints, indexes, triggers, and grants.

Production remains read-only. The baseline artifact must be reviewed before application.

## Baseline contents

Include schema only:

- required extensions and enums (`app_role`, `pengurus_level`);
- public tables, columns, defaults, nullability, identity/generated metadata;
- PK, FK, unique, check, exclusion constraints;
- indexes and sequences;
- functions, exact signatures, owners, security mode, search paths;
- views/security-invoker settings;
- triggers;
- RLS enablement and policies;
- grants required for test behavior;
- Edge Function configuration documented separately.

Exclude all rows, Auth users, emails, phones, sessions, tokens, secrets, keys, and production storage objects.

## Procedure

1. Export/reference production schema only through read-only tooling.
2. Review object definitions and policy semantics.
3. Store a versioned baseline under the approved non-production boundary, not by editing historical migrations.
4. Apply to an empty test project.
5. Compare the test catalog to the captured production reference.
6. Apply only explicitly approved post-baseline migrations.
7. Rebuild a second empty test database/project and compare A/B catalogs.

## Acceptance

No manual SQL repair after failure. Any required repair becomes a reviewed baseline change. Baseline acceptance requires equivalent security objects and no production data.
