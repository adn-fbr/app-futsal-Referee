# PHASE-5.15 MIGRATION PREFLIGHT REPORT

## Status

PASS — MIGRATION SQL DRAFT READY FOR STATIC VALIDATION

This is a draft-only artifact. No DDL or DML was executed against TEST or production. The migration was not applied to any project.

## Verified preflight conditions

The supplied contract lists the following read-only checks as required before any apply attempt:

- `event_assignments.status NULL rows = 0`
- `event_assignments.role NULL rows = 0`
- `duplicate(event_id, referee_id) = 0`
- `duplicate non-cancelled(event_id, referee_id) = 0`

The draft migration includes an explicit pre-flight guard that aborts the migration if any of these conditions fail, rather than attempting data repair or partial constraint changes.

## Static validation checklist

The draft is internally consistent with the required static validation pass conditions:

- SQL parses as a migration scaffold
- function signature is unique for the intended RPC
- `SECURITY DEFINER` is used
- `SET search_path = ''` is used
- object references are schema-qualified where required
- anonymous and public EXECUTE are denied for the new RPC
- authenticated EXECUTE is granted
- no client actor/city/province/status parameters are accepted
- canonical role checks enforce `CADANGAN`
- event ownership is required for Panitia authorization
- admin city/province authorization is enforced within the RPC
- license is not treated as a hard assignment blocker
- assignment conflict is enforced by a secure private primitive
- duplicate logic allows cancelled rows to coexist with a later pending/confirmed assignment
- direct browser INSERT closure is intentionally deferred until consumer cutover is verified

## Explicit design gap notes

The contract intentionally leaves several business decisions unresolved for later governance work, including Panitia authority, some referee-eligibility business decisions, batch/template semantics, import authority, and seed authority. Those are documented as governance items rather than silently being assumed in the draft.

## Final gate

This artifact is ready for static validation only.
It is not a runtime deployment approval and it does not imply TEST migration execution, runtime verification, or production readiness.

Production remains untouched.
