# Phase 8.5D Remediation Proposal

Status: `NEW GOVERNANCE DECISION REQUIRED`

No remediation was executed.

## Required decision

The database/business owners must explicitly decide one of:

1. `p_kota_id` is the same domain identifier as `events.kabupaten_kota_id`; then approve a database-only body correction, with a reviewed security mode/search_path and RLS disclosure decision.
2. `p_kota_id` is a distinct city concept; then approve a schema design for a `kota_id` field and FK before changing the function.
3. The three-argument function is obsolete and the historical five-argument capability is desired; then approve a new canonical function identity rather than overloading or silently replacing the existing function.

## Conditional database-body proposal

Only if option 1 is explicitly approved, the body candidate is:

```sql
RETURN EXISTS (
  SELECT 1
  FROM public.events
  WHERE kabupaten_kota_id::text = p_kota_id
    AND location = p_location
    AND name = p_name
);
```

This is a proposal, not an approved migration. It must be reviewed for SECURITY DEFINER versus INVOKER, fixed `search_path`, grants, RLS information disclosure, NULL behavior, exact identity preservation, and rollback before execution.

## Application consequence

Until the decision is recorded and the function is valid, do not update generated types, callers, or UI behavior. Afterward, either adapt the application to a proven boolean contract or design a separately governed rich-search capability.

## Transaction consequence

The event plus approval transaction remains blocked. It must not depend on the unresolved duplicate function or claim idempotency without a separate approved mechanism.
