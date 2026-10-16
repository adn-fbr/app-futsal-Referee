# PHASE-7.4E-F Provisional Rich Duplicate Search Contract

## Status

**BLOCKED — DRAFT / PROVISIONAL**

This document records the recommendation boundary only. It is not an approved contract and does not authorize implementation, migration, or deployment.

## Responsibility Model

**OPTION C — SEPARATE RESPONSIBILITIES**

Keep the existing canonical function unchanged:

`public.check_duplicate_event(text,text,text) RETURNS boolean`

A future rich-search capability must use a separate contract and must not modify, replace, overload, or wrap the canonical function.

## Provisional Recommendation

A future capability may accept the five observed application inputs, apply explicitly approved matching semantics, rank bounded duplicate candidates, and allow the application to derive `isDuplicate` from non-empty results. Exact identity, schema, signature, return type, matching model, threshold, security, RLS, visibility, performance, indexes, migration, rollback, and deployment remain unresolved approval decisions.

## Blocking Conditions

- 19/19 governance decisions are `PENDING`.
- 9/9 critical decisions are `PENDING`.
- No approval authority or approval evidence was supplied.
- Contract approval is separate from implementation authorization.
- Production deployment, migration, and baseline revision require later gates.
- Security/RLS validation is not approved.
- The canonical function and baseline must remain unchanged.

## Gate

`CONTRACT_APPROVAL = PENDING`

`IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`

`PRODUCTION_DEPLOYMENT_AUTHORIZATION = NOT_GRANTED`

**FINAL GATE: BLOCKED**
