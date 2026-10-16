# PHASE 7.4I Rollback Design

Before any authorized non-Production migration, record:

1. Migration identifier.
2. Every object created or modified.
3. Reversible rollback procedure.
4. Rollback dependencies and ordering.
5. Verification queries/tests.
6. Failure conditions and trigger thresholds.

## Required Invariants

- Preserve `public.check_duplicate_event(text,text,text) RETURNS boolean`.
- Remove only objects introduced by the approved rich-search migration.
- Revert repository adoption independently from database rollback.
- Do not revise the canonical baseline until a later authorized extraction gate.
- Verify RLS, result shape, ordering, limit, errors, and caller visibility after rollback.

No rollback SQL, migration, or trigger was generated or executed in Phase 7.4I.

Status: **READY AS PROCEDURE DESIGN; EXECUTION BLOCKED**.
