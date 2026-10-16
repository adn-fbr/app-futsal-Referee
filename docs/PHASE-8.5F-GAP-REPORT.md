# Phase 8.5F Gap Report

## Final gate

`PARTIAL — CONTRACT REMEDIATION IMPLEMENTED, VALIDATION INCOMPLETE`

## Completed

The Non-Production function now implements the approved mapping `p_kota_id -> events.kabupaten_kota_id`, returns boolean, uses invoker security, and has no five-argument overload. Generated types and active callers are reconciled. No rich duplicate RPC was created.

## Remaining gaps

- Exact-match TRUE behavior was not exercised because the target has no fully populated existing event row and fixture creation was not authorized.
- Dynamic Admin Provinsi, non-admin, restricted-visibility, and hidden-event tests were not executed because no synthetic identity channel was available.
- The dead `DuplicateEventDialog` still contains historical rich-result UI types but has no active callers.
- Event plus approval transaction atomicity, idempotency, audit completion, and notification failure semantics remain Phase 8.5G work.

Production UAT remains `NOT READY` and Production remains `NOT AUTHORIZED`.
