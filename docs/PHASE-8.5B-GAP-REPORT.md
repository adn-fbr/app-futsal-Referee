# Phase 8.5B Gap Report

## Critical unresolved design questions

1. Approved canonical type-generation source is not established; generated types are stale.
2. The canonical duplicate function compares kota/location/name, while the UI currently models date and duplicate records; semantic adaptation must be explicit.
3. No existing atomic event+approval backend boundary exists.
4. Idempotency/duplicate retry guarantee is not represented by an identified canonical field/constraint.
5. Audit trigger behavior is known for approvals, but event creation/audit and external notification failure semantics require implementation validation.
6. Current RLS policy behavior for a new transaction function is not remotely tested.

## Classification

- Duplicate caller: `APPLICATION_CONTRACT_ONLY` plus `TYPE_SOURCE_REQUIRED`.
- Event+approval atomicity: `BACKEND_TRANSACTION_MECHANISM_REQUIRED`.
- New schema/RPC/function: not authorized; implementation blocked.
- Historical date: compatible as UI/business classification; no date added to canonical duplicate RPC.

## Final status

**BLOCKED** until type source, transaction architecture, authorization/RLS design, and idempotency policy are approved. Production UAT remains NOT READY.
