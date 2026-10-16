# PHASE-5.15 MIGRATION ROLLBACK PLAN

## Scope

This rollback plan is for the draft assignment-authorization migration for the closed assignment contract and is designed to preserve security while allowing a controlled schema rollback only when the application has not yet moved to the RPC as the exclusive write path.

## Security-preserving principles

- Do not restore the old unconditional uniqueness if cancelled + active replacement pairs still exist.
- Do not restore role-only Panitia authorization.
- Do not restore a public or anonymous EXECUTE path for the new authorization function.
- Do not re-enable direct browser assignment INSERT as an automatic fallback.
- Do not silently repair invalid rows during rollback.

## Rollback steps

1. Confirm the application consumer is not using the new RPC as the sole assignment-write path.
2. Verify the active production/test consumer state before any schema rollback.
3. Revoke the new RPC EXECUTE grants and remove the function only if the application has not yet cut over.
4. Remove the private conflict helper only after confirming no privileged function depends on it.
5. Restore the previous unconditional uniqueness only if the duplicate check below passes and the migration is being undone intentionally.
6. Leave direct browser INSERT disabled only if the app has already been cut over; otherwise preserve the current write path and do not reintroduce unsafe authorization.

## Unique rollback guard

Before rolling back the partial unique index to UNIQUE(event_id, referee_id):

```sql
SELECT event_id, referee_id
FROM public.event_assignments
GROUP BY event_id, referee_id
HAVING count(*) > 1;
```

If any row pair is duplicated, rollback must be blocked with an explicit operational stop.
The migration must not delete or rewrite rows to satisfy rollback.

If the query returns zero rows, controlled rollback may proceed; if it returns any rows, the correct state is:

```text
ROLLBACK BLOCKED
```

## Function rollback guard

If the RPC must be removed:

```sql
REVOKE ALL ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_referee_to_event(uuid, uuid, text) FROM anon;
DROP FUNCTION IF EXISTS public.assign_referee_to_event(uuid, uuid, text);
```

Only do this after verifying application consumers are not relying on it and the system is not in a state where the RPC is the only valid write path.

If the consumer state is uncertain, the correct rollback outcome is:

```text
ROLLBACK BLOCKED
```

## Panitia rollback rule

Never roll back from EVENT_OWNER_ONLY to role-only Panitia assignment authority. If deployment breaks Panitia behavior, the correct action is to disable the capability rather than restore the unsafe role-only path.

## RLS and direct INSERT

The migration must not restore unrestricted browser assignment INSERT as a fallback. The future closure of direct browser INSERT must be a separate migration after consumer cutover and verification.

## Final rollback decision

This rollback plan is valid for schema rollback/disablement only when the application state is known and safe. If the new RPC is already the contractually required write path, rollback is blocked until the replacement write path and consumer verification are in place.
